import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, ArrowDownLeft, Landmark, CreditCard } from "lucide-react";

// Adjust the routes to match your pages
const items = [
  { to: "/dashboard/withdraw", label: "Send", icon: ArrowUpRight },
  { to: "/dashboard/deposit", label: "Receive", icon: ArrowDownLeft },
  { to: "/dashboard/loan", label: "Loan", icon: Landmark },
  { to: "/dashboard/cards", label: "Cards", icon: CreditCard },
];

const COUNT = items.length;
const SPRING = "cubic-bezier(0.34, 1.4, 0.64, 1)";

export const BottomGlassNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeIdx = items.findIndex(
    (i) => pathname === i.to || pathname.startsWith(i.to + "/")
  );

  // Overview only: hide the bar until the balance card has scrolled out of sight.
  const isOverview = pathname.replace(/\/$/, "") === "/dashboard";
  const [visible, setVisible] = useState(!isOverview);

  useEffect(() => {
    // Other pages: always show the bar
    if (!isOverview) {
      setVisible(true);
      return;
    }

    setVisible(false);
    let observer: IntersectionObserver | null = null;
    let tries = 0;

    // The card may not be mounted yet (skeleton/loading), so wait for it
    const timer = window.setInterval(() => {
      const card = document.querySelector("[data-balance-card]");
      if (card) {
        window.clearInterval(timer);
        observer = new IntersectionObserver(
          ([entry]) => {
            setVisible(
              !entry.isIntersecting && entry.boundingClientRect.bottom < 0
            );
          },
          // If you have a sticky header, use its height instead of 0px,
          // e.g. { rootMargin: "-64px 0px 0px 0px" }
          { rootMargin: "0px" }
        );
        observer.observe(card);
      } else if (++tries > 30) {
        // Card never appeared: show the bar so it isn't stuck hidden
        window.clearInterval(timer);
        setVisible(true);
      }
    }, 100);

    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
    };
  }, [isOverview]);

  // pos is the lens position (0..COUNT-1, fractional while dragging).
  // null means "rest on the active tab".
  const [pos, setPos] = useState<number | null>(null);
  const [pressing, setPressing] = useState(false);

  const lensIndex = pos ?? Math.max(activeIdx, 0);
  const nearIdx = Math.round(lensIndex);

  const posFromEvent = (e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const slot = (rect.width - 8) / COUNT;
    const f = (e.clientX - rect.left - 4) / slot - 0.5;
    return Math.max(0, Math.min(COUNT - 1, f));
  };

  const go = (i: number) => {
    if (pathname !== items[i].to) navigate(items[i].to);
  };

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPressing(true);
    setPos(posFromEvent(e));
  };

  const onMove = (e: React.PointerEvent) => {
    if (pressing) setPos(posFromEvent(e));
  };

  const onUp = (e: React.PointerEvent) => {
    if (!pressing) return;
    const i = Math.round(posFromEvent(e));
    setPressing(false);
    setPos(null);
    go(i);
  };

  const onCancel = () => {
    setPressing(false);
    setPos(null);
  };

  return (
    <nav
      aria-label="Quick actions"
      className="fixed inset-x-4 z-50 md:hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
        transform: visible ? "translateY(0)" : "translateY(160%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: `transform 450ms ${SPRING}, opacity 250ms`,
      }}
    >
      <div
        ref={wrapRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        className="relative mx-auto h-16 max-w-md select-none"
        style={{ touchAction: "none" }}
      >
        {/* Frosted capsule */}
        <div
          className="absolute inset-0 rounded-full border border-border bg-background/60 backdrop-blur-2xl backdrop-saturate-[1.8]"
          style={{
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.7)",
            transform: pressing ? "scale(1.045)" : "scale(1)",
            transition: `transform 450ms ${SPRING}`,
          }}
        />

        {/* Lens: grey pill at rest, clear glass while pressed */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-1 top-1 rounded-full"
          style={{
            left: 4,
            width: `calc((100% - 8px) / ${COUNT})`,
            zIndex: pressing ? 3 : 1,
            opacity: pressing || activeIdx >= 0 ? 1 : 0,
            transform: `translateX(${lensIndex * 100}%) scale(${
              pressing ? "1.22, 1.3" : "1, 1"
            })`,
            transition: pressing
              ? "transform 90ms ease-out, background 250ms, box-shadow 250ms"
              : `transform 500ms ${SPRING}, background 250ms, box-shadow 250ms, opacity 200ms`,
            background: pressing
              ? "rgba(255,255,255,0.1)"
              : "hsl(var(--foreground) / 0.1)",
            backdropFilter: pressing
              ? "blur(1px) saturate(1.5) brightness(1.1)"
              : "none",
            WebkitBackdropFilter: pressing
              ? "blur(1px) saturate(1.5) brightness(1.1)"
              : "none",
            boxShadow: pressing
              ? "inset 0 0 0 1px rgba(255,255,255,0.75), inset 3px 0 7px rgba(0,210,255,0.38), inset -3px 0 7px rgba(255,60,200,0.32), inset 0 -4px 8px rgba(255,255,255,0.35), 0 8px 22px rgba(0,0,0,0.2)"
              : "none",
          }}
        />

        {/* Tabs */}
        <ul
          className="absolute inset-1 z-[2] grid"
          style={{ gridTemplateColumns: `repeat(${COUNT}, 1fr)` }}
        >
          {items.map(({ to, label, icon: Icon }, i) => (
            <li key={to} className="flex">
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === activeIdx ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-foreground ${
                  i === activeIdx ? "font-semibold" : "font-medium"
                }`}
                style={{
                  transform: pressing && i === nearIdx ? "scale(1.14)" : "scale(1)",
                  transition: `transform 350ms ${SPRING}`,
                }}
              >
                <Icon className="h-[21px] w-[21px]" strokeWidth={2} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
