import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import Pin from "./pages/Pin.tsx";
import { DashboardLayout } from "./components/DashboardLayout.tsx";
import DashboardHome from "./pages/DashboardHome.tsx";
import { ComingSoon } from "./pages/ComingSoon.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/pin" element={<Pin />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="transactions" element={<ComingSoon title="Transactions" description="Full history with filters by date, type and status." />} />
            <Route path="send" element={<ComingSoon title="Send Money" description="Internal, local and FX transfers." />} />
            <Route path="receive" element={<ComingSoon title="Receive Money" description="Share your account details or generate a payment link." />} />
            <Route path="loans" element={<ComingSoon title="Quick Loans" description="Borrow up to 5x your monthly deposit." />} />
            <Route path="cards" element={<ComingSoon title="Cards" description="Create virtual cards, freeze, and set limits." />} />
            <Route path="fx" element={<ComingSoon title="FX Transfer" description="Send money across borders in 30+ currencies." />} />
            <Route path="local" element={<ComingSoon title="Local Transfer" description="Bank transfers within your country." />} />
            <Route path="bills" element={<ComingSoon title="Bill Payment" description="Service unavailable — please contact support." />} />
            <Route path="settings" element={<ComingSoon title="Settings" description="Profile, security and notification preferences." />} />
            <Route path="support" element={<ComingSoon title="Support" description="Live chat, contact form and FAQs." />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
