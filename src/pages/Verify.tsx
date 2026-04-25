import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVerification, useProfile } from "@/hooks/useAccount";
import { useQueryClient } from "@tanstack/react-query";
import { countries } from "@/lib/countries";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Lock,
  ScanFace,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

type DocType = "drivers_license" | "passport" | "state_id" | "residence_permit";

const STEPS = ["Personal", "Address", "Document", "Upload", "Selfie", "Review"] as const;

const Verify = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: verification, isLoading } = useVerification();
  const { data: profile } = useProfile();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [legalFirst, setLegalFirst] = useState("");
  const [legalMiddle, setLegalMiddle] = useState("");
  const [legalLast, setLegalLast] = useState("");
  const [dob, setDob] = useState("");
  const [ssn4, setSsn4] = useState("");
  const [phone, setPhone] = useState("");

  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("US");

  const [docType, setDocType] = useState<DocType>("drivers_license");
  const [docNumber, setDocNumber] = useState("");
  const [docCountry, setDocCountry] = useState("US");
  const [docState, setDocState] = useState("");
  const [docExpires, setDocExpires] = useState("");

  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  // hydrate from profile / existing record
  useEffect(() => {
    if (profile) {
      setLegalFirst((v) => v || profile.first_name || "");
      setLegalLast((v) => v || profile.last_name || "");
      setPhone((v) => v || profile.phone || "");
      setAddr1((v) => v || profile.address || "");
      setCity((v) => v || profile.city || "");
      setPostal((v) => v || profile.postal_code || "");
      setCountry((v) => v || profile.country || "US");
    }
  }, [profile]);

  useEffect(() => {
    if (verification && verification.status === "rejected") {
      // pre-fill so the user can fix and resubmit
      setLegalFirst(verification.legal_first_name || "");
      setLegalMiddle(verification.legal_middle_name || "");
      setLegalLast(verification.legal_last_name || "");
      setDob(verification.date_of_birth || "");
      setSsn4(verification.ssn_last4 || "");
      setPhone(verification.phone || "");
      setAddr1(verification.address_line1 || "");
      setAddr2(verification.address_line2 || "");
      setCity(verification.city || "");
      setStateRegion(verification.state_region || "");
      setPostal(verification.postal_code || "");
      setCountry(verification.country || "US");
      setDocType((verification.document_type as DocType) || "drivers_license");
      setDocNumber(verification.document_number || "");
      setDocCountry(verification.document_country || "US");
      setDocState(verification.document_state || "");
      setDocExpires(verification.document_expires || "");
    }
  }, [verification]);

  const status = verification?.status ?? "not_started";
  const canStartFlow = status === "not_started" || status === "rejected";

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const stepValid = useMemo(() => {
    switch (step) {
      case 0: return !!(legalFirst && legalLast && dob);
      case 1: return !!(addr1 && city && postal && country);
      case 2: return !!(docType && docNumber && docCountry && docExpires);
      case 3: return !!idFront && (docType === "passport" ? true : !!idBack);
      case 4: return !!selfie;
      default: return true;
    }
  }, [step, legalFirst, legalLast, dob, addr1, city, postal, country, docType, docNumber, docCountry, docExpires, idFront, idBack, selfie]);

  const uploadFile = async (file: File, kind: string) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user!.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("id-verification").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const [frontPath, backPath, selfiePath] = await Promise.all([
        idFront ? uploadFile(idFront, "id-front") : Promise.resolve(null as string | null),
        idBack ? uploadFile(idBack, "id-back") : Promise.resolve(null as string | null),
        selfie ? uploadFile(selfie, "selfie") : Promise.resolve(null as string | null),
      ]);

      const payload = {
        user_id: user.id,
        status: "pending",
        legal_first_name: legalFirst,
        legal_middle_name: legalMiddle || null,
        legal_last_name: legalLast,
        date_of_birth: dob,
        ssn_last4: ssn4 || null,
        phone: phone || null,
        address_line1: addr1,
        address_line2: addr2 || null,
        city,
        state_region: stateRegion || null,
        postal_code: postal,
        country,
        document_type: docType,
        document_number: docNumber,
        document_country: docCountry,
        document_state: docState || null,
        document_expires: docExpires,
        id_front_path: frontPath,
        id_back_path: backPath,
        selfie_path: selfiePath,
        rejection_reason: null,
        submitted_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("id_verifications")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;

      toast({
        title: "Verification submitted",
        description: "We'll review your information within 1–2 business days.",
      });
      qc.invalidateQueries({ queryKey: ["id-verification", user.id] });
      setStep(0);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading verification…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BrandHeader />

      {status === "approved" && <ApprovedCard verification={verification} />}
      {status === "pending" && <PendingCard />}
      {status === "rejected" && <RejectedCard reason={verification?.rejection_reason} />}

      {canStartFlow && (
        <Card className="overflow-hidden rounded-3xl border-border/60 shadow-card">
          <div className="border-b border-border/60 bg-muted/40 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 className="mt-1 font-display text-lg font-bold">{STEPS[step]}</h2>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" /> Encrypted
              </Badge>
            </div>
            <Progress value={((step + 1) / STEPS.length) * 100} className="mt-4 h-1.5" />
          </div>

          <div className="space-y-5 p-6">
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Legal first name" required>
                  <Input value={legalFirst} onChange={(e) => setLegalFirst(e.target.value)} placeholder="As shown on ID" />
                </Field>
                <Field label="Middle name (optional)">
                  <Input value={legalMiddle} onChange={(e) => setLegalMiddle(e.target.value)} />
                </Field>
                <Field label="Legal last name" required>
                  <Input value={legalLast} onChange={(e) => setLegalLast(e.target.value)} placeholder="As shown on ID" />
                </Field>
                <Field label="Date of birth" required>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </Field>
                <Field label="SSN last 4 (US only)">
                  <Input maxLength={4} value={ssn4} onChange={(e) => setSsn4(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
                </Field>
                <Field label="Phone">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Street address" required>
                    <Input value={addr1} onChange={(e) => setAddr1(e.target.value)} placeholder="123 Main St" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Apt, suite, etc.">
                    <Input value={addr2} onChange={(e) => setAddr2(e.target.value)} />
                  </Field>
                </div>
                <Field label="City" required>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </Field>
                <Field label="State / Region">
                  <Input value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} />
                </Field>
                <Field label="Postal code" required>
                  <Input value={postal} onChange={(e) => setPostal(e.target.value)} />
                </Field>
                <Field label="Country" required>
                  <CountrySelect value={country} onChange={setCountry} />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Field label="Document type" required>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {([
                      { v: "drivers_license", label: "Driver's License" },
                      { v: "passport", label: "Passport" },
                      { v: "state_id", label: "State / National ID" },
                      { v: "residence_permit", label: "Residence Permit" },
                    ] as { v: DocType; label: string }[]).map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setDocType(o.v)}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-smooth ${
                          docType === o.v
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          {o.label}
                        </span>
                        {docType === o.v && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Document number" required>
                    <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
                  </Field>
                  <Field label="Issuing country" required>
                    <CountrySelect value={docCountry} onChange={setDocCountry} />
                  </Field>
                  <Field label="Issuing state / region">
                    <Input value={docState} onChange={(e) => setDocState(e.target.value)} />
                  </Field>
                  <Field label="Expiration date" required>
                    <Input type="date" value={docExpires} onChange={(e) => setDocExpires(e.target.value)} />
                  </Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FileDrop
                  label="Front of ID"
                  hint="Clear photo, all 4 corners visible"
                  file={idFront}
                  onChange={setIdFront}
                  icon={<FileText className="h-5 w-5" />}
                />
                {docType !== "passport" && (
                  <FileDrop
                    label="Back of ID"
                    hint="Make sure barcode is readable"
                    file={idBack}
                    onChange={setIdBack}
                    icon={<FileText className="h-5 w-5" />}
                  />
                )}
              </div>
            )}

            {step === 4 && (
              <SelfieCapture file={selfie} onChange={setSelfie} />
            )}

            {step === 5 && (
              <ReviewSummary
                data={{
                  name: `${legalFirst} ${legalMiddle} ${legalLast}`.trim(),
                  dob, country, addr1, city, postal, docType, docNumber, docExpires,
                }}
                files={{ idFront, idBack, selfie }}
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-6 py-4">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} disabled={!stepValid} className="bg-gradient-primary">
                Continue <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting} className="bg-gradient-primary">
                {submitting ? "Submitting…" : "Submit for verification"}
              </Button>
            )}
          </div>
        </Card>
      )}

      <TrustFooter />
    </div>
  );
};

