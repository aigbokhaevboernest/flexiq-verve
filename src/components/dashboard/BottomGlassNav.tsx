import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Home,
  Landmark,
  CreditCard,
} from "lucide-react";

// Set to true to always use the smoky dark glass with white icons,
// whatever the site theme is.
const FORCE_DARK_STYLE = false;

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

// Glass looks: clear, light blur so the page shows through.
const THEMES = {
  dark: {
    fg: "255,255,255",
    rim: "255,255,255",
    rimBase: 0.3,
    rimGain: 0.3,
    bar: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05)), rgba(28,28,32,0.2)",
    barBorder: "1px solid rgba(255,255,255,0.2)",
    barShadow:
      "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(255,255,255,0.1), inset 0 0 18px rgba(255,255,255,0.06)",
    lens: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.1))",
    iconFilter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
  },
  light: {
    fg: "17,17,20",
    rim: "60,60,70",
    rimBase: 0.1,
    rimGain: 0.25,
    bar: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.25)), rgba(255,255,255,0.1)",
    barBorder: "1px solid rgba(255,255,255,0.75)",
    barShadow:
      "0 10px 30px rgba(20,20,40,0.16), 0 0 0 0.5px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.5), inset 0 0 18px rgba(255,255,255,0.35)",
    lens: "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.18) 45%, rgba(255,255,255,0.4))",
    iconFilter: "drop-shadow(0 1px 1px rgba(255,255,255,0.6))",
  },
};

type Props = {
  /** Pass true while the mobile sidebar is open to tuck the bar away. */
  hidden?: boolean;
};

// Physics state lives in a ref and is written straight to the DOM every
// frame, so dragging never triggers React re-renders.
type Sim = {
  x: number; // lens position (0..COUNT-1, fractional)
  v: number; // lens velocity (tabs per second)
  target: number;
  p: number; // press amount 0..1 (springs too)
  pv: number;
  pT: number;
  dragging: boolean;
  raf: number;
  last: number;
};

