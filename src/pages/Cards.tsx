import CardFace, { cardThemes } from "@/components/cards/CardFace";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Ban,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Wifi,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, formatMoney } from "@/hooks/useAccount";
import { useTotalBalance } from "@/hooks/useTotalBalance";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { sendEmail } from "@/lib/sendEmail";
import CardFace from "@/components/cards/CardFace";

/** Current status of a card, derived from the account + card rows. */
const getCardStatus = (c: any, accountFrozen: boolean) => {
  if (accountFrozen)
    return {
      key: "account_frozen",
      label: "Account frozen",
      desc: "Your account is frozen. Contact support to restore access.",
      color: "#ff8503",
      Icon: ShieldAlert,
      locked: true,
    };
  if (c?.status === "blocked")
    return {
      key: "blocked",
      label: "Card blocked",
      desc: "This card has been blocked. Contact support for help.",
      color: "#ef4444",
      Icon: Ban,
      locked: true,
    };
  if (c?.status === "deleted")
    return {
      key: "deleted",
      label: "Card removed",
      desc: "This card has been removed. Contact support for help.",
      color: "#ef4444",
      Icon: Ban,
      locked: true,
    };
  if (c?.frozen || (c?.status && c.status !== "active"))
    return {
      key: "frozen",
      label: "Card frozen",
      desc: "All transactions are blocked until you unfreeze this card.",
      color: "#ff8503",
      Icon: Snowflake,
      locked: false,
    };
  return {
    key: "active",
    label: "Active",
    desc: "Your card is ready to use for payments.",
    color: "#10b981",
    Icon: ShieldCheck,
    locked: false,
  };
};

const features: Array<{
  field: "online_payments" | "contactless" | "international";
  label: string;
  desc: string;
  icon: any;
}> = [
  { field: "online_payments", label: "Online payments", desc: "Pay on websites and apps", icon: ShoppingBag },
  { field: "contactless", label: "Contactless", desc: "Tap to pay at terminals", icon: Wifi },
  { field: "international", label: "International use", desc: "Spend outside your country", icon: Globe },
];

