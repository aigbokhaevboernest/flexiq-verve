import { MarketingPage } from "@/components/MarketingPage";
import { Wallet, Briefcase, PiggyBank, Building2, Users, Shield } from "lucide-react";

const Accounts = () => (
  <MarketingPage
    eyebrow="Accounts"
    title="Accounts that fit how you live and work"
    intro="Open a personal, business, savings or checking account in seconds — no paperwork, no minimums, no nonsense."
    sections={[
      { icon: Wallet, title: "Personal Checking", desc: "Everyday spending with zero monthly fees and instant notifications." },
      { icon: PiggyBank, title: "High-Yield Savings", desc: "Earn 4.5% APY on every dollar with no caps and no lock-ups." },
      { icon: Briefcase, title: "Business Accounts", desc: "Built for freelancers, startups and SMBs with multi-user access." },
      { icon: Building2, title: "Joint Accounts", desc: "Shared accounts for couples, families and roommates." },
      { icon: Users, title: "Teen Accounts", desc: "Co-managed accounts that teach money skills early." },
      { icon: Shield, title: "FDIC Insured", desc: "Every dollar is insured up to $250,000 by partner banks." },
    ]}
  />
);
export default Accounts;
