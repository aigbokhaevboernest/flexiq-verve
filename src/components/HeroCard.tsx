import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CreditCard, Wifi } from "lucide-react";

// Matte card color: a muted deep teal. Soft, not shiny. Swap the two values to change it:
//   slate  → "#44546e" / "#2f3c53"      plum → "#5a4a6b" / "#3f3350"
const CARD_FROM = "#356a73";
const CARD_TO = "#244b57";

// Color of the section right AFTER the hero (your "Core banking" section uses bg-navy-2).
const NEXT_SECTION = "hsl(var(--navy-2))";

/**
 * Wavy edge between the hero and the next section (replaces the hard cut).
 * Place it inside the hero <section> (which is `relative`), BEFORE the content container.
 * Two layers: a faint blue wave behind, and the next section's color in front.
 */
export const HeroWave = ({ color = NEXT_SECTION }: { color?: string }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-14 translate-y-px sm:h-20 lg:h-24"
  >
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className="block h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0,70 C200,20 420,24 660,62 C900,100 1180,108 1440,44 L1440,120 L0,120 Z"
        style={{ fill: "hsl(var(--mediumblue))" }}
        fillOpacity="0.22"
      />
      <path
        d="M0,92 C260,52 480,52 720,84 C960,116 1200,112 1440,76 L1440,120 L0,120 Z"
        style={{ fill: color }}
      />
    </svg>
  </div>
);

export const HeroCard = () => {
  const reduce = useReducedMotion();

  const enter = (y: number, rotate = 0, delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y, rotate },
    animate: { opacity: 1, y: 0, rotate },
    transition: { duration: 0.8, delay },
  });

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Floating mint card */}
      <motion.div
        {...enter(30, -8, 0.2)}
        className="absolute -left-6 top-10 hidden w-64 rounded-3xl bg-gradient-mint p-5 text-white shadow-elev sm:block"
      >
        <div className="flex items-center justify-between text-xs opacity-90">
          <span>Savings</span>
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <p className="mt-3 font-display text-2xl font-bold">+$2,480.00</p>
        <p className="mt-1 text-xs opacity-80">This month • 12.4%</p>
      </motion.div>

      {/* Main card: same simple layout, matte color, no glow blobs */}
      <motion.div
        {...enter(40)}
        className="relative overflow-hidden rounded-3xl border border-white/10 p-7 text-white shadow-elev"
        style={{ background: `linear-gradient(145deg, ${CARD_FROM} 0%, ${CARD_TO} 100%)` }}
      >
        <div className="relative flex items-center justify-between">
          <span className="font-display text-sm font-semibold opacity-90">FLEXIQ VERVE • Platinum</span>
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
        {...enter(30, 6, 0.4)}
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
