import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Wallet, Send, CreditCard, Banknote, Globe2, Smartphone, ShieldCheck, TrendingUp } from "lucide-react";

const items = [
  { icon: Wallet, title: "Personal Accounts", desc: "Checking and savings with 4.5% APY." },
  { icon: Wallet, title: "Business Accounts", desc: "Built for freelancers, startups and SMBs." },
  { icon: Send, title: "Local Transfers", desc: "Instant ACH and SEPA payments." },
  { icon: Globe2, title: "International FX", desc: "Send money to 150+ countries." },
  { icon: CreditCard, title: "Virtual & Physical Cards", desc: "Spend anywhere, freeze instantly." },
  { icon: Banknote, title: "Personal Loans", desc: "From $1K to $50K with fair rates." },
  { icon: Smartphone, title: "Mobile App", desc: "iOS and Android, fully featured." },
  { icon: TrendingUp, title: "Insights", desc: "Real-time spend & cashflow analytics." },
  { icon: ShieldCheck, title: "Identity Verification", desc: "KYC powered by ID.me." },
];

const Inventory = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="container py-16 md:py-24">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Inventory</p>
      <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Everything we offer</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">A complete catalog of Flexiq Verve products and services.</p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elev">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <it.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">{it.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
    <Footer />
  </div>
);
export default Inventory;
