import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "flexiq_cookie_consent"; // "accepted" | "declined"
const AUTO_DISMISS_MS = 15000; // closes by itself this long after it appears
const AFTER_ANIMATION_MS = 800; // extra pause once the page's opening animation is done
const ANIMATION_FALLBACK_MS = 2500; // if the animation end is never detected, show anyway after this
const SLIDE_MS = 400; // slide in / out duration

/**
 * Cookie banner shown on every page load / refresh.
 * - Waits for the page's opening animation (the `.page-enter` wrapper) to finish,
 *   then slides up from the bottom.
 * - Translucent glass look so the page shows through a little, with fully readable text.
 * - X (top left) or Accept closes it. Doing nothing closes it after 5 seconds
 *   and the choice is saved as "declined".
 */
export const CookieBanner = () => {
  const [mounted, setMounted] = useState(false); // in the DOM
  const [entered, setEntered] = useState(false); // slid into view

  const choose = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setEntered(false); // slide down
    setTimeout(() => setMounted(false), SLIDE_MS); // then remove
  };

  // Wait for the opening animation, then slide the banner up
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let revealed = false;
    let cleanupListener: (() => void) | null = null;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      timers.push(
        setTimeout(() => {
          setMounted(true);
          // two frames so the browser paints the hidden state first, then animates in
          requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
        }, AFTER_ANIMATION_MS)
      );
    };

    const el = document.querySelector<HTMLElement>(".page-enter");
    if (el) {
      const onEnd = (e: AnimationEvent) => {
        if (e.target === el) reveal(); // ignore animations of child elements
      };
      el.addEventListener("animationend", onEnd);
      cleanupListener = () => el.removeEventListener("animationend", onEnd);
    }
    // Fallback in case there is no animation, or it already finished before we started listening
    timers.push(setTimeout(reveal, el ? ANIMATION_FALLBACK_MS : 600));

    return () => {
      cleanupListener?.();
      timers.forEach(clearTimeout);
    };
  }, []);

  // Auto-dismiss a few seconds after it has appeared
  useEffect(() => {
    if (!entered) return;
    const t = setTimeout(() => choose("declined"), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [entered]);

  if (!mounted) return null;

  // Rendered into <body> so a parent with an animation/transform (like the page-enter
  // wrapper) can't push the fixed banner off-screen.
  return createPortal(
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{ transitionDuration: `${SLIDE_MS}ms` }}
      className={`fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-md rounded-3xl border border-white/20 bg-black/25 p-5 pt-6 text-center text-white shadow-2xl backdrop-blur-md transition-transform ease-out ${
        entered ? "translate-y-0" : "translate-y-[150%]"
      }`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => choose("declined")}
        className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
      >
        <X className="h-4 w-4" />
      </button>

      <Cookie className="mx-auto h-6 w-6 text-white" />
      <p className="mt-2 text-sm font-medium leading-relaxed text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
        We use cookies to improve your experience. See our{" "}
        <Link to="/policies" className="font-semibold underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>

      <Button
        size="lg"
        className="mt-4 h-12 w-full rounded-2xl bg-gradient-primary text-base font-semibold text-primary-foreground shadow-glow"
        onClick={() => choose("accepted")}
      >
        Accept
      </Button>
    </div>,
    document.body
  );
};

export default CookieBanner;
