import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Building2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, formatMoney, currencySymbol } from "@/hooks/useAccount";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CodeGate } from "@/components/CodeGate";
import { ConfirmTransferDialog } from "@/components/ConfirmTransferDialog";
import { useNavigate } from "react-router-dom";

const WireTransfer = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: account } = useAccount();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const currency = account?.currency || "USD";

  const [form, setForm] = useState({
    amount: "",
    recipientName: "",
    bankName: "",
    accountNumber: "",
    routing: "",
    swift: "",
    bankAddress: "",
    purpose: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));
  const sym = currencySymbol(currency);
  const amt = Number(form.amount || 0);

  const startConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amt || amt <= 0) return toast({ title: "Enter a valid amount", variant: "destructive" });
    if (account?.frozen) return toast({ title: "Account frozen", variant: "destructive" });
    if (amt > Number(account?.balance ?? 0)) return toast({ title: "Insufficient funds", variant: "destructive" });
    setConfirmOpen(true);
  };

  const confirmAndStart = async () => {
    if (!user) return;
    setConfirmOpen(false);
    const { data: tx, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "wire_transfer",
      status: "awaiting_code",
      amount: -amt,
      currency,
      recipient_name: form.recipientName,
      recipient_account: form.accountNumber,
      recipient_bank: form.bankName,
      description: form.purpose || `Wire transfer to ${form.recipientName}`,
      metadata: { swift: form.swift, routing: form.routing, bank_address: form.bankAddress },
    }).select().single();
    if (error || !tx) return toast({ title: "Could not start transfer", description: error?.message, variant: "destructive" });
    setPendingTxId(tx.id);
    setGateOpen(true);
  };

  const onVerified = async () => {
    if (!user || !account || !pendingTxId) return;
    await supabase.from("accounts").update({ balance: Number(account.balance) - amt }).eq("user_id", user.id);
    await supabase.from("transactions").update({ status: "pending" }).eq("id", pendingTxId);
    qc.invalidateQueries({ queryKey: ["account"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recent-tx"] });
    qc.invalidateQueries({ queryKey: ["stats"] });

    navigate("/dashboard/success", {
      state: {
        title: "Wire transfer submitted",
        message: "Your wire transfer is pending admin approval.",
        receipt: true,
        details: [
          { label: "Date", value: new Date().toLocaleString() },
          { label: "Reference", value: pendingTxId.slice(0, 12).toUpperCase() },
          { label: "Recipient", value: form.recipientName },
          { label: "Bank", value: form.bankName },
          { label: "Account", value: form.accountNumber },
          { label: "Amount", value: formatMoney(amt, currency) },
          { label: "Status", value: "Pending" },
        ],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Wire Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send wire transfers domestically and internationally — secured with multi-step authorization.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <form onSubmit={startConfirm} className="space-y-6">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl font-bold text-muted-foreground">{sym}</span>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00"
                className="h-20 rounded-2xl pl-10 text-center font-display text-3xl font-bold" required />
            </div>
            <p className="text-xs text-muted-foreground">Available: {formatMoney(Number(account?.balance ?? 0), currency)}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Recipient name</Label><Input value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} required /></div>
              <div className="space-y-2"><Label>Bank name</Label><Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} required /></div>
              <div className="space-y-2"><Label>Account number</Label><Input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} required /></div>
              <div className="space-y-2"><Label>Routing number</Label><Input value={form.routing} onChange={(e) => set("routing", e.target.value)} /></div>
              <div className="space-y-2"><Label>SWIFT / BIC</Label><Input value={form.swift} onChange={(e) => set("swift", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Bank address</Label><Input value={form.bankAddress} onChange={(e) => set("bankAddress", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Purpose</Label><Textarea value={form.purpose} onChange={(e) => set("purpose", e.target.value)} rows={2} /></div>
            </div>

            <Button type="submit" className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
              <Lock className="h-4 w-4" /> Continue & authorize
            </Button>
          </form>
        </Card>

        <Card className="rounded-3xl border-border/60 p-6 shadow-card h-fit">
          <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><p className="text-sm font-semibold">Wire transfer</p></div>
          <p className="mt-2 text-xs text-muted-foreground">Wire transfers settle within 1–3 business days. Authorization codes are required for security.</p>
        </Card>
      </div>

      <ConfirmTransferDialog
        open={confirmOpen} onOpenChange={setConfirmOpen}
        amountLabel={formatMoney(amt, currency)} recipientName={form.recipientName || "recipient"}
        rows={[
          { label: "Bank", value: form.bankName },
          { label: "Account", value: form.accountNumber },
          { label: "Routing", value: form.routing },
          { label: "SWIFT", value: form.swift },
        ]}
        onConfirm={confirmAndStart}
      />

      <CodeGate open={gateOpen} onOpenChange={setGateOpen} onVerified={onVerified} title="Authorize wire transfer" />
    </div>
  );
};

export default WireTransfer;
