import { toast } from "sonner";
import { Snowflake } from "lucide-react";

/**
 * The one and only "account unavailable" toast. Use it everywhere (bottom nav, sidebar,
 * dashboard, wallets, route guard) so the copy and look are identical.
 *
 * Only one can show at a time: a fixed toast id makes sonner replace an existing
 * one instead of stacking, and the time guard drops a second call that arrives at the
 * same moment (e.g. a pointer-up and a click both firing for one tap).
 */
let last = 0;

export const FROZEN_MESSAGE = "Your account has been frozen. Please contact support.";

export function showFrozenToast(description: string = FROZEN_MESSAGE) {
  const now = Date.now();
  if (now - last < 1500) return;
  last = now;

  toast("Account unavailable", {
    id: "account-frozen",
    description,
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
