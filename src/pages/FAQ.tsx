import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How do I open an account?", a: "Click 'Open Account' and complete the 2-minute signup. You'll need basic personal info and a valid email." },
  { q: "Is Flexiq Verve safe?", a: "Yes. We use 256-bit encryption, biometric authentication, and accounts are FDIC-insured up to $250,000." },
  { q: "Are there monthly fees?", a: "No monthly fees on personal accounts. See our pricing page for business and premium plans." },
  { q: "How fast are transfers?", a: "Local transfers are instant. International transfers typically settle within 1-2 business days." },
  { q: "Can I get a loan?", a: "Yes, qualified members can apply for personal and business loans directly from the dashboard." },
  { q: "How do I reset my PIN?", a: "Contact support from the dashboard to reset your PIN securely." },
  { q: "What currencies are supported?", a: "We support 150+ global currencies for FX transfers and multi-currency accounts." },
  { q: "Is customer support 24/7?", a: "Yes — chat and email support are available 24/7." },
];

const FAQ = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Help Center</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Frequently asked questions</h1>
        <p className="mt-4 text-muted-foreground">Everything you need to know about Flexiq Verve.</p>

        <Accordion type="single" collapsible className="mt-10 rounded-2xl border border-border/60 bg-card divide-y divide-border/60">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-0 px-6">
              <AccordionTrigger className="text-left font-medium hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
    <Footer />
  </div>
);
export default FAQ;
