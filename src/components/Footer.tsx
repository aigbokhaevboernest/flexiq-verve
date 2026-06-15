import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

const cols: { title: string; items: { label: string; to: string }[] }[] = [
  {
    title: "Product",
    items: [
      { label: "Accounts", to: "/accounts" },
      { label: "Transfers", to: "/transfers" },
      { label: "Cards", to: "/cards-info" },
      { label: "Loans", to: "/loans-info" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", to: "/about" },
      { label: "Service", to: "/services" },
      { label: "Press", to: "/press" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", to: "/policies" },
      { label: "Terms", to: "/terms" },
      { label: "Security", to: "/security" },
      { label: "Compliance", to: "/compliance" },
    ],
  },
  {
    title: "Quick Links",
    items: [
      { label: "FAQ", to: "/faq" },
      { label: "Services", to: "/services" },
      { label: "Login", to: "/login" },
      { label: "Open Account", to: "/signup" },
    ],
  },
];

export const Footer = () => (
  <footer className="bg-navy text-on-dark">
    <div className="container grid gap-10 py-14 md:grid-cols-5">
      <div className="md:col-span-1 space-y-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={adminLogo} alt="Flexiq Verve" style={{ width: 48, height: "auto", display: "block" }} />
          <span className="font-display text-lg font-bold">Flexiq Verve</span>
        </Link>
        <p className="max-w-xs text-sm text-on-dark-muted">
          Banking reimagined. Save, send and grow — all from one place.
        </p>
      </div>
      {cols.map((col) => (
        <div key={col.title}>
          <h4 className="mb-3 font-display font-semibold text-white">{col.title}</h4>
          <ul className="space-y-2 text-sm text-on-dark-muted">
            {col.items.map((i) => (
              <li key={i.label}>
                <Link to={i.to} className="transition-smooth hover:text-white">{i.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-white/10 py-6">
      <div className="container flex flex-col items-center justify-between gap-3 text-xs text-on-dark-muted md:flex-row">
        <p>© {new Date().getFullYear()} Flexiq Verve. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link to="/terms" className="hover:text-white">Terms</Link>
          <Link to="/policies" className="hover:text-white">Privacy</Link>
          <Link to="/faq" className="hover:text-white">FAQ</Link>
        </div>
      </div>
    </div>
  </footer>
);
