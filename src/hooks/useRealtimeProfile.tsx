import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Subscribe to the current user's profile row. Any change to
 * `frozen` / `status` is pushed into the React Query cache
 * instantly. If status becomes 'blocked', the user is signed
 * out and redirected to /login with a flag so the login page
 * can show a clear error message.
 */
export const useRealtimeProfile = () => {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-rt:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          const next: any = payload.new;
          // Push immediately into the cache so UI updates without a refetch
          qc.setQueryData(["profile", user.id], (prev: any) => ({ ...(prev || {}), ...next }));
          // Persist to localStorage cache so we don't read a stale frozen=false on next mount
          try {
            localStorage.setItem(`profileCache:${user.id}`, JSON.stringify(next));
          } catch {}

          if (next?.status === "blocked") {
            sessionStorage.setItem("flexiq_blocked", "1");
            sessionStorage.removeItem("flexiq_pin_ok");
            await signOut();
            navigate("/login", { replace: true });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc, navigate, signOut]);
};
