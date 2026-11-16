import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Live chat (Chatwoot) visibility:
 *  - public pages                       -> visible
 *  - /login, /signup, /pin, /pending    -> hidden
 *  - /dashboard/support (and sub-paths) -> visible
 *  - every other /dashboard page        -> hidden
 */
const HIDDEN_EXACT = ["/login", "/signup", "/pin", "/pending"];

export const shouldShowChat = (pathname: string) => {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/dashboard/support" || p.startsWith("/dashboard/support/")) return true;
  if (p.startsWith("/dashboard")) return false;
  if (HIDDEN_EXACT.includes(p)) return false;
  return true;
};

export const LiveChat = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const show = shouldShowChat(pathname);

    // CSS class in index.html hides the bubble + window instantly
    document.documentElement.classList.toggle("chat-hidden", !show);

    const apply = () => {
      const cw = (window as any).$chatwoot;
      if (!cw) return;
      if (show) {
        cw.toggleBubbleVisibility?.("show");
      } else {
        cw.toggle?.("close");
        cw.toggleBubbleVisibility?.("hide");
      }
    };

    apply();

    // Chatwoot loads late: apply again as soon as it is ready
    window.addEventListener("chatwoot:ready", apply);
    const timers = [500, 1500, 3500].map((ms) => setTimeout(apply, ms));

    return () => {
      window.removeEventListener("chatwoot:ready", apply);
      timers.forEach(clearTimeout);
    };
  }, [pathname]);

  return null;
};

export default LiveChat;
