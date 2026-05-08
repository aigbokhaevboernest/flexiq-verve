import { MarketingPage } from "@/components/MarketingPage";
import { Wallet, Send, CreditCard, Banknote, Globe2, Smartphone, ShieldCheck, TrendingUp, Bell } from "lucide-react";

const Services = () => (
  <MarketingPage
    eyebrow="Services"
    title="Everything Flexiq Verve offers"
    intro="A complete catalog of financial products and services designed to grow with you."
    sections={[
      { icon: Wallet, title: "Personal Accounts", desc: "Checking and savings with 4.5% APY." },
      { icon: Wallet, title: "Business Accounts", desc: "Built for freelancers, startups and SMBs." },
      { icon: Send, title: "Local Transfers", desc: "Instant ACH and SEPA payments." },
      { icon: Globe2, title: "International FX", desc: "Send money to 150+ countries." },
      { icon: CreditCard, title: "Virtual & Physical Cards", desc: "Spend anywhere, freeze instantly." },
      { icon: Banknote, title: "Personal Loans", desc: "From $1K to $50K with fair rates." },
      { icon: Smartphone, title: "Mobile App", desc: "iOS and Android, fully featured." },
      { icon: TrendingUp, title: "Insights", desc: "Real-time spend & cashflow analytics." },
      { icon: Bell, title: "Live Notifications", desc: "Real-time alerts for every transaction." },
      { icon: ShieldCheck, title: "Identity Verification", desc: "KYC powered by ID.me." },
    ]}
  />
);
export default Services;
