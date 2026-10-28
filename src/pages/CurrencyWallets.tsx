import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "NGN"];

type WalletRow = { id: string; currency: string; balance: number };

const CurrencyWallets = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);

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
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setAdding(false);
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
            <div key={w.id} className="flex items-center justify-between rounded-3xl bg-card p-5 shadow-elev">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{w.currency}</p>
                <p className="mt-1 text-2xl font-bold">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: w.currency }).format(w.balance)}
                </p>
              </div>
              <button
                onClick={() => navigate(`/dashboard/wallets/${w.currency}/deposit`)}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Add funds
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
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
                  disabled={addWallet.isPending}
                  onClick={() => addWallet.mutate(c)}
                  className="rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyWallets;
