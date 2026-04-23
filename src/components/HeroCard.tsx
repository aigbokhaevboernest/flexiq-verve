import { motion } from "framer-motion";
import { ArrowUpRight, CreditCard, Wifi } from "lucide-react";

export const HeroCard = () => {
  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Floating mint card */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -8 }}
        animate={{ opacity: 1, y: 0, rotate: -8 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="absolute -left-6 top-10 hidden w-64 rounded-3xl bg-gradient-mint p-5 text-white shadow-elev sm:block"
      >
        <div className="flex items-center justify-between text-xs opacity-90">
          <span>Savings</span>
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <p className="mt-3 font-display text-2xl font-bold">+$2,480.00</p>
        <p className="mt-1 text-xs opacity-80">This month • 12.4%</p>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-primary p-7 text-primary-foreground shadow-elev"
      >
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <span className="font-display text-sm font-semibold opacity-90">NORVEX • Platinum</span>
          <Wifi className="h-5 w-5 rotate-90 opacity-90" />
        </div>
        <div className="relative mt-10">
          <p className="text-xs uppercase tracking-widest opacity-70">Available Balance</p>
          <p className="mt-1 font-display text-4xl font-bold tracking-tight">$24,891.50</p>
        </div>
        <div className="relative mt-8 flex items-end justify-between">
          <p className="font-mono text-base tracking-[0.2em] opacity-90">•••• 4829</p>
          <CreditCard className="h-8 w-8 opacity-90" />
        </div>
      </motion.div>

      {/* Floating coral notif */}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 6 }}
        animate={{ opacity: 1, y: 0, rotate: 6 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute -bottom-6 -right-4 hidden w-60 rounded-2xl bg-card p-4 shadow-elev sm:block"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-coral text-white">
            <ArrowUpRight className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">Sent to Maya</p>
            <p className="text-[11px] text-muted-foreground">Just now</p>
          </div>
          <p className="font-display text-sm font-bold">−$120</p>
        </div>
      </motion.div>
    </div>
  );
};
