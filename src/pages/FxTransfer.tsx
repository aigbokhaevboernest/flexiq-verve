import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, Globe2, TrendingUp, Lock, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount, formatMoney } from "@/hooks/useAccount";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CodeGate } from "@/components/CodeGate";
import { ConfirmTransferDialog } from "@/components/ConfirmTransferDialog";
import { useNavigate } from "react-router-dom";

const FxTransfer = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: account } = useAccount();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const baseCurrency = account?.currency || "USD";
  const [from, setFrom] = useState(baseCurrency);
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("100");
  const [recipient, setRecipient] = useState({ name: "", iban: "", swift: "", bank: "", address: "", zip: "", country: "", accountType: "checking" });

  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const { data: rates = [] } = useQuery({
    queryKey: ["fx_rates"],
    queryFn: async () => {
      const { data } = await supabase.from("fx_rates").select("*");
      return data || [];
    },
  });

  const usdRates = useMemo(() => {
    const m: Record<string, number> = { USD: 1 };
    rates.forEach((r: any) => { m[r.quote_currency] = Number(r.rate); });
    return m;
  }, [rates]);

  const rate = useMemo(() => {
    const f = usdRates[from] ?? 1;
    const t = usdRates[to] ?? 1;
    return t / f;
  }, [from, to, usdRates]);

  const converted = (Number(amount || 0) * rate).toFixed(2);
  const fee = (Number(amount || 0) * 0.005).toFixed(2);

  const swap = () => { setFrom(to); setTo(from); };

  const handleSend = async () => {
    if (!user || !account) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter amount", variant: "destructive" });
    if (!recipient.name || !recipient.iban) return toast({ title: "Recipient details required", variant: "destructive" });

    // Convert from->base for balance check
    const fromInBase = Number(amount) / (usdRates[from] ?? 1) * (usdRates[baseCurrency] ?? 1);
    if (account.frozen) return toast({ title: "Account frozen", variant: "destructive" });
    if (fromInBase > Number(account.balance)) return toast({ title: "Insufficient funds", description: `Need ${formatMoney(fromInBase, baseCurrency)}`, variant: "destructive" });

    const { data: tx, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "fx",
      status: "awaiting_code",
      amount: -fromInBase,
      currency: baseCurrency,
      fx_rate: rate,
      converted_amount: Number(converted),
      converted_currency: to,
      recipient_name: recipient.name,
      recipient_account: recipient.iban,
      recipient_bank: recipient.bank,
      description: `FX ${amount} ${from} → ${converted} ${to}`,
      metadata: { swift: recipient.swift, from, to },
    }).select().single();

    if (error || !tx) return toast({ title: "Failed", description: error?.message, variant: "destructive" });
    setPendingTxId(tx.id);
    setGateOpen(true);
  };

  const onVerified = async () => {
    if (!user || !account || !pendingTxId) return;
    const amt = Number(amount);
    const fromInBase = amt / (usdRates[from] ?? 1) * (usdRates[baseCurrency] ?? 1);
    await supabase.from("accounts").update({ balance: Number(account.balance) - fromInBase }).eq("user_id", user.id);
    await supabase.from("transactions").update({ status: "pending" }).eq("id", pendingTxId);
    qc.invalidateQueries({ queryKey: ["account"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recent-tx"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    navigate("/dashboard/success", {
      state: {
        title: "Transfer pending",
        message: `${converted} ${to} to ${recipient.name}. Awaiting admin approval.`,
        receipt: true,
        details: [
          { label: "Date", value: new Date().toLocaleString() },
          { label: "Reference", value: pendingTxId.slice(0, 12).toUpperCase() },
          { label: "Recipient", value: recipient.name },
          { label: "Bank", value: recipient.bank },
          { label: "Account", value: recipient.iban },
          { label: "Sent", value: `${amount} ${from}` },
          { label: "Received", value: `${converted} ${to}` },
          { label: "Status", value: "Pending" },
        ],
      },
    });
    setPendingTxId(null);
  };

  const allCurrencies = Array.from(new Set([
    "USD","EUR","GBP","JPY","CNY","CAD","AUD","INR","MXN","BRL","ZAR","AED","KRW",
    "CHF","HKD","SGD","NZD","SEK","NOK","DKK","TRY","RUB","PLN","THB","IDR","MYR",
    "PHP","VND","ILS","SAR","EGP","NGN","KES","CZK","HUF","RON","COP","CLP","ARS","TWD",
    ...rates.map((r: any) => r.quote_currency),
  ])).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">FX Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send across borders in {allCurrencies.length}+ currencies. Authorization required.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>You send</span>
                <span>Balance: {formatMoney(Number(account?.balance ?? 0), baseCurrency)}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="h-14 border-0 bg-transparent p-0 font-display text-3xl font-bold shadow-none focus-visible:ring-0" />
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger className="h-12 w-[130px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {allCurrencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center">
              <button type="button" onClick={swap} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-bounce hover:rotate-180 hover:border-primary hover:text-primary">
                <ArrowDownUp className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Recipient gets</span>
                <span className="flex items-center gap-1 text-primary"><TrendingUp className="h-3 w-3" /> Mid-market</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <p className="flex-1 font-display text-3xl font-bold">{converted}</p>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger className="h-12 w-[130px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {allCurrencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl bg-muted/40 p-4 text-sm sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Exchange rate</p><p className="font-display font-bold">1 {from} = {rate.toFixed(4)} {to}</p></div>
              <div><p className="text-xs text-muted-foreground">Fee (0.5%)</p><p className="font-display font-bold">{fee} {from}</p></div>
              <div><p className="text-xs text-muted-foreground">Arrives in</p><p className="font-display font-bold">~ 2 hours</p></div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h2 className="font-display text-lg font-bold">Recipient details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Full name</Label><Input value={recipient.name} onChange={(e) => setRecipient({ ...recipient, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>IBAN / Account</Label><Input value={recipient.iban} onChange={(e) => setRecipient({ ...recipient, iban: e.target.value })} /></div>
              <div className="space-y-2"><Label>SWIFT / BIC</Label><Input value={recipient.swift} onChange={(e) => setRecipient({ ...recipient, swift: e.target.value })} /></div>
              <div className="space-y-2"><Label>Recipient bank</Label><Input value={recipient.bank} onChange={(e) => setRecipient({ ...recipient, bank: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={recipient.address} onChange={(e) => setRecipient({ ...recipient, address: e.target.value })} /></div>
              <div className="space-y-2"><Label>Zip / Postal code</Label><Input value={recipient.zip} onChange={(e) => setRecipient({ ...recipient, zip: e.target.value })} /></div>
              <div className="space-y-2"><Label>Country</Label><Input value={recipient.country} onChange={(e) => setRecipient({ ...recipient, country: e.target.value })} /></div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Account type</Label>
                <Select value={recipient.accountType} onValueChange={(v) => setRecipient({ ...recipient, accountType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button onClick={handleSend} className="mt-8 h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
            <Lock className="h-4 w-4" /> Authorize & send {converted} {to}
          </Button>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-warning" /><p className="text-sm font-semibold">Why Flexiq Verve FX?</p></div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Real mid-market rates</li>
              <li>• Flat 0.5% fee — no hidden margin</li>
              <li>• Transfers arrive in under 2 hours</li>
              <li>• COT, IMF & Tax authorization for safety</li>
            </ul>
          </Card>
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <p className="text-sm font-semibold">Live rates (vs USD)</p>
            <div className="mt-3 space-y-2 text-sm">
              {rates.slice(0, 6).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{r.quote_currency}</span>
                  <span className="font-mono">{Number(r.rate).toFixed(4)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <CodeGate open={gateOpen} onOpenChange={setGateOpen} required={["cot", "imf", "tax"]}
        title="Authorize FX transfer" onVerified={onVerified} />
    </div>
  );
};

export default FxTransfer;