const BrandHeader = () => (
  <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-[hsl(150_85%_25%)] via-[hsl(150_70%_18%)] to-[hsl(150_90%_12%)] p-8 text-white shadow-elev">
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] opacity-80">Verified by</p>
            <p className="font-display text-2xl font-bold">ID.me</p>
          </div>
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold leading-tight sm:text-3xl">
          Verify your identity
        </h1>
        <p className="mt-2 max-w-md text-sm opacity-90">
          Confirm who you are with a government-issued ID. This protects your account and
          unlocks higher transfer limits.
        </p>
      </div>
      <div className="grid gap-2 text-xs">
        <Bullet icon={<Lock className="h-3.5 w-3.5" />}>Bank-grade encryption</Bullet>
        <Bullet icon={<ScanFace className="h-3.5 w-3.5" />}>Biometric face match</Bullet>
        <Bullet icon={<ClipboardCheck className="h-3.5 w-3.5" />}>Reviewed in 1–2 days</Bullet>
      </div>
    </div>
  </Card>
);

const Bullet = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
    {icon}
    {children}
  </span>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
  </div>
);

const CountrySelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
    <SelectContent className="max-h-72">
      {COUNTRIES.map((c) => (
        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const FileDrop = ({
  label, hint, file, onChange, icon,
}: { label: string; hint: string; file: File | null; onChange: (f: File | null) => void; icon: React.ReactNode }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div>
      <Label className="text-xs font-medium">{label}</Label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="mt-1.5 flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/40 px-4 text-center transition-smooth hover:border-primary/60 hover:bg-primary/5"
      >
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </span>
            <p className="text-sm font-medium">Tap to upload</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      {file && (
        <button onClick={() => onChange(null)} className="mt-2 text-xs text-muted-foreground hover:text-destructive">
          Remove & retake
        </button>
      )}
    </div>
  );
};

const SelfieCapture = ({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="text-center">
      <div className="mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-full border-4 border-dashed border-primary/40 bg-primary/5">
        {preview ? (
          <img src={preview} alt="Selfie" className="h-full w-full object-cover" />
        ) : (
          <ScanFace className="h-16 w-16 text-primary/60" />
        )}
      </div>
      <p className="mt-4 font-display text-lg font-semibold">Take a quick selfie</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Look straight at the camera in good lighting. We'll match this with your ID photo.
      </p>
      <Button onClick={() => ref.current?.click()} className="mt-4 bg-gradient-primary">
        <Camera className="mr-2 h-4 w-4" /> {file ? "Retake selfie" : "Capture selfie"}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </div>
  );
};

const ReviewSummary = ({ data, files }: { data: any; files: { idFront: File | null; idBack: File | null; selfie: File | null } }) => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm">
      <p className="mb-3 font-semibold">Review your information</p>
      <dl className="grid gap-2 sm:grid-cols-2">
        <Row k="Legal name" v={data.name} />
        <Row k="Date of birth" v={data.dob} />
        <Row k="Address" v={`${data.addr1}, ${data.city} ${data.postal}`} />
        <Row k="Country" v={data.country} />
        <Row k="Document" v={`${data.docType.replace(/_/g, " ")} • ${data.docNumber}`} />
        <Row k="Expires" v={data.docExpires} />
      </dl>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {(["idFront", "idBack", "selfie"] as const).map((k) => (
        <div key={k} className="aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/40">
          {files[k] ? (
            <img src={URL.createObjectURL(files[k]!)} alt={k} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">—</div>
          )}
        </div>
      ))}
    </div>
    <p className="text-xs text-muted-foreground">
      By submitting you agree that the information provided is accurate. False information may result in account closure.
    </p>
  </div>
);

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-4 capitalize">
    <dt className="text-muted-foreground">{k}</dt>
    <dd className="text-right font-medium">{v || "—"}</dd>
  </div>
);

