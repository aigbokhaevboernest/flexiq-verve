import { MarketingPage } from "@/components/MarketingPage";
import { Mail, Phone, MapPin, MessageCircle, Clock, LifeBuoy } from "lucide-react";

const Contact = () => (
  <MarketingPage
    eyebrow="Contact"
    title="We're here when you need us"
    intro="Reach out via email, phone, or in-app chat. Our team responds 24/7."
    cta={{ label: "Open a support ticket", to: "/faq" }}
    sections={[
      { icon: Mail, title: "Email", desc: "support@flexiqverve.com — replies within 2 hours." },
      { icon: Phone, title: "Phone", desc: "+1 (800) 555-0100 — available 24/7 worldwide." },
      { icon: MessageCircle, title: "Live Chat", desc: "Tap the chat bubble in the app for instant help." },
      { icon: MapPin, title: "Headquarters", desc: "350 Mission Street, San Francisco, CA 94105." },
      { icon: Clock, title: "Hours", desc: "Customer support available 24/7, every day." },
      { icon: LifeBuoy, title: "Help Center", desc: "Browse our FAQ and self-serve guides." },
    ]}
  />
);
export default Contact;
