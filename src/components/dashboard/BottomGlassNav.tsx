import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Wallet, Home, ArrowLeftRight, Banknote } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "@/hooks/useAccount";
import { SendChooserModal } from "@/components/dashboard/SendChooserModal";

// Set to true to always use the dark glass with white icons,
// whatever the site theme is.
const FORCE_DARK_STYLE = false;

// Set to true to tint the selected tab with your brand colour instead of
// iOS system blue.
const USE_BRAND_COLOR = false;
const BRAND_COLOR = "hsl(var(--primary))";

// `to` is where the tab goes (null = opens the Send chooser modal);
// `matches` keeps the tab highlighted on sub-pages. `exact` stops Home from
// lighting up on every /dashboard/* page.
const items: Array<{
  to: string | null;
  matches: string[];
  exact?: boolean;
  label: string;
  icon: typeof Send;
}> = [
  { to: null, matches: ["/dashboard/send", "/dashboard/local"], label: "Send", icon: Send },
  { to: "/dashboard/receive", matches: ["/dashboard/receive"], label: "Add money", icon: Wallet },
  { to: "/dashboard", matches: ["/dashboard"], exact: true, label: "Home", icon: Home },
  { to: "/dashboard/loans", matches: ["/dashboard/loans"], label: "Loan", icon: Banknote },
  { to: "/dashboard/wallets", matches: ["/dashboard/wallets"], label: "Wallets", icon: ArrowLeftRight },
];

const COUNT = items.length;
const SPRING = "cubic-bezier(0.34, 1.4, 0.64, 1)";

