import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currencies } from "@/lib/currencies";
import { ArrowDownUp, Globe2, TrendingUp, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock indicative rates relative to USD
const usdRates: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 154.2, CAD: 1.37, AUD: 1.52,
  CHF: 0.91, CNY: 7.24, INR: 83.4, NGN: 1480, ZAR: 18.6, BRL: 5.1,
  MXN: 17.1, AED: 3.67, SAR: 3.75, SGD: 1.35, HKD: 7.82, KRW: 1345,
  SEK: 10.6, NOK: 10.8,
};

const FxTransfer = () => {
  const { toast } = useToast();
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("1000");

  const rate = useMemo(() => {
    const f = usdRates[from] ?? 1;
    const t = usdRates[to] ?? 1;
    return t / f;
  }, [from, to]);

  const converted = (Number(amount || 0) * rate).toFixed(2);
  const fee = (Number(amount || 0) * 0.005).toFixed(2);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">FX Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send money across borders in 30+ currencies with mid-market rates.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>You send</span>
                <span>Balance: $24,891.50</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 border-0 bg-transparent p-0 font-display text-3xl font-bold shadow-none focus-visible:ring-0"
                />
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger className="h-12 w-[130px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={swap}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-bounce hover:rotate-180 hover:border-primary hover:text-primary"
                aria-label="Swap currencies"
              >
                <ArrowDownUp className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Recipient gets</span>
                <span className="flex items-center gap-1 text-primary">
                  <TrendingUp className="h-3 w-3" /> Mid-market
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <p className="flex-1 font-display text-3xl font-bold">{converted}</p>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger className="h-12 w-[130px] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl bg-muted/40 p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Exchange rate</p>
                <p className="font-display font-bold">1 {from} = {rate.toFixed(4)} {to}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fee (0.5%)</p>
                <p className="font-display font-bold">{fee} {from}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Arrives in</p>
                <p className="font-display font-bold">~ 2 hours</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h2 className="font-display text-lg font-bold">Recipient details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rname">Full name</Label>
                <Input id="rname" placeholder="Recipient name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riban">IBAN / Account number</Label>
                <Input id="riban" placeholder="DE89 3704 0044 0532 0130 00" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rswift">SWIFT / BIC</Label>
                <Input id="rswift" placeholder="COBADEFFXXX" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rbank">Recipient bank</Label>
                <Input id="rbank" placeholder="Commerzbank AG" required />
              </div>
            </div>
          </div>

          <Button
            className="mt-8 h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow"
            onClick={() =>
              toast({
                title: "FX transfer scheduled",
                description: `${amount} ${from} → ${converted} ${to}. Tracking is available in Transactions.`,
              })
            }
          >
            <Globe2 className="h-4 w-4" /> Send {converted} {to}
          </Button>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              <p className="text-sm font-semibold">Why Norvex FX?</p>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Real mid-market exchange rates</li>
              <li>• Flat 0.5% fee — no hidden margin</li>
              <li>• Most transfers arrive in under 2 hours</li>
              <li>• Track every step in real time</li>
            </ul>
          </Card>
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <p className="text-sm font-semibold">Live rates (vs USD)</p>
            <div className="mt-3 space-y-2 text-sm">
              {["EUR", "GBP", "JPY", "CAD", "AUD"].map((c) => (
                <div key={c} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{c}</span>
                  <span className="font-mono">{usdRates[c]}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FxTransfer;
