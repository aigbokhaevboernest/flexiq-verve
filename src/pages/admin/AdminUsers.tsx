import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Snowflake, Sun, Plus, Minus, KeyRound } from "lucide-react";

const AdminUsers = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjNote, setAdjNote] = useState("");

  const [codeOpen, setCodeOpen] = useState(false);
  const [codeType, setCodeType] = useState<"cot" | "imf" | "tax" | "loan">("cot");
  const [codeValue, setCodeValue] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: accounts } = await supabase.from("accounts").select("*");
      return (profiles || []).map((p: any) => ({
        ...p,
        account: (accounts || []).find((a: any) => a.user_id === p.id),
      }));
    },
  });

  const filtered = users.filter((u: any) => {
    if (!q) return true;
    const hay = `${u.first_name} ${u.last_name} ${u.email} ${u.account?.account_number || ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const toggleFreeze = async (u: any) => {
    if (!u.account) return;
    await supabase.from("accounts").update({ frozen: !u.account.frozen }).eq("id", u.account.id);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    toast({ title: u.account.frozen ? "Account unfrozen" : "Account frozen" });
  };

  const adjust = async () => {
    if (!selected?.account) return;
    const amt = Number(adjAmount);
    if (!amt || amt <= 0) return toast({ title: "Enter amount", variant: "destructive" });
    const delta = adjType === "credit" ? amt : -amt;
    const newBal = Number(selected.account.balance) + delta;
    if (newBal < 0) return toast({ title: "Cannot debit below 0", variant: "destructive" });

    await supabase.from("accounts").update({ balance: newBal }).eq("id", selected.account.id);
    await supabase.from("transactions").insert({
      user_id: selected.id,
      type: "adjustment",
      status: "completed",
      amount: delta,
      currency: selected.account.currency,
      description: adjNote || `Admin ${adjType}`,
    });

    qc.invalidateQueries({ queryKey: ["admin-users"] });
    toast({ title: `${adjType === "credit" ? "Credited" : "Debited"} ${amt} ${selected.account.currency}` });
    setAdjOpen(false); setAdjAmount(""); setAdjNote("");
  };

  const issueCode = async () => {
    if (!selected) return;
    const code = codeValue.trim().toUpperCase() ||
      `NX-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { error } = await supabase.from("auth_codes").insert({
      user_id: selected.id,
      code,
      code_type: codeType,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `${codeType.toUpperCase()} code issued`, description: code });
    navigator.clipboard?.writeText(code);
    setCodeOpen(false); setCodeValue("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage balances, freeze accounts and issue codes.</p>
        </div>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, account…" className="pl-9" />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="pb-3">User</th><th className="pb-3">Account</th><th className="pb-3 text-right">Balance</th><th className="pb-3">Status</th><th className="pb-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((u: any) => (
                <tr key={u.id}>
                  <td className="py-3">
                    <p className="font-medium">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="py-3 font-mono text-xs">{u.account?.account_number || "—"}</td>
                  <td className="py-3 text-right font-display font-bold">
                    {u.account ? `${Number(u.account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${u.account.currency}` : "—"}
                  </td>
                  <td className="py-3">
                    {u.account?.frozen ? <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">Frozen</Badge> :
                      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">Active</Badge>}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setSelected(u); setAdjType("credit"); setAdjOpen(true); }}><Plus className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelected(u); setAdjType("debit"); setAdjOpen(true); }}><Minus className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => toggleFreeze(u)}>{u.account?.frozen ? <Sun className="h-3.5 w-3.5" /> : <Snowflake className="h-3.5 w-3.5" />}</Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelected(u); setCodeOpen(true); }}><KeyRound className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="capitalize">{adjType} {selected?.first_name}'s account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Amount ({selected?.account?.currency || "USD"})</Label><Input type="number" step="0.01" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} /></div>
            <div className="space-y-2"><Label>Note</Label><Input value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder="Reason / reference" /></div>
            <Button onClick={adjust} className="w-full bg-gradient-primary capitalize">{adjType} account</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={codeOpen} onOpenChange={setCodeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue authorization code for {selected?.first_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code type</Label>
              <Select value={codeType} onValueChange={(v: any) => setCodeType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cot">COT (Cost of Transfer)</SelectItem>
                  <SelectItem value="imf">IMF Authorization</SelectItem>
                  <SelectItem value="tax">Tax Clearance</SelectItem>
                  <SelectItem value="loan">Loan Authorization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Code (leave blank to auto-generate)</Label><Input value={codeValue} onChange={(e) => setCodeValue(e.target.value.toUpperCase())} placeholder="NX-XXXX-XXXX" className="font-mono" /></div>
            <p className="text-xs text-muted-foreground">Code will be valid for 7 days. It will be copied to your clipboard.</p>
            <Button onClick={issueCode} className="w-full bg-gradient-primary">Issue code</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
