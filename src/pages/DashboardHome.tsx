import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  WalletCards,
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
  action?: "send";
  allowWhenFrozen?: boolean;
}> = [
  { icon: Send, label: "Send", to: "/dashboard/send", action: "send" },
  { icon: Wallet, label: "Add money", to: "/dashboard/receive", allowWhenFrozen: true },
  { icon: FileText, label: "Bills", to: "/dashboard/bills", disabled: true },
  { icon: Banknote, label: "Loans", to: "/dashboard/loans" },
];

const cardTheme = {
  surface: "bg-[#3d76ca] text-white border border-white/10",
  muted: "text-white/70",
  eyeBtn: "border border-white/30 hover:bg-white/15",
  tile: "bg-white/15 hover:bg-white/20",
  iconChip: "bg-white/20 text-white",
  skeleton: "bg-white/25",
  footer:
    "bg-[#2f62b3] border-t border-white/15 hover:bg-[#2a58a3]",
};

const maskAccountNumber = (raw?: string | null): string => {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return raw;
  const last4 = digits.slice(-4);
  const hiddenCount = digits.length - 4;
  const maskedBlocks = "•".repeat(hiddenCount).match(/.{1,4}/g) || [];
  return [...maskedBlocks, last4].join(" ");
};

const getSecondaryAccountTypes = (
  accountType: string | null | undefined
): SecondaryAccountType[] => {
  const normalized = (accountType || "").trim().toLowerCase();
  const pool: SecondaryAccountType[] = ["checking", "savings", "retirement"];

  if (pool.includes(normalized as SecondaryAccountType)) {
    return pool.filter((t) => t !== normalized) as SecondaryAccountType[];
  }

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
    toast("Account unavailable", {
      description: "Your account has been frozen. Please contact support.",
      duration: 5000,
      icon: "❄️",
      style: {
        background: "#ffffff",
        color: "#0f172a",
        border: "1.5px solid #3b82f6",
        boxShadow: "0 8px 24px rgba(59,130,246,0.12)",
      },
      classNames: {
        title: "text-slate-900 font-bold",
        description: "text-slate-600",
      },
    });
  };

  useEffect(() => {
    if (profLoading) return;
    if (!profile) return;
    if ((profile as any)?.status === "blocked") {
      toast.error("Account blocked", {
        description: "Your account has been blocked. Please contact support.",
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

  const checkingOpened = (profile as any)?.checking_opened === true;
  const savingsOpened = (profile as any)?.savings_opened === true;
  const retirementOpened = (profile as any)?.retirement_opened === true;
  const checkingBalance = Number((profile as any)?.checking_balance ?? 0);
  const savingsBalance = Number((profile as any)?.savings_balance ?? 0);
  const retirementBalance = Number((profile as any)?.retirement_balance ?? 0);

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

  const maskedAccountNumber = useMemo(() => maskAccountNumber(accountNumber), [accountNumber]);
  const lastFour = useMemo(
    () => (accountNumber ? String(accountNumber).replace(/\D/g, "").slice(-4) : "----"),
    [accountNumber]
  );

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
        <div className="flex items-center gap-3 rounded-2xl border border-blue-500/40 bg-white px-5 py-4 shadow-sm dark:bg-card">
          <span className="text-xl leading-none" aria-hidden>❄️</span>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-foreground">
              Account Frozen
            </p>
            <p className="text-xs text-slate-600 dark:text-muted-foreground">
              Your account has been frozen. Please contact support.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
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
                <div className="min-h-0 flex-1 p-6 pb-4 sm:p-8 sm:pb-6">
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

                  <p className={`mt-6 text-base sm:mt-8 ${cardTheme.muted}`}>Available balance</p>
                  <div className="mt-1 flex h-14 items-center overflow-hidden tabular-nums">
                    {!balanceKnown || !currency ? (
                      <Skeleton className={`h-10 w-56 ${cardTheme.skeleton}`} />
                    ) : (
                      <div className="w-full min-w-0">
                        <FitAmount
                          variant="hero"
                          text={hidden ? "••••••" : formatMoney(balanceValue, currency)}
                          title={formatMoney(balanceValue, currency)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 mb-3 grid grid-cols-4 gap-3 sm:mt-8 sm:mb-4">
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

                      if (isFrozen && a.allowWhenFrozen) {
                        return (
                          <Link key={a.label} to={a.to} className={cls + " opacity-50"}>
                            {inner}
                          </Link>
                        );
                      }

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

                <div
                  role="link"
                  tabIndex={0}
                  onClick={goToWallets}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") goToWallets();
                  }}
                  className={`flex h-14 shrink-0 cursor-pointer items-center justify-center gap-2 px-8 text-sm font-medium leading-none transition-colors ${cardTheme.footer}`}
                >
                  <WalletCards className="h-4 w-4 shrink-0" />
                  <span>View currency wallet</span>
                  <motion.span
                    className="flex shrink-0"
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

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Quick stats</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Money in</span>
                <span className="font-semibold text-emerald-600">
                  {statsLoading || !currency ? "—" : formatMoney(stats?.inSum || 0, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Money out</span>
                <span className="font-semibold text-rose-600">
                  {statsLoading || !currency ? "—" : formatMoney(stats?.outSum || 0, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                <span className="text-muted-foreground">Net</span>
                <span className="font-semibold">
                  {statsLoading || !currency ? "—" : formatMoney(stats?.net || 0, currency)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-border/60 p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Recent activity</p>
              <Link to="/dashboard/transactions" className="text-xs font-medium text-primary">
                See all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {!txs || txs.length === 0 ? (
                <EmptyState title="No recent activity" description="Your transfers will show up here." />
              ) : (
                txs.slice(0, 5).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.recipient_name || t.description || t.type}</p>
                      <p className="text-xs text-muted-foreground">{t.status}</p>
                    </div>
                    <span className={`shrink-0 font-semibold ${Number(t.amount) >= 0 ? "text-emerald-600" : ""}`}>
                      {currency ? formatMoney(Number(t.amount), t.currency || currency) : "—"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <SendChooserModal open={sendOpen} onOpenChange={setSendOpen} />
    </div>
  );
};

export default DashboardHome;
