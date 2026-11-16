import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Live chat (Tidio) visibility:
 *  - public pages            -> visible
 *  - /dashboard/support(/*)  -> visible (bottom nav hidden there)
 *  - every other /dashboard, /pin, /pending -> hidden
 */
export const shouldShowChat = (pathname: string) => {
  if (pathname === "/dashboard/support" || pathname.startsWith("/dashboard/support/")) return true;
  if (pathname.startsWith("/dashboard") || pathname === "/pin" || pathname === "/pending") return false;
  return true;
};

export const LiveChat = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const show = shouldShowChat(pathname);
    const root = document.documentElement;
    root.classList.toggle("chat-hidden", !show);
    root.classList.toggle("no-bottom-nav", pathname.startsWith("/dashboard/support"));

    const apply = () => {
      const api = (window as any).tidioChatApi;
      if (!api) return;
      if (show) api.show();
      else {
        api.close?.();
        api.hide();
      }
    };

    apply();
    // If Tidio isn't loaded yet, apply as soon as it is
    document.addEventListener("tidioChat-ready", apply);
    return () => document.removeEventListener("tidioChat-ready", apply);
  }, [pathname]);

  return null;
};

export default LiveChat;
