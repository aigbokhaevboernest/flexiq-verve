import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Home,
  Landmark,
  CreditCard,
} from "lucide-react";

// `to` is where the tab goes; `match` keeps the tab highlighted on sub-pages.
// `exact` stops Home from lighting up on every /dashboard/* page.
const items = [
  { to: "/dashboard/send/wire", match: "/dashboard/send", label: "Send", icon: ArrowUpRight },
  { to: "/dashboard/receive", match: "/dashboard/receive", label: "Receive", icon: ArrowDownLeft },
  { to: "/dashboard", match: "/dashboard", exact: true, label: "Home", icon: Home },
  { to: "/dashboard/loans", match: "/dashboard/loans", label: "Loan", icon: Landmark },
  { to: "/dashboard/cards", match: "/dashboard/cards", label: "Cards", icon: CreditCard },
];

const COUNT = items.length;
const SPRING = "cubic-bezier(0.34, 1.4, 0.64, 1)";

type Props = {
  /** Pass true while the mobile sidebar is open to tuck the bar away. */
  hidden?: boolean;
};

export const BottomGlassNav = ({ hidden = false }: Props) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const wrapRef = useRef<HTMLDivElement>(null);

  const clean = pathname.replace(/\/$/, "");
  const activeIdx = items.findIndex((i) =>
    i.exact ? clean === i.match : clean === i.match || clean.startsWith(i.match + "/")
  );

  // Dashboard home only: hidden at the top, slides in once you scroll down,
  // slides away again when you scroll back near the top.
  const isHome = clean === "/dashboard";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    const update = () => {
      const y = window.scrollY;
      // Two thresholds so it doesn't flicker around a single point
      setScrolled((prev) => (prev ? y > 40 : y > 90));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [isHome]);

  // Every other dashboard page: always on. Sidebar open: always off.
  const shown = (isHome ? scrolled : true) && !hidden;

  // pos is the lens position (0..COUNT-1, fractional while dragging).
  // null means "rest on the active tab".
  const [pos, setPos] = useState<number | null>(null);
  const [pressing, setPressing] = useState(false);

  useEffect(() => {
    if (!shown) {
      setPressing(false);
      setPos(null);
    }
  }, [shown]);

  const lensIndex = pos ?? Math.max(activeIdx, 0);
  const nearIdx = Math.round(lensIndex);

  const posFromEvent = (e: React.PointerEvent) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const slot = (rect.width - 8) / COUNT;
    const f = (e.clientX - rect.left - 4) / slot - 0.5;
    return Math.max(0, Math.min(COUNT - 1, f));
  };

  const go = (i: number) => {
    if (clean !== items[i].to) navigate(items[i].to);
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
      aria-hidden={!shown}
      className="fixed inset-x-4 z-50 md:hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)",
        transformOrigin: "50% 100%",
        transform: shown
          ? "translateY(0) scale(1)"
          : "translateY(190%) scale(0.82)",
        opacity: shown ? 1 : 0,
        // `none` (not blur(0)) when shown: any filter on an ancestor
        // would switch off the glass blur of the bar underneath it.
        filter: shown ? "none" : "blur(10px)",
        pointerEvents: shown ? "auto" : "none",
        transition: shown
          ? `transform 650ms ${SPRING}, opacity 300ms ease-out, filter 400ms ease-out`
          : "transform 380ms cubic-bezier(0.4, 0, 1, 1), opacity 260ms ease-in, filter 300ms ease-in",
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
        {/* Dark frosted capsule */}
        <div
          className="absolute inset-0 rounded-full backdrop-blur-2xl backdrop-saturate-[1.8]"
          style={{
            background: "rgba(34, 34, 38, 0.62)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow:
              "0 10px 34px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)",
            transform: pressing ? "scale(1.045)" : "scale(1)",
            transition: `transform 450ms ${SPRING}`,
          }}
        />

        {/* Lens: soft grey pill at rest, clear glass while pressed */}
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
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.14)",
            backdropFilter: pressing
              ? "blur(1px) saturate(1.5) brightness(1.15)"
              : "none",
            WebkitBackdropFilter: pressing
              ? "blur(1px) saturate(1.5) brightness(1.15)"
              : "none",
            boxShadow: pressing
              ? "inset 0 0 0 1px rgba(255,255,255,0.55), inset 3px 0 7px rgba(0,210,255,0.38), inset -3px 0 7px rgba(255,60,200,0.32), inset 0 -4px 8px rgba(255,255,255,0.22), 0 8px 22px rgba(0,0,0,0.45)"
              : "none",
          }}
        />

        {/* Tabs: each one pops in with a small stagger */}
        <ul
          className="absolute inset-1 z-[2] grid"
          style={{ gridTemplateColumns: `repeat(${COUNT}, 1fr)` }}
        >
          {items.map(({ to, label, icon: Icon }, i) => {
            const delay = shown ? 120 + i * 50 : 0;
            return (
              <li
                key={to}
                className="flex"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown
                    ? "translateY(0) scale(1)"
                    : "translateY(16px) scale(0.7)",
                  transition: `transform 520ms ${SPRING} ${delay}ms, opacity 250ms ease-out ${delay}ms`,
                }}
              >
                <button
                  type="button"
                  tabIndex={shown ? 0 : -1}
                  onClick={() => go(i)}
                  aria-current={i === activeIdx ? "page" : undefined}
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                    i === activeIdx ? "font-semibold" : "font-medium"
                  }`}
                  style={{
                    color:
                      i === activeIdx || (pressing && i === nearIdx)
                        ? "#ffffff"
                        : "rgba(255,255,255,0.72)",
                    transform:
                      pressing && i === nearIdx ? "scale(1.14)" : "scale(1)",
                    transition: `transform 350ms ${SPRING}, color 200ms`,
                  }}
                >
                  <Icon className="h-[21px] w-[21px]" strokeWidth={2} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
