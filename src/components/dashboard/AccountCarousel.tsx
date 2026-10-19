import { useState } from "react";
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
  primaryLabel?: string;
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

// isTop controls whether the real bottom bar shows, or just the account name.
const OpenedAccountCard = ({
  type,
  balance,
  currency,
  formatMoney,
  maskedAccountNumber,
  onViewDetails,
  isTop,
}: {
  type: SecondaryType;
  balance: number;
  currency: string;
  formatMoney: (amount: number, currency?: string) => string;
  maskedAccountNumber: string;
  onViewDetails: () => void;
  isTop: boolean;
}) => {
  const meta = PLACEHOLDER_META[type];
  const Icon = meta.icon;
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl text-white shadow-2xl"
      style={{ background: meta.gradient }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      {isTop ? (
        <>
          <div className="relative flex-1 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">
                  {meta.title.toUpperCase()}
                </span>
              </div>
              <MoreHorizontal className="h-5 w-5 opacity-60" />
            </div>
            <p
              className="mt-4 font-sans font-bold tracking-tight truncate"
              style={{ fontSize: "clamp(1.75rem, 5vw, 2.75rem)" }}
              title={formatMoney(balance, currency)}
            >
              {formatMoney(balance, currency)}
            </p>
            <div className="mt-4 border-t border-white/15 pt-4">
              {type === "checking" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatItem icon={Clock} label="Overdraft" value={formatMoney(calcOverdraft(balance), currency)} />
                  <StatItem icon={Clock} label="Last txn" value="—" />
                  <StatItem icon={FileText} label="Pending" value={formatMoney(0, currency)} />
                  <StatItem icon={ShieldCheck} label="Status" value="Active" valueClassName="text-emerald-300" />
                </div>
              )}
              {type === "savings" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatItem icon={TrendingUp} label="Interest" value="2.75% p.a." />
                  <StatItem icon={Target} label="Goal" value="Not set" />
                  <StatItem icon={Calendar} label="This month" value={formatMoney(calcMonthlyInterest(balance), currency)} />
                  <StatItem icon={ShieldCheck} label="Status" value="Active" valueClassName="text-emerald-300" />
                </div>
              )}
              {type === "retirement" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatItem icon={TrendingUp} label="Total return" value={`+${(RETIREMENT_TOTAL_RETURN_RATE * 100).toFixed(2)}%`} valueClassName="text-emerald-300" />
                  <StatItem icon={LineChart} label="YTD" value={`+${(RETIREMENT_YTD_RETURN_RATE * 100).toFixed(2)}%`} valueClassName="text-emerald-300" />
                  <StatItem icon={Target} label="Risk" value="Moderate" />
                  <StatItem icon={ShieldCheck} label="Status" value="Active" valueClassName="text-emerald-300" />
                </div>
              )}
            </div>
          </div>

          {type === "retirement" ? (
            // Retirement: no account number, no "View details" — just the
            // connect label and the arrow.
            <button
              type="button"
              onClick={onViewDetails}
              className="relative flex items-center justify-between border-t border-white/15 bg-black/10 px-6 py-3.5 text-[13px] font-semibold hover:bg-black/20 transition-colors"
            >
              <span>Connect an account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onViewDetails}
              className="relative flex items-center justify-between border-t border-white/15 bg-black/10 px-6 py-3.5 text-[13px] font-semibold hover:bg-black/20 transition-colors"
            >
              <span>Account No. {maskedAccountNumber}</span>
              <span className="flex items-center gap-1.5">View details <ArrowRight className="h-3.5 w-3.5" /></span>
            </button>
          )}
        </>
      ) : (
        // Peeking state: only the name shows
        <div className="relative flex h-full items-end justify-center pb-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/85">
            {meta.shortName}
          </span>
        </div>
      )}
    </div>
  );
};

const PlaceholderCard = ({ type, onOpen, isTop }: { type: SecondaryType; onOpen: () => void; isTop: boolean }) => {
  const meta = PLACEHOLDER_META[type];
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl p-6 text-white shadow-2xl"
      style={{ background: meta.gradient }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      {isTop ? (
        <>
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
        </>
      ) : (
        <div className="relative flex h-full items-end justify-center pb-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/85">
            {meta.shortName}
          </span>
        </div>
      )}
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
    </div>
  </div>
);

const AccountCarousel = ({
  primarySlide,
  primaryLabel = "Primary",
  secondaryTypes,
  accountStates,
  onOpenAccount,
  maskedAccountNumber,
  currency,
  formatMoney,
}: AccountCarouselProps) => {
  const [topIndex, setTopIndex] = useState(0);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const slides = [
    { key: "primary", type: null as SecondaryType | null, dotColor: PRIMARY_DOT_COLOR, label: primaryLabel },
    ...secondaryTypes.map((t) => ({
      key: t,
      type: t,
      dotColor: PLACEHOLDER_META[t].dotColor,
      label: PLACEHOLDER_META[t].shortName,
    })),
  ];

  const total = slides.length;
  const next = () => setTopIndex((i) => (i + 1) % total);

  return (
    <div className="w-full min-w-0">
      <div className="relative w-full" style={{ minHeight: "390px" }}>
        <AnimatePresence initial={false}>
          {slides.map((slide, idx) => {
            const offset = (idx - topIndex + total) % total;
            if (offset > 2) return null;
            const isTop = offset === 0;

            const t = slide.type;
            const state = t ? accountStates[t] : null;

            return (
              <motion.div
                key={slide.key}
                drag={isTop ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 100) next();
                }}
                initial={{ scale: 1 - offset * 0.05, y: offset * 14, opacity: 1, x: 0, rotate: 0 }}
                animate={{ scale: 1 - offset * 0.05, y: offset * 14, opacity: 1 - offset * 0.2, x: 0, rotate: 0 }}
                exit={{ x: 400, opacity: 0, rotate: 12, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } }}
                whileDrag={{ rotate: 6, cursor: "grabbing" }}
                transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                className={`absolute inset-0 ${isTop ? "cursor-grab" : ""}`}
                style={{ zIndex: total - offset }}
              >
                {t === null ? (
                  primarySlide
                ) : state?.opened ? (
                  <OpenedAccountCard
                    type={t}
                    balance={state.balance}
                    currency={currency}
                    formatMoney={formatMoney}
                    maskedAccountNumber={maskedAccountNumber}
                    onViewDetails={() => { if (t === "retirement") setConnectModalOpen(true); }}
                    isTop={isTop}
                  />
                ) : (
                  <PlaceholderCard type={t} onOpen={() => onOpenAccount(t)} isTop={isTop} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.key}
            onClick={() => setTopIndex(i)}
            aria-label={`Show ${slide.label}`}
            className="h-2 rounded-full transition-all"
            style={{
              width: i === topIndex ? "1.5rem" : "0.5rem",
              backgroundColor: i === topIndex ? slide.dotColor : "hsl(var(--muted))",
            }}
          />
        ))}
      </div>
      {total > 1 && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Swipe or tap a dot to switch accounts
        </p>
      )}

      {connectModalOpen && <ConnectRetirementModal onClose={() => setConnectModalOpen(false)} />}
    </div>
  );
};

export default AccountCarousel;