const Cards = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  // Same total the dashboard shows: primary + every opened secondary account.
  const { account, total: balance } = useTotalBalance();
  const qc = useQueryClient();
  const [topIndex, setTopIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const cardsKey = ["cards", user?.id];

  const { data: cards = [], isLoading } = useQuery<any[]>({
    queryKey: cardsKey,
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from("cards").select("*").eq("user_id", user!.id).order("created_at");
      return data || [];
    },
  });

  const total = cards.length;
  const active = total > 0 ? cards[topIndex % total] : null;
  const currency = (account as any)?.currency || "USD";
  const accountFrozen = (profile as any)?.frozen === true;
  const status = getCardStatus(active, accountFrozen);

  /**
   * Updates the active card. Shows the change instantly, then confirms with the
   * database. If the row wasn't actually updated (RLS blocked it, or the column
   * doesn't exist) the change is rolled back and the real error is shown.
   */
  const patchCard = async (patch: Record<string, any>, successMsg?: string) => {
    if (!active || !user) return;
    const id = (active as any).id;
    const prev = qc.getQueryData<any[]>(cardsKey);
    setSaving(Object.keys(patch)[0]);
    qc.setQueryData<any[]>(cardsKey, (old) =>
      (old || []).map((c) => (c.id === id ? { ...c, ...patch } : c))
    );

    const { data, error } = await (supabase as any)
      .from("cards")
      .update(patch)
      .eq("id", id)
      .select("id");

    setSaving(null);
    if (error || !data || data.length === 0) {
      qc.setQueryData(cardsKey, prev);
      toast.error("Couldn't update card", {
        description: error?.message || "The change wasn't saved. Please try again or contact support.",
      });
      return;
    }
    if (successMsg) toast.success(successMsg);
    qc.invalidateQueries({ queryKey: cardsKey });
  };

  const newCard = async () => {
    if (!user || creating) return;
    setCreating(true);
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
      card_holder: holder,
      card_type: "virtual",
      status: "active",
    });
    if (error) {
      setCreating(false);
      return toast.error("Could not create card", { description: error.message });
    }
    qc.invalidateQueries({ queryKey: cardsKey });
    toast.success("Virtual card created");

    // Confirmation email (best-effort: never blocks or fails the card creation)
    try {
      const last4 = num.slice(-4);
      const em = (profile as any)?.email || user.email || "";
      if (em) {
        await sendEmail({
          email: em,
          first_name: firstName,
          subject: "Virtual Card Created — Flexiq Verve",
          message: `Your new virtual card ending in ${last4} has been created successfully and is ready to use.

You can view your card details and freeze or unfreeze it at any time from the Cards page on your dashboard.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}
    setCreating(false);
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
        <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
          <Skeleton className="aspect-[1.586/1] w-full max-w-[400px] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-3xl" />
            <Skeleton className="h-56 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <Card className="rounded-3xl p-10 text-center">
        <p className="text-muted-foreground">No cards yet.</p>
        <Button onClick={newCard} disabled={creating} className="mt-4 gap-2 bg-gradient-primary"><Plus className="h-4 w-4" />Create card</Button>
      </Card>
    );
  }

  const next = () => setTopIndex((i) => (i + 1) % total);
  const StatusIcon = status.Icon;
  const frozen = (active as any).frozen === true;
  const last4 = String((active as any).card_number || "").replace(/\D/g, "").slice(-4);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your virtual and physical cards.</p>
        </div>
        <Button onClick={newCard} disabled={creating} className="gap-2 rounded-2xl bg-gradient-primary shadow-glow">
          <Plus className="h-4 w-4" /> New virtual card
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        {/* Left: card stack + quick actions */}
        <div className="space-y-5">
          <div
            className="relative mx-auto w-full max-w-[400px]"
            style={{
              aspectRatio: "1.586 / 1",
              marginBottom: `${Math.min(Math.max(total - 1, 0), 2) * 14}px`,
            }}
          >
            <AnimatePresence initial={false}>
              {cards.map((c: any, idx: number) => {
                const offset = (idx - topIndex + total) % total;
                if (offset > 2) return null;
                const isTop = offset === 0;
                const st = getCardStatus(c, accountFrozen);
                const inactive = st.key !== "active";
                return (
                  <motion.div
                    key={c.id}
                    drag={isTop && total > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (Math.abs(info.offset.x) > 100) next();
                    }}
                    initial={{ scale: 1 - offset * 0.05, y: offset * 14, opacity: 1, x: 0, rotate: 0 }}
                    animate={{ scale: 1 - offset * 0.05, y: offset * 14, opacity: 1 - offset * 0.2, x: 0, rotate: 0 }}
                    exit={{ x: 400, opacity: 0, rotate: 12, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } }}
                    whileDrag={{ rotate: 6, cursor: "grabbing" }}
                    transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                    className={`absolute inset-0 rounded-2xl shadow-2xl ${isTop && total > 1 ? "cursor-grab" : ""}`}
                    style={{ zIndex: total - offset }}
                  >
                    <CardFace
                      card={c}
                      index={idx}
                      holderFallback={(profile as any)?.first_name}
                      revealed={isTop && showDetails}
                      balanceText={formatMoney(balance, currency)}
                      inactive={inactive}
                      overlayLabel={inactive && isTop ? st.label : null}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

         {total > 1 && (
  <div className="flex items-center justify-center gap-2">
    {cards.map((c: any, i: number) => {
      const isActiveDot = i === topIndex % total;
      return (
        <button
          key={c.id}
          onClick={() => setTopIndex(i)}
          aria-label={`Show card ${i + 1}`}
          className={`h-2 rounded-full transition-all ${isActiveDot ? "w-6" : "w-2 bg-muted"}`}
          style={
            isActiveDot
              ? { backgroundColor: cardThemes[i % cardThemes.length].accent }
              : undefined
          }
        />
      );
    })}
  </div>
)}

          {/* Quick actions */}
          <div className="mx-auto grid w-full max-w-[400px] grid-cols-3 gap-3">
            <button
              type="button"
              disabled={status.locked || saving === "frozen"}
              onClick={() => patchCard({ frozen: !frozen }, frozen ? "Card unfrozen" : "Card frozen")}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-xs font-medium shadow-card transition-smooth hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Snowflake className="h-4 w-4" />
              </span>
              {frozen ? "Unfreeze" : "Freeze"}
            </button>
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-xs font-medium shadow-card transition-smooth hover:bg-muted/50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </span>
              {showDetails ? "Hide" : "Reveal"}
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText((active as any).card_number);
                toast.success("Card number copied");
              }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 text-xs font-medium shadow-card transition-smooth hover:bg-muted/50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Copy className="h-4 w-4" />
              </span>
              Copy
            </button>
          </div>
        </div>

        {/* Right: status, features, details */}
        <div className="space-y-4">
          {/* Current status */}
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current status</p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${status.color}1f`, color: status.color }}
              >
                <StatusIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl font-bold leading-tight" style={{ color: status.color }}>
                  {status.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{status.desc}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { k: "Type", v: (active as any).card_type === "physical" ? "Physical" : "Virtual" },
                { k: "Ends in", v: last4 || "—" },
                { k: "Expires", v: (active as any).expiry || "—" },
              ].map((i) => (
                <div key={i.k} className="rounded-xl bg-muted/50 px-2 py-2.5">
                  <p className="text-[11px] text-muted-foreground">{i.k}</p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">{i.v}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Controls */}
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <p className="text-sm font-semibold">Card controls</p>
            <div className="mt-3 divide-y divide-border/60">
              <div className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Snowflake className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Freeze card</p>
                    <p className="text-xs text-muted-foreground">Block all transactions instantly</p>
                  </div>
                </div>
                <Switch
                  checked={frozen}
                  disabled={status.locked || saving === "frozen"}
                  onCheckedChange={(v) => patchCard({ frozen: v }, v ? "Card frozen" : "Card unfrozen")}
                />
              </div>

              {features.map((f) => {
                const Icon = f.icon;
                const on = (active as any)[f.field] !== false;
                return (
                  <div key={f.field} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{f.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.desc} · <span className={on ? "text-success" : ""}>{on ? "On" : "Off"}</span>
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={on}
                      disabled={status.locked || saving === f.field}
                      onCheckedChange={(v) =>
                        patchCard({ [f.field]: v }, `${f.label} ${v ? "turned on" : "turned off"}`)
                      }
                    />
                  </div>
                );
              })}
            </div>
            {status.locked && (
              <p className="mt-2 text-xs text-muted-foreground">Controls are unavailable while the card or account is restricted.</p>
            )}
          </Card>

          {/* Details (only when revealed) */}
          {showDetails && (
            <Card className="rounded-3xl border-border/60 p-6 shadow-card">
              <p className="text-sm font-semibold">Card details</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Number</span><span className="font-mono">{(active as any).card_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">CVV</span><span className="font-mono">{(active as any).cvv}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Expires</span><span className="font-mono">{(active as any).expiry}</span></div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cards;
