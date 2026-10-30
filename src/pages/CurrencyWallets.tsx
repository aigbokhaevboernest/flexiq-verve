import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, Plus, X, ChevronRight, ArrowLeft, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendEmail } from "@/lib/sendEmail";
import { getBalanceBreakdown } from "@/hooks/useTotalBalance";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Flag,
  PrimaryBadge,
  QUICK_CURRENCIES,
  ISO_CURRENCIES,
  currencyName,
  formatMoney,
} from "@/lib/walletCurrencies";

type WalletRow = { id: string; currency: string; balance: number };
// Full profile row: getBalanceBreakdown needs balance + checking/savings/retirement fields
type ProfileRow = Record<string, any>;

const CurrencyWallets = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  // Step 1: currency picker modal ("quick" grid or the "others" searchable list)
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"quick" | "others">("quick");
  const [query, setQuery] = useState("");
  // Step 2: confirm modal (currency chosen, nothing inserted yet)
  const [pending, setPending] = useState<string | null>(null);
  // Insert errors show inline in the confirm modal (not as a toast)
  const [createError, setCreateError] = useState("");
  useEffect(() => setCreateError(""), [pending]);

  const queryKey = ["currency-wallets", user?.id];

  const { data: wallets = [], isLoading } = useQuery<WalletRow[]>({
    queryKey,
    enabled: !!user,
    staleTime: 60_000,
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

  // Account profile: primary currency + real account balance
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileRow | null>({
    queryKey: ["profile-primary", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data || null) as ProfileRow | null;
    },
  });

  const primary = profile?.currency ? profile.currency.toUpperCase() : null;
  const isPrimary = (c: string) => !!primary && c === primary;

  const addWallet = useMutation({
    mutationFn: async (rawCurrency: string) => {
      // Always store the ISO code uppercase so it matches the /wallets/:currency lookup
      const currency = rawCurrency.toUpperCase();
      const { error } = await (supabase as any)
        .from("currency_wallets")
        .insert({ user_id: user!.id, currency, balance: 0 });
      if (error) throw error;

      // Email is best-effort: never blocks or fails adding the wallet
      try {
        const em = profile?.email || user!.email || "";
        if (em) {
          const primaryAdd = isPrimary(currency);
          await sendEmail({
            email: em,
            first_name: profile?.first_name || "",
            subject: primaryAdd
              ? "You have added your primary currency to wallet — Flexiq Verve"
              : "Currency wallet created — Flexiq Verve",
            message: primaryAdd
              ? `You have added your primary currency to wallet.

Kind Regards,
Flexiq Verve Support Team`
              : `Your ${currency} wallet has been created. You can fund it from Wallets → Fund.

Kind Regards,
Flexiq Verve Support Team`,
          });
        }
      } catch {}
    },
    onSuccess: (_d, currency) => {
      qc.invalidateQueries({ queryKey });
      closeAll();
      toast.success(isPrimary(currency) ? "Primary currency added to wallet" : `${currency} wallet created`);
    },
    onError: (e: any) => setCreateError(e?.message || "Could not create the wallet. Please try again."),
  });

  const closeAll = () => {
    setPending(null);
    setAdding(false);
    setView("quick");
    setQuery("");
  };

  const owned = useMemo(() => wallets.map((w) => w.currency), [wallets]);

  // Primary is pinned on top of the picker (if not owned yet), so keep it out of the other lists
  const pinnedPrimary = primary && !owned.includes(primary) ? primary : null;
  const quick = QUICK_CURRENCIES.filter((c) => !owned.includes(c) && c !== pinnedPrimary);
  const others = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ISO_CURRENCIES.filter((c) => !QUICK_CURRENCIES.includes(c) && !owned.includes(c) && c !== pinnedPrimary)
      .map((c) => ({ code: c, name: currencyName(c) }))
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [owned, pinnedPrimary, query]);

  const loading = !user || isLoading || profileLoading;

  const displayBalance = (w: WalletRow) =>
    isPrimary(w.currency) && profile ? Number(getBalanceBreakdown(profile as any).total ?? 0) : Number(w.balance);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-28">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Currency wallets</h1>
        {!loading && wallets.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add wallet
          </button>
        )}
      </div>

      {loading ? (
        <div className="rounded-3xl bg-card p-8 shadow-elev">
          <Skeleton className="mx-auto h-12 w-12 rounded-2xl" />
          <Skeleton className="mx-auto mt-4 h-5 w-32" />
          <Skeleton className="mx-auto mt-2 h-4 w-56" />
          <Skeleton className="mx-auto mt-5 h-10 w-44 rounded-2xl" />
        </div>
      ) : wallets.length === 0 ? (
        <div className="rounded-3xl bg-card p-8 text-center shadow-elev">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <Wallet className="h-6 w-6" />
          </span>
          <p className="mt-4 font-semibold">No wallets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a currency wallet to hold and receive funds.</p>
          <button
            onClick={() => setAdding(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add new wallet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => navigate(`/dashboard/wallets/${w.currency}`)}
              className="flex w-full items-center justify-between rounded-3xl bg-card p-5 text-left shadow-elev transition-colors hover:bg-muted/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Flag currency={w.currency} className="h-10 w-10" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{w.currency}</p>
                    {isPrimary(w.currency) && <PrimaryBadge />}
                  </div>
                  <p className="mt-1 truncate text-2xl font-bold">{formatMoney(displayBalance(w), w.currency)}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* STEP 1: choose a currency (no insert here) */}
      {adding && !pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeAll}>
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-elev" onClick={(e) => e.stopPropagation()}>
            {view === "quick" ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">Choose a currency</h3>
                  <button onClick={closeAll} className="rounded-full p-1.5 hover:bg-muted" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {pinnedPrimary && (
                  <button
                    onClick={() => setPending(pinnedPrimary)}
                    className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
                  >
                    <Flag currency={pinnedPrimary} className="h-8 w-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{pinnedPrimary}</span>
                      <span className="block truncate text-xs text-muted-foreground">{currencyName(pinnedPrimary)}</span>
                    </span>
                    <PrimaryBadge />
                  </button>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {quick.map((c) => (
                    <button
                      key={c}
                      onClick={() => setPending(c)}
                      className="flex items-center gap-2 rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Flag currency={c} />
                      {c}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setView("others")}
                  className="mt-3 flex w-full items-center justify-between rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Others
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setView("quick");
                      setQuery("");
                    }}
                    className="rounded-full p-1.5 hover:bg-muted"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h3 className="font-display text-lg font-bold">Other currencies</h3>
                </div>

                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or code"
                    autoComplete="off"
                    className="h-12 w-full min-w-0 rounded-2xl border border-input bg-background pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
                  {others.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No currencies found.</p>
                  ) : (
                    others.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => setPending(c.code)}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-muted"
                      >
                        <Flag currency={c.code} className="h-7 w-7" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{c.code}</span>
                          <span className="block truncate text-xs text-muted-foreground">{c.name}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: confirm modal (Cancel / Add). Insert + email happen only on Add */}
      {pending && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !addWallet.isPending && setPending(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-elev animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Flag currency={pending} className="mx-auto h-14 w-14" />
            <h3 className="mt-4 font-display text-lg font-bold">{isPrimary(pending) ? "Add" : "Create"} {pending} wallet?</h3>
            <p className="mt-1 text-sm font-medium">{currencyName(pending)}</p>
            {isPrimary(pending) ? (
              <p className="mt-2 text-sm text-muted-foreground">This is your primary currency. Add to wallet?</p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                You'll be able to hold, receive and fund {pending} from this wallet. We'll email you a confirmation once
                it's created.
              </p>
            )}
            {createError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-left text-sm text-red-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={addWallet.isPending}
                onClick={() => setPending(null)}
                className="rounded-2xl border border-border/60 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addWallet.isPending}
                onClick={() => {
                  setCreateError("");
                  addWallet.mutate(pending);
                }}
                className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {addWallet.isPending
                  ? isPrimary(pending)
                    ? "Adding…"
                    : "Creating…"
                  : isPrimary(pending)
                    ? "Add"
                    : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyWallets;
