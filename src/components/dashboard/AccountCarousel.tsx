import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  TrendingUp,
  Target,
  Calendar,
  Clock,
  FileText,
  ShieldCheck,
  PiggyBank,
  Landmark,
  LineChart,
  MoreHorizontal,
  ArrowRight,
  X,
} from "lucide-react";

export type SecondaryType = "checking" | "savings" | "retirement";

interface SecondaryAccountState {
  opened: boolean;
  balance: number;
}

interface AccountCarouselProps {
  primarySlide: React.ReactNode;
  secondaryTypes: SecondaryType[];
  accountStates: Record<SecondaryType, SecondaryAccountState>;
  onOpenAccount: (type: SecondaryType) => void;
  maskedAccountNumber: string;
  currency: string;
  formatMoney: (amount: number, currency?: string) => string;
}

const PLACEHOLDER_META: Record<
  SecondaryType,
  {
    title: string;
    subtitle: string;
    gradient: string;
    dotColor: string;
    icon: typeof PiggyBank;
    shortName: string;
  }
> = {
  checking: {
    title: "Checking Account",
    shortName: "Checking",
    subtitle: "Open a checking account to spend, send, and pay bills.",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
    dotColor: "#2c5282",
    icon: Landmark,
  },
  savings: {
    title: "Savings Account",
    shortName: "Savings",
    subtitle: "Open a savings account to start earning and growing your balance.",
    gradient: "linear-gradient(135deg, #14532d 0%, #1f7a3f 100%)",
    dotColor: "#1f7a3f",
    icon: PiggyBank,
  },
  retirement: {
    title: "Retirement Account",
    shortName: "Retirement",
    subtitle: "Open a retirement account to track your 401(k), IRA, and long-term savings.",
    gradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
    dotColor: "#7c3aed",
    icon: LineChart,
  },
};

const PRIMARY_DOT_COLOR = "hsl(var(--primary))";
const PRIMARY_GRADIENT = "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)";

const calcOverdraft = (balance: number) => Math.min(balance * 0.15, 5000);
const SAVINGS_APR = 0.0275;
const calcMonthlyInterest = (balance: number) => (balance * SAVINGS_APR) / 12;
const RETIREMENT_TOTAL_RETURN_RATE = 0.1245;
const RETIREMENT_YTD_RETURN_RATE = 0.062;

const StatItem = ({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  valueClassName?: string;
}) => (
  <div>
    <div className="flex items-center gap-1.5 text-xs opacity-80">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
    <p className={`mt-1 text-sm font-semibold ${valueClassName || ""}`}>{value}</p>
  </div>
);

const OpenedAccountCard = ({
  type,
  balance,
  currency,
  formatMoney,
  maskedAccountNumber,
  onViewDetails,
}: {
  type: SecondaryType;
  balance: number;
  currency: string;
  formatMoney: (amount: number, currency?: string) => string;
  maskedAccountNumber: string;
  onViewDetails: () => void;
}) => {
  const meta = PLACEHOLDER_META[type];
  const Icon = meta.icon;
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl text-white shadow-elev"
      style={{ background: meta.gradient }}
    >
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex-1 p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
              {meta.title.toUpperCase()}
            </span>
          </div>
          <MoreHorizontal className="h-5 w-5 opacity-60" />
        </div>
        <p
          className="mt-5 font-sans font-bold tracking-tight truncate max-w-[260px] sm:max-w-[340px]"
          style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}
          title={formatMoney(balance, currency)}
        >
          {formatMoney(balance, currency)}
        </p>
        <div className="mt-6 border-t border-white/15 pt-5">
          {type === "checking" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatItem icon={Clock} label="Available overdraft" value={formatMoney(calcOverdraft(balance), currency)} />
              <StatItem icon={Clock} label="Last transaction" value="Today" />
              <StatItem icon={FileText} label="Pending" value={formatMoney(0, currency)} />
              <StatItem icon={ShieldCheck} label="Status" value="Active" valueClassName="text-emerald-300" />
            </div>
          )}
          {type === "savings" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatItem icon={TrendingUp} label="Interest rate" value="2.75% p.a." />
              <StatItem icon={Target} label="Savings goal" value="Not set" />
              <StatItem icon={Calendar} label="Added this month" value={formatMoney(calcMonthlyInterest(balance), currency)} />
              <StatItem icon={ShieldCheck} label="Status" value="Active" valueClassName="text-emerald-300" />
            </div>
          )}
          {type === "retirement" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatItem icon={TrendingUp} label="Total returns" value={`+${(RETIREMENT_TOTAL_RETURN_RATE * 100).toFixed(2)}%`} valueClassName="text-emerald-300" />
              <StatItem icon={LineChart} label="YTD returns" value={`+${(RETIREMENT_YTD_RETURN_RATE * 100).toFixed(2)}%`} valueClassName="text-emerald-300" />
              <StatItem icon={Target} label="Risk level" value="Moderate" />
              <StatItem icon={ShieldCheck} label="Status" value="Active" valueClassName="text-emerald-300" />
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onViewDetails}
        className="relative flex items-center justify-between border-t border-white/15 bg-black/10 px-8 py-4 text-sm font-semibold hover:bg-black/20 transition-colors"
      >
        <span>Account No. {maskedAccountNumber}</span>
        <span className="flex items-center gap-1.5">View details <ArrowRight className="h-3.5 w-3.5" /></span>
      </button>
    </div>
  );
};

