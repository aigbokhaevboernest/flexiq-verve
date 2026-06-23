import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Receipt,
  Send,
  TrendingUp,
  Wallet,
  Wifi,
  ShieldAlert,
  PiggyBank,
  LineChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAccount, formatMoney } from "@/hooks/useAccount";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

const quickActions: Array<{
  icon: any;
  label: string;
  to: string;
  disabled?: boolean;
}> = [
  { icon: Send, label: "Send", to: "/dashboard/send/wire" },
  { icon: ArrowDownLeft, label: "Receive", to: "/dashboard/receive" },
  { icon: FileText, label: "Bills", to: "/dashboard/bills", disabled: true },
  { icon: Wallet, label: "Loans", to: "/dashboard/loans" },
];

/**
 * Mask account number — show only last 4 digits.
 * Always groups masked portion in blocks of 4, last4 is unmasked.
 * e.g. "00002693" → "•••• 2693"
 *      "1234567890" → "•••••• 7890"  (padded to clean groups)
 */
const maskAccountNumber = (raw?: string | null): string => {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return raw;
  const last4 = digits.slice(-4);
  const hiddenCount = digits.length - 4;
  if (hiddenCount === 0) return last4;
  // Group masked digits in chunks of 4, drop empty groups
  const maskedBlocks = "•".repeat(hiddenCount).match(/.{1,4}/g) || [];
  return [...maskedBlocks, last4].join(" ");
};

// ---------------------------------------------------------------------------
// Placeholder card gradients — sky blue for retirement per request
// ---------------------------------------------------------------------------
const PLACEHOLDER_GRADIENTS = {
  savings:    "linear-gradient(135deg, #1a6b5a 0%, #0d4f40 60%, #083d30 100%)",
  checking:   "linear-gradient(135deg, #1a3a6b 0%, #0d2b4f 60%, #082040 100%)",
  retirement: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 55%, #0369a1 100%)",
};

const PLACEHOLDER_LABELS = {
  savings:    "Savings Account",
  checking:   "Checking Account",
  retirement: "Retirement & Investment",
};

const PLACEHOLDER_SHORT = {
  savings:    "SAVINGS",
  checking:   "CHECKING",
  retirement: "INVEST",
};

const PLACEHOLDER_ICONS = {
  savings:    PiggyBank,
  checking:   Wallet,
  retirement: LineChart,
};

// ---------------------------------------------------------------------------
// Placeholder card component
// ---------------------------------------------------------------------------
interface PlaceholderCardProps {
  type: "savings" | "checking" | "retirement";
  hidden: boolean;
  currency: string;
}

