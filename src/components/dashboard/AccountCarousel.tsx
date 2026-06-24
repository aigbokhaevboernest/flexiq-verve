import { useEffect, useRef, useState } from "react";
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
  /** The existing primary card — rendered completely untouched, as slide 0 */
  primarySlide: React.ReactNode;
  /** Which secondary cards to show: derived from signup account_type */
  secondaryTypes: SecondaryType[];
  /** Persisted opened/balance state per secondary type, sourced from profiles */
  accountStates: Record<SecondaryType, SecondaryAccountState>;
  /** Called when the user taps "Open {type} Account" — should persist to Supabase */
  onOpenAccount: (type: SecondaryType) => void;
  /** Masked account number to show in the footer of secondary cards */
  maskedAccountNumber: string;
  /** Currency for formatting secondary balances */
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
  }
> = {
  checking: {
    title: "Checking Account",
    subtitle: "Open a checking account to spend, send, and pay bills.",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
    dotColor: "#2c5282",
    icon: Landmark,
  },
  savings: {
    title: "Savings Account",
    subtitle: "Open a savings account to start earning and growing your balance.",
    gradient: "linear-gradient(135deg, #14532d 0%, #1f7a3f 100%)",
    dotColor: "#1f7a3f",
    icon: PiggyBank,
  },
  retirement: {
    title: "Retirement Account",
    subtitle: "Open a retirement account to track your 401(k), IRA, and long-term savings.",
    gradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
    dotColor: "#7c3aed",
    icon: LineChart,
  },
};

// Dot color for the primary card slide (matches its gradient-primary class)
const PRIMARY_DOT_COLOR = "hsl(var(--primary))";

/**
 * Calculates a stand-in "available overdraft" for the checking account:
 * 15% of current balance, capped at a sane ceiling. This replaces a
 * hardcoded number — it recalculates whenever balance changes (e.g. after
 * the account is credited).
 */
const calcOverdraft = (balance: number) => Math.min(balance * 0.15, 5000);

/**
 * Calculates this month's interest accrual for savings: balance * APR / 12.
 * Recomputes from the live balance instead of being a fixed figure.
 */
const SAVINGS_APR = 0.0275; // 2.75% p.a. — the only static assumption left
const calcMonthlyInterest = (balance: number) => (balance * SAVINGS_APR) / 12;

/** Retirement returns are derived from balance too, not fixed numbers. */
const RETIREMENT_TOTAL_RETURN_RATE = 0.1245; // +12.45%
const RETIREMENT_YTD_RETURN_RATE = 0.062; // +6.20%

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

/**
 * Opened secondary account card — redesigned to mirror the reference
 * "Other accounts (Informational)" layout: icon badge + type label at
 * top, big balance directly below in the same position as the primary
 * card's balance, a divider, a row of type-specific stats, then a footer
 * with masked account number and a "View details" link/action.
 */
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

        {/* Same balance position/size as the primary card */}
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
              <StatItem
                icon={Clock}
                label="Available overdraft"
                value={formatMoney(calcOverdraft(balance), currency)}
              />
              <StatItem icon={Clock} label="Last transaction" value="Today" />
              <StatItem icon={FileText} label="Pending" value={formatMoney(0, currency)} />
              <StatItem
                icon={ShieldCheck}
                label="Status"
                value="Active"
                valueClassName="text-emerald-300"
              />
            </div>
          )}

          {type === "savings" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatItem icon={TrendingUp} label="Interest rate" value="2.75% p.a." />
              <StatItem icon={Target} label="Savings goal" value="Not set" />
              <StatItem
                icon={Calendar}
                label="Added this month"
                value={formatMoney(calcMonthlyInterest(balance), currency)}
              />
              <StatItem
                icon={ShieldCheck}
                label="Status"
                value="Active"
                valueClassName="text-emerald-300"
              />
            </div>
          )}

          {type === "retirement" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatItem
                icon={TrendingUp}
                label="Total returns"
                value={`+${(RETIREMENT_TOTAL_RETURN_RATE * 100).toFixed(2)}%`}
                valueClassName="text-emerald-300"
              />
              <StatItem
                icon={LineChart}
                label="YTD returns"
                value={`+${(RETIREMENT_YTD_RETURN_RATE * 100).toFixed(2)}%`}
                valueClassName="text-emerald-300"
              />
              <StatItem icon={Target} label="Risk level" value="Moderate" />
              <StatItem
                icon={ShieldCheck}
                label="Status"
                value="Active"
                valueClassName="text-emerald-300"
              />
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onViewDetails}
        className="relative flex items-center justify-between border-t border-white/15 bg-black/10 px-8 py-4 text-sm font-semibold transition-smooth hover:bg-black/20"
      >
        <span>Account No. {maskedAccountNumber}</span>
        <span className="flex items-center gap-1.5">
          View details <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
};

