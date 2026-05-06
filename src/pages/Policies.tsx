import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Shield, Database, Cookie, UserCheck, Mail, Lock } from "lucide-react";

const sections = [
  { id: "data", icon: Database, title: "Data We Collect", body: "We collect personal information you provide (name, email, address, ID documents), transactional data, and device/usage data needed to operate the service securely." },
  { id: "use", icon: UserCheck, title: "How We Use Data", body: "Your data powers your account, enables transactions, prevents fraud, satisfies regulatory obligations, and improves our products. We do not sell personal data." },
  { id: "share", icon: Shield, title: "Sharing & Disclosure", body: "We share data only with vetted processors (KYC, payments, cloud), regulators when required by law, and partners you explicitly authorize." },
  { id: "cookies", icon: Cookie, title: "Cookies & Tracking", body: "We use essential cookies for authentication and analytics cookies to improve UX. You can manage preferences in your browser settings." },
  { id: "security", icon: Lock, title: "Security", body: "Bank-grade encryption in transit (TLS 1.2+) and at rest (AES-256). Continuous monitoring, MFA, and biometric authentication." },
  { id: "rights", icon: UserCheck, title: "Your Rights", body: "Access, correct, export, or delete your data anytime by contacting privacy@flexiqverve.com." },
  { id: "contact", icon: Mail, title: "Contact", body: "Privacy questions? Email privacy@flexiqverve.com." },
];

const Policies = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 self-start">
            <nav className="rounded-2xl border border-border/60 bg-card p-4 text-sm">
              <p className="mb-3 font-semibold">On this page</p>
              <ul className="space-y-2">
                {sections.map((s) => (
                  <li key={s.id}><a href={`#${s.id}`} className="text-muted-foreground hover:text-foreground transition-smooth">{s.title}</a></li>
                ))}
              </ul>
            </nav>
          </aside>

          <article>
            <Accordion type="multiple" className="space-y-4">
              {sections.map((s) => (
                <AccordionItem key={s.id} value={s.id} id={s.id} className="rounded-2xl border border-border/60 bg-card px-6">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <s.icon className="h-4 w-4" />
                      </div>
                      <span className="font-display text-lg font-semibold">{s.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">{s.body}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </article>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);
export default Policies;
