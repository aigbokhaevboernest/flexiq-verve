import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ShieldCheck, XCircle, Eye } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  not_started: "bg-muted text-muted-foreground",
};

const AdminVerifications = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [urls, setUrls] = useState<{ front?: string; back?: string; selfie?: string }>({});

  const { data: rows = [] } = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const { data: vers } = await supabase
        .from("id_verifications").select("*").order("submitted_at", { ascending: false, nullsFirst: false });
      const { data: profiles } = await supabase.from("profiles").select("id,first_name,last_name,email");
      return (vers || []).map((v: any) => ({
        ...v,
        profile: (profiles || []).find((p: any) => p.id === v.user_id),
      }));
    },
  });

  const open = async (row: any) => {
    setSelected(row);
    setReason(row.rejection_reason || "");
    const sign = async (path?: string | null) => {
      if (!path) return undefined;
      const { data } = await supabase.storage.from("id-verification").createSignedUrl(path, 60 * 10);
      return data?.signedUrl;
    };
    const [front, back, selfie] = await Promise.all([sign(row.id_front_path), sign(row.id_back_path), sign(row.selfie_path)]);
    setUrls({ front, back, selfie });
  };

  const decide = async (status: "approved" | "rejected") => {
    if (!selected) return;
    const patch: any = {
      status,
      reviewed_at: new Date().toISOString(),
      rejection_reason: status === "rejected" ? reason || "Did not meet requirements" : null,
    };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    const { error } = await supabase.from("id_verifications").update(patch).eq("id", selected.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    // Audit log (best-effort; ignore failure so the decision still goes through)
    await supabase.functions.invoke("admin-actions", {
      body: {
        action: "audit_verification",
        target_user_id: selected.user_id,
        verification_id: selected.id,
        decision: status,
        reason: status === "rejected" ? reason : null,
      },
    }).catch(() => {});
    toast({ title: status === "approved" ? "Verification approved" : "Verification rejected" });
    qc.invalidateQueries({ queryKey: ["admin-verifications"] });
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">ID.me verifications</h1>
          <p className="text-sm text-muted-foreground">Review submitted identity documents</p>
        </div>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="divide-y divide-border/60">
          {rows.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No submissions yet.</p>}
          {rows.map((r: any) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 py-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-semibold">{r.legal_first_name} {r.legal_last_name}</p>
                <p className="text-xs text-muted-foreground">{r.profile?.email} • {r.document_type?.replace(/_/g, " ")}</p>
              </div>
              <Badge className={STATUS_COLORS[r.status] || ""}>{r.status.replace(/_/g, " ")}</Badge>
              <p className="text-xs text-muted-foreground">
                {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
              </p>
              <Button size="sm" variant="outline" onClick={() => open(r)}>
                <Eye className="mr-1 h-3.5 w-3.5" /> Review
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Verification review</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <Info k="Legal name" v={`${selected.legal_first_name} ${selected.legal_middle_name || ""} ${selected.legal_last_name}`} />
                <Info k="Date of birth" v={selected.date_of_birth} />
                <Info k="Address" v={`${selected.address_line1}, ${selected.city} ${selected.postal_code}, ${selected.country}`} />
                <Info k="Phone" v={selected.phone} />
                <Info k="Document" v={`${selected.document_type?.replace(/_/g, " ")} • ${selected.document_number}`} />
                <Info k="Expires" v={selected.document_expires} />
                <Info k="Issuing country" v={selected.document_country} />
                <Info k="SSN last 4" v={selected.ssn_last4} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["front", "back", "selfie"] as const).map((k) => (
                  <div key={k}>
                    <p className="mb-1 text-xs font-medium capitalize text-muted-foreground">{k}</p>
                    <div className="aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/40">
                      {urls[k] ? (
                        <a href={urls[k]} target="_blank" rel="noreferrer">
                          <img src={urls[k]} alt={k} className="h-full w-full object-cover" />
                        </a>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">—</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-1 text-xs font-medium">Rejection reason (if rejecting)</p>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. ID image is blurry" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => decide("rejected")}>
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => decide("approved")} className="bg-gradient-primary">
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Info = ({ k, v }: { k: string; v: any }) => (
  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
    <p className="text-xs text-muted-foreground">{k}</p>
    <p className="mt-0.5 font-medium break-words">{v || "—"}</p>
  </div>
);

export default AdminVerifications;
