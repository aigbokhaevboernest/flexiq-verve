import { MarketingPage } from "@/components/MarketingPage";
import { CreditCard, Snowflake, Smartphone, Gift, Shield, Globe2 } from "lucide-react";

const CardsInfo = () => (
  <MarketingPage
    eyebrow="Cards"
    title="Smart cards designed for the way you spend"
    intro="Whether you're shopping online, traveling abroad, or managing everyday expenses, Flexiq Verve cards give you the freedom, security, and control to pay with confidence."
    sections={[
      {
        icon: CreditCard,
        title: "Virtual Cards",
        desc: "Create secure virtual cards instantly for online purchases and subscriptions.",
      },
      {
        icon: Smartphone,
        title: "Digital Wallet Ready",
        desc: "Add your card to Apple Pay or Google Pay and make fast, contactless payments worldwide.",
      },
      {
        icon: Snowflake,
        title: "Instant Card Controls",
        desc: "Freeze or unfreeze your card anytime directly from the app for added peace of mind.",
      },
      {
        icon: Shield,
        title: "Advanced Security",
        desc: "Stay protected with real-time transaction alerts and industry-leading fraud prevention.",
      },
      {
        icon: Gift,
        title: "Rewards That Matter",
        desc: "Earn cashback and exclusive perks on everyday spending, travel, and lifestyle purchases.",
      },
      {
        icon: Globe2,
        title: "Borderless Spending",
        desc: "Use your card globally with competitive exchange rates and no hidden foreign transaction fees.",
      },
    ]}
  />
);

export default CardsInfo;
