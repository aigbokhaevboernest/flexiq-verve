import heroBanking from "@/assets/hero-banking.jpg";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RotatingWord } from "@/components/RotatingWord";
import { HeroCard } from "@/components/HeroCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

// ── Partner logo SVGs — all use real brand colors (cards are white) ──

const VisaLogo = () => (
  <svg viewBox="0 0 80 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <path d="M30.2 0.5L24.5 25.5H18.8L24.5 0.5H30.2Z" fill="#1A1F71"/>
    <path d="M52.8 0.5L47.8 17.2L46.2 8.8C45.8 6.5 44 5 41.8 5H32.2L32 5.8C34.2 6.3 36.5 7.2 38 8.5C38.8 9.2 39.3 10 39.5 11L44.8 25.5H50.8L60.2 0.5H52.8Z" fill="#1A1F71"/>
    <path d="M16.5 0.5L7 17.5L5.8 11.5C5.2 8.8 3.2 6.5 0.5 5.5L9.5 25.5H15.8L26.2 0.5H16.5Z" fill="#1A1F71"/>
    <path d="M65.2 16.8C65.2 14.2 68.2 13.8 71.2 14.2C72.8 14.5 74.5 15 75.5 15.8L76.5 10.5C75.2 10 73 9.5 70.2 9.5C64.5 9.5 60.5 12.5 60.5 16.8C60.5 23.5 69.8 22.5 69.8 25.2C69.8 26.2 68.5 26.8 66.5 26.8C64.2 26.8 62 26.2 60.5 25.2L59.5 30.8C61.2 31.5 63.5 32 66.5 32C72.5 32 76.5 29 76.5 24.5C76.8 17.2 65.2 18.2 65.2 16.8Z" fill="#1A1F71"/>
  </svg>
);

const MastercardLogo = () => (
  <svg viewBox="0 0 60 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
    <circle cx="20" cy="19" r="16" fill="#EB001B"/>
    <circle cx="40" cy="19" r="16" fill="#F79E1B"/>
    <path d="M30 6.8C33.2 9.2 35.5 12.8 35.5 19C35.5 25.2 33.2 28.8 30 31.2C26.8 28.8 24.5 25.2 24.5 19C24.5 12.8 26.8 9.2 30 6.8Z" fill="#FF5F00"/>
  </svg>
);

const StripeLogo = () => (
  <svg viewBox="0 0 60 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <path d="M28 10.5C28 8.8 29.4 8 31.5 8C34.5 8 38.5 9 41 10.5V4.5C38.2 3.3 35.5 2.8 31.5 2.8C23.8 2.8 18.5 6.8 18.5 11.5C18.5 19.2 30.5 18 30.5 21C30.5 23 28.8 23.8 26.5 23.8C23.2 23.8 19.5 22.5 17 20.8V27C19.8 28.5 22.8 29.2 26.5 29.2C34.5 29.2 40 25.2 40 20.2C39.8 11.5 28 13 28 10.5Z" fill="#635BFF"/>
  </svg>
);

const PlaidLogo = () => (
  <svg viewBox="0 0 70 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <rect x="2" y="2" width="11" height="11" rx="1.5" fill="#111827" opacity="0.9"/>
    <rect x="15" y="2" width="11" height="11" rx="1.5" fill="#111827" opacity="0.65"/>
    <rect x="2" y="15" width="11" height="11" rx="1.5" fill="#111827" opacity="0.65"/>
    <rect x="15" y="15" width="11" height="11" rx="1.5" fill="#111827" opacity="0.4"/>
    <text x="32" y="23" fill="#111827" fontFamily="Inter, sans-serif" fontSize="17" fontWeight="800">plaid</text>
  </svg>
);

const PayPalLogo = () => (
  <svg viewBox="0 0 90 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <text x="4" y="24" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="800">
      <tspan fill="#253D80">Pay</tspan><tspan fill="#179BD7">Pal</tspan>
    </text>
  </svg>
);

const ApplePayLogo = () => (
  <svg viewBox="0 0 100 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <path d="M17 5C15.4 5.7 13.5 7.2 12.5 9C11.6 7.3 9.8 5.5 8 5.5C5.2 5.5 2.5 8.2 2.5 12.2C2.5 17.8 8.5 23.8 12.5 26C16.5 23.8 22.5 17.8 22.5 12.2C22.5 8.2 19.8 5 17 5Z" fill="#1d1d1f"/>
    <text x="28" y="23" fill="#1d1d1f" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="600">Apple Pay</text>
  </svg>
);

const GooglePayLogo = () => (
  <svg viewBox="0 0 105 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <text x="4" y="23" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700">
      <tspan fill="#4285F4">G</tspan><tspan fill="#EA4335">o</tspan><tspan fill="#FBBC04">o</tspan>
      <tspan fill="#4285F4">g</tspan><tspan fill="#34A853">l</tspan><tspan fill="#EA4335">e </tspan>
      <tspan fill="#5F6368">Pay</tspan>
    </text>
  </svg>
);

