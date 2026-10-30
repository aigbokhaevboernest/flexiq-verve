import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowUpRight, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CodeGate } from "@/components/CodeGate";
import { sendEmail } from "@/lib/sendEmail";
import { getBalanceBreakdown } from "@/hooks/useTotalBalance";
import { Flag, PrimaryBadge, currencyName, formatMoney } from "@/lib/walletCurrencies";
import { getWithdrawFields, normalizeValue, recipientFromFields, type WithdrawType } from "@/lib/withdrawFields";

const SUPPORT_EMAIL = "support@flexiqverve.com";

// TEMP: finds the dashboard's SendChooserModal wherever it lives under src/ without hard-coding
// its path or export style. Once confirmed, replace with a normal import, e.g.
//   import SendChooserModal from "@/components/SendChooserModal";
const chooserMods = import.meta.glob("/src/**/SendChooserModal.tsx", { eager: true }) as Record<string, any>;
const chooserMod: any = Object.values(chooserMods)[0];
const SendChooserModal: any = chooserMod?.default ?? chooserMod?.SendChooserModal ?? null;

type WalletRow = { id: string; currency: string; balance: number };
type ProfileRow = Record<string, any>;

const CurrencyWalletDetail = () => {
  const { currency: currencyParam } = useParams<{ currency: string }>();
  const currency = (currencyParam || "").toUpperCase();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  // Send chooser (primary only)
  const [sendOpen, setSendOpen] = useState(false);

  // Withdraw (non-primary only)
  const [withdrawOpen, setWithdrawOpen] = useState(false); // form dialog
  const [gateOpen, setGateOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [wType, setWType] = useState<WithdrawType>("domestic");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Same query key as CurrencyWallets so the list cache is reused
  const { data: wallets, isLoading } = useQuery<WalletRow[]>({
    queryKey: ["currency-wallets", user?.id],
    enabled: !!user,
    // Always refetch on open so a wallet created moments ago is never missed
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("currency_wallets")
        .select("id,currency,balance")
        .eq("user_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return (data || []) as WalletRow[];
    },
  });

  // Full profile (same key/shape as CurrencyWallets): primary currency + balance breakdown
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileRow | null>({
    queryKey: ["profile-primary", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return (data || null) as ProfileRow | null;
    },
  });

  const loading = !user || isLoading || profileLoading;
  const wallet = wallets?.find((w) => w.currency === currency);
  const isPrimary = !!profile?.currency && String(profile.currency).toUpperCase() === currency;
  // Primary shows the same total as the overview (main + checking + savings + retirement)
  const balance = isPrimary
    ? Number(profile ? getBalanceBreakdown(profile as any).total ?? 0 : 0)
    : Number(wallet?.balance ?? 0);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 pb-28">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-52 w-full rounded-3xl" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <Dialog open onOpenChange={() => navigate("/dashboard/wallets")}>
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Wallet not found</DialogTitle>
            <DialogDescription>You don't have a {currency || "this"} wallet yet. Add it first.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate("/dashboard/wallets")}>Back to wallets</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const onAmountChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const [whole, ...rest] = cleaned.split(".");
    setAmount(rest.length ? `${whole}.${rest.join("")}` : whole);
  };

  const fieldDefs = getWithdrawFields(currency, wType);

  const resetWithdrawForm = () => {
    setAmount("");
    setFields({});
    setErrors({});
    setFormError("");
    setWType("domestic");
  };

  const onWithdrawClick = () => {
    if (isPrimary) return;
    setNotice("");
    if (!(balance > 0)) {
      setNotice("Insufficient funds. Fund this wallet before withdrawing.");
      return;
    }
    resetWithdrawForm();
    setWithdrawOpen(true);
  };

  const switchType = (t: WithdrawType) => {
    if (t === wType) return;
    setWType(t);
    setFields({});
    setErrors({});
    setFormError("");
  };

  const setField = (key: string, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
    setFormError("");
  };

  // Form -> CodeGate. Nothing is written until the code is verified.
  const onWithdrawFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const amt = Number(amount);
    if (!amt || amt <= 0) next.amount = "Enter a valid amount";
    else if (amt > balance + 0.000001) next.amount = "Insufficient funds";

    for (const f of fieldDefs) {
      const v = (fields[f.key] || "").trim();
      if (!v) {
        if (f.required !== false) next[f.key] = `${f.label} is required`;
        continue;
      }
      const msg = f.check?.(v);
      if (msg) next[f.key] = msg;
    }

    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;
    setWithdrawOpen(false);
    setGateOpen(true);
  };

  const onWithdrawVerified = async () => {
    if (!user) return;
    const amt = Number(amount);
    setSubmitting(true);
    try {
      // 1. Fresh balance (UI may be stale)
      const { data: fresh, error: fErr } = await (supabase as any)
        .from("currency_wallets")
        .select("balance")
        .eq("id", wallet.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (fErr || !fresh) throw new Error("Could not verify your wallet balance. Please try again.");
      const current = Number(fresh.balance);
      if (amt > current + 0.000001) throw new Error("Insufficient funds");

      const clean = Object.fromEntries(
        Object.entries(fields)
          .map(([k, v]) => [k, v.trim()])
          .filter(([, v]) => v),
      ) as Record<string, string>;
      const rec = recipientFromFields(clean);

      // 2. Transaction row (pending: money leaves the wallet, payout is reviewed)
      const { data: tx, error: tErr } = await (supabase as any)
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "transfer_out",
          status: "pending",
          amount: -amt,
          currency,
          recipient_name: rec.name,
          recipient_account: rec.account,
          recipient_bank: rec.bank,
          routing_number: rec.routing,
          description: clean.purpose
            ? `Wallet withdraw (${currency}) to ${rec.name}: ${clean.purpose}`
            : `Wallet withdraw (${currency}) to ${rec.name}`,
          metadata: {
            wallet_withdraw: true,
            wallet_id: wallet.id,
            wallet_currency: currency,
            transfer_type: wType,
            ...clean,
          },
        })
        .select("id")
        .single();
      if (tErr) throw new Error(tErr.message || "Could not create the withdrawal. Please try again.");

      // 3. Debit via the debit_currency_wallet RPC (SECURITY DEFINER: checks owner + balance atomically).
      //    Clients no longer have UPDATE on currency_wallets, so there is no direct-update fallback.
      const { error: rpcErr } = await (supabase as any).rpc("debit_currency_wallet", {
        p_wallet_id: wallet.id,
        p_amount: amt,
      });
      if (rpcErr) {
        const missing = /could not find the function|PGRST202/i.test(
          `${rpcErr.code ?? ""} ${rpcErr.message ?? ""}`,
        );
        await (supabase as any).from("transactions").update({ status: "failed" }).eq("id", tx.id);
        throw new Error(
          missing
            ? "Withdrawals are temporarily unavailable. Please contact support."
            : rpcErr.message || "Your wallet could not be debited. Please try again.",
        );
      }

      // Flag as debited so an admin approval never debits twice (same as Local Transfer)
      await (supabase as any).rpc("mark_tx_debited", { p_tx_id: tx.id });

      // 4. Email (best-effort)
      try {
        const em = profile?.email || user.email || "";
        if (em) {
          await sendEmail({
            email: em,
            first_name: profile?.first_name || "",
            subject: "Wallet withdrawal submitted — Flexiq Verve",
            message: `Your ${currency} wallet withdrawal of ${formatMoney(amt, currency)} to ${rec.name} has been submitted and is pending processing.

For more information or complaints, please contact ${SUPPORT_EMAIL} or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
          });
        }
      } catch {}

      qc.invalidateQueries({ queryKey: ["currency-wallets", user.id] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["recent-tx"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Withdrawal submitted");
      resetWithdrawForm();
    } catch (e: any) {
      // Reopen the form with the real reason shown inline, values kept so the user can retry
      setFormError(e?.message || "Withdrawal failed. Please try again.");
      setWithdrawOpen(true);
    } finally {
      setSubmitting(false);
      setGateOpen(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5 pb-28 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        type="button"
        onClick={() => navigate("/dashboard/wallets")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="rounded-3xl bg-card p-6 text-center shadow-elev">
        <Flag currency={currency} size={80} className="mx-auto h-16 w-16" />
        <div className="mt-3 flex items-center justify-center gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {currency} · {currencyName(currency)}
          </p>
          {isPrimary && <PrimaryBadge />}
        </div>
        <p className="mt-2 text-4xl font-bold">{formatMoney(balance, currency)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{isPrimary ? "Account balance" : "Available balance"}</p>

        {/* Primary: Fund + Send (dashboard send chooser). Others: Fund + Withdraw */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/wallets/${currency}/deposit`)}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Fund
          </button>
          {isPrimary && (
            <button
              type="button"
              onClick={() => (SendChooserModal ? setSendOpen(true) : toast.error("Send is unavailable right now"))}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border/60 px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          )}
          {!isPrimary && (
            <button
              type="button"
              onClick={onWithdrawClick}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border/60 px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <ArrowUpRight className="h-4 w-4" /> Withdraw
            </button>
          )}
        </div>

        {notice && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-left text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
      </div>

      {/* Same send chooser as the dashboard home; it carries on with the normal send flows */}
      {isPrimary && SendChooserModal && (
        <SendChooserModal
          open={sendOpen}
          isOpen={sendOpen}
          onOpenChange={setSendOpen}
          onClose={() => setSendOpen(false)}
        />
      )}

      {!isPrimary && (
        <>
          {/* Withdraw form -> CodeGate -> debit */}
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto font-sans sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Withdraw {currency}</DialogTitle>
                <DialogDescription>Available: {formatMoney(balance, currency)}</DialogDescription>
              </DialogHeader>
              <form onSubmit={onWithdrawFormSubmit} className="space-y-4" noValidate>
                {formError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Domestic | International */}
                <div className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold" role="tablist">
                  {(["domestic", "international"] as WithdrawType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={wType === t}
                      onClick={() => switchType(t)}
                      className={`rounded-full px-4 py-2 capitalize transition-colors ${
                        wType === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="w-amount">Amount</Label>
                  <Input
                    id="w-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={amount}
                    onChange={(e) => {
                      onAmountChange(e.target.value);
                      if (errors.amount) setErrors((er) => ({ ...er, amount: "" }));
                      setFormError("");
                    }}
                    placeholder={`Amount in ${currency}`}
                    className={`h-12 w-full min-w-0 rounded-xl px-4 text-base ${errors.amount ? "border-red-500" : ""}`}
                  />
                  {errors.amount && <p role="alert" className="text-xs text-red-500">{errors.amount}</p>}
                </div>

                {fieldDefs.map((f) => (
                  <div key={`${wType}-${f.key}`} className="space-y-1.5">
                    <Label htmlFor={`w-${f.key}`}>
                      {f.label}
                      {f.required === false && <span className="text-muted-foreground"> (optional)</span>}
                    </Label>
                    {f.options ? (
                      <select
                        id={`w-${f.key}`}
                        value={fields[f.key] || ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                        className={`h-12 w-full rounded-xl border bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring ${
                          errors[f.key] ? "border-red-500" : "border-input"
                        }`}
                      >
                        <option value="">Select</option>
                        {f.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={`w-${f.key}`}
                        value={fields[f.key] || ""}
                        inputMode={f.inputMode}
                        autoComplete="off"
                        placeholder={f.placeholder}
                        onChange={(e) => setField(f.key, normalizeValue(f, e.target.value))}
                        className={`h-12 rounded-xl px-4 text-base ${errors[f.key] ? "border-red-500" : ""}`}
                      />
                    )}
                    {errors[f.key] && <p role="alert" className="text-xs text-red-500">{errors[f.key]}</p>}
                  </div>
                ))}

                <Button type="submit" disabled={submitting} className="h-12 w-full rounded-2xl text-base font-semibold">
                  Continue
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <CodeGate open={gateOpen} onOpenChange={setGateOpen} onVerified={onWithdrawVerified} />
        </>
      )}
    </div>
  );
};

export default CurrencyWalletDetail;
