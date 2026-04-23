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

const quickActions = [
  { icon: Send, label: "Send", tone: "bg-gradient-primary" },
  { icon: ArrowDownLeft, label: "Receive", tone: "bg-gradient-mint" },
  { icon: Receipt, label: "Pay Bills", tone: "bg-gradient-coral" },
  { icon: Wallet, label: "Request", tone: "bg-primary/10 text-primary" },
];

const stats = [
  { label: "Total deposits", value: "$48,210.00", change: "+8.2%", up: true, icon: ArrowDownLeft },
  { label: "Total transfers", value: "$23,580.00", change: "+3.1%", up: true, icon: ArrowUpRight },
  { label: "Monthly spending", value: "$4,820.00", change: "−2.4%", up: false, icon: TrendingUp },
];

const transactions = [
  { name: "Spotify Premium", date: "Today, 09:42", amount: -10.99, type: "Subscription", status: "Completed" },
  { name: "Maya Patel", date: "Today, 08:15", amount: -120.0, type: "Transfer", status: "Completed" },
  { name: "Salary — Acme Inc.", date: "Yesterday", amount: 4200.0, type: "Deposit", status: "Completed" },
  { name: "Whole Foods", date: "Yesterday", amount: -82.43, type: "Card", status: "Completed" },
  { name: "Refund — Amazon", date: "Apr 21", amount: 39.99, type: "Refund", status: "Pending" },
  { name: "Local transfer — D. Lee", date: "Apr 20", amount: -560.0, type: "Transfer", status: "Completed" },
];

const DashboardHome = () => {
  const [hidden, setHidden] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Good morning, Jane 👋</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Here's your money today</h1>
      </div>

      {/* Top: balance card + quick actions */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 text-primary-foreground shadow-elev">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-70">Available Balance</p>
                <div className="mt-2 flex items-center gap-3">
                  <p className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                    {hidden ? "••••••" : "$24,891.50"}
                  </p>
                  <button onClick={() => setHidden((h) => !h)} className="rounded-full bg-white/15 p-2 backdrop-blur transition-smooth hover:bg-white/25">
                    {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm opacity-90">
                  <div>
                    <p className="text-xs opacity-70">Account No.</p>
                    <p className="font-mono">**** 7821 4829</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-70">Account type</p>
                    <p className="font-medium">Personal • Checking</p>
                  </div>
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
                  <button key={a.label} className="group flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-3 text-center backdrop-blur transition-smooth hover:bg-white/20">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-primary-foreground`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side card */}
        <Card className="rounded-3xl border-border/60 p-6 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Your card</p>
            <Button variant="ghost" size="sm" className="h-8 text-xs">Manage</Button>
          </div>
          <div className="mt-4 rounded-2xl bg-gradient-coral p-5 text-white">
            <div className="flex items-center justify-between text-xs opacity-90">
              <span>Virtual debit</span>
              <CreditCard className="h-4 w-4" />
            </div>
            <p className="mt-6 font-mono text-sm tracking-[0.2em]">•••• •••• •••• 4829</p>
            <div className="mt-3 flex justify-between text-xs opacity-90">
              <span>Jane Doe</span>
              <span>12/29</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">Limit</p>
              <p className="font-display text-sm font-bold">$10,000</p>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="font-display text-sm font-bold">$2,140</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="rounded-3xl border-border/60 p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
              <p className={`mt-1 text-xs font-medium ${s.up ? "text-success" : "text-destructive"}`}>
                {s.change} vs last month
              </p>
            </Card>
          );
        })}
      </div>

      {/* Recent activity */}
      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          <Button variant="ghost" size="sm">View all</Button>
        </div>
        <div className="mt-4 divide-y divide-border/60">
          {transactions.map((t) => {
            const positive = t.amount > 0;
            return (
              <div key={t.name + t.date} className="flex items-center gap-4 py-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${positive ? "bg-success/15 text-success" : "bg-muted text-foreground/70"}`}>
                  {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.type} • {t.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-display text-sm font-bold ${positive ? "text-success" : ""}`}>
                    {positive ? "+" : "−"}${Math.abs(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xs ${t.status === "Pending" ? "text-warning" : "text-muted-foreground"}`}>{t.status}</p>
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
