import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Copy, CreditCard, Eye, EyeOff, Plus, Snowflake, Wifi } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAccount, useProfile, formatMoney } from "@/hooks/useAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const cardGradients = [
  "linear-gradient(135deg,#4f46e5 0%,#9333ea 50%,#ec4899 100%)",
  "linear-gradient(135deg,#0f766e 0%,#0891b2 50%,#22d3ee 100%)",
  "linear-gradient(135deg,#ea580c 0%,#dc2626 50%,#7f1d1d 100%)",
  "linear-gradient(135deg,#1e293b 0%,#334155 50%,#475569 100%)",
  "linear-gradient(135deg,#7c2d12 0%,#c2410c 50%,#facc15 100%)",
  "linear-gradient(135deg,#064e3b 0%,#16a34a 50%,#bbf7d0 100%)",
];

const Cards = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: account } = useAccount();
  const qc = useQueryClient();
  const [topIndex, setTopIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const { data: cards = [], isLoading } = useQuery<any[]>({
    queryKey: ["cards", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from("cards").select("*").eq("user_id", user!.id).order("created_at");
      return data || [];
    },
  });

  const total = cards.length;
  const active = total > 0 ? cards[topIndex % total] : null;
  const currency = (account as any)?.currency || "USD";
  const balance = Number((account as any)?.balance ?? 0);

  const update = async (patch: any) => {
    if (!active) return;
    await (supabase as any).from("cards").update(patch).eq("id", (active as any).id);
    qc.invalidateQueries({ queryKey: ["cards"] });
  };

  const newCard = async () => {
    if (!user) return;
    const num = "4" + Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join("");
    const cvv = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    const exp = `${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}/${String(new Date().getFullYear() + 4).slice(-2)}`;
    const firstName = ((profile as any)?.first_name || "").trim();
    const holder = firstName ? firstName.toUpperCase() : "";
    const { error } = await (supabase as any).from("cards").insert({
      user_id: user.id,
      card_number: num,
      cvv,
      expiry: exp,
      cardholder_name: holder,
      card_type: "virtual",
      status: "active",
      brand: "Visa",
    });
    if (error) return toast.error("Could not create card", { description: error.message });
    qc.invalidateQueries({ queryKey: ["cards"] });
    toast.success("Virtual card created");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-44 rounded-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <Skeleton className="h-56 w-full rounded-3xl" />
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <Card className="rounded-3xl p-10 text-center">
        <p className="text-muted-foreground">No cards yet.</p>
        <Button onClick={newCard} className="mt-4 gap-2 bg-gradient-primary"><Plus className="h-4 w-4" />Create card</Button>
      </Card>
    );
  }

  const next = () => setTopIndex((i) => (i + 1) % total);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Swipe to flip through your cards. Standard credit card size.</p>
        </div>
        <Button onClick={newCard} className="gap-2 rounded-2xl bg-gradient-primary shadow-glow">
          <Plus className="h-4 w-4" /> New virtual card
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <div className="space-y-4">
          <div className="relative mx-auto w-full max-w-[400px]" style={{ aspectRatio: "1.586 / 1" }}>
            <AnimatePresence initial={false}>
              {cards.map((c: any, idx: number) => {
                const offset = (idx - topIndex + total) % total;
                if (offset > 2) return null;
                const gradient = cardGradients[idx % cardGradients.length];
                const isTop = offset === 0;
                const last4 = (c.card_number || "").slice(-4);
                const masked = (c.card_number || "").replace(/(.{4})/g, "$1 ").trim();
                const holderName =
                  (c.cardholder_name && c.cardholder_name.trim()) ||
                  ((profile as any)?.first_name || "").toUpperCase() ||
                  "—";
                const expiry = c.expiry || "—";
                const isInactive = c.status && c.status !== "active";
                return (
                  <motion.div
                    key={c.id}
                    drag={isTop ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 100) next();
                    }}
                    initial={{ scale: 1 - offset * 0.05, y: offset * 14, opacity: 1, x: 0, rotate: 0 }}
                    animate={{ scale: 1 - offset * 0.05, y: offset * 14, opacity: 1 - offset * 0.2, x: 0, rotate: 0 }}
                    exit={{ x: 400, opacity: 0, rotate: 12, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } }}
                    whileDrag={{ rotate: 6, cursor: "grabbing" }}
                    transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                    className={`absolute inset-0 overflow-hidden rounded-2xl p-5 text-white shadow-2xl ${isTop ? "cursor-grab" : ""} ${c.frozen || isInactive ? "opacity-60" : ""}`}
                    style={{ background: gradient, zIndex: total - offset }}
                  >
                    <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest opacity-80">Flexiq Verve</p>
                          <p className="text-xs opacity-80">{c.card_type || "Virtual"} debit</p>
                        </div>
                        <Wifi className="h-5 w-5 rotate-90 opacity-90" />
                      </div>
                      <div>
                        <p className="font-mono text-base tracking-[0.2em] sm:text-lg">{isTop && showDetails ? masked : `•••• •••• •••• ${last4 || "————"}`}</p>
                        <p className="mt-1 text-[10px] uppercase opacity-70">Balance</p>
                        <p className="font-display text-xl font-bold">{formatMoney(balance, currency)}</p>
                      </div>
                      <div className="flex items-end justify-between text-xs">
                        <div>
                          <p className="text-[10px] uppercase opacity-70">Cardholder</p>
                          <p className="font-medium">{holderName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase opacity-70">Exp</p>
                          <p className="font-mono">{expiry}</p>
                        </div>
                        <CreditCard className="h-5 w-5 opacity-90" />
                      </div>
                    </div>
                    {(c.frozen || isInactive) && isTop && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Badge className="rounded-full bg-white text-foreground">
                          <Snowflake className="mr-2 h-4 w-4" />
                          {c.status === "blocked" ? "Card blocked" : c.status === "deleted" ? "Card removed" : "Card frozen"}
                        </Badge>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-2">
            {cards.map((c: any, i: number) => (
              <button
                key={c.id}
                onClick={() => setTopIndex(i)}
                aria-label={`Show card ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === topIndex ? "w-6 bg-primary" : "w-2 bg-muted"}`}
              />
            ))}
          </div>
          {total > 1 && (
            <p className="text-center text-xs text-muted-foreground">Swipe card or tap a dot · {topIndex + 1} of {total}</p>
          )}
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
            {showDetails && (
              <div className="mt-3 space-y-1 rounded-xl bg-muted/40 p-3 text-xs">
                <p>Number: <span className="font-mono">{(active as any).card_number}</span></p>
                <p>CVV: <span className="font-mono">{(active as any).cvv}</span></p>
                <p>Expires: <span className="font-mono">{(active as any).expiry}</span></p>
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-3 w-full justify-start gap-2 text-muted-foreground"
              onClick={() => { navigator.clipboard.writeText((active as any).card_number); toast.success("Copied"); }}>
              <Copy className="h-3.5 w-3.5" /> Copy card number
            </Button>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-semibold">Freeze card</p><p className="text-xs text-muted-foreground">Block all transactions instantly.</p></div>
              <Switch checked={(active as any).frozen} onCheckedChange={(v) => { update({ frozen: v }); toast(v ? "Card frozen" : "Card unfrozen"); }} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cards;
