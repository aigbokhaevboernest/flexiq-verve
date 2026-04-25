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
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAccount, useProfile, formatMoney } from "@/hooks/useAccount";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const quickActions = [
  { icon: Send, label: "Send", to: "/dashboard/send" },
  { icon: ArrowDownLeft, label: "Receive", to: "/dashboard/receive" },
  { icon: Receipt, label: "Bills", to: "/dashboard/bills" },
  { icon: Wallet, label: "Loans", to: "/dashboard/loans" },
];

const DashboardHome = () => {
  const [hidden, setHidden] = useState(false);
  const { user } = useAuth();
  const { data: account, isLoading: accLoading } = useAccount();
  const { data: profile } = useProfile();

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

  const { data: card } = useQuery({
    queryKey: ["primary-card", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
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
      const inSum = (data || []).filter((t) => Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount), 0);
      const outSum = (data || []).filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
      return { inSum, outSum, net: inSum - outSum };
    },
  });

  const currency = account?.currency || profile?.currency || "USD";
  const greeting = profile?.first_name ? `Welcome back, ${profile.first_name} 👋` : "Welcome back 👋";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Here's your money today</h1>
      </div>

      <VerificationBanner status={verification?.status} reason={verification?.rejection_reason} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-elev">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70">Available Balance</p>
                <div className="mt-2 flex items-center gap-3">
                  {accLoading ? (
                    <Skeleton className="h-12 w-48 bg-white/20" />
                  ) : (
                    <p className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                      {hidden ? "••••••" : formatMoney(Number(account?.balance ?? 0), currency)}
                    </p>
                  )}
                  <button onClick={() => setHidden((h) => !h)} className="rounded-full bg-white/15 p-2 backdrop-blur transition-smooth hover:bg-white/25">
                    {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm opacity-90">
                  <div>
                    <p className="text-xs opacity-70">Account No.</p>
                    <p className="font-mono">{account?.account_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70">Account type</p>
                    <p className="font-medium">{profile?.account_type || "Personal"} · {currency}</p>
                  </div>
                  {account?.frozen && (
                    <div>
                      <p className="text-xs opacity-70">Status</p>
                      <p className="font-semibold text-warning">Frozen</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <Wifi className="ml-auto h-5 w-5 rotate-90 opacity-90" />
                <p className="mt-12 font-display text-sm font-semibold opacity-90">PLATINUM</p>
              </div>
            </div>

            <div className="relative mt-8 grid grid-cols-4 gap-3">
              {quickActions.map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.label} to={a.to} className="group flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-3 text-center backdrop-blur transition-smooth hover:bg-white/20">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-primary-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
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
              <span>{card?.card_type === "physical" ? "Physical" : "Virtual"} debit</span>
              <CreditCard className="h-4 w-4" />
            </div>
            <p className="mt-6 font-mono text-sm tracking-[0.2em]">
              •••• •••• •••• {card?.card_number?.slice(-4) ?? "————"}
            </p>
            <div className="mt-3 flex justify-between text-xs opacity-90">
              <span>{card?.cardholder_name || "—"}</span>
              <span>{card?.expires_at || "—"}</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">Limit</p>
              <p className="font-display text-sm font-bold">{formatMoney(Number(card?.monthly_limit ?? 0), currency)}</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-display text-sm font-bold">{card?.frozen ? "Frozen" : "Active"}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Money in (30d)", value: stats?.inSum ?? 0, icon: ArrowDownLeft, positive: true },
          { label: "Money out (30d)", value: stats?.outSum ?? 0, icon: ArrowUpRight, positive: false },
          { label: "Net (30d)", value: stats?.net ?? 0, icon: TrendingUp, positive: (stats?.net ?? 0) >= 0 },
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
              <p className={`mt-3 font-display text-2xl font-bold ${s.positive ? "text-success" : "text-foreground"}`}>
                {formatMoney(Math.abs(s.value), currency)}
              </p>
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
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet — your activity will show here.</p>
          )}
          {(txs || []).map((t: any) => {
            const positive = Number(t.amount) > 0;
            return (
              <div key={t.id} className="flex items-center gap-4 py-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${positive ? "bg-success/15 text-success" : "bg-muted text-foreground/70"}`}>
                  {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{t.description || t.recipient_name || t.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t.type.replace(/_/g, " ")} • {new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`font-display text-sm font-bold ${positive ? "text-success" : ""}`}>
                    {positive ? "+" : "−"}{formatMoney(Math.abs(Number(t.amount)), t.currency || currency)}
                  </p>
                  <p className={`text-xs capitalize ${t.status === "pending" || t.status === "awaiting_code" ? "text-warning" : t.status === "rejected" || t.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                    {t.status.replace(/_/g, " ")}
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

const VerificationBanner = ({ status, reason }: { status?: string; reason?: string | null }) => {
  if (status === "approved") {
    return (
      <Link to="/dashboard/verify" className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/5 px-4 py-3 transition-smooth hover:bg-success/10">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15 text-success"><CheckCircle2 className="h-4 w-4" /></span>
        <div className="flex-1 text-sm"><p className="font-semibold">Identity verified by ID.me</p><p className="text-xs text-muted-foreground">All features unlocked</p></div>
      </Link>
    );
  }
  if (status === "pending") {
    return (
      <Link to="/dashboard/verify" className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 transition-smooth hover:bg-warning/10">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning"><Clock className="h-4 w-4" /></span>
        <div className="flex-1 text-sm"><p className="font-semibold">ID.me verification in review</p><p className="text-xs text-muted-foreground">Usually completes within 1–2 business days</p></div>
      </Link>
    );
  }
  if (status === "rejected") {
    return (
      <Link to="/dashboard/verify" className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 transition-smooth hover:bg-destructive/10">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive"><XCircle className="h-4 w-4" /></span>
        <div className="flex-1 text-sm"><p className="font-semibold">Verification rejected — action needed</p><p className="text-xs text-muted-foreground">{reason || "Please resubmit your documents"}</p></div>
      </Link>
    );
  }
  return (
    <Link to="/dashboard/verify" className="group flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-3 transition-smooth hover:from-primary/15 hover:to-accent/15">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white"><ShieldCheck className="h-4 w-4" /></span>
      <div className="flex-1 text-sm">
        <p className="font-semibold">Verify your identity with ID.me</p>
        <p className="text-xs text-muted-foreground">Unlock higher limits and full account access · 3 minutes</p>
      </div>
      <span className="text-xs font-semibold text-primary group-hover:underline">Start →</span>
    </Link>
  );
};

export default DashboardHome;
