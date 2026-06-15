import heroBanking from "@/assets/hero-banking.jpg";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RotatingWord } from "@/components/RotatingWord";
import { HeroCard } from "@/components/HeroCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Bell,
  Clock,
  CreditCard,
  Globe2,
  Lock,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
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

const Index = () => {
  return (
    <div className="page-enter min-h-screen bg-navy">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <img
          src={heroBanking}
          alt="Premium banking app and card"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--navy))]/40 via-transparent to-[hsl(var(--navy))]" />
        {/* Floating glow orbs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[hsl(var(--mediumblue))]/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[hsl(var(--mediumblue))]/20 blur-3xl animate-float [animation-delay:2s]" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-primary-glow/30 blur-2xl animate-float [animation-delay:4s] hidden md:block" />
        {/* Subtle grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="container relative grid gap-14 py-16 md:grid-cols-2 md:py-24 lg:py-32">
          <div className="flex flex-col justify-center text-on-dark">
            <motion.div {...fade(0)} className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-on-dark backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--mediumblue))]" />
              Now offering 4.5% APY on savings
            </motion.div>
            <motion.h1 {...fade(0.05)} className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Bank Smarter,{" "}
              <RotatingWord />{" "}
              <span className="block">your money & build credit with Flexiq Verve</span>
            </motion.h1>
            <motion.p {...fade(0.15)} className="mt-6 max-w-xl text-base text-on-dark-muted sm:text-lg">
              Flexiq Verve provides secure, fast, and reliable digital banking services to help you manage your finances with ease, from anywhere, on any device.
            </motion.p>
            <motion.div {...fade(0.25)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-[hsl(var(--mediumblue))] text-white shadow-glow hover:bg-[hsl(var(--mediumblue))]/90">
                <Link to="/signup">
                  Open an Account <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
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

      {/* CORE FEATURES — navy */}
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
              const tone =
                f.tone === "mint" ? "bg-gradient-mint" :
                f.tone === "coral" ? "bg-gradient-coral" :
                "bg-gradient-primary";
              return (
                <motion.div key={f.title} {...fade(idx * 0.08)} className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white p-6 shadow-card transition-smooth hover:-translate-y-1 hover:shadow-elev">
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

      {/* QUICK FEATURES — medium blue */}
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

      {/* STATS — navy */}
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

      {/* SECURITY — navy mesh */}
      <section id="security" className="bg-navy-blue-mesh py-20 sm:py-28">
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div {...fade()} className="text-on-dark">
              <p className="text-sm font-semibold uppercase tracking-widest text-success">Security first</p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Your money, protected by design</h2>
              <p className="mt-4 text-on-dark-muted">
                Bank-grade encryption, fraud monitoring, and biometric authentication keep your account safer than your wallet.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {["Real-time fraud detection", "FDIC-insured accounts up to $250K", "Biometric & PIN protection", "End-to-end encryption"].map((i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20 text-success">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                    {i}
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
                    {[
                      { label: "Login from new device", status: "Blocked" },
                      { label: "International transfer", status: "Verified" },
                      { label: "Card payment $890", status: "Approved" },
                    ].map((r) => (
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

      {/* CTA — medium blue */}
      <section className="bg-navy pb-24 pt-4">
        <div className="container">
          <motion.div {...fade()} className="relative overflow-hidden rounded-3xl bg-blue-gradient p-10 text-center text-white shadow-elev sm:p-16">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-[hsl(var(--navy))]/40 blur-3xl" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold sm:text-4xl">Ready to bank smarter?</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/85">
                Join Flexiq Verve in under 2 minutes. No paperwork, no fees, no nonsense.
              </p>
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