const DwollaLogo = () => (
  <svg viewBox="0 0 90 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <circle cx="17" cy="17" r="13" fill="none" stroke="#F37B21" strokeWidth="2.5"/>
    <circle cx="17" cy="17" r="7.5" fill="#F37B21" opacity="0.85"/>
    <circle cx="17" cy="17" r="3.5" fill="white"/>
    <text x="36" y="23" fill="#2D3748" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700">dwolla</text>
  </svg>
);

const MarqetaLogo = () => (
  <svg viewBox="0 0 95 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <path d="M5 26L13 8L21 26" stroke="#E8272A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 19H17" stroke="#E8272A" strokeWidth="2.2" strokeLinecap="round"/>
    <text x="27" y="23" fill="#1a1a2e" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700">marqeta</text>
  </svg>
);

const ZelleLogo = () => (
  <svg viewBox="0 0 80 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <path d="M8 8H28L10 26H30" stroke="#6D1ED4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="36" y="23" fill="#6D1ED4" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="800">zelle</text>
  </svg>
);

const CashAppLogo = () => (
  <svg viewBox="0 0 95 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <rect x="2" y="2" width="28" height="30" rx="8" fill="#00D632"/>
    <text x="8" y="23" fill="white" fontFamily="Inter, sans-serif" fontSize="16" fontWeight="800">$</text>
    <text x="36" y="23" fill="#1a1a1a" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">Cash App</text>
  </svg>
);

const ACHLogo = () => (
  <svg viewBox="0 0 80 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <rect x="2" y="6" width="26" height="22" rx="4" fill="#003087"/>
    <text x="5" y="22" fill="white" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="800">ACH</text>
    <text x="34" y="23" fill="#003087" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">Network</text>
  </svg>
);

const FedwireLogo = () => (
  <svg viewBox="0 0 90 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
    <rect x="2" y="6" width="26" height="22" rx="4" fill="#1a3a6b"/>
    <text x="5" y="22" fill="white" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="800">FED</text>
    <text x="34" y="23" fill="#1a3a6b" fontFamily="Inter, sans-serif" fontSize="13" fontWeight="700">Fedwire</text>
  </svg>
);

// "And many more" special card — not duplicated in ticker
const AndMoreCard = () => (
  <div
    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-8 py-5 flex-shrink-0"
    style={{ minWidth: "160px" }}
  >
    <p className="text-2xl font-bold text-gray-300">···</p>
    <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase text-center leading-tight">
      150+ more<br/>supported
    </p>
  </div>
);

const partners = [
  { name: "Visa",       Logo: VisaLogo },
  { name: "Mastercard", Logo: MastercardLogo },
  { name: "Stripe",     Logo: StripeLogo },
  { name: "PayPal",     Logo: PayPalLogo },
  { name: "Apple Pay",  Logo: ApplePayLogo },
  { name: "Google Pay", Logo: GooglePayLogo },
  { name: "Zelle",      Logo: ZelleLogo },
  { name: "Cash App",   Logo: CashAppLogo },
  { name: "Plaid",      Logo: PlaidLogo },
  { name: "Dwolla",     Logo: DwollaLogo },
  { name: "Marqeta",    Logo: MarqetaLogo },
  { name: "ACH",        Logo: ACHLogo },
  { name: "Fedwire",    Logo: FedwireLogo },
];

// Triple-duplicate for truly seamless infinite loop
const ticker = [...partners, ...partners, ...partners];

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

      {/* ── PARTNERS — infinite horizontal scroll ticker ── */}
      <section className="bg-navy py-16 sm:py-20">
        {/* Heading — inside container */}
        <div className="container mb-10">
          <motion.div {...fade()} className="mx-auto max-w-2xl text-center text-on-dark">
            <p className="text-sm font-semibold uppercase tracking-widest text-[hsl(var(--mediumblue))]">Our partners</p>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Backed by the best in banking</h2>
            <p className="mt-3 text-on-dark-muted text-sm">
              We work with trusted global financial infrastructure partners to keep your money moving safely.
            </p>
          </motion.div>
        </div>

        {/* Full-bleed ticker track */}
        <div className="relative w-full overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[hsl(var(--navy))] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[hsl(var(--navy))] to-transparent" />

          {/* Scrolling strip */}
          <div
            className="flex gap-4 w-max"
            style={{ animation: "partners-scroll 30s linear infinite" }}
          >
            {ticker.map((p, i) => {
              const Logo = p.Logo;
              return (
                <div
                  key={`${p.name}-${i}`}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-8 py-5 flex-shrink-0"
                  style={{ minWidth: "150px" }}
                >
                  {/* Logo on top */}
                  <div className="flex h-10 w-full items-center justify-center">
                    <Logo />
                  </div>
                  {/* Name underneath */}
                  <p className="text-[11px] font-semibold tracking-widest text-on-dark-muted uppercase">
                    {p.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <style>{`
          @keyframes partners-scroll {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
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
