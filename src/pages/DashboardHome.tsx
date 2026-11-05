import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Landmark,
  Receipt,
  Send,
  TrendingUp,
  Wallet,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAccount, useOpenAccount, formatMoney } from "@/hooks/useAccount";
import type { SecondaryAccountType } from "@/hooks/useAccount";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import AccountCarousel from "@/components/dashboard/AccountCarousel";
import { SendChooserModal } from "@/components/dashboard/SendChooserModal";
import FitAmount from "@/components/FitAmount";

const quickActions: Array<{
  icon: any;
  label: string;
  to: string;
  disabled?: boolean;
  /** "send" opens the Local / Digital / Wire / FX chooser instead of navigating */
  action?: "send";
}> = [
  { icon: Send, label: "Send", to: "/dashboard/send", action: "send" },
  { icon: Wallet, label: "Add money", to: "/dashboard/receive" },
  { icon: FileText, label: "Bills", to: "/dashboard/bills", disabled: true },
  { icon: Banknote, label: "Loans", to: "/dashboard/loans" },
];

/**
 * Primary card theme: one solid blue with white text in both light and dark
 * mode (mid blue stays visible on dark pages). Solid colors only — no
 * gradients, blur or stacked translucent layers.
 */
const cardTheme = {
  surface: "bg-[#3d76ca] text-white border border-white/10",
  muted: "text-white/70",
  eyeBtn: "border border-white/30 hover:bg-white/15",
  tile: "bg-white/15 hover:bg-white/20",
  iconChip: "bg-white/20 text-white",
  skeleton: "bg-white/25",
  // Darker shade of the same blue behind "View currency wallet"
  footer:
    "bg-[#2f62b3] border-t border-white/15 hover:bg-[#2a58a3]",
};

/** Mask account number — show only last 4 digits: •••• •••• 7890 */
const maskAccountNumber = (raw?: string | null): string => {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return raw;
  const last4 = digits.slice(-4);
  const hiddenCount = digits.length - 4;
  // Group masked digits in blocks of 4 for readability
  const maskedBlocks = "•".repeat(hiddenCount).match(/.{1,4}/g) || [];
  return [...maskedBlocks, last4].join(" ");
};

/**
 * Determine which secondary account cards to show in the carousel, based
 * on the account type chosen at signup. Pool is {checking, savings,
 * retirement} — business is never a secondary card.
 *
 * Rule: always exactly 2 secondary cards, never duplicating the signup type.
 *  - signup = "checking"   -> secondary = ["savings", "retirement"]
 *  - signup = "savings"    -> secondary = ["checking", "retirement"]
 *  - signup = "retirement" -> secondary = ["checking", "savings"]
 *  - signup = "business" | anything else/unknown
 *                           -> secondary = ["checking", "savings"]
 *
 * Matching is case-insensitive since the exact stored casing of
 * account_type is unconfirmed.
 */
const getSecondaryAccountTypes = (
  accountType: string | null | undefined
): SecondaryAccountType[] => {
  const normalized = (accountType || "").trim().toLowerCase();
  const pool: SecondaryAccountType[] = ["checking", "savings", "retirement"];

  if (pool.includes(normalized as SecondaryAccountType)) {
    return pool.filter((t) => t !== normalized) as SecondaryAccountType[];
  }

  // business, personal, empty/unknown -> retirement excluded entirely
  return ["checking", "savings"];
};

