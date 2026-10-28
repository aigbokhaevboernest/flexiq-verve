import { useFrozenGuard } from "@/hooks/useFrozenGuard";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check, Loader2, Lock, Search } from "lucide-react";
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
type LookupState = "idle" | "loading" | "found" | "none";

const LocalTransfer = () => {
  useFrozenGuard();

  const { toast } = useToast();
  const { user } = useAuth();
  const { account, total: availableBalance } = useTotalBalance();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const currency = account?.currency || "USD";

  // External is the default
  const [dest, setDest] = useState<Dest>("external");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [email, setEmail] = useState(""); // internal only
  const [routing, setRouting] = useState(""); // external only
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);
  // Confirmed Flexiq Verve receiver (null = manual entry / not found)
  const [receiver, setReceiver] = useState<any>(null);
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  // Found account waiting for the user's confirmation
  const [candidate, setCandidate] = useState<any>(null);
  const reqId = useRef(0);

  const isInternal = dest === "internal";

  const resetLookup = () => {
    reqId.current++;
    setLookupState("idle");
    setCandidate(null);
    setReceiver(null);
  };

  // Lookup by account number (used by both auto-search and the Find button)
  const lookupAccount = async (num: string) => {
    const n = num.trim();
    if (!isInternal || n.length < 4) return;
    const id = ++reqId.current;
    setLookupState("loading");
    setCandidate(null);
    const { data, error } = await (supabase as any).rpc("resolve_flexiq_user", {
      p_account_number: n,
      p_email: null, // RPC should treat email as optional
    });
    if (id !== reqId.current) return; // stale result
    const found = Array.isArray(data) ? data[0] : data;
    if (error || !found) {
      setLookupState("none");
      return;
    }
    setCandidate(found);
    setLookupState("found");
  };

  // Auto-search as soon as a 10-digit number is entered
  useEffect(() => {
    reqId.current++;
    setReceiver(null);
    setCandidate(null);
    if (!isInternal) {
      setLookupState("idle");
      return;
    }
    const n = accNumber.trim();
    if (/^\d{10}$/.test(n)) lookupAccount(n);
    else setLookupState("idle");
    return () => {
      reqId.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accNumber, isInternal]);

  // Only fill the form after the user confirms the account
  const confirmCandidate = () => {
    if (!candidate) return;
    setReceiver(candidate);
    setRecipient(`${candidate.first_name || ""} ${candidate.last_name || ""}`.trim());
    setEmail(candidate.email || "");
    setCandidate(null);
    setLookupState("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !account) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter amount", variant: "destructive" });
    if (account?.frozen) return toast({ title: "Account frozen", variant: "destructive" });
    if (amt > availableBalance) return toast({ title: "Insufficient funds", variant: "destructive" });

    setSubmitting(true);

    let found: any = null;
    if (isInternal) {
      // Use confirmed receiver, otherwise try one last lookup by account number
      found = receiver;
      if (!found) {
        const { data } = await (supabase as any).rpc("resolve_flexiq_user", {
          p_account_number: accNumber.trim(),
          p_email: null,
        });
        found = Array.isArray(data) ? data[0] : data;
      }

      if (found) {
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
        if (found.currency && found.currency !== currency) {
          setSubmitting(false);
          return toast({
            title: "Different currency",
            description: `This account holds ${found.currency}. Use FX transfer instead.`,
            variant: "destructive",
          });
        }
        setReceiver(found);
      }
      // No match → manual entry: goes to admin review, no auto-credit
    }

    const receiverName = found
      ? `${found.first_name || ""} ${found.last_name || ""}`.trim() || recipient
      : recipient;

    // Save beneficiary (external and Flexiq Verve each have their own list)
    saveBeneficiary(
      user.id,
      (isInternal ? "flexiq" : "local") as any,
      isInternal
        ? { name: receiverName, account_number: accNumber }
        : { name: recipient, account_number: accNumber, routing_number: routing },
    ).then(() => qc.invalidateQueries({ queryKey: ["beneficiaries"] }));

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
        ? found
          ? { internal: true, receiver_id: found.id, receiver_email: found.email }
          : { internal: true, manual: true, receiver_email: email }
        : { routing, local: true },
    }).select().single();
    setSubmitting(false);

    if (error || !tx) return toast({ title: "Failed", description: error?.message, variant: "destructive" });
    setPendingTxId(tx.id);
    setGateOpen(true);
  };

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["account"] });
    qc.invalidateQueries({ queryKey: ["total-balance"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recent-tx"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const onVerified = async () => {
    if (!user || !account || !pendingTxId) return;
    const amt = Number(amount);

    const plan = planDeduction(account, amt);
    if (!plan.ok) {
      await (supabase as any).from("transactions").update({ status: "failed" }).eq("id", pendingTxId);
      refreshAll();
      setPendingTxId(null);
      return toast({ title: "Insufficient funds", variant: "destructive" });
    }

    const { error: debitErr } = await (supabase as any).from("profiles").update(plan.patch).eq("id", user.id);
    if (debitErr) {
      await (supabase as any).from("transactions").update({ status: "failed" }).eq("id", pendingTxId);
      refreshAll();
      setPendingTxId(null);
      return toast({
        title: "Transfer failed",
        description: "We couldn't debit your account. Nothing was sent.",
        variant: "destructive",
      });
    }

    // Flag the sender as debited so admin approve never debits twice
    await (supabase as any).rpc("mark_tx_debited", { p_tx_id: pendingTxId });

    const ref = pendingTxId;
    const amtCopy = amt;
    const recCopy = isInternal
      ? `${receiver?.first_name || ""} ${receiver?.last_name || ""}`.trim() || recipient
      : recipient;
    let finalStatus: "Pending" | "Completed" = "Pending";

    if (isInternal && receiver) {
      // Credit first; only mark completed if it succeeded
      const { error: creditErr } = await (supabase as any).rpc("credit_internal_transfer", { p_tx_id: ref });
      if (creditErr) {
        toast({
          title: "Transfer needs review",
          description: "We couldn't credit the receiver yet. Our team will complete it shortly.",
          variant: "destructive",
        });
      } else {
        await (supabase as any).from("transactions").update({ status: "completed" }).eq("id", ref);
        finalStatus = "Completed";
      }
    } else if (isInternal) {
      toast({
        title: "Submitted for review",
        description: "We couldn't verify that account automatically. Our team will complete it.",
      });
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
    resetLookup();
    setPendingTxId(null);
    navigate("/dashboard/success", {
      state: {
        title: finalStatus === "Completed" ? "Transfer Completed" : "Transfer Submitted",
        message: finalStatus === "Completed" ? "Funds were sent to the recipient." : "Pending system verification.",
        // Receipt shows a green ✔ instead of the pending clock icon
        success: true,
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

  const switchDest = (d: Dest) => {
    if (d === dest) return;
    setDest(d);
    resetLookup();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Local Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send to a local bank or to another Flexiq Verve account.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Toggle: full width, pill fills each half edge to edge */}
            <div
              className="relative grid w-full grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold"
              role="tablist"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] overflow-hidden rounded-full shadow-sm transition-transform duration-300 ease-out"
                style={{ transform: isInternal ? "translateX(100%)" : "translateX(0)" }}
              >
                <span
                  className={`absolute inset-0 bg-slate-600 transition-opacity duration-300 dark:bg-slate-500 ${isInternal ? "opacity-0" : "opacity-100"}`}
                />
                <span
                  className={`absolute inset-0 bg-gradient-primary transition-opacity duration-300 ${isInternal ? "opacity-100" : "opacity-0"}`}
                />
              </span>
              <button
                type="button"
                role="tab"
                aria-selected={!isInternal}
                onClick={() => switchDest("external")}
                className={`relative z-10 whitespace-nowrap rounded-full px-4 py-2.5 transition-colors duration-300 ${!isInternal ? "text-white" : "text-muted-foreground"}`}
              >
                External account
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isInternal}
                onClick={() => switchDest("internal")}
                className={`relative z-10 whitespace-nowrap rounded-full px-4 py-2.5 transition-colors duration-300 ${isInternal ? "text-primary-foreground" : "text-muted-foreground"}`}
              >
                Flexiq Verve account
              </button>
            </div>

            {/* Amount directly under the toggle */}
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
                <Label>Account number</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={accNumber}
                      inputMode="numeric"
                      onChange={(e) => {
                        if (receiver) {
                          // Number changed after confirming: clear the filled details
                          setRecipient("");
                          setEmail("");
                        }
                        setAccNumber(e.target.value);
                      }}
                      required
                    />
                    {isInternal && receiver && (
                      <span className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  {isInternal && (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-1 rounded-xl"
                      disabled={lookupState === "loading" || accNumber.trim().length < 4}
                      onClick={() => lookupAccount(accNumber)}
                    >
                      {lookupState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Find
                    </Button>
                  )}
                </div>

                {isInternal && lookupState === "loading" && (
                  <p className="text-xs text-muted-foreground">Looking up account…</p>
                )}

                {/* Confirmation before anything is auto-filled */}
                {isInternal && lookupState === "found" && candidate && (
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <p className="text-xs text-muted-foreground">Account found. Is this the right person?</p>
                    <p className="mt-1 font-semibold">
                      {`${candidate.first_name || ""} ${candidate.last_name || ""}`.trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">{candidate.email}</p>
                    <div className="mt-3 flex gap-2">
                      <Button type="button" size="sm" className="rounded-xl bg-gradient-primary" onClick={confirmCandidate}>
                        Yes, use this account
                      </Button>
                      <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={() => { setCandidate(null); setLookupState("idle"); }}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                {isInternal && lookupState === "none" && (
                  <p className="text-xs text-amber-600">
                    No Flexiq Verve account found. You can enter the details manually; it will be sent for review.
                  </p>
                )}
                {isInternal && receiver && (
                  <p className="text-xs font-medium text-emerald-600">
                    Verified: {`${receiver.first_name || ""} ${receiver.last_name || ""}`.trim()}
                  </p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>{isInternal ? "Account name" : "Recipient name"}</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
              </div>

              {isInternal ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Recipient email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              ) : (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Routing number</Label>
                  <Input value={routing} onChange={(e) => setRouting(e.target.value)} required />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea className="text-base md:text-sm" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
            </div>

            <Button id="transfer-submit" type="submit" disabled={submitting} className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
              {submitting ? "Processing…" : (<><Lock className="h-4 w-4" />Send {sym}{Number(amount || 0).toFixed(2)}<ArrowRight className="h-4 w-4" /></>)}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {isInternal ? (
            <SavedBeneficiaries
              key="flexiq"
              kind={"flexiq" as any}
              onSelect={(b) => {
                setRecipient(b.name || "");
                setAccNumber(b.account_number || ""); // triggers auto-lookup
              }}
            />
          ) : (
            <SavedBeneficiaries
              key="local"
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
