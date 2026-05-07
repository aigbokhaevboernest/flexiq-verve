import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, CreditCard, Eye, EyeOff, Plus, Snowflake, Wifi } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Cards = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: cards = [] } = useQuery({
    queryKey: ["cards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("cards").select("*").eq("user_id", user!.id).order("created_at");
      return data || [];
    },
  });

  const active = cards.find((c: any) => c.id === activeId) || cards[0];
  const update = async (patch: any) => {
    if (!active) return;
    await supabase.from("cards").update(patch).eq("id", active.id);
    qc.invalidateQueries({ queryKey: ["cards"] });
  };

  const newCard = async () => {
    if (!user || !profile) return;
    const num = "4" + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join("");
    const cvv = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    const exp = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}/${String(new Date().getFullYear() + 4).slice(-2)}`;
    await supabase.from("cards").insert({
      user_id: user.id,
      card_number: num, cvv, expires_at: exp,
      cardholder_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim().toUpperCase() || "CARDHOLDER",
      brand: "Visa",
    });
    qc.invalidateQueries({ queryKey: ["cards"] });
    toast({ title: "Virtual card created" });
  };

  if (!active) {
    return (
      <Card className="rounded-3xl p-10 text-center">
        <p className="text-muted-foreground">No cards yet.</p>
        <Button onClick={newCard} className="mt-4 gap-2 bg-gradient-primary"><Plus className="h-4 w-4" />Create card</Button>
      </Card>
    );
  }
  const last4 = active.card_number.slice(-4);
  const masked = active.card_number.replace(/(.{4})/g, "$1 ").trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create virtual cards, set limits and freeze instantly.</p>
        </div>
        <Button onClick={newCard} className="gap-2 rounded-2xl bg-gradient-primary shadow-glow">
          <Plus className="h-4 w-4" /> New virtual card
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="space-y-4">
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-primary p-7 text-white shadow-elev transition-smooth ${active.frozen ? "opacity-60" : ""}`}>
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">Flexiq Verve {active.card_type}</p>
                <p className="mt-1 font-display text-lg font-semibold">{active.cardholder_name}</p>
              </div>
              <Wifi className="h-5 w-5 rotate-90 opacity-90" />
            </div>
            <p className="relative mt-10 font-mono text-xl tracking-[0.25em]">{showDetails ? masked : `•••• •••• •••• ${last4}`}</p>
            <div className="relative mt-5 flex justify-between text-sm">
              <div><p className="text-[10px] uppercase opacity-70">Expiry</p><p className="font-mono">{active.expires_at}</p></div>
              <div><p className="text-[10px] uppercase opacity-70">CVV</p><p className="font-mono">{showDetails ? active.cvv : "•••"}</p></div>
              <CreditCard className="h-6 w-6 opacity-90" />
            </div>
            {active.frozen && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Badge className="rounded-full bg-white text-foreground text-base px-4 py-1.5"><Snowflake className="mr-2 h-4 w-4" /> Card frozen</Badge>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {cards.map((c: any) => (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition-smooth ${c.id === active.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}>
                •••• {c.card_number.slice(-4)} · {c.card_type}
              </button>
            ))}
          </div>
        </div>

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
            <Button variant="ghost" size="sm" className="mt-3 w-full justify-start gap-2 text-muted-foreground"
              onClick={() => { navigator.clipboard.writeText(active.card_number); toast({ title: "Copied" }); }}>
              <Copy className="h-3.5 w-3.5" /> Copy card number
            </Button>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-semibold">Freeze card</p><p className="text-xs text-muted-foreground">Block all transactions instantly.</p></div>
              <Switch checked={active.frozen} onCheckedChange={(v) => { update({ frozen: v }); toast({ title: v ? "Card frozen" : "Card unfrozen" }); }} />
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Cards;
