import heroBanking from "@/assets/hero-banking.jpg";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RotatingWord } from "@/components/RotatingWord";
import { HeroCard } from "@/components/HeroCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRef, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Bell,
  Clock,
  CreditCard,
  Globe2,
  Lock,
  PiggyBank,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

const features = [
  { icon: Wallet, title: "Account Management", desc: "Open personal, business, savings or checking accounts in seconds.", tone: "primary" },
  { icon: Send, title: "Money Transfers", desc: "Send locally, internally or via FX with transparent rates.", tone: "mint" },
  { icon: Banknote, title: "Bill Payments", desc: "Settle utilities, subscriptions and more from one dashboard.", tone: "coral" },
  { icon: TrendingUp, title: "Transaction Tracking", desc: "Real-time insights into every dollar coming in and out.", tone: "primary" },
];

const quickFeatures = [
  { icon: Zap, label: "Instant payments" },
  { icon: Banknote, label: "Take a loan" },
  { icon: Clock, label: "24/7 access" },
  { icon: Smartphone, label: "Mobile-friendly" },
  { icon: Globe2, label: "Online payments" },
  { icon: Bell, label: "Live notifications" },
];

const stats = [
  { value: "1.2M+", label: "Active users" },
  { value: "$8.4B", label: "Total transactions" },
  { value: "320K", label: "Daily transfers" },
  { value: "99.99%", label: "Uptime" },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Small Business Owner",
    avatar: "SM",
    rating: 5,
    text: "Flexiq Verve completely changed how I manage my business finances. The instant transfers and real-time tracking are game-changers.",
  },
  {
    name: "James T.",
    role: "Freelance Designer",
    avatar: "JT",
    rating: 5,
    text: "I had opened an account 5 years ago. I feel safe keeping my funds here. Their deposit schemes and savings APY are really helpful.",
  },
  {
    name: "Aisha K.",
    role: "Graduate Student",
    avatar: "AK",
    rating: 5,
    text: "No fees, no hassle. I send money internationally for near-zero cost. The app is beautiful and incredibly easy to use.",
  },
  {
    name: "Marcus R.",
    role: "Software Engineer",
    avatar: "MR",
    rating: 5,
    text: "The fraud detection caught a suspicious charge before I even noticed. That kind of proactive security is exactly what I need from a bank.",
  },
];

/**
 * Real, official logo files — hotlinked from Wikimedia Commons, which mirrors
 * the exact SVG assets each company publishes in their own brand/press kit.
 * Nothing here is redrawn or approximated.
 *
 * NOTE: spot-check these URLs once in-browser. Wikimedia occasionally renames
 * or re-versions a file, so confirm each one resolves before shipping.
 */
