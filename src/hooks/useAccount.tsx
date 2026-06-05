import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * useAccount — single source of truth for account-like fields.
 * Reads from `profiles` per canonical schema (balance, account_number,
 * currency, frozen, status, kyc_status, card_number, expiry, cvv, ...).
 *
 * localStorage cache is cleared on any realtime update to prevent
 * stale data from overwriting live freeze/block changes.
 */
export const useAccount = () => {
  const { user } = useAuth();
  const cacheKey = user ? `profileCache:${user.id}` : null;

  return useQuery<any>({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    initialData: () => {
      if (!cacheKey) return undefined;
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw);
        // Discard cache if balance or currency was null/missing when saved
        if (parsed?.balance == null || !parsed?.currency) return undefined;
        return parsed;
      } catch {
        return undefined;
      }
    },
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      // Only write to cache if we have a real balance and currency
      if (data && cacheKey && data.balance != null && data.currency) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
      }
      return data;
    },
  });
};

/** Same data as useAccount — kept as alias for old call sites. */
export const useProfile = useAccount;

export const useIsAdmin = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
};

export const useVerification = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["id-verification", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("id_verifications")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

export const formatMoney = (amount: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const currencySymbol = (currency = "USD") => {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
};
