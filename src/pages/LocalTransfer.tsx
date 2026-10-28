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
import { useQueryClient } from "@tanstack/react-query";
import { CodeGate } from "@/components/CodeGate";
import { SavedBeneficiaries } from "@/components/SavedBeneficiaries";
import { saveBeneficiary } from "@/lib/beneficiaries";
import { useNavigate } from "react-router-dom";
import { sendEmail } from "@/lib/sendEmail";

type Dest = "internal" | "external";

const LocalTransfer = () => {
  useFrozenGuard();

  const { toast } = useToast();
  const { user } = useAuth();
  // total = primary + every opened secondary account (same as the dashboard)
  const { account, total: availableBalance } = useTotalBalance();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const currency = account?.currency || "USD";

  const [dest, setDest] = useState<Dest>("internal");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(""); // account name (internal) or recipient name (external)
  const [accNumber, setAccNumber] = useState("");
  const [email, setEmail] = useState(""); // internal only
  const [routing, setRouting] = useState(""); // external only
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  // The verified Flexiq Verve receiver (internal transfers)
  const [receiver, setReceiver] = useState<any>(null);

  const isInternal = dest === "internal";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !account) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter amount", variant: "destructive" });
    if (account?.frozen) return toast({ title: "Account frozen", variant: "destructive" });
    if (amt > availableBalance) return toast({ title: "Insufficient funds", variant: "destructive" });

    setSubmitting(true);

    // ── Internal: find the receiver first ──
    let found: any = null;
    if (isInternal) {
      const { data, error: rpcErr } = await (supabase as any).rpc("resolve_flexiq_user", {
        p_account_number: accNumber,
        p_email: email,
      });
      found = Array.isArray(data) ? data[0] : data;
      if (rpcErr || !found) {
        setSubmitting(false);
        return toast({
          title: "Account not found",
          description: "No Flexiq Verve account matches that account number and email.",
          variant: "destructive",
        });
      }

      const fullName = `${found.first_name || ""} ${found.last_name || ""}`.trim().toLowerCase();
      const nameOk = recipient
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .every((part) => fullName.includes(part));
      if (!nameOk) {
        setSubmitting(false);
        return toast({
          title: "Account name doesn't match",
          description: "Check the name on the receiving account.",
          variant: "destructive",
        });
      }

      // Same currency rule: different currencies go through FX transfer
      if (found.currency && found.currency !== currency) {
        setSubmitting(false);
        return toast({
          title: "Different currency",
          description: `This account holds ${found.currency}. Use FX transfer instead.`,
          variant: "destructive",
        });
      }
      setReceiver(found);
    } else {
      // Save the entered recipient details as soon as Submit is clicked
      saveBeneficiary(user.id, "local", {
        name: recipient,
        account_number: accNumber,
        routing_number: routing,
      }).then(() => qc.invalidateQueries({ queryKey: ["beneficiaries"] }));
    }

    const receiverName = isInternal
      ? `${found.first_name || ""} ${found.last_name || ""}`.trim() || recipient
      : recipient;

    const { data: tx, error } = await (supabase as any).from("transactions").insert({
      user_id: user.id,
      type: "transfer_out",
      status: "pending",
      amount: -amt,
      currency,
      recipient_name: receiverName,
      recipient_account: accNumber,
      recipient_bank: isInternal ? "Flexiq Verve" : "Local bank",
      routing_number: isInternal ? null : routing,
      description: desc || `Local transfer to ${receiverName}`,
      metadata: isInternal
        ? { internal: true, receiver_id: found.id, receiver_email: found.email }
        : { routing, local: true },
    }).select().single();
    setSubmitting(false);

    if (error || !tx) return toast({ title: "Failed", description: error?.message, variant: "destructive" });
    setPendingTxId(tx.id);
    setGateOpen(true);
  };

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recent-tx"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

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

    const ref = pendingTxId;
    const amtCopy = amt;
    const recCopy = isInternal
      ? `${receiver?.first_name || ""} ${receiver?.last_name || ""}`.trim() || recipient
      : recipient;
    let finalStatus: "Pending" | "Completed" = "Pending";

    if (isInternal) {
      // Money moves instantly between Flexiq Verve accounts
      await (supabase as any).from("transactions").update({ status: "completed" }).eq("id", ref);
      const { error: creditErr } = await (supabase as any).rpc("credit_internal_transfer", { p_tx_id: ref });
      if (creditErr) {
        // Sender was debited but the receiver could not be credited: leave it for review
        await (supabase as any).from("transactions").update({ status: "pending" }).eq("id", ref);
        toast({
          title: "Transfer needs review",
          description: "We couldn't credit the receiver yet. Our team will complete it shortly.",
          variant: "destructive",
        });
      } else {
        finalStatus = "Completed";
      }
    } else {
      await (supabase as any).from("transactions").update({ status: "pending" }).eq("id", ref);
    }
    refreshAll();

    // ── Emails ──
    try {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("first_name,last_name,email").eq("id", user.id).maybeSingle();
      const fn = prof?.first_name || "";
      const senderFull = `${prof?.first_name || ""} ${prof?.last_name || ""}`.trim() || "a Flexiq Verve user";
      const em = prof?.email || user.email || "";
      const footer = `For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`;

      if (em) {
        await sendEmail({
          email: em, first_name: fn,
          subject: "Local Transfer — Flexiq Verve",
          message: isInternal && finalStatus === "Completed"
            ? `Your transfer of ${amtCopy} ${currency} to ${recCopy} (Flexiq Verve account) has been completed.

${footer}`
            : `This is to inform you that your local transfer of ${amtCopy} ${currency} to ${recCopy} has been submitted and is currently pending review.

Please wait while we process your request. You will receive a notification regarding the status of your transfer.

${footer}`,
        });
      }

      if (isInternal && finalStatus === "Completed" && receiver?.email) {
        await sendEmail({
          email: receiver.email, first_name: receiver.first_name || "",
          subject: "You received money — Flexiq Verve",
          message: `You have received ${amtCopy} ${currency} from ${senderFull}. The funds are now available in your account.

${footer}`,
        });
      }
    } catch {}

    const summaryRecipient = recCopy;
    const summaryAccount = accNumber;
    setAmount(""); setRecipient(""); setAccNumber(""); setRouting(""); setEmail(""); setDesc("");
    setReceiver(null);
    setPendingTxId(null);
    navigate("/dashboard/success", {
      state: {
        title: finalStatus === "Completed" ? "Transfer Completed" : "Transfer Submitted",
        message: finalStatus === "Completed" ? "Funds were sent to the recipient." : "Pending system verification.",
        receipt: true,
        returnTo: "/dashboard/local",
        details: [
          { label: "Date", value: new Date().toLocaleString() },
          { label: "Reference", value: ref.slice(0, 12).toUpperCase() },
          { label: "Recipient", value: summaryRecipient },
          { label: "Account", value: summaryAccount },
          { label: "Amount", value: formatMoney(amt, currency) },
          { label: "Status", value: finalStatus },
        ],
      },
    });
  };

  const sym = currencySymbol(currency);

  const segBtn = (active: boolean) =>
    `flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-smooth ${
      active ? "bg-gradient-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Local Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send to another Flexiq Verve account or to a local bank.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Destination */}
            <div className="flex gap-1 rounded-2xl border border-border bg-muted/40 p-1" role="tablist">
              <button type="button" role="tab" aria-selected={isInternal} onClick={() => setDest("internal")} className={segBtn(isInternal)}>
                Flexiq Verve account
              </button>
              <button type="button" role="tab" aria-selected={!isInternal} onClick={() => setDest("external")} className={segBtn(!isInternal)}>
                External account
              </button>
            </div>

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
              <div className="space-y-2 sm:col-span-2">
                <Label>{isInternal ? "Account name" : "Recipient name"}</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Account number</Label>
                <Input value={accNumber} onChange={(e) => setAccNumber(e.target.value)} required />
              </div>
              {isInternal ? (
                <div className="space-y-2">
                  <Label>Recipient email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Routing number</Label>
                  <Input value={routing} onChange={(e) => setRouting(e.target.value)} required />
                </div>
              )}
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                {/* 16px on mobile stops the browser zooming in when the field is focused */}
                <Textarea className="text-base md:text-sm" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
              </div>
            </div>

            <Button id="transfer-submit" type="submit" disabled={submitting} className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
              {submitting ? "Processing…" : (<><Lock className="h-4 w-4" />Send {sym}{Number(amount || 0).toFixed(2)}<ArrowRight className="h-4 w-4" /></>)}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {!isInternal && (
            <SavedBeneficiaries
              kind="local"
              onSelect={(b) => {
                setRecipient(b.name || "");
                setAccNumber(b.account_number || "");
                setRouting(b.routing_number || "");
              }}
            />
          )}
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
