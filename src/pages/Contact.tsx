import { MarketingPage } from "@/components/MarketingPage";
import { Mail, MessageCircle, LifeBuoy } from "lucide-react";

const Contact = () => (
  <MarketingPage
    eyebrow="Contact"
    title="We're here when you need us"
    intro="Reach out via email or in-app chat. Our team responds 24/7."
    cta={{ label: "Open a support ticket", to: "/faq" }}
    sections={[
      { icon: Mail, title: "Email", desc: "support@flexiqverve.com — replies within 2 hours." },
      { icon: MessageCircle, title: "Live Chat", desc: "Tap the chat bubble in the app for instant help." },
      { icon: LifeBuoy, title: "Help Center", desc: "Browse our FAQ and self-serve guides." },
    ]}
  />
);
export default Contact;
