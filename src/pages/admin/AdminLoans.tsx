import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Check, X } from "lucide-react";

const AdminLoans = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [rejectFor, setRejectFor] = useState<any>(null);
  const [reason, setReason] = useState("");

  const { data: loans = [] } = useQuery({
    queryKey: ["admin-loans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("loans")
        .select("*, profiles!inner(first_name,last_name,email)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const approve = async (l: any) => {
    await supabase.from("loans").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", l.id);
    qc.invalidateQueries({ queryKey: ["admin-loans"] });
    toast({ title: "Loan approved", description: "User can now request disbursement with a Loan Authorization Code." });
  };
  const doReject = async () => {
    if (!rejectFor) return;
    await supabase.from("loans").update({ status: "rejected", rejection_reason: reason || "Not approved" }).eq("id", rejectFor.id);
    qc.invalidateQueries({ queryKey: ["admin-loans"] });
    toast({ title: "Loan rejected" });
    setRejectFor(null); setReason("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Loans</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and approve loan applications.</p>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="pb-3">User</th><th className="pb-3 text-right">Amount</th><th className="pb-3">Term</th><th className="pb-3">Purpose</th><th className="pb-3">Status</th><th className="pb-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {loans.map((l: any) => (
              <tr key={l.id}>
                <td className="py-3">
                  <p className="font-medium">{l.profiles?.first_name} {l.profiles?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{l.profiles?.email}</p>
                </td>
                <td className="py-3 text-right font-display font-bold">{Number(l.amount).toLocaleString()} {l.currency}</td>
                <td className="py-3">{l.term_months}m @ {l.interest_rate}%</td>
                <td className="py-3 max-w-[240px] truncate text-muted-foreground">{l.purpose || "—"}</td>
                <td className="py-3">
                  <Badge variant="outline" className={
                    l.status === "active" ? "border-success/30 bg-success/10 text-success capitalize" :
                    l.status === "approved" ? "border-primary/30 bg-primary/10 text-primary capitalize" :
                    l.status === "pending" ? "border-warning/30 bg-warning/10 text-warning capitalize" :
                    "border-destructive/30 bg-destructive/10 text-destructive capitalize"
                  }>{l.status}</Badge>
                </td>
                <td className="py-3 text-right">
                  {l.status === "pending" && (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => approve(l)}><Check className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectFor(l)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {loans.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No loans.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!rejectFor} onOpenChange={(v) => !v && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject loan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <Button onClick={doReject} variant="destructive" className="w-full">Confirm rejection</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoans;
