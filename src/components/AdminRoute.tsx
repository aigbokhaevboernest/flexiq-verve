import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAccount";
import { ShieldCheck } from "lucide-react";

export const AdminRoute = () => {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (loading || (user && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <ShieldCheck className="h-5 w-5 animate-pulse text-primary" />
          <span className="text-sm">Verifying admin access…</span>
        </div>
      </div>
    );
  }

  // Not signed in OR signed in but not admin → admin login portal
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};
