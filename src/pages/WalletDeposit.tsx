import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bitcoin, Copy, Landmark, Mail, MessageCircle, Upload, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";

const SUPPORT_EMAIL = "support@flexiqverve.com";
const ADMIN_NOTIFY_EMAIL = SUPPORT_EMAIL;
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY"];

type Method = "crypto" | "bank";
type Step = "choose" | "crypto" | "bank";

const WalletDeposit = () => {
  const { currency: currencyParam } = useParams<{ currency: string }>();
  const walletCurrency = (currencyParam || "").toUpperCase();
  const { data: settings, isLoading } = useAppSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<Method>("crypto");
  // Entered on step 1, carried over (and prefilled) on the crypto page
  const [amount, setAmount] = useState("");
  const [crypto, setCrypto] = useState("BTC");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Whether the user actually owns this currency wallet. null = checking.
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const wal = await (supabase as any)
        .from("currency_wallets")
        .select("id")
        .eq("user_id", user.id)
        .eq("currency", walletCurrency)
        .maybeSingle();
      if (cancelled) return;
      setHasWallet(!wal.error && !!wal.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, walletCurrency]);

  if (isLoading || hasWallet === null)
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    );

  if (!CURRENCIES.includes(walletCurrency) || !hasWallet) {
    return (
      <Dialog open onOpenChange={() => navigate("/dashboard/wallets")}>
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Wallet not found</DialogTitle>
            <DialogDescription>You don't have a {walletCurrency || "this"} wallet yet. Add it first.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate("/dashboard/wallets")}>Back to wallets</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const walletMap: Record<string, string> = {
    BTC: (settings as any)?.btc_wallet_address || "—",
    ETH: (settings as any)?.eth_wallet_address || "—",
    USDT: (settings as any)?.usdt_wallet_address || "—",
  };

  const wallet = walletMap[crypto] || "—";
  const isUsdt = crypto === "USDT";

  const cryptoName = isUsdt ? "USDT (TRON)" : crypto;
  const cryptoLabel = isUsdt ? (
    <>
      USDT (<span className="font-semibold text-red-500">TRON</span>)
    </>
  ) : (
    <>{crypto}</>
  );

  const copy = () => {
    navigator.clipboard.writeText(wallet);
    toast({ title: "Wallet address copied" });
  };

  // Back from the fund flow returns to this currency's detail page (not the list)
  const goBack = () => {
    if (step === "choose") navigate(`/dashboard/wallets/${walletCurrency}`);
    else setStep("choose");
  };

  // Step 1 -> expected page
  const handleContinue = () => {
    if (!amount || Number(amount) <= 0) {
      return toast({ title: "Enter an amount", variant: "destructive" });
    }
    setStep(method);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!amount || Number(amount) <= 0) return toast({ title: "Enter an amount", variant: "destructive" });
    setSubmitting(true);

    let proofUrl: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("id-verification").upload(path, file);
      if (!up.error) proofUrl = path;
    }

    const { error } = await (supabase as any).from("wallet_deposit_requests").insert({
      user_id: user.id,
      wallet_currency: walletCurrency,
      crypto,
      amount: Number(amount),
      proof_url: proofUrl,
      status: "pending",
    });
    setSubmitting(false);
    if (error) return toast({ title: "Failed to submit", description: error.message, variant: "destructive" });

    try {
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("first_name,last_name,email")
        .eq("id", user.id)
        .maybeSingle();
      const fn = prof?.first_name || "";
      const ln = prof?.last_name || "";
      const em = prof?.email || user.email || "";
      if (em) {
        await sendEmail({
          email: em,
          first_name: fn,
          subject: `${walletCurrency} Wallet Deposit Submitted — Flexiq Verve`,
          message: `This is to inform you that your ${walletCurrency} wallet deposit request of ${walletCurrency} ${amount} via ${cryptoName} has been successfully submitted and is pending review.

You will receive a notification once your deposit has been confirmed.

For more information or complaints, please contact ${SUPPORT_EMAIL} or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
      // Admin notification (best-effort, never blocks the user flow)
      try {
        await sendEmail({
          email: ADMIN_NOTIFY_EMAIL,
          first_name: "Admin",
          subject: `New ${walletCurrency} Wallet Deposit Request — Flexiq Verve`,
          message: `${fn} ${ln} has submitted a ${walletCurrency} wallet deposit request of ${walletCurrency} ${amount} via ${cryptoName} and it is pending review.

Please verify if the deposit was actually received and log in to the admin dashboard to either approve or decline.`,
        });
      } catch {}
    } catch {}

    navigate("/dashboard/success", {
      state: {
        title: "Deposit submitted",
        message: "Upon confirmation of your payment, we will promptly process your service request.",
        details: [
          { label: "Wallet", value: walletCurrency },
          { label: "Crypto", value: cryptoName },
          { label: "Amount", value: `${walletCurrency} ${amount}` },
          { label: "Status", value: "Pending review" },
        ],
      },
    });
  };

  const methodCard = (m: Method, title: string, sub: string, Icon: any) => (
    <button
      type="button"
      onClick={() => setMethod(m)}
      className={`flex w-full items-center gap-4 rounded-3xl border px-5 py-4 text-left transition-colors ${
        method === m ? "border-primary bg-primary/10" : "border-border/60 bg-card hover:bg-muted/40"
      }`}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{sub}</span>
      </span>
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-md space-y-5 overflow-x-hidden pb-28">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-2xl font-bold">Add funds · {walletCurrency}</h1>

      {/* ---------- STEP 1: choose method + amount ---------- */}
      {step === "choose" && (
        <div key="choose" className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
          {methodCard("crypto", "Crypto", "BTC, ETH, USDT", Bitcoin)}
          {methodCard("bank", "Bank transfer", "Wire or ACH", Landmark)}

          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount in ${walletCurrency}`}
            className="h-14 w-full rounded-2xl bg-card px-5 text-base"
          />

          <Button
            type="button"
            onClick={handleContinue}
            className="h-14 w-full rounded-full text-base font-semibold"
          >
            Continue
          </Button>
        </div>
      )}

      {/* ---------- STEP 2a: bank transfer -> contact support ---------- */}
      {step === "bank" && (
        <Card
          key="bank"
          className="animate-in fade-in slide-in-from-bottom-2 rounded-3xl border-border/60 p-6 text-center shadow-card duration-300"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <Landmark className="h-6 w-6" />
          </span>
          <p className="mt-4 text-lg font-semibold">Pay by bank transfer</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Contact support to pay by bank transfer. Our team will share the bank details to fund your {walletCurrency}{" "}
            {amount ? `wallet with ${walletCurrency} ${amount}` : "wallet"}.
          </p>

          <div className="mx-auto mt-6 max-w-md space-y-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              <Mail className="h-4 w-4" /> {SUPPORT_EMAIL}
            </a>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">or</p>
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm font-medium">
              <MessageCircle className="h-4 w-4" /> Use the Live Chat on your dashboard
            </div>
          </div>
        </Card>
      )}

      {/* ---------- STEP 2b: crypto payment (single column: address -> QR) ---------- */}
      {step === "crypto" && (
        <Card
          key="crypto"
          className="animate-in fade-in slide-in-from-bottom-2 min-w-0 rounded-3xl border-border/60 p-5 shadow-card duration-300"
        >
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label>Payment method</Label>
              <select
                value={crypto}
                onChange={(e) => setCrypto(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="BTC">BTC — Bitcoin</option>
                <option value="ETH">ETH — Ethereum</option>
                <option value="USDT">USDT (TRON) — Tether</option>
              </select>
              {isUsdt && (
                <p className="text-xs text-muted-foreground">
                  Network: TRC-20 (<span className="font-semibold text-red-500">TRON</span>)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Amount ({walletCurrency})</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="h-12 w-full rounded-xl px-4 text-base"
              />
            </div>

            {/* Compact address, QR directly underneath */}
            <div className="min-w-0 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Wallet address ({cryptoLabel})</p>
              <div className="mt-2 flex min-w-0 items-start gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-background px-2.5 py-2 font-mono text-[11px] leading-snug">
                  {wallet}
                </code>
                <Button type="button" variant="outline" size="icon" onClick={copy} className="h-8 w-8 shrink-0">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              {isUsdt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Send USDT only on the <span className="font-semibold text-red-500">TRON</span> (TRC-20) network. Other
                  networks may result in lost funds.
                </p>
              )}

              <div className="mt-4 flex flex-col items-center">
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border">
                  {wallet && wallet !== "—" ? <QRCodeSVG value={wallet} size={160} /> : <div className="h-40 w-40 bg-muted" />}
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Scan with your crypto wallet to send {cryptoLabel}.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload payment proof (optional)</Label>
              <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-3 text-sm text-muted-foreground hover:bg-muted/40">
                <Upload className="h-4 w-4 shrink-0" />
                <span className="truncate">{file?.name || "Choose file…"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <Button
              type="submit"
              variant="outline"
              disabled={submitting}
              className="h-12 w-full rounded-2xl border-2 border-blue-600 bg-transparent text-base font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/30"
            >
              <Wallet className="mr-2 h-4 w-4" /> {submitting ? "Submitting…" : "Submit payment"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
};

export default WalletDeposit;