// Liquid Glass looks. The capsule is nearly clear: a modest blur, a lift in
// saturation and brightness so the page glows through, a gradient specular
// rim (bright top-left and bottom-right, dim in between) and a soft float
// shadow. No big inset glows: those wash out the rounded ends.
const THEMES = {
  dark: {
    fg: "255,255,255",
    active: "#0A84FF",
    rimBase: 0.32,
    rimGain: 0.3,
    lensFill: "rgba(255,255,255,0.14)",
    lensHi: 0.3,
    bar: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 100%), rgba(30,30,36,0.16)",
    barShadow:
      "0 12px 32px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(255,255,255,0.08)",
    rimGradient:
      "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.12) 28%, rgba(255,255,255,0.04) 55%, rgba(255,255,255,0.14) 78%, rgba(255,255,255,0.55) 100%)",
    sheen:
      "linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.07) 100%)",
    textShadow: "0 1px 2px rgba(0,0,0,0.45)",
    iconFilter: "drop-shadow(0 1px 2px rgba(0,0,0,0.45))",
    base: 0.72,
  },
  light: {
    fg: "10,10,14",
    active: "#007AFF",
    rimBase: 0.14,
    rimGain: 0.26,
    lensFill: "rgba(255,255,255,0.34)",
    lensHi: 0.85,
    bar: "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%), rgba(255,255,255,0.06)",
    barShadow:
      "0 12px 32px rgba(20,20,40,0.16), 0 2px 6px rgba(20,20,40,0.08), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.45)",
    rimGradient:
      "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.3) 28%, rgba(255,255,255,0.1) 55%, rgba(255,255,255,0.35) 78%, rgba(255,255,255,0.95) 100%)",
    sheen:
      "linear-gradient(115deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.2) 100%)",
    textShadow: "0 0 6px rgba(255,255,255,0.55)",
    iconFilter: "drop-shadow(0 0 3px rgba(255,255,255,0.5))",
    base: 0.8,
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
  const { data: profile } = useAccount();
  const frozen = !!(profile as any)?.frozen;
  const [sendOpen, setSendOpen] = useState(false);

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
  const activeColor = USE_BRAND_COLOR ? BRAND_COLOR : theme.active;
  const activeColorRef = useRef(activeColor);
  activeColorRef.current = activeColor;

  const clean = pathname.replace(/\/$/, "");
  const activeIdx = items.findIndex((i) =>
    i.exact
      ? i.matches.includes(clean)
      : i.matches.some((m) => clean === m || clean.startsWith(m + "/"))
  );
  const activeRef = useRef(activeIdx);
  activeRef.current = activeIdx;

  // Always visible on every dashboard page. Only the open sidebar hides it.
  const shown = !hidden;

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
    // Liquid stretch along the direction of travel, plus a swell on press.
    const stretch = Math.min(0.14, speed * 0.035);
    const sx = 1 + 0.1 * s.p + stretch;
    const sy = 1 + 0.12 * s.p - stretch * 0.2;
    lens.style.transform = `translate3d(${s.x * 100}%,0,0) scale(${sx},${sy})`;
    lens.style.opacity =
      activeRef.current >= 0 || s.dragging || s.p > 0.02 ? "1" : "0";

    // The lens turns clearer and its edges brighter the more it is pressed
    // or moving, like glass lifting off the bar.
    const f = Math.min(1, speed * 0.28 + s.p * 0.6);
    lens.style.boxShadow = [
      `inset 0 0 0 1px rgba(255,255,255,${th.rimBase + th.rimGain * f})`,
      `inset 0 1.5px 1px rgba(255,255,255,${th.lensHi * (0.5 + 0.5 * f)})`,
      `inset 0 -1.5px 2px rgba(255,255,255,${0.2 + 0.2 * f})`,
      `inset 2px 0 6px rgba(0,200,255,${0.04 + 0.22 * f})`,
      `inset -2px 0 6px rgba(255,70,200,${0.04 + 0.2 * f})`,
      `0 ${4 + 6 * f}px ${14 + 10 * f}px rgba(0,0,0,${0.06 + 0.08 * f})`,
    ].join(",");

    if (barRef.current) {
      barRef.current.style.transform = `scale(${1 + 0.012 * s.p})`;
    }

    // Icon under the lens grows slightly; the selected tab is tinted
    btnRefs.current.forEach((el, i) => {
      if (!el) return;
      const prox = Math.max(0, 1 - Math.abs(i - s.x));
      el.style.transform = `scale(${1 + prox * (0.06 + 0.08 * s.p)})`;
      el.style.color =
        i === activeRef.current && !s.dragging
          ? activeColorRef.current
          : `rgba(${th.fg},${th.base + (1 - th.base) * prox})`;
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

  // First paint, whenever the theme flips, or the active tab changes
  useEffect(() => {
    apply();
  }, [apply, dark, activeIdx]);

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
    const item = items[i];
    if (item.to === null) {
      // Send: pick the type first
      if (frozen) {
        toast("Account frozen", {
          description:
            "Your account has been frozen by an administrator. All transactions and features are disabled. Please contact support.",
          duration: 5000,
          style: { background: "#ff8503", color: "#ffffff", border: "none" },
          classNames: { title: "text-white font-semibold", description: "text-white/90" },
        });
        return;
      }
      setSendOpen(true);
      return;
    }
    if (clean !== item.to) navigate(item.to);
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
    // Send opens a modal and doesn't change the route, so the lens
    // returns to the current tab instead of staying on Send.
    s.target = items[i].to === null ? Math.max(activeRef.current, 0) : i;
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
    <>
      <nav
        aria-label="Quick actions"
        aria-hidden={!shown}
        className="fixed inset-x-4 z-50 md:hidden"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 18px)",
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
          {/* Liquid glass capsule. Light blur + saturation/brightness lift so
              the page glows through. The shadow lives on a separate layer so
              the glass layer itself never gets an inner white haze. */}
          <div
            ref={barRef}
            className="absolute inset-0 rounded-full"
            style={{
              background: theme.bar,
              backdropFilter: "blur(6px) saturate(1.6) brightness(1.06)",
              WebkitBackdropFilter: "blur(6px) saturate(1.6) brightness(1.06)",
              boxShadow: theme.barShadow,
              isolation: "isolate",
              willChange: "transform",
            }}
          >
            {/* Diagonal sheen across the whole capsule */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ background: theme.sheen }}
            />
            {/* Specular rim: a 1px gradient ring, bright at the top-left and
                bottom-right corners, faint in between */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                padding: 1,
                background: theme.rimGradient,
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
              }}
            />
          </div>

          {/* Track: 4px inside the capsule on every side. Not clipped, so the
              lens can swell past the edge a hair while it is pressed. */}
          <div className="absolute inset-1 rounded-full">
            {/* Glass lens: exactly one slot wide (100% / COUNT) */}
            <div
              ref={lensRef}
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${100 / COUNT}%`,
                zIndex: 3,
                willChange: "transform, box-shadow",
                transition: "opacity 200ms",
                background: `linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 50%, rgba(255,255,255,0.1)), ${theme.lensFill}`,
                backdropFilter: "blur(1px) saturate(1.9) brightness(1.14)",
                WebkitBackdropFilter: "blur(1px) saturate(1.9) brightness(1.14)",
              }}
            />

            {/* Tabs: each one pops in with a small stagger */}
            <ul
              className="absolute inset-0 z-[2] grid"
              style={{ gridTemplateColumns: `repeat(${COUNT}, 1fr)` }}
            >
              {items.map(({ label, icon: Icon }, i) => {
                const delay = shown ? 120 + i * 50 : 0;
                const active = i === activeIdx;
                return (
                  <li
                    key={label}
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
                      // Pointer taps are handled in onUp; detail === 0 means
                      // keyboard activation (Enter/Space), which still needs go().
                      onClick={(e) => {
                        if (e.detail === 0) go(i);
                      }}
                      aria-label={label}
                      aria-current={active ? "page" : undefined}
                      className={`flex flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap text-[11px] ${
                        active ? "font-semibold" : "font-medium"
                      }`}
                      style={{
                        color: active ? activeColor : `rgba(${theme.fg},${theme.base})`,
                        filter: theme.iconFilter,
                        textShadow: theme.textShadow,
                        willChange: "transform",
                      }}
                    >
                      <Icon
                        className="h-[21px] w-[21px]"
                        strokeWidth={2}
                        fill={active ? "currentColor" : "none"}
                        fillOpacity={active ? 0.9 : 0}
                      />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      <SendChooserModal open={sendOpen} onOpenChange={setSendOpen} />
    </>
  );
};
