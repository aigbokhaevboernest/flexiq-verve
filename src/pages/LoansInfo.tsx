import { MarketingPage } from "@/components/MarketingPage";
import { Banknote, Calculator, Clock, ShieldCheck, TrendingDown, Wallet } from "lucide-react";

const LoansInfo = () => (
  <MarketingPage
    eyebrow="Loans"
    title="Personal loans with fair, transparent rates"
    intro="From $1,000 to $50,000 with no hidden fees, instant decisions, and flexible terms."
    sections={[
      { icon: Banknote, title: "Personal Loans", desc: "$1K to $50K from 5.99% APR with terms 12–60 months." },
      { icon: Clock, title: "Instant Decisions", desc: "Apply in 2 minutes and get a decision in seconds." },
      { icon: TrendingDown, title: "Low Fixed Rates", desc: "Lock in your rate for the life of the loan." },
      { icon: Calculator, title: "Soft Credit Check", desc: "See your rate without affecting your credit score." },
      { icon: Wallet, title: "Flexible Repayment", desc: "Pay early any time with zero prepayment penalty." },
      { icon: ShieldCheck, title: "No Hidden Fees", desc: "What you see is what you owe. No origination fees." },
    ]}
  />
);
export default LoansInfo;
