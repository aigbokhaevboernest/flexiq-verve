import { toast } from "sonner";
import { Snowflake } from "lucide-react";
import { createElement } from "react";

let lastAt = 0;

/** Single frozen-account toast (deduped ~1.5s). Use everywhere instead of ad-hoc amber toasts. */
export function showFrozenToast() {
  const now = Date.now();
  if (now - lastAt < 1500) return;
  lastAt = now;
  toast("Account unavailable", {
    description: "Your account has been frozen. Please contact support.",
    duration: 5000,
    icon: createElement(Snowflake, { className: "h-5 w-5 text-sky-500" }),
    style: {
      background: "#ffffff",
      color: "#0f172a",
      border: "1.5px solid #A7E8FF",
      boxShadow: "0 8px 24px rgba(167,232,255,0.45)",
    },
    classNames: {
      title: "text-slate-900 font-bold",
      description: "text-slate-600",
    },
  });
}
