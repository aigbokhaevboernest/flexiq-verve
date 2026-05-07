import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ShieldCheck, Users, Receipt, Banknote, KeyRound, Globe2, Menu, LogOut, ArrowLeft, Sparkles, BadgeCheck, ScrollText, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import adminLogo from "@/assets/logo.png";

const nav = [
  { to: "/admin", label: "Overview", icon: ShieldCheck, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/loans", label: "Loans", icon: Banknote },
  { to: "/admin/codes", label: "Auth Codes", icon: KeyRound },
  { to: "/admin/fx", label: "FX Rates", icon: Globe2 },
  { to: "/admin/verifications", label: "ID Verifications", icon: BadgeCheck },
  { to: "/admin/tickets", label: "Support Tickets", icon: MessageSquare },
  { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6 font-display text-xl font-bold">
        <img
          src={adminLogo}
          alt="Admin Logo"
          style={{ width: "40px", height: "auto", display: "block", margin: 0, padding: 0 }}
        />
        Admin
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
                  isActive ? "bg-gradient-primary text-primary-foreground shadow-md"
                           : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}>
              <Icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          );
        })}
        <div className="my-2 h-px bg-sidebar-border" />
        <NavLink to="/dashboard" onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent">
          <ArrowLeft className="h-4 w-4" /> Back to user dashboard
        </NavLink>
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button onClick={async () => { onNavigate?.(); await signOut(); navigate("/login"); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
};

export const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold">Flexiq Verve Admin Console</span>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
