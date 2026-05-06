import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles } from "lucide-react";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles className="h-5 w-5 animate-pulse text-primary" />
          <span className="text-sm">Loading your account…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Require PIN unlock for this session before reaching the dashboard
  const pinOk = sessionStorage.getItem("flexiq_pin_ok") === "1";
  if (!pinOk && location.pathname !== "/pin") {
    return <Navigate to="/pin" replace />;
  }

  return <Outlet />;
};
