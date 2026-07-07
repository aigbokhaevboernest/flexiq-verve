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
import Transactions from "./pages/Transactions.tsx";
import SendMoney from "./pages/SendMoney.tsx";
import Cards from "./pages/Cards.tsx";
import FxTransfer from "./pages/FxTransfer.tsx";
import LocalTransfer from "./pages/LocalTransfer.tsx";
import Loans from "./pages/Loans.tsx";
import ReceiveMoney from "./pages/ReceiveMoney.tsx";
import Bills from "./pages/Bills.tsx";
import Settings from "./pages/Settings.tsx";
import Profile from "./pages/Profile.tsx";
import Support from "./pages/Support.tsx";
import Verify from "./pages/Verify.tsx";
import FAQ from "./pages/FAQ.tsx";
import Terms from "./pages/Terms.tsx";
import Policies from "./pages/Policies.tsx";
import Services from "./pages/Services.tsx";
import Accounts from "./pages/Accounts.tsx";
import Transfers from "./pages/Transfers.tsx";
import CardsInfo from "./pages/CardsInfo.tsx";
import LoansInfo from "./pages/LoansInfo.tsx";
import About from "./pages/About.tsx";
import Press from "./pages/Press.tsx";
import Contact from "./pages/Contact.tsx";
import Security from "./pages/Security.tsx";
import Compliance from "./pages/Compliance.tsx";
import Pin from "./pages/Pin.tsx";
import Pending from "./pages/Pending.tsx";
import Success from "./pages/Success.tsx";
import WireTransfer from "./pages/WireTransfer.tsx";
import { SplashScreen } from "./components/SplashScreen";
import { useSessionTimeout } from "./hooks/useSessionTimeout";

const queryClient = new QueryClient();

const SessionGuard = ({ children }: { children: React.ReactNode }) => {
  useSessionTimeout();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SplashScreen />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SessionGuard>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/services" element={<Services />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/cards-info" element={<CardsInfo />} />
            <Route path="/loans-info" element={<LoansInfo />} />
            <Route path="/about" element={<About />} />
            <Route path="/press" element={<Press />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/security" element={<Security />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/pin" element={<Pin />} />
            <Route path="/pending" element={<Pending />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="send" element={<SendMoney />} />
                <Route path="send/international" element={<FxTransfer />} />
                <Route path="send/wire" element={<WireTransfer />} />
                <Route path="send/fx" element={<FxTransfer />} />
                <Route path="receive" element={<ReceiveMoney />} />
                <Route path="loans" element={<Loans />} />
                <Route path="cards" element={<Cards />} />
                <Route path="fx" element={<FxTransfer />} />
                <Route path="local" element={<LocalTransfer />} />
                <Route path="bills" element={<Bills />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="support" element={<Support />} />
                <Route path="success" element={<Success />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          </SessionGuard>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
