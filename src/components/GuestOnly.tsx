import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Layout route for PUBLIC pages (home, login, signup, FAQ, ...).
 *
 * A logged-in user can't stay on these: they are sent to /dashboard with
 * `replace`, so Back / swipe-back never lands on (or oscillates with) a
 * public page. /dashboard's ProtectedRoute then sends them to /pin first if
 * the PIN hasn't been entered yet.
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

  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
