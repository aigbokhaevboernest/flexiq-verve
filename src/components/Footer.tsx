import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t border-border/60 bg-muted/30">
    <div className="container grid gap-10 py-14 md:grid-cols-4">
      <div className="space-y-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">

          </span>
          Flexiq Verve
        </Link>
        <p className="max-w-xs text-sm text-muted-foreground">
          Banking reimagined. Save, send and grow. all from one place.
        </p>
      </div>
      {[
        { title: "Product", items: ["Accounts", "Transfers", "Cards", "Loans"] },
        { title: "Company", items: ["About", "Careers", "Press", "Contact"] },
        { title: "Legal", items: ["Privacy", "Terms", "Security", "Compliance"] },
      ].map((col) => (
        <div key={col.title}>
          <h4 className="mb-3 font-display font-semibold">{col.title}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {col.items.map((i) => (
              <li key={i}><a href="#" className="hover:text-foreground transition-smooth">{i}</a></li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-border/60 py-6">
      <div className="container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} Flexiq Verve. All rights reserved.</p>
      
      </div>
    </div>
  </footer>
);