const ApprovedCard = ({ verification }: { verification: any }) => (
  <Card className="rounded-3xl border-success/30 bg-success/5 p-6 shadow-card">
    <div className="flex items-start gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/15 text-success">
        <CheckCircle2 className="h-6 w-6" />
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold">Identity verified</h2>
          <Badge className="bg-success text-white hover:bg-success">Verified ✓</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved on {verification?.approved_at ? new Date(verification.approved_at).toLocaleDateString() : "—"}.
          You have full access to all account features.
        </p>
      </div>
    </div>
  </Card>
);

const PendingCard = () => (
  <Card className="rounded-3xl border-warning/30 bg-warning/5 p-6 shadow-card">
    <div className="flex items-start gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15 text-warning">
        <Clock className="h-6 w-6" />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold">Review in progress</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your documents are being reviewed. This usually takes 1–2 business days. We'll notify you once it's complete.
        </p>
      </div>
    </div>
  </Card>
);

const RejectedCard = ({ reason }: { reason?: string | null }) => (
  <Card className="rounded-3xl border-destructive/30 bg-destructive/5 p-6 shadow-card">
    <div className="flex items-start gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
        <XCircle className="h-6 w-6" />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold">Verification rejected</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {reason || "Some details couldn't be verified."} Please update your information and resubmit below.
        </p>
      </div>
    </div>
  </Card>
);

const TrustFooter = () => (
  <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
    {[
      { icon: Lock, t: "Private", d: "Encrypted in transit and at rest" },
      { icon: ShieldCheck, t: "Secure", d: "Used only for identity verification" },
      { icon: ChevronRight, t: "Compliant", d: "KYC / AML & GLBA aligned" },
    ].map(({ icon: Icon, t, d }) => (
      <div key={t} className="flex items-start gap-2 rounded-xl border border-border/60 bg-card p-3">
        <Icon className="mt-0.5 h-4 w-4 text-primary" />
        <div>
          <p className="font-semibold text-foreground">{t}</p>
          <p>{d}</p>
        </div>
      </div>
    ))}
  </div>
);

export default Verify;
