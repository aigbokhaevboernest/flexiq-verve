import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Repeat, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LocalTransfer = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "Local transfer submitted",
        description: `$${amount || "0.00"} will arrive within minutes.`,
      });
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Local Transfer</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bank transfers within your country — instant and free.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-border bg-muted/40 p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Amount</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-display text-2xl font-bold text-muted-foreground">$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-14 border-0 bg-transparent p-0 font-display text-3xl font-bold shadow-none focus-visible:ring-0"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="recipient">Recipient name</Label>
                <Input id="recipient" required placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account">Account number</Label>
                <Input id="account" required placeholder="0123456789" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="routing">Routing number</Label>
                <Input id="routing" required placeholder="021000021" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="What's this transfer for?" rows={3} />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow"
            >
              {submitting ? "Processing…" : (
                <>
                  <Repeat className="h-4 w-4" />
                  Transfer ${amount || "0.00"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <p className="text-sm font-semibold">Free & instant</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Local transfers are free and typically settle within minutes via the national clearing network.
            </p>
          </Card>
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <p className="text-sm font-semibold">Saved beneficiaries</p>
            <div className="mt-3 space-y-2">
              {[
                { n: "D. Lee", acc: "•••• 4421" },
                { n: "Maya Patel", acc: "•••• 8821" },
                { n: "Sarah Kim", acc: "•••• 2210" },
              ].map((b) => (
                <button
                  key={b.n}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-smooth hover:bg-muted"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                    {b.n.split(" ").map((p) => p[0]).join("")}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{b.n}</p>
                    <p className="text-xs text-muted-foreground">{b.acc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LocalTransfer;
