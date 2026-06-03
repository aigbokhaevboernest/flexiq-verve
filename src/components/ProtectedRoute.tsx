import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
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
