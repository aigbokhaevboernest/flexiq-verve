import { MarketingPage } from "@/components/MarketingPage";
import { Heart, Globe2, Trophy, Users, Zap, Sparkles } from "lucide-react";

const About = () => (
  <MarketingPage
    eyebrow="About Us"
    title="Redefining the future of digital banking"
    intro="At Flexiq Verve, we believe banking should be simple, secure, and accessible to everyone. We're building a financial platform that removes barriers, empowers people, and helps businesses move money with confidence."
    sections={[
      {
        icon: Heart,
        title: "Our Mission",
        desc: "To make modern financial services faster, fairer, and available to everyone, everywhere.",
      },
      {
        icon: Sparkles,
        title: "Our Vision",
        desc: "To create a world where managing and moving money is effortless, transparent, and borderless.",
      },
      {
        icon: Users,
        title: "Trusted Worldwide",
        desc: "Serving over 1.2 million customers across more than 60 countries.",
      },
      {
        icon: Globe2,
        title: "Global Presence",
        desc: "Connecting people and businesses through a secure international financial network.",
      },
      {
        icon: Zap,
        title: "Built for Speed",
        desc: "From account creation to your first transaction in just a few minutes.",
      },
      {
        icon: Trophy,
        title: "Innovation Driven",
        desc: "Recognized for delivering cutting-edge digital banking experiences with reliability and trust.",
      },
    ]}
  />
);

export default About;
