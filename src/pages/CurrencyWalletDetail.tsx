import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Mail, MessageCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Flag, PrimaryBadge, currencyName, formatMoney } from "@/lib/walletCurrencies";

const SUPPORT_EMAIL = "support@flexiqverve.com";

type WalletRow = { id: string; currency: string; balance: number };
type ProfileRow = { currency: string | null; balance: number | null };

const CurrencyWalletDetail = () => {
  const { currency: currencyParam } = useParams<{ currency: string }>();
  const currency = (currencyParam || "").toUpperCase();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // Same query key as CurrencyWallets so the list cache is reused
  const { data: wallets, isLoading } = useQuery<WalletRow[]>({
    queryKey: ["currency-wallets", user?.id],
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

  // Primary currency + real account balance
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileRow | null>({
    queryKey: ["profile-primary-detail", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("currency,balance")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data || null) as ProfileRow | null;
    },
  });

  const loading = !user || isLoading || profileLoading;
  const wallet = wallets?.find((w) => w.currency === currency);
  const isPrimary = !!profile?.currency && profile.currency.toUpperCase() === currency;
  const balance = isPrimary ? Number(profile?.balance ?? 0) : Number(wallet?.balance ?? 0);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 pb-28">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-52 w-full rounded-3xl" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <Dialog open onOpenChange={() => navigate("/dashboard/wallets")}>
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Wallet not found</DialogTitle>
            <DialogDescription>You don't have a {currency || "this"} wallet yet. Add it first.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate("/dashboard/wallets")}>Back to wallets</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 pb-28 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <button
        type="button"
        onClick={() => navigate("/dashboard/wallets")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="rounded-3xl bg-card p-6 text-center shadow-elev">
        <Flag currency={currency} size={80} className="mx-auto h-16 w-16" />
        <div className="mt-3 flex items-center justify-center gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {currency} · {currencyName(currency)}
          </p>
          {isPrimary && <PrimaryBadge />}
        </div>
        <p className="mt-2 text-4xl font-bold">{formatMoney(balance, currency)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPrimary ? "Account balance" : "Available balance"}
        </p>

        {/* Primary currency: Fund only, no Withdraw */}
        <div className={`mt-6 grid gap-3 ${isPrimary ? "grid-cols-1" : "grid-cols-2"}`}>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/wallets/${currency}/deposit`)}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Fund
          </button>
          {!isPrimary && (
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-border/60 px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <ArrowUpRight className="h-4 w-4" /> Withdraw
            </button>
          )}
        </div>
      </div>

      {/* Withdraw placeholder (non-primary only): swap for the real flow later */}
      {!isPrimary && (
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent className="font-sans sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Withdraw {currency}</DialogTitle>
              <DialogDescription>
                Contact support to withdraw from your {currency} wallet. Our team will guide you through the process.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                <Mail className="h-4 w-4" /> {SUPPORT_EMAIL}
              </a>
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm font-medium">
                <MessageCircle className="h-4 w-4" /> Use the Live Chat on your dashboard
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CurrencyWalletDetail;
