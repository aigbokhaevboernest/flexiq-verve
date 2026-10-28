import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, Plus, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendEmail } from "@/lib/sendEmail";
import { Skeleton } from "@/components/ui/skeleton";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY"];

const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  JPY: "Japanese Yen",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
};

// ISO currency -> flag country code (EUR uses the EU flag)
const FLAG_CODES: Record<string, string> = {
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  CAD: "ca",
  AUD: "au",
  JPY: "jp",
  CHF: "ch",
  CNY: "cn",
};

const Flag = ({ currency, className = "h-5 w-5" }: { currency: string; className?: string }) => (
  <img
    src={`https://flagcdn.com/w40/${FLAG_CODES[currency] ?? "un"}.png`}
    alt={`${currency} flag`}
    loading="lazy"
    className={`${className} shrink-0 rounded-full object-cover ring-1 ring-border`}
  />
);

type WalletRow = { id: string; currency: string; balance: number };

const CurrencyWallets = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  // Step 1: currency picker modal
  const [adding, setAdding] = useState(false);
  // Step 2: confirm modal (currency chosen, nothing inserted yet)
  const [pending, setPending] = useState<string | null>(null);

  const queryKey = ["currency-wallets", user?.id];

  const { data: wallets = [], isLoading } = useQuery<WalletRow[]>({
    queryKey,
    enabled: !!user,
    staleTime: 60_000, // revisits show instantly from cache
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

  const addWallet = useMutation({
    mutationFn: async (currency: string) => {
      const { error } = await (supabase as any)
        .from("currency_wallets")
        .insert({ user_id: user!.id, currency, balance: 0 });
      if (error) throw error;

      // Email is best-effort: never blocks or fails the wallet creation
      try {
        const { data: prof } = await (supabase as any)
          .from("profiles")
          .select("first_name,email")
          .eq("id", user!.id)
          .maybeSingle();
        const em = prof?.email || user!.email || "";
        if (em) {
          await sendEmail({
            email: em,
            first_name: prof?.first_name || "",
            subject: "Currency wallet created — Flexiq Verve",
            message: `Your ${currency} wallet has been created. You can fund it from Wallets → Add funds.

Kind Regards,
Flexiq Verve Support Team`,
          });
        }
      } catch {}
    },
    onSuccess: (_d, currency) => {
      qc.invalidateQueries({ queryKey });
      setPending(null);
      setAdding(false);
      toast.success(`${currency} wallet created`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const owned = wallets.map((w) => w.currency);
  const available = CURRENCIES.filter((c) => !owned.includes(c));
  const loading = !user || isLoading;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 pb-28">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold">Currency wallets</h1>
        {!loading && wallets.length > 0 && available.length > 0 && (
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
          <p className="mt-1 text-sm text-muted-foreground">
            Add a currency wallet to hold and receive funds.
          </p>
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
              <div className="flex items-center gap-3">
                <Flag currency={w.currency} className="h-10 w-10" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{w.currency}</p>
                  <p className="mt-1 text-2xl font-bold">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: w.currency }).format(w.balance)}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      {/* STEP 1: choose a currency (no insert here) */}
      {adding && !pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAdding(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-elev" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Choose a currency</h3>
              <button onClick={() => setAdding(false)} className="rounded-full p-1.5 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {available.map((c) => (
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
          </div>
        </div>
      )}

      {/* STEP 2: confirm modal (Cancel / Create). Insert + email happen only on Create */}
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
            <h3 className="mt-4 font-display text-lg font-bold">Create {pending} wallet?</h3>
            <p className="mt-1 text-sm font-medium">{CURRENCY_NAMES[pending]}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You'll be able to hold, receive and fund {pending} from this wallet. We'll email you a confirmation once it's created.
            </p>
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
                onClick={() => addWallet.mutate(pending)}
                className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {addWallet.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyWallets;
