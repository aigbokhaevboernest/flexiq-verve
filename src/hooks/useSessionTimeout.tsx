import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// 1 hour of no interaction. (For testing, temporarily use 2 * 60 * 1000.)
const TIMEOUT_MS = 30 * 60 * 1000;
const DEBUG = false; // true = logs "[idle] ..." in the console

// Where an idle user lands.
const LOCK_PATH = "/pin";

// false = LOCK: forget the PIN check and go to /pin; the Supabase session
//         stays, so the user just re-enters their PIN.
// true  = fully SIGN OUT first, then go to /pin.
const SIGN_OUT_ON_TIMEOUT = false;

const PIN_OK_KEY = "flexiq_pin_ok";
const LAST_ACTIVITY_KEY = "flexiq:last-activity";
const FORCE_LOCK_KEY = "flexiq:force-lock";

// Pages where the idle timer does not run.
const EXEMPT = ["/login", "/signup", "/forgot-password", "/reset-password", "/", "/pin", "/verify"];

const AUTH_STORAGE_PATTERNS = [/supabase\.auth/i, /^sb-.*-auth-token$/i, /^sb-.*-code-verifier$/i];
const isAuthStorageKey = (key: string) => AUTH_STORAGE_PATTERNS.some((p) => p.test(key));

const log = (...args: unknown[]) => {
  if (DEBUG) console.log("[idle]", ...args);
};

const clearIdleKeys = () => {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(FORCE_LOCK_KEY);
  } catch {
    /* ignore */
  }
};

const clearAuthStorage = () => {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key) keys.push(key);
      }
      keys.forEach((key) => {
        if (isAuthStorageKey(key)) storage.removeItem(key);
      });
    } catch {
      /* ignore */
    }
  });
};

let locking = false;

async function lockSession(reason: string) {
  if (locking) return;
  locking = true;
  log("locking:", reason);

  try {
    sessionStorage.removeItem(PIN_OK_KEY); // forces the PIN screen
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(FORCE_LOCK_KEY, String(Date.now())); // tells other tabs
  } catch {
    /* ignore */
  }

  if (SIGN_OUT_ON_TIMEOUT) {
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: "global" }),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch {
      /* ignore */
    }
    clearAuthStorage();
  }

  clearIdleKeys();
  window.location.replace(LOCK_PATH);
}

// In-memory clock = source of truth. localStorage only shares activity
// between tabs, so blocked storage can't make a session immortal.
let lastActivity = Date.now();

function useIdleController(enabled: boolean, loading: boolean) {
  useEffect(() => {
    if (loading) return;

    // Not logged in, or on an exempt page: no timer, and no stale timestamp
    // left behind for the next visit.
    if (!enabled) {
      clearIdleKeys();
      lastActivity = Date.now();
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const readStored = (): number | null => {
      try {
        const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      } catch {
        return null;
      }
    };

    const writeStored = (t: number) => {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(t));
      } catch {
        /* ignore */
      }
    };

    const arm = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(check, Math.max(ms, 0));
    };

    // Wall-clock recheck. Never grants free time.
    function check() {
      const stored = readStored();
      const last = Math.max(lastActivity, stored ?? 0); // another tab's activity counts
      lastActivity = last;

      const idleFor = Date.now() - last;
      log(`idle ${Math.round(idleFor / 1000)}s / ${Math.round(TIMEOUT_MS / 1000)}s`);

      if (idleFor >= TIMEOUT_MS) {
        void lockSession("idle timeout");
        return;
      }
      arm(TIMEOUT_MS - idleFor);
    }

    const onActivity = () => {
      const now = Date.now();
      // An expired window can't be revived by a tap (e.g. right after wake).
      if (now - lastActivity >= TIMEOUT_MS) {
        void lockSession("idle timeout (activity after expiry)");
        return;
      }
      lastActivity = now;
      writeStored(now);
      arm(TIMEOUT_MS);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === FORCE_LOCK_KEY && e.newValue) {
        try {
          sessionStorage.removeItem(PIN_OK_KEY);
        } catch {
          /* ignore */
        }
        window.location.replace(LOCK_PATH);
      }
    };

    // Seed the clock.
    const now = Date.now();
    const stored = readStored();
    if (stored != null && now - stored >= TIMEOUT_MS) {
      void lockSession("stale session on load");
      return;
    }
    lastActivity = stored != null ? stored : now;
    if (stored == null) writeStored(now);
    log("armed, timeout =", TIMEOUT_MS / 1000, "s");

    // Discrete user actions ONLY. mousemove / scroll are excluded:
    // layout shifts, tickers and charts fire them with nobody there.
    const events: (keyof WindowEventMap)[] = ["mousedown", "keydown", "touchstart", "click"];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);

    check();
    const heartbeat = setInterval(check, 10000);

    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(heartbeat);
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [enabled, loading]);
}

/**
 * Same call style as before: useSessionTimeout() with no arguments,
 * used inside SessionGuard (needs the Router, not the AuthProvider).
 */
export const useSessionTimeout = () => {
  const { pathname } = useLocation();
  const [auth, setAuth] = useState({ loading: true, loggedIn: false });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setAuth({ loading: false, loggedIn: !!session });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuth({ loading: false, loggedIn: !!session });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const exempt = EXEMPT.includes(pathname);
  useIdleController(auth.loggedIn && !exempt, auth.loading);
};