const partners = [
  { name: "Visa", src: "https://upload.wikimedia.org/wikipedia/commons/0/04/Visa_2021.svg" },
  { name: "Mastercard", src: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
  { name: "PayPal", src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
  { name: "Stripe", src: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Stripe_Logo%2C_revised_2016.svg" },
  { name: "Apple Pay", src: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Apple_Pay_logo.svg" },
  { name: "Google Pay", src: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Google_Pay_Logo.svg" },
  { name: "Zelle", src: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Zelle_logo.svg" },
  { name: "Cash App", src: "https://upload.wikimedia.org/wikipedia/commons/4/44/Cash_App_logo.svg" },
  { name: "Plaid", src: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Plaid_logo.svg" },
  { name: "Dwolla", src: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Dwolla_logo.svg" },
];

// Duplicate once for a seamless 0% -> -50% loop
const ticker = [...partners, ...partners];

const faqs = [
  { q: "How do I open an account?", a: "Click 'Open Account' and complete the 2-minute signup. You'll need basic personal info and a valid email." },
  { q: "Is Flexiq Verve safe?", a: "Yes. We use 256-bit encryption, biometric authentication, and accounts are FDIC-insured up to $250,000." },
  { q: "Are there monthly fees?", a: "No monthly fees on personal accounts. See our pricing page for business and premium plans." },
  { q: "How fast are transfers?", a: "Local transfers are instant. International transfers typically settle within 1–2 business days." },
  { q: "Can I get a loan?", a: "Yes, qualified members can apply for personal and business loans directly from the dashboard." },
  { q: "What currencies are supported?", a: "We support 150+ global currencies for FX transfers and multi-currency accounts." },
  { q: "Is customer support 24/7?", a: "Yes — chat and email support are available around the clock." },
];

const Index = () => {
  const partnerTrackRef = useRef<HTMLDivElement>(null);
  const [isPartnerDragging, setIsPartnerDragging] = useState(false);
  const partnerDragState = useRef({ startX: 0, startScroll: 0 });

  const onPartnerPointerDown = (e: React.PointerEvent) => {
    if (!partnerTrackRef.current) return;
    setIsPartnerDragging(true);
    partnerDragState.current = { startX: e.clientX, startScroll: partnerTrackRef.current.scrollLeft };
    partnerTrackRef.current.setPointerCapture(e.pointerId);
  };

  const onPartnerPointerMove = (e: React.PointerEvent) => {
    if (!isPartnerDragging || !partnerTrackRef.current) return;
    const dx = e.clientX - partnerDragState.current.startX;
    partnerTrackRef.current.scrollLeft = partnerDragState.current.startScroll - dx;
  };

  const onPartnerPointerUp = (e: React.PointerEvent) => {
    setIsPartnerDragging(false);
    partnerTrackRef.current?.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="page-enter min-h-screen bg-navy">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <img src={heroBanking} alt="Premium banking app and card" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--navy))]/40 via-transparent to-[hsl(var(--navy))]" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[hsl(var(--mediumblue))]/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[hsl(var(--mediumblue))]/20 blur-3xl animate-float [animation-delay:2s]" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-primary-glow/30 blur-2xl animate-float [animation-delay:4s] hidden md:block" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="container relative grid gap-14 py-16 md:grid-cols-2 md:py-24 lg:py-32">
          <div className="flex flex-col justify-center text-on-dark">
            <motion.div {...fade(0)} className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-on-dark backdrop-blur">
              <PiggyBank className="h-3.5 w-3.5 text-[hsl(var(--mediumblue))]" />
              Now offering 4.5% APY on savings
            </motion.div>
            <motion.h1 {...fade(0.05)} className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Bank Smarter,{" "}<RotatingWord />{" "}
              <span className="block">your money & build credit with Flexiq Verve</span>
            </motion.h1>
            <motion.p {...fade(0.15)} className="mt-6 max-w-xl text-base text-on-dark-muted sm:text-lg">
              Flexiq Verve provides secure, fast, and reliable digital banking services to help you manage your finances with ease, from anywhere, on any device.
            </motion.p>
            <motion.div {...fade(0.25)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-[hsl(var(--mediumblue))] text-white shadow-glow hover:bg-[hsl(var(--mediumblue))]/90">
                <Link to="/signup">Open an Account <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-on-dark backdrop-blur hover:bg-white/20 hover:text-white">
                <Link to="/login">Login</Link>
              </Button>
            </motion.div>
            <motion.div {...fade(0.35)} className="mt-10 flex items-center gap-6 text-xs text-on-dark-muted">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> FDIC Insured</div>
              <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-[hsl(var(--mediumblue))]" /> 256-bit encryption</div>
            </motion.div>
          </div>
          <div className="relative flex items-center justify-center">
            <HeroCard />
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ── */}
      <section id="features" className="bg-navy-2 py-20 sm:py-28">
        <div className="container">
          <motion.div {...fade()} className="mx-auto max-w-2xl text-center text-on-dark">
            <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--mediumblue))]">Core banking</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Sophisticated banking, simplified.</h2>
            <p className="mt-4 text-on-dark-muted">A modern, intuitive experience designed around security and simplicity.</p>
          </motion.div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, idx) => {
              const Icon = f.icon;
              const tone = f.tone === "mint" ? "bg-gradient-mint" : f.tone === "coral" ? "bg-gradient-coral" : "bg-gradient-primary";
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white p-6 shadow-card hover:-translate-y-1 hover:shadow-elev transition-transform duration-300"
                >
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${tone} text-white shadow-md`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── QUICK FEATURES ── */}
      <section className="bg-blue-gradient py-16">
        <div className="container">
          <motion.div {...fade()} className="rounded-3xl bg-white/10 p-8 backdrop-blur sm:p-12">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {quickFeatures.map((q, i) => {
                const Icon = q.icon;
                return (
                  <motion.div key={q.label} {...fade(i * 0.05)} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--mediumblue))]/15 text-[hsl(var(--mediumblue))]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-medium text-foreground">{q.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" className="bg-navy py-20 sm:py-28">
        <div className="container">
          <motion.div {...fade()} className="mx-auto max-w-2xl text-center text-on-dark">
            <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--mediumblue))]">Live numbers</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">A growing community of smart spenders</h2>
          </motion.div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} {...fade(i * 0.08)} className="rounded-3xl border border-white/10 bg-white p-8 text-center shadow-card">
                <p className="font-display text-4xl font-bold text-gradient">{s.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section id="security" className="bg-navy-blue-mesh py-20 sm:py-28">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...fade()} className="text-on-dark">
              <p className="text-sm font-semibold uppercase tracking-widest text-success">Security first</p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Your money, protected by design</h2>
              <p className="mt-4 text-on-dark-muted">Bank-grade encryption, fraud monitoring, and biometric authentication keep your account safer than your wallet.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["Real-time fraud detection", "FDIC-insured accounts up to $250K", "Biometric & PIN protection", "End-to-end encryption"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...fade(0.15)} className="relative">
              <div className="rounded-3xl bg-gradient-primary p-1 shadow-elev">
                <div className="rounded-[calc(theme(borderRadius.3xl)-4px)] bg-white p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Card paused automatically</p>
                      <p className="text-xs text-muted-foreground">Suspicious activity blocked at 3:42 AM</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {[{ label: "Login from new device", status: "Blocked" }, { label: "International transfer", status: "Verified" }, { label: "Card payment $890", status: "Approved" }].map((r) => (
                      <div key={r.label} className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm">
                        <span className="text-foreground">{r.label}</span>
                        <span className="font-medium text-success">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="bg-navy-2 py-20 sm:py-28">
        <div className="container">
          <motion.div {...fade()} className="mx-auto max-w-2xl text-center text-on-dark">
            <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--mediumblue))]">What customers say</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Loved by people who value their money</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-[hsl(var(--mediumblue))] text-[hsl(var(--mediumblue))]" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-on-dark-muted">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--mediumblue))]/20 text-xs font-bold text-[hsl(var(--mediumblue))]">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-dark">{t.name}</p>
                    <p className="text-xs text-on-dark-muted">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS — draggable auto-scrolling logo ticker ── */}
      <section className="bg-navy py-16 sm:py-20">
        <div className="container mb-10">
          <motion.div {...fade()} className="mx-auto max-w-2xl text-center text-on-dark">
            <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--mediumblue))]">Our partners</p>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Backed by the best in banking</h2>
            <p className="mt-3 text-on-dark-muted text-sm">
              We work with trusted global financial infrastructure partners to keep your money moving safely.
            </p>
          </motion.div>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[hsl(var(--navy))] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[hsl(var(--navy))] to-transparent" />

          <div
            ref={partnerTrackRef}
            onPointerDown={onPartnerPointerDown}
            onPointerMove={onPartnerPointerMove}
            onPointerUp={onPartnerPointerUp}
            onPointerLeave={onPartnerPointerUp}
            className={`flex gap-4 overflow-x-auto scrollbar-none select-none ${
              isPartnerDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              scrollbarWidth: "none",
              animation: isPartnerDragging ? "none" : "partners-scroll 32s linear infinite",
            }}
          >
            {ticker.map((p, i) => (
              <div
                key={`${p.name}-${i}`}
                className="flex h-20 w-[150px] flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white px-6 py-4"
              >
                <img
                  src={p.src}
                  alt={p.name}
                  draggable={false}
                  className="h-7 max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}

            <div className="flex h-20 w-[160px] flex-shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-white/15 bg-transparent">
              <p className="text-2xl font-bold text-white/30">···</p>
              <p className="text-[11px] font-semibold tracking-wider text-on-dark-muted uppercase text-center leading-tight">
                150+ more
                <br />
                supported
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes partners-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .scrollbar-none::-webkit-scrollbar { display: none; }
          @media (prefers-reduced-motion: reduce) {
            [style*="partners-scroll"] { animation: none !important; }
          }
        `}</style>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-navy-2 py-20 sm:py-28">
        <div className="container">
          <motion.div {...fade()} className="mx-auto max-w-2xl text-center text-on-dark mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--mediumblue))]">Help Center</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-4 text-on-dark-muted">Everything you need to know about Flexiq Verve.</p>
          </motion.div>
          <motion.div {...fade(0.1)} className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur divide-y divide-white/10">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-0 px-6">
                  <AccordionTrigger className="text-left font-medium text-on-dark hover:no-underline hover:text-white">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-on-dark-muted">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <motion.div {...fade(0.2)} className="mt-6 text-center">
              <Link to="/faq" className="text-sm text-[hsl(var(--mediumblue))] hover:underline">
                View all FAQs →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-navy pb-24 pt-4">
        <div className="container">
          <motion.div {...fade()} className="relative overflow-hidden rounded-3xl bg-blue-gradient p-10 text-center text-white shadow-elev sm:p-16">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-[hsl(var(--navy))]/40 blur-3xl" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold sm:text-4xl">Ready to bank smarter?</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/85">Join Flexiq Verve in under 2 minutes. No paperwork, no fees, no nonsense.</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90">
                  <Link to="/signup">Open an Account <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/15 hover:text-white">
                  <Link to="/login">I already have one</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
