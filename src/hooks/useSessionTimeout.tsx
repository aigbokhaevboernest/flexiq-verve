import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const TIMEOUT_MS = 1 * 60 * 1000; // 1 hour
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
const EXEMPT = ["/login", "/signup", "/forgot-password", "/reset-password", "/", "/pin", "/verify"];

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (EXEMPT.includes(pathname)) return;

    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        try { localStorage.clear(); } catch { /* ignore */ }
        try { sessionStorage.clear(); } catch { /* ignore */ }
        navigate("/login", { replace: true });
      }, TIMEOUT_MS);
    };

    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pathname, navigate]);
};
