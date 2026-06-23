import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";

interface AccountCarouselProps {
  /** The existing primary card — rendered completely untouched, as slide 0 */
  primarySlide: React.ReactNode;
  /** Which secondary placeholder cards to show: derived from signup account_type */
  secondaryTypes: Array<"checking" | "savings">;
}

const PLACEHOLDER_META: Record<
  "checking" | "savings",
  { title: string; subtitle: string; gradient: string }
> = {
  checking: {
    title: "Checking Account",
    subtitle: "Open a checking account to spend, send, and pay bills.",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)",
  },
  savings: {
    title: "Savings Account",
    subtitle: "Open a savings account to start earning and growing your balance.",
    gradient: "linear-gradient(135deg, #14532d 0%, #1f7a3f 100%)",
  },
};

/** A placeholder slide for an account type the user hasn't opened yet. */
const PlaceholderCard = ({ type }: { type: "checking" | "savings" }) => {
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
        className="relative inline-flex w-fit items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur transition-smooth hover:bg-white/25"
      >
        Open {meta.title}
      </button>
    </div>
  );
};

const AccountCarousel = ({ primarySlide, secondaryTypes }: AccountCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const primaryWrapperRef = useRef<HTMLDivElement>(null);
  const [slideHeight, setSlideHeight] = useState<number | undefined>(undefined);

  const slides: Array<{ key: string; node: React.ReactNode }> = [
    { key: "primary", node: primarySlide },
    ...secondaryTypes.map((t) => ({ key: t, node: <PlaceholderCard type={t} /> })),
  ];

  // Measure the primary card's rendered height so every secondary slide
  // matches it EXACTLY. This is what prevents the carousel from stretching
  // or collapsing on iOS/Android — height is explicit, not inherited via flex.
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

  // Track which slide is active based on scroll position (for the dots).
  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== activeIndex) setActiveIndex(index);
  };

  const goToSlide = (index: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  return (
    <div className="w-full">
      {/*
        Outer wrapper: explicit height once measured, so the scroll
        container never stretches its children. Before height is known
        we render naturally (primary slide's own height drives layout).
      */}
      <div
        style={slideHeight ? { height: `${slideHeight}px` } : undefined}
        className="relative w-full"
      >
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              // shrink-0 + explicit basis stops flexbox from stretching/squashing
              // slide width on iOS Safari and Android Chrome alike.
              className="h-full w-full shrink-0 basis-full snap-start snap-always"
              ref={i === 0 ? primaryWrapperRef : undefined}
            >
              {/* h-full here only works because the parent now has an explicit
                  pixel height (set above) — not because of flex:1 anywhere. */}
              <div className="h-full w-full">{slide.node}</div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goToSlide(i)}
              className={`h-1.5 rounded-full transition-smooth ${
                i === activeIndex ? "w-6 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountCarousel;
