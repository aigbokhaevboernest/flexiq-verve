import { MarketingPage } from "@/components/MarketingPage";
import { ShieldCheck, Lock, Eye, Fingerprint, AlertTriangle, KeyRound } from "lucide-react";

const Security = () => (
  <MarketingPage
    eyebrow="Security"
    title="Your money, protected by design"
    intro="Bank-grade security at every layer — from biometric login to real-time fraud monitoring."
    sections={[
      { icon: Lock, title: "256-bit Encryption", desc: "Every byte encrypted at rest and in transit." },
      { icon: Fingerprint, title: "Biometric Login", desc: "Face ID, Touch ID and 4-digit PIN protection." },
      { icon: Eye, title: "24/7 Monitoring", desc: "AI-driven fraud detection on every transaction." },
      { icon: AlertTriangle, title: "Instant Alerts", desc: "Get notified the moment something looks off." },
      { icon: KeyRound, title: "Two-Factor Auth", desc: "Required for all sensitive account changes." },
      { icon: ShieldCheck, title: "FDIC Insured", desc: "Up to $250,000 per depositor through partner banks." },
    ]}
  />
);
export default Security;
