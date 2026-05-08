import { MarketingPage } from "@/components/MarketingPage";
import { Heart, Globe2, Trophy, Users, Zap, Sparkles } from "lucide-react";

const About = () => (
  <MarketingPage
    eyebrow="About"
    title="We're rebuilding banking from the ground up"
    intro="Flexiq Verve was founded on a simple idea: people deserve a bank that's fast, fair, and built for the way they actually live."
    sections={[
      { icon: Heart, title: "Our Mission", desc: "Financial freedom for everyone, everywhere." },
      { icon: Sparkles, title: "Our Vision", desc: "A world without banking friction or hidden fees." },
      { icon: Users, title: "1.2M+ Customers", desc: "Trusted by people in over 60 countries." },
      { icon: Globe2, title: "Global Reach", desc: "Licensed and regulated in 12 jurisdictions." },
      { icon: Zap, title: "Built for Speed", desc: "From signup to first payment in under 2 minutes." },
      { icon: Trophy, title: "Award Winning", desc: "Best Digital Bank 2025 — Fintech Awards." },
    ]}
  />
);
export default About;