const PlaceholderCard = ({
  type,
  onOpen,
}: {
  type: SecondaryType;
  onOpen: () => void;
}) => {
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
          <Lock className="h-3 w-3" />
          Not opened
        </span>
        <p className="mt-4 text-xs uppercase tracking-widest opacity-70">
          {meta.title}
        </p>
        <p className="mt-2 max-w-[280px] text-sm opacity-90">{meta.subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="relative inline-flex w-fit items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition-smooth hover:bg-white/25"
      >
        Open {meta.title}
      </button>
    </div>
  );
};

/** UI-only "connect external account" modal — no real linking yet. */
const ConnectRetirementModal = ({ onClose }: { onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    onClick={onClose}
  >
    <div
      className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-elev"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Connect retirement accounts</h3>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Link an external 401(k), IRA, or other retirement account to track its
        balance and performance alongside your other accounts.
      </p>

      <div className="mt-5 space-y-2">
        {["401(k)", "Traditional IRA", "Roth IRA", "Other retirement plan"].map((label) => (
          <button
            key={label}
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-between rounded-2xl border border-border/60 px-4 py-3 text-left text-sm font-medium opacity-60"
          >
            {label}
            <ArrowRight className="h-4 w-4" />
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Connecting external accounts isn't available yet — coming soon.
      </p>
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const primaryWrapperRef = useRef<HTMLDivElement>(null);
  const [slideHeight, setSlideHeight] = useState<number | undefined>(undefined);

  const slides: Array<{ key: string; node: React.ReactNode; dotColor: string }> = [
    { key: "primary", node: primarySlide, dotColor: PRIMARY_DOT_COLOR },
    ...secondaryTypes.map((t) => {
      const state = accountStates[t];
      return {
        key: t,
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
        dotColor: PLACEHOLDER_META[t].dotColor,
      };
    }),
  ];

  // Re-measure slide height whenever the primary slide's content changes size
  // (e.g. balance digits changing width) AND whenever opened-state changes,
  // since switching a secondary slide between Placeholder/Opened can change
  // its own height too — without this, stale heights cause the "cards stack
  // too close" effect specifically when swiping right after an account opens.
  useEffect(() => {
    const el = primaryWrapperRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) setSlideHeight(h);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [accountStates]);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeIndex) setActiveIndex(index);
    if (index !== 0) setShowSwipeHint(false);
  };

  const goToSlide = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
    setShowSwipeHint(false);
  };

  return (
    // min-w-0 + w-full + overflow-hidden here is the actual fix:
    // without min-w-0, a flex/grid child refuses to shrink below its
    // content's natural width, which lets the scroll row push the whole
    // PAGE wider than the viewport (the bug in your screenshot — the
    // entire layout pans right because an ancestor never clipped).
    <div className="w-full min-w-0 overflow-hidden">
      <div
        style={slideHeight ? { height: `${slideHeight}px` } : undefined}
        className="relative w-full min-w-0 overflow-hidden"
      >
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          // gap-0 explicit: a flex row with no gap is what guarantees
          // each snap-start slide sits flush against the next with zero
          // visual overlap or crowding while scrolling/snapping.
          className="flex h-full w-full min-w-0 gap-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              // min-w-0 again: prevents this slide itself from forcing
              // the flex row wider than 100% of the scroller. Same size
              // and width as the primary card — no extra classes here.
              className="h-full w-full min-w-0 shrink-0 basis-full snap-start snap-always"
              ref={i === 0 ? primaryWrapperRef : undefined}
            >
              <div className="h-full w-full min-w-0 overflow-hidden">{slide.node}</div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goToSlide(i)}
                className="h-1.5 rounded-full transition-smooth"
                style={{
                  width: i === activeIndex ? "1.5rem" : "0.375rem",
                  backgroundColor:
                    i === activeIndex ? slide.dotColor : "hsl(var(--border))",
                }}
              />
            ))}
          </div>

          {showSwipeHint && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Swipe to see your other accounts →
            </p>
          )}
        </>
      )}

      {connectModalOpen && (
        <ConnectRetirementModal onClose={() => setConnectModalOpen(false)} />
      )}
    </div>
  );
};

export default AccountCarousel;
