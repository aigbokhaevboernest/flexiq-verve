import { MarketingPage } from "@/components/MarketingPage";
import { CreditCard, Snowflake, Smartphone, Gift, Shield, Globe2 } from "lucide-react";

const CardsInfo = () => (
  <MarketingPage
    eyebrow="Cards"
    title="Cards that adapt to every part of your life"
    intro="Virtual and physical cards with controls, rewards, and security that put you in charge."
    sections={[
      { icon: CreditCard, title: "Virtual Cards", desc: "Spin up unlimited virtual cards for online spending." },
      { icon: Smartphone, title: "Apple & Google Pay", desc: "Tap to pay anywhere contactless is accepted." },
      { icon: Snowflake, title: "Freeze Anytime", desc: "Pause and resume cards instantly from the app." },
      { icon: Shield, title: "Fraud Protection", desc: "Real-time alerts and zero liability on unauthorized charges." },
      { icon: Gift, title: "Cashback Rewards", desc: "Earn up to 3% on dining, travel, and groceries." },
      { icon: Globe2, title: "No FX Fees", desc: "Spend in any currency without hidden conversion fees." },
    ]}
  />
);
export default CardsInfo;
