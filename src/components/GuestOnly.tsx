import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Layout route for PUBLIC pages (home, login, signup, FAQ, ...).
 *
 * A logged-in user can't stay on these. They go straight to /pin until the PIN
 * is unlocked for this session, and only then to /dashboard. Going directly to
 * the right place (instead of /dashboard -> bounce -> /pin) is what removes the
 * dashboard flash after signup.
 */
export default function GuestOnly() {
  const auth = useAuth() as any;
  const user = auth.user;
  const loading: boolean = auth.loading ?? auth.isLoading ?? false;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    const pinOk = sessionStorage.getItem("flexiq_pin_ok") === "1";
    return <Navigate to={pinOk ? "/dashboard" : "/pin"} replace />;
  }
  return <Outlet />;
}
