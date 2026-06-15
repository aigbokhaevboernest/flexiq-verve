import { MarketingPage } from "@/components/MarketingPage";
import { Wallet, Briefcase, PiggyBank, Building2, Users, Shield } from "lucide-react";

const Accounts = () => (
  <MarketingPage
    eyebrow="Accounts"
    title="An account for every way you manage money"
    intro="Personal, business, joint, or savings — open yours in under two minutes. No minimum balance, no monthly fees, no hidden conditions buried in the fine print."
    sections={[
      {
        icon: Wallet,
        title: "Personal Checking",
        desc: "Spend freely with instant transaction alerts, a virtual card the moment you sign up, and a debit card that arrives in days — not weeks.",
      },
      {
        icon: PiggyBank,
        title: "High-Yield Savings",
        desc: "Your idle cash earns 4.5% APY from day one. No cap on how much qualifies, no lock-in period, and interest posts daily.",
      },
      {
        icon: Briefcase,
        title: "Business Accounts",
        desc: "Separate personal and business finances without opening a second bank. Add team members, set spending controls, and export transactions straight to your accounting software.",
      },
      {
        icon: Building2,
        title: "Joint Accounts",
        desc: "Shared visibility, shared access — ideal for couples splitting bills or families managing household expenses together. Either holder can act independently.",
      },
      {
        icon: Users,
        title: "Teen Accounts",
        desc: "Your teen gets a real card with real money. You set the limits and get notified every time it's used. They learn; you stay in control.",
      },
      {
        icon: Shield,
        title: "FDIC Insured to $250,000",
        desc: "Every dollar you deposit is held at FDIC-member partner banks, covered up to the federal limit. Your money is protected before you ever spend a cent.",
      },
    ]}
  />
);

export default Accounts;
