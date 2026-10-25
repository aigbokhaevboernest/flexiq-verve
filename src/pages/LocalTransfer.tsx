import { useFrozenGuard } from "@/hooks/useFrozenGuard";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, currencySymbol } from "@/hooks/useAccount";
import { useTotalBalance, planDeduction } from "@/hooks/useTotalBalance";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { CodeGate } from "@/components/CodeGate";
import { PulseLoader } from "@/components/PulseLoader";
import { saveBeneficiary } from "@/lib/beneficiaries";
import { useNavigate } from "react-router-dom";
import { sendEmail } from "@/lib/sendEmail";

const LocalTransfer = () => {
  useFrozenGuard();

  const { toast } = useToast();
  const { user } = useAuth();
  // total = primary + every opened secondary account (same as the dashboard)
  const { account, total: availableBalance } = useTotalBalance();
  const qc = useQueryClient();
  const currency = account?.currency || "USD";

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [routing, setRouting] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const { data: beneficiaries = [], isLoading: loadingBeneficiaries } = useQuery({
    queryKey: ["beneficiaries", user?.id, "local"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("beneficiaries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("kind", "local")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !account) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter amount", variant: "destructive" });
    if (account?.frozen) return toast({ title: "Account frozen", variant: "destructive" });
    if (amt > availableBalance) return toast({ title: "Insufficient funds", variant: "destructive" });

    // Save the entered recipient details as soon as Submit is clicked
    saveBeneficiary(user.id, "local", {
      name: recipient,
      account_number: accNumber,
      routing_number: routing,
    }).then(() => qc.invalidateQueries({ queryKey: ["beneficiaries"] }));

    setSubmitting(true);
    const { data: tx, error } = await (supabase as any).from("transactions").insert({
      user_id: user.id,
      type: "transfer_out",
      status: "pending",
      amount: -amt,
      currency,
      recipient_name: recipient,
      recipient_account: accNumber,
      recipient_bank: "Local bank",
      routing_number: routing,
      description: desc || `Local transfer to ${recipient}`,
      metadata: { routing, local: true },
    }).select().single();
    setSubmitting(false);

    if (error || !tx) return toast({ title: "Failed", description: error?.message, variant: "destructive" });
    setPendingTxId(tx.id);
    setGateOpen(true);
  };

  const navigate = useNavigate();
  const onVerified = async () => {
    if (!user || !account || !pendingTxId) return;
    const amt = Number(amount);

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
    const ref = pendingTxId;
    const amtCopy = amt;
    const recCopy = recipient;

    try {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("first_name,last_name,email").eq("id", user.id).maybeSingle();
      const fn = prof?.first_name || "";
      const em = prof?.email || user.email || "";
      if (em) {
        await sendEmail({
          email: em, first_name: fn,
          subject: "Local Transfer — Flexiq Verve",
          message:
`This is to inform you that your local transfer of ${amtCopy} ${currency} to ${recCopy} has been submitted and is currently pending review.

Please wait while we process your request. You will receive a notification regarding the status of your transfer.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}

    setAmount(""); setRecipient(""); setAccNumber(""); setRouting(""); setDesc("");
    setPendingTxId(null);
    navigate("/dashboard/success", {
      state: {
        title: "Transfer Submitted",
        message: "Pending system verification.",
        receipt: true,
        returnTo: "/dashboard/local",
        details: [
          { label: "Date", value: new Date().toLocaleString() },
          { label: "Reference", value: ref.slice(0, 12).toUpperCase() },
          { label: "Recipient", value: recipient },
          { label: "Account", value: accNumber },
          { label: "Amount", value: formatMoney(amt, currency) },
          { label: "Status", value: "Pending" },
        ],
      },
    });
  };

  const sym = currencySymbol(currency);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Local Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bank transfers within your country.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Amount</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-display text-2xl font-bold text-muted-foreground">{sym}</span>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                  className="h-14 border-0 bg-transparent p-0 font-display text-3xl font-bold shadow-none focus-visible:ring-0" required />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Available: {formatMoney(availableBalance, currency)}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label>Recipient name</Label><Input value={recipient} onChange={(e) => setRecipient(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Account number</Label><Input value={accNumber} onChange={(e) => setAccNumber(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Routing number</Label><Input value={routing} onChange={(e) => setRouting(e.target.value)} required /></div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                {/* 16px on mobile stops the browser zooming in when the field is focused */}
                <Textarea className="text-base md:text-sm" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
              {submitting ? "Processing…" : (<><Lock className="h-4 w-4" />Send {sym}{Number(amount || 0).toFixed(2)}<ArrowRight className="h-4 w-4" /></>)}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <p className="text-sm font-semibold">Saved beneficiaries</p>
            <div className="mt-3 space-y-2">
              {loadingBeneficiaries ? (
                <PulseLoader size={32} />
              ) : beneficiaries.length === 0 ? (
                <p className="text-xs text-muted-foreground">No saved beneficiaries yet.</p>
              ) : (
                beneficiaries.map((b: any) => (
                  <button key={b.id} type="button"
                    onClick={() => { setRecipient(b.name); setAccNumber(b.account_number); setRouting(b.routing_number || ""); }}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-smooth hover:bg-muted">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                      {b.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{b.name}</p>
                      <p className="text-xs text-muted-foreground">•••• {b.account_number.slice(-4)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <CodeGate
        open={gateOpen}
        onOpenChange={setGateOpen}
        title="Authorize local transfer"
        onVerified={onVerified}
      />
    </div>
  );
};

export default LocalTransfer;
