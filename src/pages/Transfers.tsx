import { MarketingPage } from "@/components/MarketingPage";
import { Send, Globe2, Zap, Building2, ArrowLeftRight, Receipt } from "lucide-react";

const Transfers = () => (
  <MarketingPage
    eyebrow="Transfers"
    title="Move money instantly, anywhere in the world"
    intro="Local ACH, SEPA, FX and instant peer-to-peer payments — all at transparent, fair rates."
    sections={[
      { icon: Zap, title: "Instant P2P", desc: "Send to any Flexiq Verve user in under a second." },
      { icon: Send, title: "Local Transfers", desc: "Free ACH and SEPA payments to any bank." },
      { icon: Globe2, title: "International FX", desc: "150+ countries with mid-market rates." },
      { icon: ArrowLeftRight, title: "Recurring Transfers", desc: "Automate rent, savings or payroll on your schedule." },
      { icon: Building2, title: "Wire Transfers", desc: "Same-day domestic and international wires." },
      { icon: Receipt, title: "Request Money", desc: "Send a payment link to anyone, even non-customers." },
    ]}
  />
);
export default Transfers;
