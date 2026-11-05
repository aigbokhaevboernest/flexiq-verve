import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Wifi } from "lucide-react";

// Background color of the section that comes AFTER the hero (the dark navy under the card).
// Match it to that section so the fade is seamless.
const NEXT_SECTION_BG = "#111729";

// Set to false to hide the small "Sample" tag and the caption under the card.
const SHOW_SAMPLE_LABELS = true;

const SAMPLE_CARD = {
  accountType: "Checking",
  balance: "$24,891.50",
  last4: "4829",
};

/**
 * Drop this as the LAST child of your hero <section> (the section must be `relative`).
 * It fades the hero into the next section and adds a soft blue glow along the seam,
 * so there is no hard cut where the two sections meet.
 */
export const HeroBlend = ({
  to = NEXT_SECTION_BG,
  className = "h-48 sm:h-56",
}: {
  to?: string;
  className?: string;
}) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none absolute inset-x-0 bottom-0 z-0 ${className}`}
    style={{
      background: [
        "radial-gradient(60% 55% at 50% 100%, rgba(74,144,226,0.22) 0%, rgba(74,144,226,0) 100%)",
        `linear-gradient(to bottom, rgba(17,23,41,0) 0%, ${to} 92%)`,
      ].join(", "),
    }}
  />
);

export const HeroCard = () => {
  const reduce = useReducedMotion();

  const enter = (y: number, rotate = 0, delay = 0) => ({
    initial: reduce ? false : { opacity: 0, y, rotate },
    animate: { opacity: 1, y: 0, rotate },
    transition: { duration: 0.8, delay },
  });

  return (
    <figure className="relative isolate mx-auto w-full max-w-md">
      {/* Glow behind the card: its color spills out and melts into the page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(closest-side, rgba(74,144,226,0.38) 0%, rgba(74,144,226,0.14) 45%, rgba(74,144,226,0) 100%)",
        }}
      />

      {/* Floating mint card (sample) */}
      <motion.div
        {...enter(30, -8, 0.2)}
        className="absolute -left-6 top-10 hidden w-64 rounded-3xl bg-gradient-mint p-5 text-white shadow-elev sm:block"
      >
        <div className="flex items-center justify-between text-xs opacity-90">
          <span>Savings</span>
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="mt-3 font-display text-2xl font-bold">+$2,480.00</p>
        <p className="mt-1 text-xs opacity-80">This month • 12.4%</p>
      </motion.div>

      {/* Main card: real card proportions, navy so the blue buttons stay the focus */}
      <motion.div
        {...enter(40)}
        role="img"
        aria-label={`${SAMPLE_CARD.accountType} card showing an available balance of ${SAMPLE_CARD.balance}`}
        className="relative aspect-[1.586/1] w-full overflow-hidden rounded-3xl border border-white/15 p-6 text-white shadow-elev sm:p-7"
        style={{
          background:
            "linear-gradient(135deg, #2b3b63 0%, #1e2b4e 55%, #141d38 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        {/* green accent edge */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[3px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(74,222,128,0) 0%, #4ade80 50%, rgba(74,222,128,0) 100%)",
          }}
        />

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-sm font-semibold leading-tight">Flexiq Verve</p>
              <p className="text-xs text-white/70">{SAMPLE_CARD.accountType}</p>
            </div>
            <div className="flex items-center gap-2">
              {SHOW_SAMPLE_LABELS && (
                <span className="rounded-full border border-emerald-400 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                  Sample
                </span>
              )}
              <Wifi className="h-5 w-5 rotate-90 text-white/85" aria-hidden="true" />
            </div>
          </div>

          {/* chip */}
          <div
            aria-hidden="true"
            className="h-8 w-11 rounded-md border border-amber-200/60"
            style={{
              background: "linear-gradient(135deg, #f6e3a8 0%, #d9b866 50%, #f1d68c 100%)",
            }}
          />

          <div>
            <p className="text-xs text-white/70">Available balance</p>
            <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {SAMPLE_CARD.balance}
            </p>
            <p className="mt-2 font-mono text-sm tracking-[0.2em] text-white/85">
              •••• •••• •••• {SAMPLE_CARD.last4}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Floating notification (sample) */}
      <motion.div
        {...enter(30, 6, 0.4)}
        className="absolute -bottom-6 -right-4 hidden w-60 rounded-2xl bg-card p-4 shadow-elev sm:block"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-coral text-white">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">Sent to Maya</p>
            <p className="text-[11px] text-muted-foreground">Just now</p>
          </div>
          <p className="font-display text-sm font-bold">−$120</p>
        </div>
      </motion.div>

      {SHOW_SAMPLE_LABELS && (
        <figcaption className="relative mt-3 text-center text-xs text-white/60">
          Sample card shown for illustration only.
        </figcaption>
      )}
    </figure>
  );
};
