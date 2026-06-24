import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * useAccount — single source of truth for account-like fields.
 * Reads from `profiles` per canonical schema (balance, account_number,
 * currency, frozen, status, kyc_status, card_number, expiry, cvv,
 * checking_opened, checking_balance, savings_opened, savings_balance, ...).
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

/**
 * useOpenAccount — marks a secondary account (checking/savings) as opened
 * by writing `{type}_opened = true` to the user's profile row in Supabase.
 * This is the single source of truth for opened-state, so it survives
 * refresh and stays consistent everywhere the profile is read.
 */
export const useOpenAccount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cacheKey = user ? `profileCache:${user.id}` : null;

  return useMutation({
    mutationFn: async (type: "checking" | "savings") => {
      if (!user) throw new Error("Not authenticated");
      const column = type === "checking" ? "checking_opened" : "savings_opened";
      const { data, error } = await (supabase as any)
        .from("profiles")
        .update({ [column]: true })
        .eq("id", user.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (!user) return;
      if (cacheKey) {
        try { localStorage.removeItem(cacheKey); } catch {}
      }
      // Optimistically seed the cache with the fresh row so the UI
      // updates immediately without waiting on a refetch.
      if (data) {
        queryClient.setQueryData(["profile", user.id], data);
      }
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    },
  });
};

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
