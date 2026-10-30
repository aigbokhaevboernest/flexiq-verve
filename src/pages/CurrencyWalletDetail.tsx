import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Plus } from "lucide-react";
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

const SUPPORT_EMAIL = "support@flexiqverve.com";

type WalletRow = { id: string; currency: string; balance: number };
type ProfileRow = Record<string, any>;

const CurrencyWalletDetail = () => {
  const { currency: currencyParam } = useParams<{ currency: string }>();
  const currency = (currencyParam || "").toUpperCase();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  // Withdraw (non-primary only)
  const [withdrawOpen, setWithdrawOpen] = useState(false); // form dialog
  const [gateOpen, setGateOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [routing, setRouting] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Same query key as CurrencyWallets so the list cache is reused
  const { data: wallets, isLoading } = useQuery<WalletRow[]>({
    queryKey: ["currency-wallets", user?.id],
    enabled: !!user,
    staleTime: 60_000,
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

  const onWithdrawClick = () => {
    if (isPrimary) return;
    if (!(balance > 0)) {
      toast.error("Insufficient funds");
      return;
    }
    setAmount("");
    setRecipient("");
    setAccNumber("");
    setRouting("");
    setDesc("");
    setWithdrawOpen(true);
  };

  // Form -> CodeGate. Nothing is written until the code is verified.
  const onWithdrawFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > balance + 0.000001) return toast.error("Insufficient funds");
    if (!recipient.trim() || !accNumber.trim()) return toast.error("Enter recipient name and account number");
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

      // 2. Transaction row (pending: money leaves the wallet, payout is reviewed)
      const { data: tx, error: tErr } = await (supabase as any)
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "transfer_out",
          status: "pending",
          amount: -amt,
          currency,
          recipient_name: recipient.trim(),
          recipient_account: accNumber.trim(),
          recipient_bank: "External",
          routing_number: routing.trim() || null,
          description: desc.trim() || `Wallet withdraw (${currency}) to ${recipient.trim()}`,
          metadata: { wallet_withdraw: true, wallet_id: wallet.id, wallet_currency: currency },
        })
        .select("id")
        .single();
      if (tErr) throw tErr;

      // 3. Debit. The balance filter makes this fail if the wallet changed since step 1.
      const newBal = Math.round((current - amt) * 1e8) / 1e8;
      const { data: upd, error: dErr } = await (supabase as any)
        .from("currency_wallets")
        .update({ balance: newBal })
        .eq("id", wallet.id)
        .eq("user_id", user.id)
        .eq("balance", fresh.balance)
        .select("id");
      if (dErr || !upd?.length) {
        await (supabase as any).from("transactions").update({ status: "failed" }).eq("id", tx.id);
        throw new Error(dErr?.message || "Withdrawal could not be completed. Please try again.");
      }

      // 4. Email (best-effort)
      try {
        const em = profile?.email || user.email || "";
        if (em) {
          await sendEmail({
            email: em,
            first_name: profile?.first_name || "",
            subject: "Wallet withdrawal submitted — Flexiq Verve",
            message: `Your ${currency} wallet withdrawal of ${formatMoney(amt, currency)} to ${recipient.trim()} has been submitted and is pending processing.

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
      setAmount("");
      setRecipient("");
      setAccNumber("");
      setRouting("");
      setDesc("");
    } catch (e: any) {
      toast.error(e?.message || "Withdrawal failed");
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

        {/* Primary currency: Fund only, no Withdraw */}
        <div className={`mt-6 grid gap-3 ${isPrimary ? "grid-cols-1" : "grid-cols-2"}`}>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/wallets/${currency}/deposit`)}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Fund
          </button>
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
      </div>

      {!isPrimary && (
        <>
          {/* Withdraw form -> CodeGate -> debit */}
          <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto font-sans sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Withdraw {currency}</DialogTitle>
                <DialogDescription>Available: {formatMoney(balance, currency)}</DialogDescription>
              </DialogHeader>
              <form onSubmit={onWithdrawFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="w-amount">Amount</Label>
                  <Input
                    id="w-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    placeholder={`Amount in ${currency}`}
                    className="h-12 w-full min-w-0 rounded-xl px-4 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-recipient">Recipient name</Label>
                  <Input
                    id="w-recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="h-12 rounded-xl px-4 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-acc">Account number</Label>
                  <Input
                    id="w-acc"
                    value={accNumber}
                    onChange={(e) => setAccNumber(e.target.value)}
                    className="h-12 rounded-xl px-4 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-routing">Routing number (optional)</Label>
                  <Input
                    id="w-routing"
                    value={routing}
                    onChange={(e) => setRouting(e.target.value)}
                    className="h-12 rounded-xl px-4 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-desc">Note (optional)</Label>
                  <Input
                    id="w-desc"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="h-12 rounded-xl px-4 text-base"
                  />
                </div>
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
