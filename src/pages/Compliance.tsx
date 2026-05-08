import { MarketingPage } from "@/components/MarketingPage";
import { ScrollText, Scale, Globe2, FileCheck, Building2, ShieldCheck } from "lucide-react";

const Compliance = () => (
  <MarketingPage
    eyebrow="Compliance"
    title="Regulated, audited, and accountable"
    intro="Flexiq Verve operates under the strictest financial regulations in every market we serve."
    sections={[
      { icon: Scale, title: "Licensed & Regulated", desc: "Authorized in 12 jurisdictions including US, UK and EU." },
      { icon: ScrollText, title: "AML & KYC", desc: "Industry-leading anti-money laundering procedures." },
      { icon: FileCheck, title: "SOC 2 Type II", desc: "Annually audited for security, availability and privacy." },
      { icon: Globe2, title: "GDPR Compliant", desc: "Full compliance with global data privacy regulations." },
      { icon: Building2, title: "Partner Banks", desc: "Funds held with FDIC-insured partner institutions." },
      { icon: ShieldCheck, title: "PCI-DSS Level 1", desc: "Highest level of payment card industry compliance." },
    ]}
  />
);
export default Compliance;
