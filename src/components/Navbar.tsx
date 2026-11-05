import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
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
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#18223E] transition-smooth">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center" onClick={() => setOpen(false)}>
          <BrandLogo className="h-9 w-auto object-contain sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-white/70 transition-smooth hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            variant="ghost"
            asChild
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/login">Login</Link>
          </Button>
          <Button
            asChild
            className="bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95"
          >
            <Link to="/signup">Open Account</Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="h-12 w-12 text-white hover:bg-white/10 hover:text-white lg:hidden"
        >
          {open ? <X className="!h-8 !w-8" /> : <Menu className="!h-8 !w-8" />}
        </Button>
      </div>

      {/* Dim backdrop under the header; tap to close */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-x-0 bottom-0 top-20 bg-black/40 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Dropdown panel: clipped at the header's bottom edge so it slides out from under it */}
      <div
        className={`absolute inset-x-0 top-full overflow-hidden lg:hidden ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <div
          className={`border-b border-white/10 bg-[#18223E] px-6 pb-6 pt-2 text-white shadow-xl transition-transform duration-500 ease-in-out ${
            open ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <nav className="flex flex-col">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/10 py-4 text-base font-medium uppercase tracking-wide text-white/90 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              asChild
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/login" onClick={() => setOpen(false)}>
                Login
              </Link>
            </Button>
            <Button asChild className="bg-gradient-primary text-primary-foreground">
              <Link to="/signup" onClick={() => setOpen(false)}>
                Open Account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
