import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText, Scale, Shield, UserCheck, AlertCircle, Mail } from "lucide-react";

const sections = [
  { id: "acceptance", icon: UserCheck, title: "Acceptance of Terms", body: "By accessing or using Flexiq Verve, you agree to be bound by these Terms. If you do not agree, please do not use our services." },
  { id: "accounts", icon: FileText, title: "Accounts & Eligibility", body: "You must be at least 18 years old and provide accurate, complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials." },
  { id: "use", icon: Scale, title: "Acceptable Use", body: "You agree not to misuse the platform, attempt unauthorized access, or use Flexiq Verve for unlawful activity, fraud, or money laundering." },
  { id: "fees", icon: AlertCircle, title: "Fees & Charges", body: "Most personal accounts have no monthly fee. Specific transaction or service fees are disclosed before you confirm any operation." },
  { id: "liability", icon: Shield, title: "Limitation of Liability", body: "Flexiq Verve is not liable for indirect, incidental, or consequential damages arising from use of the service to the maximum extent permitted by law." },
  { id: "contact", icon: Mail, title: "Contact", body: "Questions about these Terms? Email legal@flexiqverve.com." },
];

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Legal</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Terms & Conditions</h1>
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

          <article className="space-y-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="rounded-2xl border border-border/60 bg-card p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
                </div>
                <p className="leading-relaxed text-muted-foreground">{s.body}</p>
              </section>
            ))}
          </article>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);
export default Terms;
