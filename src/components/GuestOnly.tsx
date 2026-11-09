import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SplashScreen } from "@/components/SplashScreen";

/**
 * Layout route for PUBLIC pages (home, login, signup, FAQ, ...).
 *
 * A logged-in user can't stay on these. They go straight to /pin until the PIN
 * is unlocked for this session, and only then to /dashboard. Going directly to
 * the right place (instead of /dashboard -> bounce -> /pin) is what removes the
 * dashboard flash after signup.
 *
 * While the session is still being checked we keep showing the SAME splash used
 * at app start (instead of a grey screen with a spinner), so login/signup never
 * paint under a different loading UI.
 */
export default function GuestOnly() {
  const auth = useAuth() as any;
  const user = auth.user;
  const loading: boolean = auth.loading ?? auth.isLoading ?? false;

  if (loading) {
    return <SplashScreen hold />;
  }

  if (user) {
    const pinOk = sessionStorage.getItem("flexiq_pin_ok") === "1";
    return <Navigate to={pinOk ? "/dashboard" : "/pin"} replace />;
  }
  return <Outlet />;
}
