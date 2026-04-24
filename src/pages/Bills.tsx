import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Wifi, Smartphone, Tv, Droplet, Flame, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAccount, formatMoney, currencySymbol } from "@/hooks/useAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CodeGate } from "@/components/CodeGate";

const services = [
  { id: "electricity", label: "Electricity", icon: Lightbulb },
  { id: "internet", label: "Internet", icon: Wifi },
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "cable", label: "Cable TV", icon: Tv },
  { id: "water", label: "Water", icon: Droplet },
  { id: "gas", label: "Gas", icon: Flame },
];

const Bills = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: account } = useAccount();
  const qc = useQueryClient();
  const currency = account?.currency || "USD";

  const [service, setService] = useState("electricity");
  const [provider, setProvider] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [amount, setAmount] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [pendingTxId, setPendingTxId] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !account) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter amount", variant: "destructive" });
    if (account.frozen) return toast({ title: "Account frozen", variant: "destructive" });
    if (amt > Number(account.balance)) return toast({ title: "Insufficient funds", variant: "destructive" });

    const { data: tx, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "bill_payment",
      status: "awaiting_code",
      amount: -amt,
      currency,
      recipient_name: provider,
      recipient_account: accountNo,
      description: `${service} bill — ${provider}`,
      metadata: { service },
    }).select().single();

    if (error || !tx) return toast({ title: "Failed", description: error?.message, variant: "destructive" });
    setPendingTxId(tx.id);
    setGateOpen(true);
  };

  const onVerified = async () => {
    if (!user || !account || !pendingTxId) return;
    const amt = Number(amount);
    await supabase.from("accounts").update({ balance: Number(account.balance) - amt }).eq("user_id", user.id);
    await supabase.from("transactions").update({ status: "completed" }).eq("id", pendingTxId);
    qc.invalidateQueries({ queryKey: ["account"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recent-tx"] });
    toast({ title: "Bill paid", description: `${formatMoney(amt, currency)} to ${provider}.` });
    setProvider(""); setAccountNo(""); setAmount("");
    setPendingTxId(null);
  };

  const sym = currencySymbol(currency);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Bill Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pay your bills directly from your Norvex account.</p>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {services.map((s) => {
            const Icon = s.icon;
            const active = service === s.id;
            return (
              <button key={s.id} type="button" onClick={() => setService(s.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-smooth ${active ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}>
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{s.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. National Grid" required />
          </div>
          <div className="space-y-2">
            <Label>Bill / Account number</Label>
            <Input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Amount ({sym})</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <p className="text-xs text-muted-foreground">Available: {formatMoney(Number(account?.balance ?? 0), currency)}</p>
          </div>
          <Button type="submit" className="sm:col-span-2 h-12 gap-2 bg-gradient-primary shadow-glow">
            <Lock className="h-4 w-4" /> Authorize & pay {sym}{Number(amount || 0).toFixed(2)}
          </Button>
        </form>
      </Card>

      <CodeGate open={gateOpen} onOpenChange={setGateOpen} required={["cot", "tax"]}
        title="Authorize bill payment" onVerified={onVerified} />
    </div>
  );
};

export default Bills;
