import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Banknote,
  Bell,
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
  Sparkles,
  Sun,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useAccount";
import { ShieldCheck } from "lucide-react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/transactions", label: "Transactions", icon: Receipt },
  { to: "/dashboard/send", label: "Send Money", icon: Send },
  { to: "/dashboard/receive", label: "Receive Money", icon: Wallet },
  { to: "/dashboard/loans", label: "Quick Loans", icon: Banknote },
  { to: "/dashboard/cards", label: "Cards", icon: CreditCard },
  { to: "/dashboard/fx", label: "FX Transfer", icon: Globe2 },
  { to: "/dashboard/local", label: "Local Transfer", icon: Repeat },
  { to: "/dashboard/bills", label: "Bill Payment", icon: Receipt },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
  { to: "/dashboard/support", label: "Support", icon: Headphones },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6 font-display text-xl font-bold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Sparkles className="h-5 w-5" />
        </span>
        Norvex
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
                  isActive
                    ? "bg-gradient-primary text-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          );
        })}
      </nav>
      {isAdmin && (
        <div className="border-t border-sidebar-border p-3">
          <NavLink to="/admin" onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl bg-gradient-coral px-3 py-2.5 text-sm font-semibold text-white shadow-md">
            <ShieldCheck className="h-4 w-4" /> Admin Console
          </NavLink>
        </div>
      )}
      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={async () => {
            onNavigate?.();
            await signOut();
            navigate("/login");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { user } = useAuth();
  const [initials, setInitials] = useState("JD");

  useEffect(() => {
    const saved = localStorage.getItem("norvex-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("first_name,last_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const f = data?.first_name?.[0] ?? user.email?.[0] ?? "";
        const l = data?.last_name?.[0] ?? "";
        setInitials(((f + l) || "U").toUpperCase());
      });
  }, [user]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("norvex-theme", next ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
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
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-coral text-sm font-bold text-white">
              {initials}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
