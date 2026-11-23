import { toast } from "sonner";
import { Snowflake } from "lucide-react";

/**
 * The one and only "account frozen" toast. Use it everywhere (bottom nav, sidebar,
 * dashboard, wallets) so the copy and look are identical.
 *
 * It can only appear once at a time: a fixed toast id makes sonner replace an existing
 * one instead of stacking, and the time guard drops a second call that arrives at the
 * same moment (e.g. a pointer-up and a click both firing for one tap).
 *
 * Save as: src/lib/frozenToast.tsx
 */
let last = 0;

export function showFrozenToast() {
  const now = Date.now();
  if (now - last < 1500) return;
  last = now;

  toast("Account unavailable", {
    id: "account-frozen",
    description: "Your account has been frozen. Please contact support.",
    duration: 5000,
    icon: <Snowflake className="h-4 w-4" style={{ color: "#0B6E99" }} />,
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
