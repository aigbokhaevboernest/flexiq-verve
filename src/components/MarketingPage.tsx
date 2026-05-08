import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface Section {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
  cta?: { label: string; to: string };
}

export const MarketingPage = ({ eyebrow, title, intro, sections, cta }: Props) => (
  <div className="page-enter min-h-screen bg-navy">
    <Navbar />

    {/* Hero */}
    <section className="relative overflow-hidden bg-navy-blue-mesh py-20 sm:py-28">
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[hsl(var(--mediumblue))]/30 blur-3xl" />
      <div className="container relative max-w-3xl text-on-dark animate-fade-in">
        <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--mediumblue))]">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-5 text-lg text-on-dark-muted">{intro}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-[hsl(var(--mediumblue))] text-white hover:bg-[hsl(var(--mediumblue))]/90">
            <Link to={cta?.to ?? "/signup"}>{cta?.label ?? "Open an Account"} <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-on-dark hover:bg-white/20 hover:text-white">
            <Link to="/contact">Talk to us</Link>
          </Button>
        </div>
      </div>
    </section>

    {/* Cards section — alternates white over blue band */}
    <section className="bg-blue-gradient py-16 sm:py-20">
      <div className="container grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <div key={s.title} className="rounded-2xl border border-white/10 bg-white p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elev">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--mediumblue))]/15 text-[hsl(var(--mediumblue))]">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>

    <Footer />
  </div>
);
