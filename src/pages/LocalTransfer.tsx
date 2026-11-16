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
type FxState = "idle" | "loading" | "ok" | "error";
type FxQuote = { rate: number; converted: number; currency: string };

/**
 * Cross-currency Flexiq -> Flexiq transfers are credited automatically.
 * Requires the `credit_internal_transfer` SQL function (credit_internal_transfer.sql),
 * which credits the receiver `metadata.converted_amount` in their own currency.
 * Set to false to send cross-currency transfers to admin review (Pending) instead.
 */
const AUTO_CREDIT_CROSS_CURRENCY = true;

// ── Exchange rate ────────────────────────────────────────────────────────────
// NOTE: this is a live public rate. If FxTransfer uses its own rate source
// (admin-set fx_rates), swap this one function to use the same source so both
// pages always quote the same rate.
const rateCache = new Map<string, { rate: number; at: number }>();
async function fetchFxRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;
  const key = `${from}>${to}`;
  const hit = rateCache.get(key);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return hit.rate;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    const json = await res.json();
    const rate = json?.rates?.[to];
    if (json?.result === "success" && typeof rate === "number" && rate > 0) {
      rateCache.set(key, { rate, at: Date.now() });
      return rate;
    }
  } catch {
    /* fall through */
  }
  return null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

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

  // Exchange rate for a confirmed receiver who holds a different currency
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxState, setFxState] = useState<FxState>("idle");
  // The quote locked in at submit time (read again after the code gate)
  const fxRef = useRef<FxQuote | null>(null);

  const isInternal = dest === "internal";
  const receiverCurrency: string | null = receiver?.currency || null;
  const isCrossCurrency = isInternal && !!receiverCurrency && receiverCurrency !== currency;

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

  // Get the exchange rate once a receiver with another currency is confirmed
  useEffect(() => {
    if (!isCrossCurrency || !receiverCurrency) {
      setFxRate(null);
      setFxState("idle");
      return;
    }
    let cancelled = false;
    setFxState("loading");
    setFxRate(null);
    fetchFxRate(currency, receiverCurrency).then((rate) => {
      if (cancelled) return;
      if (rate) {
        setFxRate(rate);
        setFxState("ok");
      } else {
        setFxState("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isCrossCurrency, receiverCurrency, currency]);

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
    let fx: FxQuote | null = null;
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

        // Different currency: convert instead of blocking the transfer
        if (found.currency && found.currency !== currency) {
          const rate =
            fxState === "ok" && fxRate && receiverCurrency === found.currency
              ? fxRate
              : await fetchFxRate(currency, found.currency);
          if (!rate) {
            setSubmitting(false);
            return toast({
              title: "Exchange rate unavailable",
              description: "We couldn't get the exchange rate right now. Please try again in a moment.",
              variant: "destructive",
            });
          }
          fx = { rate, converted: round2(amt * rate), currency: found.currency };
        }
        setReceiver(found);
      }
      // No match → manual entry: goes to admin review, no auto-credit
    }
    fxRef.current = fx;

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
          ? {
              internal: true,
              receiver_id: found.id,
              receiver_email: found.email,
              ...(fx
                ? {
                    cross_currency: true,
                    fx_rate: fx.rate,
                    converted_amount: fx.converted,
                    converted_currency: fx.currency,
                  }
                : {}),
            }
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
    const fx = fxRef.current;

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

    if (isInternal && receiver && fx && !AUTO_CREDIT_CROSS_CURRENCY) {
      // Currency conversion: saved with its rate, completed by our team
      toast({
        title: "Submitted for review",
        description: "This transfer needs a currency conversion. Our team will complete it shortly.",
      });
    } else if (isInternal && receiver) {
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
      // What the receiver actually gets, in their own currency
      const receivedText = fx ? `${fx.converted} ${fx.currency}` : `${amtCopy} ${currency}`;

      if (em) {
        await sendEmail({
          email: em, first_name: fn,
          subject: "Local Transfer — Flexiq Verve",
          message: isInternal && finalStatus === "Completed"
            ? `Your transfer of ${amtCopy} ${currency} to ${recCopy} (Flexiq Verve account) has been completed.${fx ? ` They received ${receivedText}.` : ""}

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
          message: `You have received ${receivedText} from ${senderFull}. The funds are now available in your account.

${footer}`,
        });
      }
    } catch {}

    const summaryRecipient = recCopy;
    const summaryAccount = accNumber;
    setAmount(""); setRecipient(""); setAccNumber(""); setRouting(""); setEmail(""); setDesc("");
    resetLookup();
    setPendingTxId(null);
    fxRef.current = null;

    // Green ✔ only when the transfer really completed; otherwise the amber pending clock
    const isCompleted = finalStatus === "Completed";

    navigate("/dashboard/success", {
      state: {
        title: isCompleted ? "Transfer Completed" : "Transfer Submitted",
        message: isCompleted ? "Funds were sent to the recipient." : "Pending system verification.",
        success: isCompleted,
        pending: !isCompleted,
        receipt: true,
        returnTo: "/dashboard/local",
        details: [
          { label: "Date", value: new Date().toLocaleString() },
          { label: "Reference", value: ref.slice(0, 12).toUpperCase() },
          { label: "Recipient", value: summaryRecipient },
          { label: "Account", value: summaryAccount },
          { label: fx ? "You send" : "Amount", value: formatMoney(amt, currency) },
          ...(fx
            ? [
                { label: "They receive", value: formatMoney(fx.converted, fx.currency) },
                { label: "Exchange rate", value: `1 ${currency} = ${fx.rate.toFixed(4)} ${fx.currency}` },
              ]
            : []),
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

  const amountNum = Number(amount);
  const convertedPreview =
    fxState === "ok" && fxRate && amountNum > 0 ? round2(amountNum * fxRate) : null;
  // Block sending while the rate for a cross-currency transfer isn't ready
  const rateBlocking = isCrossCurrency && fxState !== "ok";

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

              {/* Different-currency Flexiq account: show what they will receive */}
              {isCrossCurrency && receiverCurrency && (
                <div className="mt-3 border-t border-border/60 pt-3 text-sm">
                  {fxState === "loading" && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Getting exchange rate…
                    </p>
                  )}
                  {fxState === "ok" && fxRate && (
                    <>
                      <p className="font-semibold">
                        Recipient will receive{" "}
                        {convertedPreview !== null
                          ? formatMoney(convertedPreview, receiverCurrency)
                          : `${receiverCurrency} amount`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        1 {currency} = {fxRate.toFixed(4)} {receiverCurrency}. Their account holds {receiverCurrency}.
                      </p>
                    </>
                  )}
                  {fxState === "error" && (
                    <p className="text-xs text-amber-600">
                      Exchange rate unavailable right now. Please try again in a moment.
                    </p>
                  )}
                </div>
              )}
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

            <Button id="transfer-submit" type="submit" disabled={submitting || rateBlocking} className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
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
