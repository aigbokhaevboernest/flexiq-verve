import { useFrozenGuard } from "@/hooks/useFrozenGuard";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, currencySymbol } from "@/hooks/useAccount";
import { useTotalBalance, planDeduction } from "@/hooks/useTotalBalance";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CodeGate } from "@/components/CodeGate";
import { ConfirmTransferDialog } from "@/components/ConfirmTransferDialog";
import { useNavigate } from "react-router-dom";
import { SectionLabel } from "@/components/SectionLabel";
import { sendEmail } from "@/lib/sendEmail";
import { saveBeneficiary } from "@/lib/beneficiaries";


const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <SectionLabel>{title}</SectionLabel>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </div>
);

const WireTransfer = () => {
  useFrozenGuard();

  const { toast } = useToast();
  const { user } = useAuth();
  // total = primary + every opened secondary account (same as the dashboard)
  const { account, total: availableBalance } = useTotalBalance();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const currency = account?.currency || "USD";

  const [form, setForm] = useState({
    amount: "",
    firstName: "",
    lastName: "",
    zipCode: "",
    address: "",
    bankName: "",
    accountName: "",
    accountType: "checking",
    accountNumber: "",
    iban: "",
    routing: "",
    swift: "",
    bankZip: "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));
  const sym = currencySymbol(currency);
  const amt = Number(form.amount || 0);
  const fullName = `${form.firstName} ${form.lastName}`.trim();

  const startConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amt || amt <= 0) return toast({ title: "Enter a valid amount", variant: "destructive" });
    if (account?.frozen) return toast({ title: "Account frozen", variant: "destructive" });
    if (amt > availableBalance) return toast({ title: "Insufficient funds", variant: "destructive" });

    // Save the entered recipient details as soon as Continue is clicked
    if (user) {
      saveBeneficiary(user.id, "wire", {
        name: fullName,
        account_number: form.accountNumber,
        routing_number: form.routing,
        bank_name: form.bankName,
        swift_bic: form.swift,
        address: form.address,
        zip_code: form.zipCode,
        account_type: form.accountType,
      }).then(() => qc.invalidateQueries({ queryKey: ["beneficiaries"] }));
    }

    setConfirmOpen(true);
  };

  const confirmAndStart = async () => {
    if (!user) return;
    setConfirmOpen(false);
    const { data: tx, error } = await (supabase as any).from("transactions").insert({
      user_id: user.id,
      type: "wire_transfer",
      status: "pending",
      amount: -amt,
      currency,
      recipient_name: fullName,
      recipient_account: form.accountNumber,
      recipient_bank: form.bankName,
      iban: form.iban,
      swift_iban: form.swift,
      routing_number: form.routing,
      address: form.address,
      zip_code: form.zipCode,
      bank_zip_code: form.bankZip,
      account_type: form.accountType,
      description: `Wire transfer to ${fullName}`,
      metadata: {
        swift: form.swift, routing: form.routing, account_type: form.accountType,
        zip: form.zipCode, address: form.address, bank_zip: form.bankZip, account_name: form.accountName, iban: form.iban,
      },
    }).select().single();
    if (error || !tx) return toast({ title: "Could not start transfer", description: error?.message, variant: "destructive" });
    setPendingTxId(tx.id);
    setGateOpen(true);
  };

  const onVerified = async () => {
    if (!user || !account || !pendingTxId) return;

    // Take the amount out of the combined balance exactly once.
    const plan = planDeduction(account, amt);
    if (!plan.ok) {
      await (supabase as any).from("transactions").update({ status: "failed" }).eq("id", pendingTxId);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["recent-tx"] });
      setPendingTxId(null);
      return toast({ title: "Insufficient funds", variant: "destructive" });
    }

    await (supabase as any).from("profiles").update(plan.patch).eq("id", user.id);
    await (supabase as any).from("transactions").update({ status: "pending" }).eq("id", pendingTxId);
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recent-tx"] });
    qc.invalidateQueries({ queryKey: ["stats"] });

    try {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("first_name,last_name,email").eq("id", user.id).maybeSingle();
      const fn = prof?.first_name || "";
      const em = prof?.email || user.email || "";
      if (em) {
        await sendEmail({
          email: em, first_name: fn,
          subject: "Wire Transfer — Flexiq Verve",
          message:
`This is to inform you that your international wire transfer of ${amt} ${currency} to ${fullName} has been submitted and is currently pending review.

Please wait while we process your request. You will receive a notification regarding the status of your transfer.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}

    navigate("/dashboard/success", {
      state: {
        title: "Transfer Submitted",
        message: "Pending system verification.",
        receipt: true,
        returnTo: "/dashboard/send/wire",
        details: [
          { label: "Date", value: new Date().toLocaleString() },
          { label: "Reference", value: pendingTxId.slice(0, 12).toUpperCase() },
          { label: "Recipient", value: fullName },
          { label: "Bank", value: form.bankName },
          { label: "Account", value: form.accountNumber },
          { label: "SWIFT/BIC", value: form.swift },
          { label: "Amount", value: formatMoney(amt, currency) },
          { label: "Status", value: "Pending" },
        ],
      },
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">International Wire Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send funds internationally with full bank details and authorization.</p>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
        <form onSubmit={startConfirm} className="space-y-8">
          <Section title="Amount">
            <div className="space-y-2 sm:col-span-2">
              <Label>Amount ({currency})</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl font-bold text-muted-foreground">{sym}</span>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00"
                  className="h-16 rounded-2xl pl-10 text-center font-display text-2xl font-bold" required />
              </div>
              <p className="text-xs text-muted-foreground">Available: {formatMoney(availableBalance, currency)}</p>
            </div>
          </Section>

          <Section title="Recipient">
            <div className="space-y-2"><Label>First name</Label><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Last name</Label><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Zip code</Label><Input value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} required /></div>
          </Section>

          <Section title="Bank Details">
            <div className="space-y-2"><Label>Bank name</Label><Input value={form.bankName} onChange={(e) => set("bankName", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Account name</Label><Input value={form.accountName} onChange={(e) => set("accountName", e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Account type</Label>
              <Select value={form.accountType} onValueChange={(v) => set("accountType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Account number</Label><Input value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} required /></div>
            <div className="space-y-2"><Label>IBAN</Label><Input value={form.iban} onChange={(e) => set("iban", e.target.value)} placeholder="e.g. DE89 3704 0044 0532 0130 00" /></div>
            <div className="space-y-2"><Label>Routing number</Label><Input value={form.routing} onChange={(e) => set("routing", e.target.value)} required /></div>
            <div className="space-y-2"><Label>SWIFT / BIC</Label><Input value={form.swift} onChange={(e) => set("swift", e.target.value)} required /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Bank zip code</Label><Input value={form.bankZip} onChange={(e) => set("bankZip", e.target.value)} /></div>
          </Section>

          <Button type="submit" className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
            <Lock className="h-4 w-4" /> Continue
          </Button>
        </form>
      </Card>

      <ConfirmTransferDialog
        open={confirmOpen} onOpenChange={setConfirmOpen}
        amountLabel={formatMoney(amt, currency)} recipientName={fullName || "recipient"}
        rows={[
          { label: "Bank", value: form.bankName },
          { label: "Account", value: form.accountNumber },
          { label: "Routing", value: form.routing },
          { label: "SWIFT/BIC", value: form.swift },
        ]}
        onConfirm={confirmAndStart}
      />

      <CodeGate open={gateOpen} onOpenChange={setGateOpen} onVerified={onVerified} title="Authorize transfer" />
    </div>
  );
};

export default WireTransfer;
