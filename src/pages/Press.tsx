import { MarketingPage } from "@/components/MarketingPage";
import { Newspaper, Mic, Award, Camera, FileText, Tv } from "lucide-react";

const Press = () => (
  <MarketingPage
    eyebrow="Press"
    title="Flexiq Verve in the news"
    intro="Stories, announcements and media coverage about our mission to reinvent banking."
    sections={[
      { icon: Newspaper, title: "Newsroom", desc: "Latest press releases and company announcements." },
      { icon: Mic, title: "Media Inquiries", desc: "Reach our PR team at press@flexiqverve.com." },
      { icon: Award, title: "Awards", desc: "Best Digital Bank 2025, Fintech Innovator of the Year." },
      { icon: Camera, title: "Brand Assets", desc: "Logos, screenshots and executive photos for media." },
      { icon: FileText, title: "Fact Sheet", desc: "Key numbers and milestones at a glance." },
      { icon: Tv, title: "Featured In", desc: "TechCrunch, Forbes, Bloomberg, The Verge and more." },
    ]}
  />
);
export default Press;
