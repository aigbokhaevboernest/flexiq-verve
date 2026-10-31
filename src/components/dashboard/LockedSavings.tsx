import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CodeGate } from "@/components/CodeGate";
import { Flag, formatMoney } from "@/lib/walletCurrencies";
import { getBalanceBreakdown } from "@/hooks/useTotalBalance";

type LockRow = {
  id: string;
  name: string | null;
  amount: number;
  currency: string;
  annual_rate: number;
  duration_days: number;
  maturity_at: string;
  interest_amount: number;
  status: "active" | "paid_out" | "broken";
  penalty_amount: number;
};
type Plan = { duration_days: number; annual_rate: number; label: string };
type WalletRow = { id: string; currency: string; balance: number };

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

const LockedSavings = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [srcKey, setSrcKey] = useState("primary");
  const [planDays, setPlanDays] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [createErr, setCreateErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Detail / early break (break needs the unlock authorization code via CodeGate)
  const [selected, setSelected] = useState<LockRow | null>(null);
  const [confirmBreak, setConfirmBreak] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [breakErr, setBreakErr] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["locks", user?.id] });
    qc.invalidateQueries({ queryKey: ["currency-wallets", user?.id] });
    qc.invalidateQueries({ queryKey: ["profile-primary", user?.id] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recent-tx"] });
  };

  // Pay out any of this user's matured locks as soon as the page opens
  useEffect(() => {
    if (!user) return;
    (supabase as any).rpc("mature_my_locks").then(() => refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const { data: locks = [], isLoading } = useQuery<LockRow[]>({
    queryKey: ["locks", user?.id],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("locked_savings")
        .select("id,name,amount,currency,annual_rate,duration_days,maturity_at,interest_amount,status,penalty_amount")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LockRow[];
    },
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["lock-plans"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("lock_plans")
        .select("duration_days,annual_rate,label")
        .eq("active", true)
        .order("duration_days");
      if (error) throw error;
      return (data || []) as Plan[];
    },
  });

  const { data: wallets = [] } = useQuery<WalletRow[]>({
    queryKey: ["currency-wallets", user?.id],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("currency_wallets")
        .select("id,currency,balance")
        .eq("user_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return (data || []) as WalletRow[];
    },
  });

  const { data: profile } = useQuery<Record<string, any> | null>({
    queryKey: ["profile-primary", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data || null;
    },
  });

  const primaryCur = String(profile?.currency || "").toUpperCase();
  // Sources: dashboard total (main + opened secondary accounts) + every non-primary currency wallet
  const sources = [
    ...(profile && primaryCur
      ? [{ key: "primary", label: `${primaryCur} · account balance`, currency: primaryCur, balance: getBalanceBreakdown(profile).total }]
      : []),
    ...wallets
      .filter((w) => w.currency !== primaryCur)
      .map((w) => ({ key: w.id, label: `${w.currency} wallet`, currency: w.currency, balance: Number(w.balance) })),
  ];
  const src = sources.find((s) => s.key === srcKey) || sources[0];
  const plan = plans.find((p) => p.duration_days === planDays);
  const amt = Number(amount);
  const estInterest = plan && amt > 0 ? (amt * plan.annual_rate * plan.duration_days) / 36500 : 0;

  const onAmountChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const [whole, ...rest] = cleaned.split(".");
    setAmount(rest.length ? `${whole}.${rest.join("")}` : whole);
    setCreateErr("");
  };

  const openCreate = () => {
    setSrcKey("primary");
    setPlanDays(plans[0]?.duration_days ?? null);
    setAmount("");
    setName("");
    setCreateErr("");
    setCreateOpen(true);
  };

  const submitLock = async () => {
    if (!src) return setCreateErr("No account available to lock from.");
    if (!plan) return setCreateErr("Choose a lock period.");
    if (!(amt > 0)) return setCreateErr("Enter a valid amount.");
    if (amt > src.balance + 0.000001) return setCreateErr("Insufficient funds.");
    setBusy(true);
    setCreateErr("");
    const isPrimary = src.key === "primary";
    const { error } = await (supabase as any).rpc("lock_funds", {
      p_amount: amt,
      p_duration_days: plan.duration_days,
      p_source: isPrimary ? "primary" : "wallet",
      p_wallet_id: isPrimary ? null : src.key,
      p_name: name.trim() || null,
    });
    setBusy(false);
    if (error) return setCreateErr(error.message || "Could not lock funds. Please try again.");
    toast.success(`${formatMoney(amt, src.currency)} locked until ${fmtDate(new Date(Date.now() + plan.duration_days * 86_400_000).toISOString())}`);
    setCreateOpen(false);
    refresh();
  };

  const closeDetail = () => {
    setSelected(null);
    setConfirmBreak(false);
    setBreakErr("");
  };

  // Runs only after CodeGate verifies the unlock authorization code
  const onBreakVerified = async () => {
    if (!selected) return;
    try {
      const { error } = await (supabase as any).rpc("break_lock", { p_lock_id: selected.id });
      if (error) throw error;
      toast.success("Lock broken. Principal returned, interest forfeited.");
      closeDetail();
      refresh();
    } catch (e: any) {
      setBreakErr(e?.message || "Could not break the lock. Please try again.");
    } finally {
      setGateOpen(false);
    }
  };

  const active = locks.filter((l) => l.status === "active");
  const history = locks.filter((l) => l.status !== "active");

  const row = (l: LockRow) => (
    <button
      key={l.id}
      type="button"
      onClick={() => setSelected(l)}
      className="flex w-full items-center justify-between rounded-3xl bg-card p-5 text-left shadow-elev transition-colors hover:bg-muted/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Flag currency={l.currency} className="h-10 w-10" />
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {l.name || `${l.duration_days}-day lock`}
          </p>
          <p className="mt-1 truncate text-xl font-bold">{formatMoney(l.amount, l.currency)}</p>
          <p className="text-xs text-muted-foreground">
            {l.status === "active"
              ? `Unlocks ${fmtDate(l.maturity_at)} · ${daysLeft(l.maturity_at)}d left`
              : l.status === "paid_out"
                ? `Matured ${fmtDate(l.maturity_at)}`
                : "Broken early"}
          </p>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          l.status === "active"
            ? "bg-emerald-500/15 text-emerald-600"
            : l.status === "paid_out"
              ? "bg-primary/10 text-primary"
              : "bg-red-500/10 text-red-600"
        }`}
      >
        {l.status === "active" ? "Active" : l.status === "paid_out" ? "Paid out" : "Broken"}
      </span>
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-md space-y-5 pb-28">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Lock funds</h1>
        <button
          onClick={openCreate}
          disabled={!sources.length}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> New lock
        </button>
      </div>

      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-3xl" />
      ) : locks.length === 0 ? (
        <div className="rounded-3xl bg-card p-8 text-center shadow-elev">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <Lock className="h-6 w-6" />
          </span>
          <p className="mt-4 font-semibold">No locked funds yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Lock money for a fixed period and earn interest.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && <div className="space-y-3">{active.map(row)}</div>}
          {history.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">History</p>
              {history.map(row)}
            </div>
          )}
        </>
      )}

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={(o) => !busy && setCreateOpen(o)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto font-sans sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lock funds</DialogTitle>
            <DialogDescription>Locked money can't be spent until the unlock date.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {createErr && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{createErr}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="l-src">Lock from</Label>
              <select
                id="l-src"
                value={src?.key || ""}
                onChange={(e) => {
                  setSrcKey(e.target.value);
                  setCreateErr("");
                }}
                className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {sources.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label} — {formatMoney(s.balance, s.currency)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Lock period</Label>
              <div className="grid grid-cols-2 gap-2">
                {plans.map((p) => (
                  <button
                    key={p.duration_days}
                    type="button"
                    onClick={() => {
                      setPlanDays(p.duration_days);
                      setCreateErr("");
                    }}
                    className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                      planDays === p.duration_days ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{p.duration_days} days</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.annual_rate}% p.a. · {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="l-amt">Amount{src ? ` (${src.currency})` : ""}</Label>
              <Input
                id="l-amt"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                placeholder="0.00"
                className="h-12 rounded-xl px-4 text-base"
              />
              {src && (
                <p className="text-xs text-muted-foreground">
                  Available: {formatMoney(src.balance, src.currency)}
                  {src.key === "primary" ? " (includes your opened accounts)" : ""}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="l-name">
                Goal name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="l-name"
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rent, Emergency"
                className="h-12 rounded-xl px-4 text-base"
              />
            </div>

            {plan && amt > 0 && src && (
              <div className="rounded-2xl bg-muted/50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest at maturity</span>
                  <span className="font-semibold">{formatMoney(estInterest, src.currency)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-semibold">{formatMoney(amt + estInterest, src.currency)}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Funds are locked until{" "}
                  {fmtDate(new Date(Date.now() + plan.duration_days * 86_400_000).toISOString())}. Breaking early
                  forfeits the interest.
                </p>
              </div>
            )}

            <Button onClick={submitLock} disabled={busy} className="h-12 w-full rounded-2xl text-base font-semibold">
              {busy ? "Locking…" : "Confirm lock"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail + early break */}
      <Dialog open={!!selected && !gateOpen} onOpenChange={(o) => !o && closeDetail()}>
        <DialogContent className="font-sans sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name || `${selected.duration_days}-day lock`}</DialogTitle>
                <DialogDescription>
                  {selected.annual_rate}% p.a. · {selected.duration_days} days
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Locked</span>
                  <span className="font-semibold">{formatMoney(selected.amount, selected.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {selected.status === "broken" ? "Interest forfeited" : "Interest at maturity"}
                  </span>
                  <span className="font-semibold">
                    {formatMoney(
                      selected.status === "broken" ? selected.penalty_amount : selected.interest_amount,
                      selected.currency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unlock date</span>
                  <span className="font-semibold">{fmtDate(selected.maturity_at)}</span>
                </div>
                {selected.status === "active" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time left</span>
                    <span className="font-semibold">{daysLeft(selected.maturity_at)} days</span>
                  </div>
                )}
              </div>

              {breakErr && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{breakErr}</span>
                </div>
              )}

              {selected.status === "active" &&
                (confirmBreak ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Breaking early returns your {formatMoney(selected.amount, selected.currency)} but you will lose
                      the {formatMoney(selected.interest_amount, selected.currency)} interest. You'll need your unlock
                      authorization code.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setConfirmBreak(false)}>
                        Keep locked
                      </Button>
                      <Button
                        variant="destructive"
                        className="h-11 rounded-2xl"
                        onClick={() => {
                          setBreakErr("");
                          setGateOpen(true);
                        }}
                      >
                        Break lock
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-2xl"
                    onClick={() => {
                      setBreakErr("");
                      setConfirmBreak(true);
                    }}
                  >
                    Break early
                  </Button>
                ))}
            </>
          )}
        </DialogContent>
      </Dialog>

      <CodeGate open={gateOpen} onOpenChange={setGateOpen} onVerified={onBreakVerified} />
    </div>
  );
};

export default LockedSavings;
