import { useEffect, useRef, useState } from "react";
import { Lock, Send, ArrowDownLeft } from "lucide-react";

interface AccountCarouselProps {
  /** The existing primary card — rendered completely untouched, as slide 0 */
  primarySlide: React.ReactNode;
  /** Which secondary placeholder cards to show: derived from signup account_type */
  secondaryTypes: Array<"checking" | "savings">;
}

const PLACEHOLDER_META: Record<
  "checking" | "savings",
  { title: string; subtitle: string; gradient: string; dotColor: string }
> = {
  checking: {
    title: "Checking Account",
    subtitle: "Open a checking account to spend, send, and pay bills.",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
    dotColor: "#2c5282",
  },
  savings: {
    title: "Savings Account",
    subtitle: "Open a savings account to start earning and growing your balance.",
    gradient: "linear-gradient(135deg, #14532d 0%, #1f7a3f 100%)",
    dotColor: "#1f7a3f",
  },
};

// Dot color for the primary card slide (matches its gradient-primary class)
const PRIMARY_DOT_COLOR = "hsl(var(--primary))";

/** Shown once an account is "opened" — mirrors the primary card's balance layout at €0.00 */
const OpenedAccountCard = ({ type }: { type: "checking" | "savings" }) => {
  const meta = PLACEHOLDER_META[type];
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl p-8 text-white shadow-elev"
      style={{ background: meta.gradient }}
    >
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

      <div className="relative">
        <p className="text-xs uppercase tracking-widest opacity-70">Account</p>
        <p className="mt-1 text-lg font-bold">{meta.title}</p>

        <p className="mt-6 text-xs uppercase tracking-widest opacity-70">
          Available Balance
        </p>
        <p className="mt-2 font-sans text-4xl font-bold tracking-tight">
          €0.00
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-3 text-center backdrop-blur transition-smooth hover:bg-white/20"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <Send className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium">Send</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 p-3 text-center backdrop-blur transition-smooth hover:bg-white/20"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <ArrowDownLeft className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium">Receive</span>
        </button>
      </div>
    </div>
  );
};

const PlaceholderCard = ({
  type,
  onOpen,
}: {
  type: "checking" | "savings";
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

const AccountCarousel = ({ primarySlide, secondaryTypes }: AccountCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openedTypes, setOpenedTypes] = useState<Record<string, boolean>>({});
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const primaryWrapperRef = useRef<HTMLDivElement>(null);
  const [slideHeight, setSlideHeight] = useState<number | undefined>(undefined);

  const slides: Array<{ key: string; node: React.ReactNode; dotColor: string }> = [
    { key: "primary", node: primarySlide, dotColor: PRIMARY_DOT_COLOR },
    ...secondaryTypes.map((t) => ({
      key: t,
      node: openedTypes[t] ? (
        <OpenedAccountCard type={t} />
      ) : (
        <PlaceholderCard
          type={t}
          onOpen={() => setOpenedTypes((prev) => ({ ...prev, [t]: true }))}
        />
      ),
      dotColor: PLACEHOLDER_META[t].dotColor,
    })),
  ];

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
  }, []);

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
          className="flex h-full w-full min-w-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              // min-w-0 again: prevents this slide itself from forcing
              // the flex row wider than 100% of the scroller.
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
          {/* mt-5 instead of mt-3 — more breathing room between card and dots */}
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
    </div>
  );
};

export default AccountCarousel;