const PlaceholderCard = ({ type, onOpen }: { type: SecondaryType; onOpen: () => void }) => {
  const meta = PLACEHOLDER_META[type];
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl p-8 text-white shadow-elev"
      style={{ background: meta.gradient }}
    >
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          <Lock className="h-3 w-3" /> Not opened
        </span>
        <p className="mt-4 text-xs uppercase tracking-widest opacity-70">{meta.title}</p>
        <p className="mt-2 max-w-[280px] text-sm opacity-90">{meta.subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="relative inline-flex w-fit items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/25 transition-colors"
      >
        Open {meta.title}
      </button>
    </div>
  );
};

const ConnectRetirementModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-elev" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Connect retirement accounts</h3>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Link an external 401(k), IRA, or other retirement account to track its balance and performance.
      </p>
      <div className="mt-5 space-y-2">
        {["401(k)", "Traditional IRA", "Roth IRA", "Other retirement plan"].map((label) => (
          <button key={label} type="button" disabled
            className="flex w-full cursor-not-allowed items-center justify-between rounded-2xl border border-border/60 px-4 py-3 text-left text-sm font-medium opacity-60"
          >
            {label} <ArrowRight className="h-4 w-4" />
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Connecting external accounts isn't available yet — coming soon.</p>
    </div>
  </div>
);

const AccountCarousel = ({
  primarySlide,
  secondaryTypes,
  accountStates,
  onOpenAccount,
  maskedAccountNumber,
  currency,
  formatMoney,
}: AccountCarouselProps) => {
  const [topIndex, setTopIndex] = useState(0);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build slides array: primary first, then secondary cards
  const slides: Array<{
    key: string;
    node: React.ReactNode;
    dotColor: string;
    label: string;
  }> = [
    {
      key: "primary",
      node: primarySlide,
      dotColor: PRIMARY_DOT_COLOR,
      label: "Primary",
    },
    ...secondaryTypes.map((t) => {
      const state = accountStates[t];
      const meta = PLACEHOLDER_META[t];
      return {
        key: t,
        label: meta.shortName,
        dotColor: meta.dotColor,
        node: state.opened ? (
          <OpenedAccountCard
            type={t}
            balance={state.balance}
            currency={currency}
            formatMoney={formatMoney}
            maskedAccountNumber={maskedAccountNumber}
            onViewDetails={() => {
              if (t === "retirement") setConnectModalOpen(true);
            }}
          />
        ) : (
          <PlaceholderCard type={t} onOpen={() => onOpenAccount(t)} />
        ),
      };
    }),
  ];

  const total = slides.length;

  const next = () => setTopIndex((i) => (i + 1) % total);

  // How many peek cards to show behind the top card (max 2)
  const peekCount = Math.min(2, total - 1);

  return (
    <div className="w-full min-w-0">
      {/* Stack area — position relative, padded bottom to show peek cards */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ paddingBottom: `${peekCount * 18}px` }}
      >
        <AnimatePresence initial={false}>
          {slides.map((slide, idx) => {
            // offset: 0 = top card, 1 = first peeking card, 2 = second peeking card
            const offset = (idx - topIndex + total) % total;

            // Only render top card + peek cards
            if (offset > peekCount) return null;

            const isTop = offset === 0;

            // Stacking transform: each card behind shifts down and scales down slightly
            const translateY = offset * 14;
            const scale = 1 - offset * 0.04;
            const opacity = isTop ? 1 : 1 - offset * 0.15;
            const zIndex = total - offset;

            return (
              <motion.div
                key={slide.key}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 400) {
                    next();
                  }
                }}
                initial={false}
                animate={{
                  y: translateY,
                  scale,
                  opacity,
                  x: 0,
                  rotate: 0,
                }}
                exit={{
                  x: 500,
                  opacity: 0,
                  rotate: 8,
                  transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
                }}
                whileDrag={{ rotate: 3, cursor: "grabbing", scale: scale * 1.01 }}
                transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: offset === 0 ? "relative" : "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex,
                  transformOrigin: "bottom center",
                  cursor: isTop ? "grab" : "default",
                  pointerEvents: isTop ? "auto" : "none",
                }}
              >
                {/* Card content */}
                <div className="w-full overflow-hidden rounded-3xl" style={{ minHeight: "260px" }}>
                  {slide.node}
                </div>

                {/* Card name label shown on peeking cards */}
                {!isTop && (
                  <div
                    className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-1"
                    style={{ zIndex: zIndex + 1 }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                      {slide.label}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              aria-label={`Go to ${slide.label}`}
              onClick={() => setTopIndex(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === topIndex ? "1.5rem" : "0.375rem",
                backgroundColor: i === topIndex ? slide.dotColor : "hsl(var(--border))",
              }}
            />
          ))}
        </div>
      )}

      {/* Swipe hint */}
      {total > 1 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Swipe or tap a dot to switch accounts
        </p>
      )}

      {connectModalOpen && (
        <ConnectRetirementModal onClose={() => setConnectModalOpen(false)} />
      )}
    </div>
  );
};

export default AccountCarousel;