const PlaceholderCard = ({ type, hidden, currency }: PlaceholderCardProps) => {
  const Icon = PLACEHOLDER_ICONS[type];
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 text-white shadow-elev h-full flex flex-col"
      style={{ background: PLACEHOLDER_GRADIENTS[type] }}
    >
      {/* Decorative blobs */}
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      {/* ── Bold account-type header ── */}
      <div className="relative mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <Icon className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-widest opacity-60 leading-none mb-0.5">
            Account
          </p>
          <p className="text-lg font-extrabold tracking-wide leading-none">
            {PLACEHOLDER_LABELS[type]}
          </p>
        </div>
        {/* Top-right badge */}
        <span className="ml-auto text-xs font-bold opacity-50 tracking-widest">
          {PLACEHOLDER_SHORT[type]}
        </span>
      </div>

      {/* Balance row */}
      <div className="relative">
        <p className="text-xs uppercase tracking-widest opacity-60">
          Available Balance
        </p>
        <p
          className="mt-2 font-sans font-bold tracking-tight"
          style={{ fontSize: "clamp(2rem, 6vw, 3rem)" }}
        >
          {hidden ? "••••••" : formatMoney(0, currency)}
        </p>
      </div>

      {/* Meta row */}
      <div className="relative mt-5 flex gap-8 text-sm opacity-80">
        <div>
          <p className="text-xs opacity-60">Status</p>
          <p className="font-medium opacity-60 text-xs mt-0.5">Not opened yet</p>
        </div>
      </div>

      {/* Quick actions — disabled */}
      <div className="relative mt-8 grid grid-cols-4 gap-3">
        {quickActions.map((a) => {
          const Ic = a.icon;
          return (
            <button
              key={a.label}
              type="button"
              disabled
              className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-3 text-center opacity-35 cursor-not-allowed"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                <Ic className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium">{a.label}</span>
            </button>
          );
        })}
      </div>

      {/* Removed Coming soon pill as requested */}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const DashboardHome = () => {
  const [hidden, setHidden]         = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const { user }                    = useAuth();
  const { data: profile, isLoading: profLoading } = useAccount();
  const queryClient                 = useQueryClient();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const isFrozen = profile?.frozen === true;

  const rawAccountType = ((profile as any)?.account_type || "checking")
    .toLowerCase().trim();
  const isCheckingUser = rawAccountType === "checking";

  const placeholderSlides: Array<"savings" | "checking" | "retirement"> =
    isCheckingUser ? ["savings", "retirement"] : ["checking", "retirement"];

  const totalSlides = 1 + placeholderSlides.length; // always 3

  const goTo   = (idx: number) => setActiveSlide(Math.max(0, Math.min(totalSlides - 1, idx)));
  const goPrev = () => goTo(activeSlide - 1);
  const goNext = () => goTo(activeSlide + 1);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 36) {
      dx < 0 ? goNext() : goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleFrozenAction = () => {
    toast("Account frozen", {
      description:
        "Your account has been frozen by an administrator. All transactions and features are disabled. Please contact support.",
      duration: 5000,
      style: { background: "#ff8503", color: "#ffffff", border: "none" },
      classNames: { title: "text-white font-semibold", description: "text-white/90" },
    });
  };

  useEffect(() => {
    if (profLoading) return;
    if (!profile) return;
    if ((profile as any)?.status === "blocked") {
      toast.error("Account blocked", {
        description: "Your account has been blocked by an administrator. Please contact support.",
        duration: 3000,
      });
      setTimeout(() => {
        supabase.auth.signOut().then(() => { window.location.href = "/login"; });
      }, 3000);
    }
  }, [profLoading]);

  useEffect(() => {
    if (!user) return;
    const cacheKey = `profileCache:${user.id}`;
    const channel = supabase
      .channel("profile-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => {
          try { localStorage.removeItem(cacheKey); } catch {}
          queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const { data: txs } = useQuery({
    queryKey: ["recent-tx", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const { data: card, isLoading: cardLoading } = useQuery<any>({
    queryKey: ["primary-card", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("cards")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("amount,type,status")
        .eq("user_id", user!.id);

      const inSum = (data || [])
        .filter((t) =>
          Number(t.amount) > 0 ||
          t.type === "transfer_in" || t.type === "deposit" ||
          t.type === "refund"      || t.type === "loan_disbursement"
        )
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

      const outSum = (data || [])
        .filter((t) =>
          Number(t.amount) < 0 ||
          t.type === "transfer_out" || t.type === "bill_payment" || t.type === "fx"
        )
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

      return { inSum, outSum, net: inSum - outSum };
    },
  });

  const profileReady   = !!profile && !profLoading;
  const firstName      = (profile as any)?.first_name?.trim() || "";
  const currency       = (profile as any)?.currency || null;
  const accountNumber  = (profile as any)?.account_number || null;
  const balanceKnown   = profile && (profile as any).balance != null;
  const balanceValue   = balanceKnown ? Number((profile as any).balance) : 0;

  const maskedAccountNumber = useMemo(
    () => maskAccountNumber(accountNumber),
    [accountNumber]
  );

  // ── Real account card (slide 0) — original logic 100% untouched ─────────
  const RealAccountSlide = (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-elev h-full flex flex-col">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/40 blur-3xl pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          {isFrozen && (
            <span
              className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
              style={{ backgroundColor: "rgba(255, 133, 3, 0.8)" }}
            >
              <ShieldAlert className="h-3 w-3" />
              Account Frozen
            </span>
          )}

          <p className="text-xs uppercase tracking-widest opacity-70">
            Available Balance
          </p>
          <div className="mt-2 flex items-center gap-3">
            {!balanceKnown || !currency ? (
              <Skeleton className="h-10 w-44 bg-white/20" />
            ) : (
              <p
                className="font-sans font-bold tracking-tight truncate max-w-[260px] sm:max-w-[340px]"
                style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
                title={formatMoney(balanceValue, currency)}
              >
                {hidden ? "••••••" : formatMoney(balanceValue, currency)}
              </p>
            )}
            <button
              onClick={() => setHidden((h) => !h)}
              className="rounded-full bg-white/15 p-2 backdrop-blur transition-smooth hover:bg-white/25"
            >
              {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm opacity-90">
            <div>
              <p className="text-xs opacity-70">Account No.</p>
              <p className="font-mono">
                {!profileReady ? (
                  <Skeleton className="inline-block h-3 w-24 bg-white/20 align-middle" />
                ) : (
                  maskedAccountNumber
                )}
              </p>
            </div>
            <div>
              <p className="text-xs opacity-70">Account type</p>
              <p className="font-medium">
                {(profile as any)?.account_type || "Personal"}
              </p>
            </div>
            {isFrozen && (
              <div>
                <p className="text-xs opacity-70">Status</p>
                <p className="font-semibold" style={{ color: "#ff8503" }}>
                  ● Frozen
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden text-right sm:block">
          <Wifi className="ml-auto h-5 w-5 rotate-90 opacity-90" />
          <p className="mt-12 font-display text-sm font-semibold opacity-90">
            PLATINUM
          </p>
        </div>
      </div>

      <div className="relative mt-8 grid grid-cols-4 gap-3">
        {quickActions.map((a) => {
          const Icon = a.icon;
          const cls =
            "group flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-3 text-center backdrop-blur transition-smooth hover:bg-white/20";
          const inner = (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-primary-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-medium">{a.label}</span>
            </>
          );

          if (isFrozen || a.disabled) {
            return (
              <button
                key={a.label}
                type="button"
                onClick={
                  isFrozen
                    ? handleFrozenAction
                    : () => {
                        toast.error("Feature not available", {
                          description: "Please contact support for assistance.",
                        });
                      }
                }
                className={cls + " cursor-not-allowed opacity-50"}
              >
                {inner}
              </button>
            );
          }
          return (
            <Link key={a.label} to={a.to} className={cls}>
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );

  // ── Slides array ─────────────────────────────────────────────────────────
  const slides = [
    { key: "real", node: RealAccountSlide },
    ...placeholderSlides.map((type) => ({
      key: type,
      node: (
        <PlaceholderCard
          type={type}
          hidden={hidden}
          currency={currency || "USD"}
        />
      ),
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {firstName ? (
            <>Welcome back, {firstName} 👋</>
          ) : profileReady ? (
            <>Welcome back 👋</>
          ) : (
            <Skeleton className="inline-block h-4 w-44 align-middle" />
          )}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
          Here's your money today
        </h1>
      </div>

      {isFrozen && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4"
          style={{
            border: "1px solid rgba(255, 133, 3, 0.4)",
            backgroundColor: "rgba(255, 133, 3, 0.1)",
          }}
        >
          <ShieldAlert className="h-5 w-5 shrink-0" style={{ color: "#ff8503" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#ff8503" }}>
              Account Frozen
            </p>
            <p className="text-xs" style={{ color: "rgba(255, 133, 3, 0.8)" }}>
              Your account has been frozen by an administrator. All transactions
              and features are disabled. Please contact support.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Swipable carousel ──────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="relative select-none">
            <div
              className="overflow-hidden"
              style={{ borderRadius: "1.5rem" }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex"
                style={{
                  transition: "transform 380ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  gap: "12px",
                  transform: `translateX(calc(-${activeSlide} * (100% - 16px + 12px)))`,
                }}
              >
                {slides.map((slide, i) => (
                  <div
                    key={slide.key}
                    className="flex-shrink-0 w-full"
                    style={{
                      flex: "0 0 calc(100% - 28px)",
                      opacity: i === activeSlide ? 1 : 0.72,
                      transition: "opacity 380ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    }}
                  >
                    {slide.node}
                  </div>
                ))}
              </div>
            </div>

            {/* Left chevron */}
            {activeSlide > 0 && (
              <button
                onClick={goPrev}
                aria-label="Previous account"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-all hover:bg-black/45 hover:scale-105"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {/* Right chevron */}
            {activeSlide < totalSlides - 1 && (
              <button
                onClick={goNext}
                aria-label="Next account"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-all hover:bg-black/45 hover:scale-105"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Dot indicators */}
            <div className="mt-3 flex justify-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="h-1.5 rounded-full"
                  style={{
                    width: activeSlide === i ? "1.5rem" : "0.375rem",
                    backgroundColor:
                      activeSlide === i
                        ? "hsl(var(--primary))"
                        : "hsl(var(--border))",
                    transition: "width 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 300ms ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Your card panel — unchanged ────────────────────────────────── */}
        <Card className="rounded-3xl border-border/60 p-6 shadow-card h-full">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Your card</p>
            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
              <Link to="/dashboard/cards">Manage</Link>
            </Button>
          </div>
          <div className="mt-4 rounded-2xl bg-gradient-coral p-5 text-white">
            <div className="flex items-center justify-between text-xs opacity-90">
              <span>
                {card?.card_type === "physical" ? "Physical" : "Virtual"} debit
              </span>
              <CreditCard className="h-4 w-4" />
            </div>
            {(() => {
              const raw      = card?.card_number || (profile as any)?.card_number;
              const expiry   = card?.expiry || (profile as any)?.expiry;
              const cardName =
                card?.cardholder_name?.trim() ||
                (firstName ? firstName.toUpperCase() : "");
              if (cardLoading || profLoading) {
                return (
                  <>
                    <Skeleton className="mt-6 h-5 w-56 bg-white/30" />
                    <div className="mt-3 flex justify-between text-xs opacity-90">
                      <Skeleton className="h-3 w-24 bg-white/30" />
                      <Skeleton className="h-3 w-12 bg-white/30" />
                    </div>
                  </>
                );
              }
              const masked = raw
                ? `•••• •••• •••• ${String(raw).replace(/\s+/g, "").slice(-4)}`
                : "•••• •••• •••• ————";
              return (
                <>
                  <p className="mt-6 font-normal text-sm tracking-[0.2em]">{masked}</p>
                  <div className="mt-3 flex justify-between text-xs opacity-90">
                    <span>{cardName || "—"}</span>
                    <span>{expiry || "—"}</span>
                  </div>
                </>
              );
            })()}
          </div>
          {(isFrozen ||
            card?.frozen ||
            (card?.status && card.status !== "active")) && (
            <p
              className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold"
              style={{ color: "#ff8503" }}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {isFrozen
                ? "Account frozen"
                : card?.status === "blocked"
                ? "Card blocked"
                : card?.status === "deleted"
                ? "Card removed"
                : "Card frozen"}
            </p>
          )}
        </Card>
      </div>

      {/* Stats row — unchanged */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Credit",  value: stats?.inSum,  icon: ArrowDownLeft, positive: true },
          { label: "Debit",   value: stats?.outSum, icon: ArrowUpRight,  positive: false },
          { label: "Net",     value: stats?.net,    icon: TrendingUp,    positive: (stats?.net ?? 0) >= 0 },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="rounded-3xl border-border/60 p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              {statsLoading || s.value == null ? (
                <Skeleton className="mt-3 h-7 w-32" />
              ) : (
                <p className={`mt-3 font-display text-2xl font-bold ${s.positive ? "text-success" : "text-foreground"}`}>
                  {formatMoney(Math.abs(s.value), currency || "USD")}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recent activity — unchanged */}
      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/transactions">View all</Link>
          </Button>
        </div>
        <div className="mt-4 divide-y divide-border/60">
          {(txs || []).length === 0 && (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Your activity will show here as you spend, send, or receive money."
              ctaLabel="Send Money"
              ctaTo="/dashboard/send"
            />
          )}
          {(txs || []).map((t: any) => {
            const positive = Number(t.amount) > 0;
            const displayStatus =
              t.status === "awaiting_code" ? "pending"
              : t.status === "rejected"    ? "processing"
              : t.status;
            return (
              <div key={t.id} className="flex items-center gap-4 py-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    positive ? "bg-success/15 text-success" : "bg-muted text-foreground/70"
                  }`}
                >
                  {positive
                    ? <ArrowDownLeft className="h-4 w-4" />
                    : <ArrowUpRight  className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="break-words text-sm font-medium">
                    {t.description || t.recipient_name ||
                      (t.type === "transfer_in"  ? "Credit"
                      : t.type === "transfer_out" ? "Debit"
                      : t.type.replace(/_/g, " "))}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {t.type === "transfer_in"  ? "Credit"
                    : t.type === "transfer_out" ? "Debit"
                    : t.type.replace(/_/g, " ")}{" "}
                    • {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-display text-sm font-bold ${positive ? "text-success" : ""}`}>
                    {positive ? "+" : "−"}
                    {formatMoney(Math.abs(Number(t.amount)), t.currency || currency || "USD")}
                  </p>
                  <p
                    className="text-xs capitalize font-medium"
                    style={{
                      color:
                        displayStatus === "pending"    ? "#f59e0b"
                        : displayStatus === "processing" ? "#f59e0b"
                        : displayStatus === "failed"    ? "#ef4444"
                        : displayStatus === "completed" ? "#10b981"
                        : "#94a3b8",
                    }}
                  >
                    {displayStatus.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default DashboardHome;
