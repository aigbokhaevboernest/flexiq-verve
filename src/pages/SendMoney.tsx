import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Building2, Send, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SendMoney = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "Transfer initiated",
        description: `$${amount || "0.00"} is on the way. You'll see it in Transactions shortly.`,
      });
    }, 900);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Send Money</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send funds to anyone, anywhere — securely and instantly.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</span>
                <h2 className="font-display text-lg font-bold">Amount</h2>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-2xl font-bold text-muted-foreground">$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-20 rounded-2xl pl-10 text-center font-display text-3xl font-bold"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 250, 500, 1000].map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium transition-smooth hover:border-primary hover:bg-primary/5"
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</span>
                <h2 className="font-display text-lg font-bold">Recipient</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" required placeholder="Jane" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" required placeholder="Doe" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" required placeholder="123 Market St" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">Zip code</Label>
                  <Input id="zip" required placeholder="94103" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select defaultValue="US">
                    <SelectTrigger id="country"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">3</span>
                <h2 className="font-display text-lg font-bold">Bank details</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank name</Label>
                  <Input id="bankName" required placeholder="Chase Bank" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account name</Label>
                  <Input id="accountName" required placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account type</Label>
                  <Select defaultValue="checking">
                    <SelectTrigger id="accountType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account number</Label>
                  <Input id="accountNumber" required placeholder="0123456789" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="routing">Routing number</Label>
                  <Input id="routing" required placeholder="021000021" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea id="note" placeholder="What's this for?" rows={3} />
                </div>
              </div>
            </section>

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow"
            >
              {submitting ? "Sending…" : (
                <>
                  Send ${amount || "0.00"} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <p className="text-sm font-semibold">Secure transfer</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Every transfer is encrypted end-to-end and protected by 2FA. We never share your details with the recipient bank beyond what's required.
            </p>
          </Card>
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <p className="text-sm font-semibold">Fee summary</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Amount</span>
                <span>${Number(amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Transfer fee</span>
                <span>$0.00</span>
              </div>
              <div className="border-t border-border/60 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>${Number(amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Recent recipients</p>
            </div>
            <div className="mt-3 space-y-2">
              {["Maya Patel", "D. Lee", "Sarah Kim"].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-smooth hover:bg-muted"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-mint text-xs font-bold text-white">
                    {n.split(" ").map((p) => p[0]).join("")}
                  </span>
                  <span className="text-sm">{n}</span>
                  <Send className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SendMoney;
