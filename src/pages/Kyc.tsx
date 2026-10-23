import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Loader2, ShieldCheck, Clock, X, FileText, ArrowLeft } from "lucide-react";

// Brand green sampled from the logo
const GREEN = "#4FA85E";
const GREEN_DEEP = "#3E9A52";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 365; // 1 year, so the admin panel can show the image

const validateFile = (f: File): string | null => {
  if (!ALLOWED_TYPES.includes(f.type)) return "Please upload a JPG, PNG, WebP or PDF file.";
  if (f.size > MAX_BYTES) return "File is too large. Max size is 8MB.";
  return null;
};

interface Submission {
  id: string;
  document_type: string | null;
  status: string;
  submitted_at: string | null;
  rejection_reason: string | null;
}

const FileSlot = ({
  label,
  file,
  onChange,
  required,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  required?: boolean;
}) => (
  <div>
    <Label>
      {label} {required && <span style={{ color: GREEN }}>*</span>}
    </Label>
    {file ? (
      <div className="mt-1 overflow-hidden rounded-xl border border-border bg-muted/40">
        {file.type.startsWith("image/") ? (
          <img
            src={URL.createObjectURL(file)}
            alt={label}
            className="max-h-48 w-full bg-muted object-contain"
          />
        ) : (
          <div className="flex items-center justify-center bg-muted py-8">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="flex items-center gap-2 bg-card px-3 py-2 text-[12px]">
          <span className="flex-1 truncate">{file.name}</span>
          <span className="text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
          <button type="button" onClick={() => onChange(null)} className="hover:text-red-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    ) : (
      <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-3 hover:border-foreground/40">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 truncate text-[13px] text-muted-foreground">
          Click to upload (JPG/PNG/PDF, max 8MB)
        </span>
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (!f) return;
            const err = validateFile(f);
            if (err) {
              toast.error(err);
              return;
            }
            onChange(f);
          }}
        />
      </label>
    )}
  </div>
);

export default function Kyc() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loading, setLoading] = useState(false);

  const [docType, setDocType] = useState("Passport");
  const [docNumber, setDocNumber] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoadingStatus(true);
    (supabase as any)
      .from("id_verifications")
      .select("id, document_type, status, submitted_at, rejection_reason")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        setSubmission((data as Submission) ?? null);
        setLoadingStatus(false);
      });
  }, [user]);

  // Uploads to the private bucket and returns a long-lived signed URL
  const upload = async (file: File, key: string) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
    const path = `${user!.id}/${Date.now()}-${key}-${safeName}`;
    const { error } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
    if (error) throw new Error(`Upload failed (${key}): ${error.message}`);

    const { data, error: signError } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(path, SIGNED_URL_SECONDS);
    if (signError || !data?.signedUrl) throw new Error(`Could not prepare ${key} file`);
    return data.signedUrl;
  };

  const submit = async () => {
    if (!user) return;
    if (!docNumber.trim() || !front || !selfie) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const document_front_url = await upload(front, "front");
      const document_back_url = back ? await upload(back, "back") : null;
      const selfie_url = await upload(selfie, "selfie");

      const row = {
        document_type: docType,
        document_number: docNumber.trim(),
        document_front_url,
        document_back_url,
        selfie_url,
        status: "pending",
        submitted_at: new Date().toISOString(),
        rejection_reason: null,
        reviewed_at: null,
      };

      // One row per user: update after a rejection, insert the first time
      const { data: existing } = await (supabase as any)
        .from("id_verifications")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data, error } = existing
        ? await (supabase as any)
            .from("id_verifications")
            .update(row)
            .eq("id", existing.id)
            .select("id, document_type, status, submitted_at, rejection_reason")
            .maybeSingle()
        : await (supabase as any)
            .from("id_verifications")
            .insert({ user_id: user.id, ...row })
            .select("id, document_type, status, submitted_at, rejection_reason")
            .maybeSingle();

      if (error) throw error;

      setSubmission(
        (data as Submission) ?? {
          id: crypto.randomUUID(),
          document_type: docType,
          status: "pending",
          submitted_at: new Date().toISOString(),
          rejection_reason: null,
        }
      );
      setFront(null);
      setBack(null);
      setSelfie(null);
      setDocNumber("");
      qc.invalidateQueries({ queryKey: ["id-verification", user.id] });
      toast.success("KYC submitted. Pending review.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const showStatusCard = !!submission && submission.status !== "rejected";
  const showRejected = !!submission && submission.status === "rejected";
  const showForm = !loadingStatus && (!submission || submission.status === "rejected");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard/profile">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to profile
        </Link>
      </Button>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: GREEN }}>
          Identity verification
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">AML / KYC</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          To maintain a secure and transparent financial process, you are required to confirm your
          identity.
        </p>
      </div>

      {loadingStatus && (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-3 w-56 animate-pulse rounded bg-muted" />
          </div>
        </div>
      )}

      {!loadingStatus && showStatusCard && submission && (
        <div
          className={`flex items-center gap-4 rounded-2xl border p-5 ${
            submission.status === "approved"
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-yellow-500/30 bg-yellow-500/5"
          }`}
        >
          {submission.status === "approved" ? (
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-600" />
          )}
          <div className="flex-1">
            <p className="text-[14px] font-medium capitalize">Status: {submission.status}</p>
            <p className="text-[12px] text-muted-foreground">
              {submission.document_type}
              {submission.submitted_at &&
                ` · submitted ${new Date(submission.submitted_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      )}

      {!loadingStatus && showRejected && submission && (
        <div className="flex items-center gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-5">
          <X className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="text-[14px] font-medium">Verification rejected</p>
            {submission.rejection_reason && (
              <p className="mt-1 text-[12px] text-red-700">Reason: {submission.rejection_reason}</p>
            )}
            <p className="mt-1 text-[12px] text-muted-foreground">
              Please resubmit with the correct documents below.
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="kyc-doc">Document type</Label>
              <select
                id="kyc-doc"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Passport">Passport</option>
                <option value="National ID">National ID</option>
                <option value="Driver License">Driver's license</option>
              </select>
            </div>
            <div>
              <Label>
                Document number <span style={{ color: GREEN }}>*</span>
              </Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
            </div>
          </div>

          <FileSlot label="ID front" file={front} onChange={setFront} required />
          <FileSlot label="ID back (if applicable)" file={back} onChange={setBack} />
          <FileSlot label="Selfie holding ID" file={selfie} onChange={setSelfie} required />

          <Button
            onClick={submit}
            disabled={loading}
            className="w-full text-white hover:opacity-95"
            style={{ backgroundColor: GREEN_DEEP }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for verification"}
          </Button>
        </div>
      )}
    </div>
  );
}