const DashboardHome = () => {
  const [hidden, setHidden] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profLoading } = useAccount();
  const openAccount = useOpenAccount();
  const queryClient = useQueryClient();

  const isFrozen = profile?.frozen === true;

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
        supabase.auth.signOut().then(() => {
          window.location.href = "/login";
        });
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
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
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
          t.type === "transfer_in" ||
          t.type === "deposit" ||
          t.type === "refund" ||
          t.type === "loan_disbursement"
        )
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

      const outSum = (data || [])
        .filter((t) =>
          Number(t.amount) < 0 ||
          t.type === "transfer_out" ||
          t.type === "bill_payment" ||
          t.type === "fx"
        )
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

      return { inSum, outSum, net: inSum - outSum };
    },
  });

  const profileReady = !!profile && !profLoading;
  const firstName = (profile as any)?.first_name?.trim() || "";
  const currency = (profile as any)?.currency || null;
  const accountNumber = (profile as any)?.account_number || null;
  const balanceKnown = profile && (profile as any).balance != null;

  // Per-account persisted state, sourced straight from the profile row —
  // this is what makes "opened" and each balance survive a refresh, and
  // never fall back to the default placeholder once opened.
  const checkingOpened = (profile as any)?.checking_opened === true;
  const savingsOpened = (profile as any)?.savings_opened === true;
  const retirementOpened = (profile as any)?.retirement_opened === true;
  const checkingBalance = Number((profile as any)?.checking_balance ?? 0);
  const savingsBalance = Number((profile as any)?.savings_balance ?? 0);
  const retirementBalance = Number((profile as any)?.retirement_balance ?? 0);

  // Primary card balance is the aggregate of the primary account's own
  // balance plus any opened secondary accounts — recalculates automatically
  // whenever any of these change (e.g. an admin funds a secondary account).
  const balanceValue = useMemo(() => {
    const own = balanceKnown ? Number((profile as any).balance) : 0;
    const checkingPart = checkingOpened ? checkingBalance : 0;
    const savingsPart = savingsOpened ? savingsBalance : 0;
    const retirementPart = retirementOpened ? retirementBalance : 0;
    return own + checkingPart + savingsPart + retirementPart;
  }, [
    balanceKnown,
    profile,
    checkingOpened,
    savingsOpened,
    retirementOpened,
    checkingBalance,
    savingsBalance,
    retirementBalance,
  ]);

  // Stable masked account number — only recomputes when accountNumber changes, no flicker
  const maskedAccountNumber = useMemo(() => maskAccountNumber(accountNumber), [accountNumber]);
  const lastFour = useMemo(
    () => (accountNumber ? String(accountNumber).replace(/\D/g, "").slice(-4) : "----"),
    [accountNumber]
  );

  // Which secondary cards to show alongside the primary card, based on the
  // signup account_type. Always 2, never duplicates signup type, never
  // shows business as a secondary card.
  const secondaryAccountTypes = useMemo(
    () => getSecondaryAccountTypes((profile as any)?.account_type),
    [(profile as any)?.account_type]
  );

  const accountStates = useMemo(
    () => ({
      checking: { opened: checkingOpened, balance: checkingBalance },
      savings: { opened: savingsOpened, balance: savingsBalance },
      retirement: { opened: retirementOpened, balance: retirementBalance },
    }),
    [
      checkingOpened,
      checkingBalance,
      savingsOpened,
      savingsBalance,
      retirementOpened,
      retirementBalance,
    ]
  );

  const handleOpenAccount = (type: SecondaryAccountType) => {
    openAccount.mutate(type, {
      onError: () => {
        toast.error("Couldn't open account", {
          description: "Please try again in a moment.",
        });
      },
    });
  };

  const goToWallets = () =>
    isFrozen ? handleFrozenAction() : navigate("/dashboard/wallets");

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
          Your financial overview
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
        {/* data-balance-card: kept as a marker for the balance card */}
        <div className="lg:col-span-2 min-w-0" data-balance-card>
          <AccountCarousel
            secondaryTypes={secondaryAccountTypes}
            accountStates={accountStates}
            onOpenAccount={handleOpenAccount}
            maskedAccountNumber={maskedAccountNumber}
            currency={currency || "USD"}
            formatMoney={formatMoney}
            primarySlide={
              <div
                className={`flex h-full flex-col overflow-hidden rounded-3xl shadow-elev ${cardTheme.surface}`}
              >
                {/* Main content */}
                <div className="flex-1 p-8 pb-6">
                  {/* Header: icon chip + account name/number, eye toggle on the right */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <span
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${cardTheme.iconChip}`}
                      >
                        <Landmark className="h-6 w-6" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-medium capitalize leading-tight">
                          {(profile as any)?.account_type || "Personal"}
                        </p>
                        <p className={`mt-0.5 text-sm ${cardTheme.muted}`}>
                          {!profileReady ? (
                            <Skeleton
                              className={`inline-block h-3 w-20 align-middle ${cardTheme.skeleton}`}
                            />
                          ) : (
                            <>●●●● {lastFour}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={hidden ? "Show balance" : "Hide balance"}
                      onClick={() => setHidden((h) => !h)}
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-smooth ${cardTheme.eyeBtn}`}
                    >
                      {hidden ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {isFrozen && (
                    <span
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: "#ff8503" }}
                    >
                      <ShieldAlert className="h-3 w-3" />
                      Account Frozen
                    </span>
                  )}

                  {/* Balance */}
                  <p className={`mt-8 text-base ${cardTheme.muted}`}>Available balance</p>
                  <div className="mt-1">
                    {!balanceKnown || !currency ? (
                      <Skeleton className={`h-12 w-56 ${cardTheme.skeleton}`} />
                    ) : (
                      <FitAmount
                        variant="hero"
                        text={hidden ? "••••••" : formatMoney(balanceValue, currency)}
                        title={formatMoney(balanceValue, currency)}
                      />
                    )}
                  </div>

                  <div className="mt-8 grid grid-cols-4 gap-3">
                    {quickActions.map((a) => {
                      const Icon = a.icon;
                      const cls = `group flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-smooth ${cardTheme.tile}`;
                      const inner = (
                        <>
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${cardTheme.iconChip}`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="whitespace-nowrap text-xs font-medium">{a.label}</span>
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

                      // Send: choose Local / Digital / Wire / FX first
                      if (a.action === "send") {
                        return (
                          <button
                            key={a.label}
                            type="button"
                            onClick={() => setSendOpen(true)}
                            className={cls}
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

                {/* Currency wallet footer: darker band for separation */}
                <div
                  role="link"
                  tabIndex={0}
                  onClick={goToWallets}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToWallets();
                  }}
                  className={`flex cursor-pointer items-center justify-center gap-2 px-8 py-4 text-sm font-medium transition-colors ${cardTheme.footer}`}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>View currency wallet</span>
                  <motion.span
                    className="flex"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.span>
                </div>
              </div>
            }
          />
        </div>

        <Card className="rounded-3xl border-border/60 p-6 shadow-card">
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
              const raw = card?.card_number || (profile as any)?.card_number;
              const expiry = card?.expiry || (profile as any)?.expiry;
              const cardName = card?.cardholder_name?.trim() || (firstName ? firstName.toUpperCase() : "");
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

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Credit", value: stats?.inSum, icon: ArrowDownLeft, positive: true },
          { label: "Debit", value: stats?.outSum, icon: ArrowUpRight, positive: false },
          { label: "Net", value: stats?.net, icon: TrendingUp, positive: (stats?.net ?? 0) >= 0 },
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
              t.status === "awaiting_code"
                ? "pending"
                : t.status === "rejected"
                ? "processing"
                : t.status;
            return (
              <div key={t.id} className="flex items-center gap-4 py-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${positive ? "bg-success/15 text-success" : "bg-muted text-foreground/70"}`}>
                  {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="break-words text-sm font-medium">
                    {t.description || t.recipient_name || (t.type === "transfer_in" ? "Credit" : t.type === "transfer_out" ? "Debit" : t.type.replace(/_/g, " "))}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {t.type === "transfer_in" ? "Credit" : t.type === "transfer_out" ? "Debit" : t.type.replace(/_/g, " ")} • {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-display text-sm font-bold ${positive ? "text-success" : ""}`}>
                    {positive ? "+" : "−"}
                    {formatMoney(Math.abs(Number(t.amount)), t.currency || currency || "USD")}
                  </p>
                  {/* Stable status badge — inline styles avoid purple background contrast issues */}
                  <p
                    className="text-xs capitalize font-medium"
                    style={{
                      color:
                        displayStatus === "pending" ? "#f59e0b" :
                        displayStatus === "processing" ? "#f59e0b" :
                        displayStatus === "failed" ? "#ef4444" :
                        displayStatus === "completed" ? "#10b981" :
                        "#94a3b8",
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

      <SendChooserModal open={sendOpen} onOpenChange={setSendOpen} />
    </div>
  );
};

export default DashboardHome;
