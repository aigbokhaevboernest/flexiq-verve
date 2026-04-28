import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import { DashboardLayout } from "./components/DashboardLayout.tsx";
import { AdminLayout } from "./components/AdminLayout.tsx";
import DashboardHome from "./pages/DashboardHome.tsx";
import Transactions from "./pages/Transactions.tsx";
import SendMoney from "./pages/SendMoney.tsx";
import Cards from "./pages/Cards.tsx";
import FxTransfer from "./pages/FxTransfer.tsx";
import LocalTransfer from "./pages/LocalTransfer.tsx";
import Loans from "./pages/Loans.tsx";
import ReceiveMoney from "./pages/ReceiveMoney.tsx";
import Bills from "./pages/Bills.tsx";
import Settings from "./pages/Settings.tsx";
import Support from "./pages/Support.tsx";
import AdminHome from "./pages/admin/AdminHome.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminTransactions from "./pages/admin/AdminTransactions.tsx";
import AdminLoans from "./pages/admin/AdminLoans.tsx";
import AdminCodes from "./pages/admin/AdminCodes.tsx";
import AdminFx from "./pages/admin/AdminFx.tsx";
import AdminVerifications from "./pages/admin/AdminVerifications.tsx";
import AdminAuditLog from "./pages/admin/AdminAuditLog.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import AdminTickets from "./pages/admin/AdminTickets.tsx";
import Verify from "./pages/Verify.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="send" element={<SendMoney />} />
                <Route path="receive" element={<ReceiveMoney />} />
                <Route path="loans" element={<Loans />} />
                <Route path="cards" element={<Cards />} />
                <Route path="fx" element={<FxTransfer />} />
                <Route path="local" element={<LocalTransfer />} />
                <Route path="bills" element={<Bills />} />
                <Route path="settings" element={<Settings />} />
                <Route path="support" element={<Support />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHome />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="loans" element={<AdminLoans />} />
                <Route path="codes" element={<AdminCodes />} />
                <Route path="fx" element={<AdminFx />} />
                <Route path="verifications" element={<AdminVerifications />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="audit" element={<AdminAuditLog />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
