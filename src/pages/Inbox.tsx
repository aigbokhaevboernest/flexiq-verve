import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Bell, Inbox as InboxIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/hooks/useAccount";
import { supabase } from "@/integrations/supabase/client";

type Filter = "all" | "messages" | "activity";

type InboxItem = {
  id: string;
  kind: "message" | "activity";
  title: string;
  body: string;
  at: string;
  direction?: "in" | "out";
  status?: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#f59e0b",
  completed: "#10b981",
  failed: "#ef4444",
};

// Wallet fund requests use their own status words; map them onto the inbox ones.
const depositStatus = (s: string) => {
  const v = String(s || "").toLowerCase();
  if (["approved", "completed", "confirmed", "paid"].includes(v)) return "completed";
  if (["declined", "rejected", "failed", "cancelled"].includes(v)) return "failed";
  return "pending";
};

const activityTitle = (type: string, t?: any) => {
  if (t?.metadata?.wallet_withdraw || type === "wallet_withdraw") return "Wallet withdrawal";
  if (type === "wallet_created") return "Currency wallet added";
  if (type === "wallet_deposit") return "Wallet fund request";
  if (type === "lock") return "Funds locked";
  if (type === "lock_payout") return "Locked funds matured";
  if (type === "lock_break") return "Lock broken early";
  if (type === "transfer_in") return "Money received";
  if (type === "transfer_out") return "Transfer sent";
  if (type === "loan_disbursement") return "Loan disbursed";
  if (type === "deposit") return "Money added";
  return type.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};

const Inbox = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["inbox-notifications", user?.id],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const { data: txs = [], isLoading: txLoading } = useQuery({
    queryKey: ["inbox-transactions", user?.id],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  // Wallet fund requests live in their own table, so load them here too
  const { data: deposits = [], isLoading: depLoading } = useQuery({
    queryKey: ["inbox-wallet-deposits", user?.id],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("wallet_deposit_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const items = useMemo<InboxItem[]>(() => {
    const messages: InboxItem[] = notes.map((n: any) => ({
      id: `n-${n.id}`,
      kind: "message",
      title: n.title,
      body: n.body || "",
      at: n.created_at,
    }));
    const activity: InboxItem[] = txs.map((t: any) => {
      const amt = Number(t.amount);
      const status = t.status === "awaiting_code" ? "pending" : t.status === "rejected" ? "processing" : t.status;
      return {
        id: `t-${t.id}`,
        kind: "activity",
        title: activityTitle(t.type, t),
        body: `${formatMoney(Math.abs(amt), t.currency || "USD")}${t.description ? " · " + t.description : ""}`,
        at: t.created_at,
        direction: amt > 0 ? "in" : "out",
        status,
      };
    });
    const fundRequests: InboxItem[] = deposits.map((d: any) => ({
      id: `d-${d.id}`,
      kind: "activity",
      title: "Wallet fund request",
      body: `${formatMoney(Math.abs(Number(d.amount)), d.wallet_currency || "USD")}${d.crypto ? " · via " + d.crypto : ""}`,
      at: d.created_at,
      direction: "in",
      status: depositStatus(d.status),
    }));
    return [...messages, ...activity, ...fundRequests]
      .filter((i) => filter === "all" || (filter === "messages" ? i.kind === "message" : i.kind === "activity"))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [notes, txs, deposits, filter]);

  const loading = notesLoading || txLoading || depLoading;

  const chip = (value: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(value)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-smooth ${
        filter === value ? "bg-gradient-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/70"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">Messages and account activity in one place.</p>
      </div>

      <div className="flex gap-2">
        {chip("all", "All")}
        {chip("messages", "Messages")}
        {chip("activity", "Activity")}
      </div>

      <Card className="rounded-3xl border-border/60 p-2 shadow-card sm:p-4">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <InboxIcon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-medium">Nothing here yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Transfers, deposits and status updates will show up as they happen.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {items.map((i) => (
              <li key={i.id} className="flex items-start gap-3 p-3 sm:p-4">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    i.kind === "message"
                      ? "bg-primary/10 text-primary"
                      : i.direction === "in"
                      ? "bg-success/15 text-success"
                      : "bg-muted text-foreground/70"
                  }`}
                >
                  {i.kind === "message" ? (
                    <Bell className="h-4 w-4" />
                  ) : i.direction === "in" ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{i.title}</p>
                    {i.status && (
                      <span
                        className="shrink-0 text-xs font-medium capitalize"
                        style={{ color: STATUS_COLOR[i.status] || "#94a3b8" }}
                      >
                        {i.status.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  {i.body && <p className="mt-0.5 break-words text-sm text-muted-foreground">{i.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(i.at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Inbox;
