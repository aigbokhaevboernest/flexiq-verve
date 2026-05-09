import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Building2, Send, Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, formatMoney, currencySymbol } from "@/hooks/useAccount";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { CodeGate } from "@/components/CodeGate";
import { countries } from "@/lib/countries";
import { useNavigate } from "react-router-dom";

const SendMoney = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: account } = useAccount();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const currency = account?.currency || "USD";

  const [form, setForm] = useState({
    amount: "",
    firstName: "",
    lastName: "",
    address: "",
    zip: "",
    country: "United States",
    bankName: "",
    accountName: "",
    accountType: "checking",
    accountNumber: "",
    routing: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !account) return;
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (account.frozen) {
      toast({ title: "Account is frozen", description: "Contact support.", variant: "destructive" });
      return;
    }
    if (amount > Number(account.balance)) {
      toast({ title: "Insufficient funds", description: `Available: ${formatMoney(Number(account.balance), currency)}`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    // Create awaiting-code transaction
    const recipientName = `${form.firstName} ${form.lastName}`.trim();
    const { data: tx, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "transfer_out",
      status: "awaiting_code",
      amount: -amount,
      currency,
      recipient_name: recipientName,
      recipient_account: form.accountNumber,
      recipient_bank: form.bankName,
      recipient_country: form.country,
      description: form.note || `Transfer to ${recipientName}`,
      metadata: {
        first_name: form.firstName,
        last_name: form.lastName,
        address: form.address,
        zip: form.zip,
        account_type: form.accountType,
        routing: form.routing,
        account_name: form.accountName,
      },
    }).select().single();

    setSubmitting(false);
    if (error || !tx) {
      toast({ title: "Could not start transfer", description: error?.message, variant: "destructive" });
      return;
    }
    setPendingTxId(tx.id);
    setGateOpen(true);
  };

  const onCodesVerified = async () => {
    if (!user || !pendingTxId || !account) return;
    const amount = Number(form.amount);
    const { error: balErr } = await supabase
      .from("accounts")
      .update({ balance: Number(account.balance) - amount })
      .eq("user_id", user.id);
    if (balErr) throw balErr;

    await supabase
      .from("transactions")
      .update({ status: "pending" })
      .eq("id", pendingTxId);

    qc.invalidateQueries({ queryKey: ["account"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recent-tx"] });
    qc.invalidateQueries({ queryKey: ["stats"] });

    navigate("/dashboard/success", {
      state: {
        title: "Transfer pending",
        message: `${formatMoney(amount, currency)} to ${form.firstName} ${form.lastName}. Awaiting admin approval.`,
        receipt: true,
        details: [
          { label: "Date", value: new Date().toLocaleString() },
          { label: "Reference", value: pendingTxId.slice(0, 12).toUpperCase() },
          { label: "Recipient", value: `${form.firstName} ${form.lastName}` },
          { label: "Bank", value: form.bankName },
          { label: "Account", value: form.accountNumber },
          { label: "Amount", value: formatMoney(amount, currency) },
          { label: "Status", value: "Pending" },
        ],
      },
    });
    setPendingTxId(null);
  };

  const sym = currencySymbol(currency);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Send Money</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send funds to anyone, anywhere — securely with COT, IMF and Tax authorization.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</span>
                <h2 className="font-display text-lg font-bold">Amount</h2>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl font-bold text-muted-foreground">{sym}</span>
                <Input
                  type="number" inputMode="decimal" step="0.01"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  placeholder="0.00"
                  className="h-20 rounded-2xl pl-10 text-center font-display text-3xl font-bold"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">Available: {formatMoney(Number(account?.balance ?? 0), currency)}</p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</span>
                <h2 className="font-display text-lg font-bold">Recipient</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>First name</Label><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></div>
                <div className="space-y-2"><Label>Last name</Label><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required /></div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Country</Label>
                  <Select value={form.country} onValueChange={(v) => set("country", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">3</span>
                <h2 className="font-display text-lg font-bold">Bank details</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Bank name</Label><Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} required /></div>
                <div className="space-y-2"><Label>Account name</Label><Input value={form.accountName} onChange={(e) => set("accountName", e.target.value)} required /></div>
                <div className="space-y-2"><Label>Account number</Label><Input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} required /></div>
                <div className="space-y-2"><Label>Routing / SWIFT</Label><Input value={form.routing} onChange={(e) => set("routing", e.target.value)} required /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Note (optional)</Label><Textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={3} /></div>
              </div>
            </section>

            <Button type="submit" disabled={submitting} className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
              {submitting ? "Preparing…" : (
                <><Lock className="h-4 w-4" />Authorize & Send {sym}{Number(form.amount || 0).toFixed(2)}<ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-success" /><p className="text-sm font-semibold">Three-step authorization</p></div>
            <p className="mt-2 text-sm text-muted-foreground">All international transfers require COT, IMF and Tax clearance codes issued by your account manager.</p>
          </Card>
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <p className="text-sm font-semibold">Fee summary</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Amount</span><span>{formatMoney(Number(form.amount || 0), currency)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Transfer fee</span><span>{formatMoney(0, currency)}</span></div>
              <div className="border-t border-border/60 pt-3 flex justify-between font-semibold"><span>Total</span><span>{formatMoney(Number(form.amount || 0), currency)}</span></div>
            </div>
          </Card>
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Need codes?</p></div>
            <p className="mt-2 text-xs text-muted-foreground">Contact your account manager to receive valid COT, IMF and Tax authorization codes for this transaction.</p>
          </Card>
        </div>
      </div>

      <CodeGate
        open={gateOpen}
        onOpenChange={setGateOpen}
        title="Authorize transfer"
        description="Enter the codes provided by your account manager to authorize this transfer."
        onVerified={onCodesVerified}
      />
    </div>
  );
};

export default SendMoney;
