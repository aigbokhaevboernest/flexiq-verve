import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import { DashboardLayout } from "./components/DashboardLayout.tsx";
import DashboardHome from "./pages/DashboardHome.tsx";
import { ComingSoon } from "./pages/ComingSoon.tsx";
import Transactions from "./pages/Transactions.tsx";
import SendMoney from "./pages/SendMoney.tsx";
import Cards from "./pages/Cards.tsx";
import FxTransfer from "./pages/FxTransfer.tsx";
import LocalTransfer from "./pages/LocalTransfer.tsx";

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

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="send" element={<SendMoney />} />
                <Route path="receive" element={<ComingSoon title="Receive Money" description="Share your account details or generate a payment link." />} />
                <Route path="loans" element={<ComingSoon title="Quick Loans" description="Borrow up to 5x your monthly deposit." />} />
                <Route path="cards" element={<Cards />} />
                <Route path="fx" element={<FxTransfer />} />
                <Route path="local" element={<LocalTransfer />} />
                <Route path="bills" element={<ComingSoon title="Bill Payment" description="Service unavailable — please contact support." />} />
                <Route path="settings" element={<ComingSoon title="Settings" description="Profile, security and notification preferences." />} />
                <Route path="support" element={<ComingSoon title="Support" description="Live chat, contact form and FAQs." />} />
              </Route>
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
