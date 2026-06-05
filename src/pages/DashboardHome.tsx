import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Eye,
  EyeOff,
  Receipt,
  Send,
  TrendingUp,
  Wallet,
  Wifi,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAccount, formatMoney } from "@/hooks/useAccount";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

const quickActions = [
  { icon: Send, label: "Send", to: "/dashboard/send/wire" },
  { icon: ArrowDownLeft, label: "Receive", to: "/dashboard/receive" },
  { icon: Receipt, label: "Bills", to: "/dashboard/bills", disabled: true },
  { icon: Wallet, label: "Loans", to: "/dashboard/loans" },
];

const DashboardHome = () => {
  const [hidden, setHidden] = useState(false);
  const { user } = useAuth();
  const { data: profile, isLoading: profLoading } = useAccount();
  const queryClient = useQueryClient();

  const isFrozen = profile?.frozen === true;

  const handleFrozenAction = () => {
    toast("Account frozen", {
      description:
        "Your account has been frozen by an administrator. All transactions and features are disabled. Please contact support.",
      duration: 5000,
      style: {
        background: "#ff8503",
        color: "#ffffff",
        border: "none",
      },
      classNames: {
        title: "text-white font-semibold",
        description: "text-white/90",
      },
    });
  };

  // Block check — runs once when loading completes
  useEffect(() => {
    if (profLoading) return;
    if (!profile) return;
    if ((profile as any)?.status === "blocked") {
      toast.error("Account blocked", {
        description:
          "Your account has been blocked by an administrator. Please contact support.",
        duration: 3000,
      });
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          window.location.href = "/login";
        });
      }, 3000);
    }
  }, [profLoading]);

  // Realtime — invalidate query to force fresh fetch
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
    return () => {
      supabase.removeChannel(channel);
    };
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

  const { data: card } = useQuery<any>({
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

  const { data: stats } = useQuery({
    queryKey: ["stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data } = await supabase
        .from("transactions")
        .select("amount,type,status")
        .eq("user_id", user!.id)
        .eq("status", "completed")
        .gte("created_at", since.toISOString());
      const inSum = (data || [])
        .filter((t) => Number(t.amount) > 0)
        .reduce((s, t) => s + Number(t.amount), 0);
      const outSum = (data || [])
        .filter((t) => Number(t.amount) < 0)
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
      return { inSum, outSum, net: inSum - outSum };
    },
  });

  const profileReady = !!profile && !profLoading;
  const firstName = (profile as any)?.first_name?.trim() || "";
  const currency = (profile as any)?.currency || null;
  const accountNumber = (profile as any)?.account_number || null;
  const balanceKnown = profile && (profile as any).balance != null;
  const balanceValue = balanceKnown ? Number((profile as any).balance) : 0;

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

      {/* Frozen banner */}
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
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-elev">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />

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
                    {hidden ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm opacity-90">
                  <div>
                    <p className="text-xs opacity-70">Account No.</p>
                    <p className="font-mono">
                      {accountNumber ||
                        (profileReady ? (
                          "—"
                        ) : (
                          <Skeleton className="inline-block h-3 w-24 bg-white/20 align