export const BottomGlassNav = ({ hidden = false }: Props) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const wrapRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Follow the site theme (the layout toggles the `dark` class on <html>)
  const [dark, setDark] = useState(
    () =>
      FORCE_DARK_STYLE ||
      (typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark"))
  );
  useEffect(() => {
    if (FORCE_DARK_STYLE) {
      setDark(true);
      return;
    }
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  const theme = dark ? THEMES.dark : THEMES.light;
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const clean = pathname.replace(/\/$/, "");
  const activeIdx = items.findIndex((i) =>
    i.exact ? clean === i.match : clean === i.match || clean.startsWith(i.match + "/")
  );
  const activeRef = useRef(activeIdx);
  activeRef.current = activeIdx;

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

  const sim = useRef<Sim>({
    x: Math.max(activeIdx, 0),
    v: 0,
    target: Math.max(activeIdx, 0),
    p: 0,
    pv: 0,
    pT: 0,
    dragging: false,
    raf: 0,
    last: 0,
  });

  const reduceMotion = useRef(false);
  useEffect(() => {
    reduceMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }, []);

  // Write the current physics state to the DOM.
  const apply = useCallback(() => {
    const s = sim.current;
    const th = themeRef.current;
    const lens = lensRef.current;
    if (!lens) return;

    const speed = Math.abs(s.v);
    // Stretch along the direction of travel, squash a touch vertically
    const stretch = Math.min(0.6, speed * 0.09);
    const sx = 1.22 + 0.18 * s.p + stretch;
    const sy = 1.0 + 0.12 * s.p - stretch * 0.2;
    lens.style.transform = `translate3d(${s.x * 100}%,0,0) scale(${sx},${sy})`;
    lens.style.opacity =
      activeRef.current >= 0 || s.dragging || s.p > 0.02 ? "1" : "0";

    // Refraction fringes get stronger the faster the lens moves
    const f = Math.min(1, speed * 0.28 + s.p * 0.55);
    lens.style.boxShadow = [
      `inset 0 0 0 1px rgba(${th.rim},${th.rimBase + th.rimGain * f})`,
      `inset 3px 0 7px rgba(0,210,255,${0.12 + 0.4 * f})`,
      `inset -3px 0 7px rgba(255,60,200,${0.1 + 0.35 * f})`,
      `inset 0 -3px 7px rgba(255,220,80,${0.06 + 0.2 * f})`,
      `inset 0 2px 6px rgba(255,255,255,${0.25 + 0.15 * f})`,
      `0 6px 20px rgba(0,0,0,${0.12 + 0.2 * f})`,
    ].join(",");

    if (barRef.current) {
      barRef.current.style.transform = `scale(${1 + 0.045 * s.p})`;
    }

    // Icon under the lens grows; neighbours ease off as it passes
    btnRefs.current.forEach((el, i) => {
      if (!el) return;
      const prox = Math.max(0, 1 - Math.abs(i - s.x));
      el.style.transform = `scale(${1 + prox * (0.1 + 0.1 * s.p)})`;
      el.style.color = `rgba(${th.fg},${0.68 + 0.32 * prox})`;
    });
  }, []);

  const kick = useCallback(() => {
    const s = sim.current;
    if (s.raf) return;
    s.last = performance.now();

    const step = (t: number) => {
      const dt = Math.min(0.032, (t - s.last) / 1000 || 0.016);
      s.last = t;

      // Tight while a finger is dragging, softer and bouncier on release
      const k = s.dragging ? 520 : 240;
      const c = reduceMotion.current
        ? 2 * Math.sqrt(k)
        : s.dragging
        ? 38
        : 21;

      s.v += (k * (s.target - s.x) - c * s.v) * dt;
      s.x += s.v * dt;
      s.pv += (420 * (s.pT - s.p) - 24 * s.pv) * dt;
      s.p += s.pv * dt;

      const settled =
        Math.abs(s.target - s.x) < 0.0005 &&
        Math.abs(s.v) < 0.002 &&
        Math.abs(s.pT - s.p) < 0.001 &&
        Math.abs(s.pv) < 0.002;

      if (settled) {
        s.x = s.target;
        s.v = 0;
        s.p = s.pT;
        s.pv = 0;
        s.raf = 0;
        apply();
        return;
      }
      apply();
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  }, [apply]);

  // First paint, and whenever the theme flips: repaint icon colours
  useEffect(() => {
    apply();
  }, [apply, dark]);

  useEffect(() => () => cancelAnimationFrame(sim.current.raf), []);

  // Route changed (or tab tapped): glide the lens to the active tab
  useEffect(() => {
    const s = sim.current;
    if (s.dragging) return;
    s.target = Math.max(activeIdx, 0);
    kick();
  }, [activeIdx, kick]);

  // Bar tucked away mid-drag: release cleanly
  useEffect(() => {
    if (shown) return;
    const s = sim.current;
    s.dragging = false;
    s.pT = 0;
    s.target = Math.max(activeRef.current, 0);
    kick();
  }, [shown, kick]);

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
    const s = sim.current;
    s.dragging = true;
    s.pT = 1;
    s.target = posFromEvent(e);
    kick();
  };

  const onMove = (e: React.PointerEvent) => {
    const s = sim.current;
    if (!s.dragging) return;
    s.target = posFromEvent(e);
    kick();
  };

  const onUp = (e: React.PointerEvent) => {
    const s = sim.current;
    if (!s.dragging) return;
    const i = Math.round(posFromEvent(e));
    s.dragging = false;
    s.pT = 0;
    s.target = i;
    kick();
    go(i);
  };

  const onCancel = () => {
    const s = sim.current;
    s.dragging = false;
    s.pT = 0;
    s.target = Math.max(activeRef.current, 0);
    kick();
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
        {/* Liquid glass capsule: nearly clear, light blur so the page shows through */}
        <div
          ref={barRef}
          className="absolute inset-0 rounded-full"
          style={{
            background: theme.bar,
            backdropFilter: "blur(4px) saturate(1.8)",
            WebkitBackdropFilter: "blur(4px) saturate(1.8)",
            border: theme.barBorder,
            boxShadow: theme.barShadow,
            willChange: "transform",
          }}
        />

        {/* Glass lens: stretches with speed, fringes with motion.
            No blur here, so the icon under it stays sharp. */}
        <div
          ref={lensRef}
          aria-hidden
          className="pointer-events-none absolute bottom-1 top-1 rounded-full"
          style={{
            left: 4,
            width: `calc((100% - 8px) / ${COUNT})`,
            zIndex: 3,
            willChange: "transform, box-shadow",
            transition: "opacity 200ms",
            background: theme.lens,
            backdropFilter: "saturate(1.5) brightness(1.12)",
            WebkitBackdropFilter: "saturate(1.5) brightness(1.12)",
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
                  ref={(el) => {
                    btnRefs.current[i] = el;
                  }}
                  type="button"
                  tabIndex={shown ? 0 : -1}
                  onClick={() => go(i)}
                  aria-current={i === activeIdx ? "page" : undefined}
                  className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                    i === activeIdx ? "font-semibold" : "font-medium"
                  }`}
                  style={{
                    color: `rgba(${theme.fg},0.7)`,
                    filter: theme.iconFilter,
                    willChange: "transform",
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
