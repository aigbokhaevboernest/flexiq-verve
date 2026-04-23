import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  Snowflake,
  Wifi,
  Zap,
} from "lucide-react";

type CardItem = {
  id: string;
  name: string;
  last4: string;
  expiry: string;
  type: "Virtual" | "Physical";
  gradient: string;
  frozen: boolean;
  limit: number;
  spent: number;
};

const initial: CardItem[] = [
  {
    id: "c1",
    name: "Jane Doe",
    last4: "4829",
    expiry: "12/29",
    type: "Virtual",
    gradient: "bg-gradient-primary",
    frozen: false,
    limit: 10000,
    spent: 2140,
  },
  {
    id: "c2",
    name: "Jane Doe",
    last4: "1052",
    expiry: "08/27",
    type: "Physical",
    gradient: "bg-gradient-coral",
    frozen: false,
    limit: 5000,
    spent: 980,
  },
];

const Cards = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardItem[]>(initial);
  const [activeId, setActiveId] = useState(initial[0].id);
  const [showDetails, setShowDetails] = useState(false);

  const active = cards.find((c) => c.id === activeId)!;

  const update = (patch: Partial<CardItem>) =>
    setCards((cs) => cs.map((c) => (c.id === activeId ? { ...c, ...patch } : c)));

  const usagePct = Math.round((active.spent / active.limit) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create virtual cards, set limits and freeze instantly.
          </p>
        </div>
        <Button
          className="gap-2 rounded-2xl bg-gradient-primary shadow-glow"
          onClick={() => {
            const nc: CardItem = {
              id: "c" + (cards.length + 1),
              name: "Jane Doe",
              last4: String(Math.floor(1000 + Math.random() * 9000)),
              expiry: "06/30",
              type: "Virtual",
              gradient: "bg-gradient-mint",
              frozen: false,
              limit: 2000,
              spent: 0,
            };
            setCards((cs) => [...cs, nc]);
            setActiveId(nc.id);
            toast({ title: "Virtual card created", description: `Card ending in ${nc.last4} is ready.` });
          }}
        >
          <Plus className="h-4 w-4" /> New virtual card
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        {/* Active card preview */}
        <div className="space-y-4">
          <div className={`relative overflow-hidden rounded-3xl ${active.gradient} p-7 text-white shadow-elev transition-smooth ${active.frozen ? "opacity-60" : ""}`}>
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">Norvex {active.type}</p>
                <p className="mt-1 font-display text-lg font-semibold">{active.name}</p>
              </div>
              <Wifi className="h-5 w-5 rotate-90 opacity-90" />
            </div>
            <p className="relative mt-10 font-mono text-xl tracking-[0.25em]">
              {showDetails ? "4829 1234 5678 " + active.last4 : "•••• •••• •••• " + active.last4}
            </p>
            <div className="relative mt-5 flex justify-between text-sm">
              <div>
                <p className="text-[10px] uppercase opacity-70">Expiry</p>
                <p className="font-mono">{active.expiry}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase opacity-70">CVV</p>
                <p className="font-mono">{showDetails ? "428" : "•••"}</p>
              </div>
              <CreditCard className="h-6 w-6 opacity-90" />
            </div>
            {active.frozen && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Badge className="rounded-full bg-white/90 text-foreground backdrop-blur">
                  <Snowflake className="mr-1 h-3 w-3" /> Frozen
                </Badge>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-smooth ${
                  c.id === activeId
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                •••• {c.last4} · {c.type}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Card details</p>
                <p className="text-xs text-muted-foreground">Number, expiry & CVV</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowDetails((s) => !s)} className="gap-2">
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? "Hide" : "Reveal"}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full justify-start gap-2 text-muted-foreground"
              onClick={() => {
                navigator.clipboard.writeText(`4829 1234 5678 ${active.last4}`);
                toast({ title: "Card number copied" });
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copy card number
            </Button>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Freeze card</p>
                <p className="text-xs text-muted-foreground">Block all new transactions instantly.</p>
              </div>
              <Switch
                checked={active.frozen}
                onCheckedChange={(v) => {
                  update({ frozen: v });
                  toast({ title: v ? "Card frozen" : "Card unfrozen" });
                }}
              />
            </div>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Monthly limit</p>
              <span className="font-display text-sm font-bold">${active.limit.toLocaleString()}</span>
            </div>
            <Slider
              className="mt-4"
              min={500}
              max={20000}
              step={500}
              value={[active.limit]}
              onValueChange={([v]) => update({ limit: v })}
            />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used: ${active.spent.toLocaleString()}</span>
                <span>{usagePct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${usagePct > 80 ? "bg-destructive" : "bg-gradient-primary"}`}
                  style={{ width: `${Math.min(usagePct, 100)}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-warning" />
              <p className="text-sm font-semibold">Quick controls</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <label className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                Online <Switch defaultChecked />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                ATM <Switch defaultChecked />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                Contactless <Switch defaultChecked />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                Abroad <Switch />
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cards;
