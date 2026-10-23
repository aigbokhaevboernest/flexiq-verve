import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const links: { href: string; label: string }[] = [
  { href: "/#features", label: "Features" },
  { href: "/#stats", label: "Why Flexiq?" },
  { href: "/#security", label: "Security" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
  { href: "/terms", label: "Terms" },
  { href: "/policies", label: "Privacy" },


export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const transparent = pathname === "/";

  return (
    <header className={`sticky top-0 z-50 w-full transition-smooth ${transparent ? "bg-background/70 backdrop-blur-xl" : "bg-background"} border-b border-border/60`}>
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center">
          <BrandLogo className="h-9 w-auto object-contain sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild className="bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95">
            <Link to="/signup">Open Account</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="mt-8 flex flex-col gap-5">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-base font-medium">
                  {l.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-3">
                <Button variant="outline" asChild>
                  <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
                </Button>
                <Button asChild className="bg-gradient-primary text-primary-foreground">
                  <Link to="/signup" onClick={() => setOpen(false)}>Open Account</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
