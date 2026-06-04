import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useProfile } from "@/hooks/useAccount";
import { toast } from "sonner";

export const useFrozenGuard = () => {
  const { data: account } = useAccount();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const isFrozen = !!account?.frozen;

  useEffect(() => {
    if (isFrozen) {
      toast.error("Account frozen", {
        description:
          "Your account has been frozen. Please contact support.",
        duration: 5000,
      });
      navigate("/dashboard", { replace: true });
    }
  }, [isFrozen]);

  return isFrozen;
};
