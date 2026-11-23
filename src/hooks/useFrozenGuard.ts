import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@/hooks/useAccount";
import { showFrozenToast, FROZEN_MESSAGE } from "@/lib/frozenToast";

export const useFrozenGuard = () => {
  const { data: profile } = useAccount();
  const navigate = useNavigate();

  const isFrozen = !!profile?.frozen;
  const status = (profile?.status as string) || "active";
  const isBlocked = status === "blocked" || status === "deleted" || status === "frozen";

  useEffect(() => {
    if (isFrozen || isBlocked) {
      const msg =
        status === "deleted"
          ? "Your account has been removed. Please contact support."
          : status === "blocked"
          ? "Your account has been blocked. Please contact support."
          : FROZEN_MESSAGE;
      showFrozenToast(msg);
      navigate("/dashboard", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFrozen, isBlocked, status]);

  return isFrozen || isBlocked;
};
