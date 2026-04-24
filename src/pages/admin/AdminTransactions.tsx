import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

const AdminTransactions = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: txs = [] } = useQuery({
    queryKey: ["admin-tx"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*, profiles!inner(first_name,last_name,email)")
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const reject = async (t: any) => {
    await supabase.from("transactions").update({ status: "rejected" }).eq("id", t.id);
    qc.invalidateQueries({ queryKey: ["admin-tx"] });
    toast({ title: "Transaction rejected" });
  };

  const forceComplete = async (t: any) => {
    if (Number(t.amount) < 0) {
      const { data: acc } = await supabase.from("accounts").select("*").eq("user_id", t.user_id).maybeSingle();
      if (acc) await supabase.from("accounts").update({ balance: Number(acc.balance) + Number(t.amount) }).eq("id", acc.id);
    }
    await supabase.from("transactions").update({ status: "completed" }).eq("id", t.id);
    qc.invalidateQueries({ queryKey: ["admin-tx"] });
    toast({ title: "Marked completed" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">All system transactions. Approve or reject pending items.</p>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="pb-3">User</th><th className="pb-3">Type</th><th className="pb-3">Reference</th><th className="pb-3 text-right">Amount</th><th className="pb-3">Status</th><th className="pb-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {txs.map((t: any) => (
              <tr key={t.id}>
                <td className="py-3">
                  <p className="font-medium">{t.profiles?.first_name} {t.profiles?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{t.profiles?.email}</p>
                </td>
                <td className="py-3 capitalize">{t.type.replace(/_/g, " ")}</td>
                <td className="py-3 font-mono text-xs">{t.reference}</td>
                <td className={`py-3 text-right font-display font-bold ${Number(t.amount) > 0 ? "text-success" : ""}`}>
                  {Number(t.amount) > 0 ? "+" : "−"}{Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {t.currency}
                </td>
                <td className="py-3">
                  <Badge variant="outline" className={
                    t.status === "completed" ? "border-success/30 bg-success/10 text-success capitalize" :
                    t.status === "pending" || t.status === "awaiting_code" ? "border-warning/30 bg-warning/10 text-warning capitalize" :
                    "border-destructive/30 bg-destructive/10 text-destructive capitalize"
                  }>{t.status.replace(/_/g, " ")}</Badge>
                </td>
                <td className="py-3 text-right">
                  {(t.status === "pending" || t.status === "awaiting_code") && (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => forceComplete(t)}><Check className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => reject(t)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {txs.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No transactions.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default AdminTransactions;
