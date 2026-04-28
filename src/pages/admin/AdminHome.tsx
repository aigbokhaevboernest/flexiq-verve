import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Wallet, Banknote, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AdminHome = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: userCount }, { data: accounts }, { count: pendingTx }, { count: pendingLoans }, { count: openTickets }, { count: pendingKyc }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("accounts").select("balance,currency"),
        supabase.from("transactions").select("*", { count: "exact", head: true }).eq("status", "awaiting_code"),
        supabase.from("loans").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).in("status", ["open", "pending"]),
        supabase.from("id_verifications").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const totalBalance = (accounts || []).reduce((s, a: any) => s + Number(a.balance), 0);
      return {
        userCount: userCount || 0,
        totalBalance,
        pendingTx: pendingTx || 0,
        pendingLoans: pendingLoans || 0,
        openTickets: openTickets || 0,
        pendingKyc: pendingKyc || 0,
      };
    },
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["admin-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*, profiles!inner(first_name,last_name,email)")
        .order("created_at", { ascending: false })
        .limit(8);
      return data || [];
    },
  });

  const cards = [
    { label: "Total users", value: stats?.userCount ?? 0, icon: Users, to: "/admin/users" },
    { label: "Combined balance", value: `$${(stats?.totalBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: Wallet, to: "/admin/users" },
    { label: "Awaiting authorization", value: stats?.pendingTx ?? 0, icon: AlertCircle, to: "/admin/transactions" },
    { label: "Pending loans", value: stats?.pendingLoans ?? 0, icon: Banknote, to: "/admin/loans" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">System health and pending actions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} to={c.to}>
              <Card className="rounded-3xl border-border/60 p-6 shadow-card transition-smooth hover:shadow-elev hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                </div>
                <p className="mt-3 font-display text-2xl font-bold">{c.value}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Latest activity</h2>
        <div className="mt-4 divide-y divide-border/60">
          {recent.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>}
          {recent.map((t: any) => (
            <div key={t.id} className="flex items-center gap-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-xs font-bold">
                {(t.profiles?.first_name?.[0] || "U") + (t.profiles?.last_name?.[0] || "")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{t.profiles?.first_name} {t.profiles?.last_name} <span className="text-muted-foreground">· {t.profiles?.email}</span></p>
                <p className="text-xs text-muted-foreground capitalize">{t.type.replace(/_/g, " ")} · {t.reference} · <span className="capitalize">{t.status.replace(/_/g, " ")}</span></p>
              </div>
              <p className={`font-display text-sm font-bold ${Number(t.amount) > 0 ? "text-success" : ""}`}>
                {Number(t.amount) > 0 ? "+" : "−"}${Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })} {t.currency}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminHome;
