import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Wallet, Home, ArrowLeftRight, WalletCards, Banknote } from "lucide-react";
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
  { to: "/dashboard/wallets", matches: ["/dashboard/wallets"], label: "Wallets", icon: WalletCards },
];

const COUNT = items.length;
const SPRING = "cubic-bezier(0.34, 1.4, 0.64, 1)";
const TRACK_H = 56; // bar is h-16 (64px) with a 4px inset on every side

// How the real thing behaves (from the screen recording):
//  - at rest the selected tab is just a flat, soft grey pill (no blur)
//  - while pressed or moving it "lifts": the pill turns into clear glass,
//    grows wider and taller, MAGNIFIES the icon + label inside it, and
//    shows a thin rainbow fringe at its edges
const THEMES = {
  dark: {
    fg: "255,255,255",
    active: "#0A84FF",
    pill: "255,255,255",
    pillA: 0.16,
    rimBase: 0.3,
    bar: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 100%), rgba(30,30,36,0.16)",
    barShadow:
      "0 12px 32px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(255,255,255,0.08)",
    rimGradient:
      "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.12) 28%, rgba(255,255,255,0.04) 55%, rgba(255,255,255,0.14) 78%, rgba(255,255,255,0.55) 100%)",
    sheen:
      "linear-gradient(115deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.07) 100%)",
    base: 0.75,
  },
  light: {
    fg: "10,10,14",
    active: "#007AFF",
    pill: "60,60,67",
    pillA: 0.11,
    rimBase: 0.12,
    bar: "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%), rgba(255,255,255,0.06)",
    barShadow:
      "0 12px 32px rgba(20,20,40,0.16), 0 2px 6px rgba(20,20,40,0.08), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(255,255,255,0.45)",
    rimGradient:
      "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.3) 28%, rgba(255,255,255,0.1) 55%, rgba(255,255,255,0.35) 78%, rgba(255,255,255,0.95) 100%)",
    sheen:
      "linear-gradient(115deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.2) 100%)",
    base: 0.82,
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
  p: number; // "lift" amount 0..1 (springs, can overshoot)
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
  const lensRef = useRef<HTMLDivElement>(null);
  const magRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLUListElement>(null);
  const rimRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cloneBtnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackW = useRef(0);

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

  // Track width in px (the lens is sized in px so text is never scaled up
  // from a blurry cached bitmap).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => {
      trackW.current = el.clientWidth - 8;
      apply();
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write the current physics state to the DOM.
  const apply = useCallback(() => {
    const s = sim.current;
    const th = themeRef.current;
    const lens = lensRef.current;
    const mag = magRef.current;
    const clone = cloneRef.current;
    const rim = rimRef.current;
    if (!lens || !mag || !clone || !rim) return;

    const W = trackW.current || (wrapRef.current ? wrapRef.current.clientWidth - 8 : 0);
    if (!W) return;
    const slot = W / COUNT;

    const L = Math.max(0, Math.min(1, s.p)); // lift, clamped for colours
    const speed = Math.abs(s.v);
    // Stretch along the direction of travel (liquid feel)
    const stretch = Math.min(0.12, speed * 0.03);
    const sx = 1 + 0.22 * s.p + stretch;
    const sy = Math.max(0.98, 1 + 0.14 * s.p - stretch * 0.15);

    // Size the lens with layout (not transform: scaled text goes blurry)
    const w = slot * sx;
    const h = TRACK_H * sy;
    let left = (s.x + 0.5) * slot - w / 2;
    left = Math.max(-3, Math.min(W - w + 3, left));
    const top = -(h - TRACK_H) / 2;
    lens.style.width = `${w}px`;
    lens.style.height = `${h}px`;
    lens.style.transform = `translate3d(${left}px,${top}px,0)`;
    lens.style.opacity =
      activeRef.current >= 0 || s.dragging || s.p > 0.02 ? "1" : "0";

    // Flat grey pill at rest, melting to clear glass when lifted
    lens.style.background = `rgba(${th.pill},${th.pillA * (1 - Math.min(1, L * 1.25))})`;

    // Magnified copy of the tabs, aligned to the bar behind the lens
    clone.style.width = `${W}px`;
    clone.style.transform = `translate3d(${-left}px,${-top}px,0)`;
    mag.style.transform = `scale(${1 + 0.2 * L})`;
    mag.style.opacity = String(Math.min(1, L * 1.5));

    // Rainbow fringe on the glyphs and on the lens edge
    const f = Math.min(1, L * 0.75 + speed * 0.25);
    clone.style.filter =
      f > 0.05
        ? `drop-shadow(${(1.6 * f).toFixed(2)}px 0 0 rgba(255,40,90,${(0.5 * f).toFixed(2)})) drop-shadow(${(-1.6 * f).toFixed(2)}px 0 0 rgba(0,190,255,${(0.5 * f).toFixed(2)}))`
        : "none";
    rim.style.boxShadow = [
      `inset 0 0 0 1px rgba(255,255,255,${th.rimBase * (1 - L) + (0.55 + 0.3 * f) * L})`,
      `inset 0 2px 1.5px rgba(255,255,255,${0.7 * L})`,
      `inset 0 -2px 2px rgba(255,255,255,${0.45 * L})`,
      `inset 4px 0 5px -1px rgba(0,200,255,${0.5 * f})`,
      `inset -4px 0 5px -1px rgba(255,60,200,${0.5 * f})`,
      `inset 0 -4px 5px -2px rgba(255,220,80,${0.35 * f})`,
    ].join(",");
    lens.style.boxShadow = `0 ${2 + 6 * L}px ${8 + 12 * L}px rgba(0,0,0,${0.1 * L})`;

    // Originals fade out under the lens (the magnified copy replaces them)
    btnRefs.current.forEach((el, i) => {
      if (!el) return;
      const prox = Math.max(0, 1 - Math.abs(i - s.x));
      el.style.opacity = String(1 - prox * Math.min(1, L * 1.5));
      el.style.color =
        i === activeRef.current && !s.dragging
          ? activeColorRef.current
          : `rgba(${th.fg},${th.base + (1 - th.base) * prox})`;
    });
    cloneBtnRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.color =
        i === activeRef.current && !s.dragging
          ? activeColorRef.current
          : `rgb(${th.fg})`;
    });
  }, []);

  const kick = useCallback(() => {
    const s = sim.current;
    if (s.raf) return;
    s.last = performance.now();

    const step = (t: number) => {
      const dt = Math.min(0.032, (t - s.last) / 1000 || 0.016);
      s.last = t;

      // Lift while a finger is down OR the lens is still travelling
      const travel = Math.abs(s.target - s.x);
      s.pT = s.dragging || travel > 0.05 || Math.abs(s.v) > 0.25 ? 1 : 0;

      // Tight while a finger is dragging, softer and bouncier on release
      const k = s.dragging ? 520 : 240;
      const c = reduceMotion.current
        ? 2 * Math.sqrt(k)
        : s.dragging
        ? 38
        : 21;

      s.v += (k * (s.target - s.x) - c * s.v) * dt;
      s.x += s.v * dt;

      // Pops up fast with a little overshoot, settles back more gently
      const pk = s.pT ? 420 : 200;
      const pc = s.pT ? 24 : 20;
      s.pv += (pk * (s.pT - s.p) - pc * s.pv) * dt;
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
    // Send opens a modal and doesn't change the route, so the lens
    // returns to the current tab instead of staying on Send.
    s.target = items[i].to === null ? Math.max(activeRef.current, 0) : i;
    kick();
    go(i);
  };

  const onCancel = () => {
    const s = sim.current;
    s.dragging = false;
    s.target = Math.max(activeRef.current, 0);
    kick();
  };

  const tabClass = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap text-[11px] ${
      active ? "font-semibold" : "font-medium"
    }`;

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
          {/* Glass capsule */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: theme.bar,
              backdropFilter: "blur(6px) saturate(1.6) brightness(1.06)",
              WebkitBackdropFilter: "blur(6px) saturate(1.6) brightness(1.06)",
              boxShadow: theme.barShadow,
              isolation: "isolate",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ background: theme.sheen }}
            />
            {/* Specular rim: 1px gradient ring */}
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

          <div className="absolute inset-1 rounded-full">
            {/* Lens. No backdrop-filter: that is what made it look blurry.
                Sized and moved in px each frame. */}
            <div
              ref={lensRef}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 overflow-hidden rounded-full"
              style={{ zIndex: 3, width: `${100 / COUNT}%`, height: TRACK_H }}
            >
              {/* Magnified copy of the tabs, scaled about the lens centre */}
              <div
                ref={magRef}
                className="absolute inset-0"
                style={{ transformOrigin: "50% 50%", opacity: 0 }}
              >
                <ul
                  ref={cloneRef}
                  className="absolute left-0 top-0 grid"
                  style={{
                    gridTemplateColumns: `repeat(${COUNT}, 1fr)`,
                    height: TRACK_H,
                  }}
                >
                  {items.map(({ label, icon: Icon }, i) => {
                    const active = i === activeIdx;
                    return (
                      <li key={label} className="flex">
                        <div
                          ref={(el) => {
                            cloneBtnRefs.current[i] = el;
                          }}
                          className={tabClass(active)}
                        >
                          <Icon
                            className="h-[21px] w-[21px]"
                            strokeWidth={2.25}
                            fill={active ? "currentColor" : "none"}
                            fillOpacity={active ? 0.9 : 0}
                          />
                          {label}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {/* Edge highlights and fringe, painted over the magnified tabs */}
              <div
                ref={rimRef}
                className="absolute inset-0 rounded-full"
              />
            </div>

            {/* Real tabs */}
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
                      className={tabClass(active)}
                      style={{
                        color: active ? activeColor : `rgba(${theme.fg},${theme.base})`,
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
