import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@/hooks/useAccount";
import { toast } from "sonner";

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
          : "Your account has been frozen. Please contact support.";
      toast.error("Account unavailable", { description: msg, duration: 5000 });
      navigate("/dashboard", { replace: true });
    }
  }, [isFrozen, isBlocked, status]);

  return isFrozen || isBlocked;
};
