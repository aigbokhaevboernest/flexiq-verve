import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import adminLogo from "@/assets/logo.png";
import {
  Banknote,
  ChevronDown,
  CreditCard,
  Globe2,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Receipt,
  Repeat,
  Search,
  Send,
  Settings,
  Sun,
  Wallet,
  ArrowRightLeft,
  Smartphone,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useTransition } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationsPanel } from "@/components/NotificationsPanel";

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { pathname } = useLocation();

  const sendItems = [
    { to: "/dashboard/send", label: "Digital Payments", icon: Smartphone },
    { to: "/dashboard/send/wire", label: "Wire Transfer", icon: Building2 },
    { to: "/dashboard/send/fx", label: "FX Transfer", icon: ArrowRightLeft },
  ];
  const sendActive = sendItems.some((i) => pathname.startsWith(i.to));
  const [sendOpen, setSendOpen] = useState(sendActive);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
      isActive
        ? "bg-gradient-primary text-primary-foreground shadow-md"
        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    }`;

  const subLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
      isActive
        ? "bg-primary/15 text-primary"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
    }`;

  return (
    <div className="flex h-full flex-col font-sans">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <img src={adminLogo} alt="Flexiq Verve" className="h-12 w-12 object-contain" />
        <span className="font-display text-lg font-bold leading-none">Flexiq<br/>Verve</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavLink to="/dashboard" end onClick={onNavigate} className={linkClass}>
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </NavLink>

        {/* Send Money group */}
        <Collapsible open={sendOpen} onOpenChange={setSendOpen}>
          <CollapsibleTrigger
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
              sendActive ? "text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <Send className="h-4 w-4" /> Send Money
            <ChevronDown className={`ml-auto h-4 w-4 transition-transform duration-300 ${sendOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent
            className="overflow-hidden data-[state=open]:animate-[accordion-down_400ms_cubic-bezier(0.4,0,0.2,1)] data-[state=closed]:animate-[accordion-up_350ms_cubic-bezier(0.4,0,0.2,1)]"
          >
            <div className="ml-3 mt-1 space-y-1 rounded-xl border-l-2 border-primary/60 bg-sidebar-accent/40 py-2 pl-2 pr-1">
              {sendItems.map((s) => (
                <NavLink key={s.to} to={s.to} end onClick={onNavigate} className={subLinkClass}>
                  {({ isActive }) => (
                    <>
                      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${isActive ? "border-primary" : "border-muted-foreground/40"}`}>
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </span>
                      <s.icon className="h-4 w-4" />
                      <span>{s.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <NavLink to="/dashboard/local" onClick={onNavigate} className={linkClass}>
          <Repeat className="h-4 w-4" /> Local Transfer
        </NavLink>
        <NavLink to="/dashboard/receive" onClick={onNavigate} className={linkClass}>
          <Wallet className="h-4 w-4" /> Receive Money
        </NavLink>
        <NavLink to="/dashboard/loans" onClick={onNavigate} className={linkClass}>
          <Banknote className="h-4 w-4" /> Quick Loans
        </NavLink>
        <NavLink to="/dashboard/cards" onClick={onNavigate} className={linkClass}>
          <CreditCard className="h-4 w-4" /> Cards
        </NavLink>
        <NavLink to="/dashboard/transactions" onClick={onNavigate} className={linkClass}>
          <Receipt className="h-4 w-4" /> Transactions
        </NavLink>
        <button
          type="button"
          onClick={() => { onNavigate?.(); toast.error("Feature not available", { description: "Please contact support." }); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-smooth hover:bg-sidebar-accent/50"
        >
          <Receipt className="h-4 w-4" /> Bill Payment
        </button>
        <NavLink to="/dashboard/settings" onClick={onNavigate} className={linkClass}>
          <Settings className="h-4 w-4" /> Settings
        </NavLink>
        <NavLink to="/dashboard/support" onClick={onNavigate} className={linkClass}>
          <Headphones className="h-4 w-4" /> Support
        </NavLink>
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={async () => { onNavigate?.(); await signOut(); navigate("/login"); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
};

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { user } = useAuth();
  const [initials, setInitials] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("flexiq-theme");
    if (saved === "dark") { document.documentElement.classList.add("dark"); setDark(true); }
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("first_name,last_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      const f = data?.first_name?.[0] ?? user.email?.[0] ?? "";
      const l = data?.last_name?.[0] ?? "";
      setInitials(((f + l) || "U").toUpperCase());
    });
  }, [user]);

  // Show a brief skeleton on every route change for perceived feedback
  useEffect(() => {
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 250);
    return () => clearTimeout(t);
  }, [pathname]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("flexiq-theme", next ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-muted/40 font-sans" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search transactions, contacts…" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {dark ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </Button>
            <NotificationsPanel />
            {/* Profile - use button + startTransition to avoid blocking navigation */}
            <button
              type="button"
              aria-label="View profile"
              onClick={() => startTransition(() => navigate("/dashboard/profile"))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-coral text-sm font-bold text-white transition-smooth hover:scale-105 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {initials || <Skeleton className="h-5 w-5 rounded-full bg-white/30" />}
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {routeLoading ? (
            <div className="space-y-4 animate-fade-in">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-40 w-full rounded-3xl" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Skeleton className="h-28 rounded-3xl" />
                <Skeleton className="h-28 rounded-3xl" />
                <Skeleton className="h-28 rounded-3xl" />
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};
