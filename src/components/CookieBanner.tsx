import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const STORAGE_KEY = "flexiq_cookie_consent"; // "accepted" | "declined"
const AUTO_DISMISS_MS = 15000; // banner closes by itself this long after it appears
const AFTER_ANIMATION_MS = 800; // extra pause once the page's opening animation is done
const ANIMATION_FALLBACK_MS = 2500; // if the animation end is never detected, show anyway after this
const SLIDE_MS = 400; // slide in / out duration
const TOAST_VISIBLE_MS = 3000; // "Cookie accepted" message stays this long

/**
 * Cookie banner shown on every page load / refresh.
 * - Waits for the page's opening animation (the `.page-enter` wrapper) to finish,
 *   then slides up from the bottom.
 * - Sits flush against the bottom, left and right edges of the screen, kept short so
 *   it doesn't cover the main button on pages like Login.
 * - X (top left) or doing nothing for 15 seconds closes it as "declined".
 * - Accept closes it and slides a green "Cookie accepted successfully" message
 *   down from the top.
 */
export const CookieBanner = () => {
  const [mounted, setMounted] = useState(false); // banner in the DOM
  const [entered, setEntered] = useState(false); // banner slid into view

  const [toastMounted, setToastMounted] = useState(false);
  const [toastEntered, setToastEntered] = useState(false);

  const closeToast = () => {
    setToastEntered(false);
    setTimeout(() => setToastMounted(false), SLIDE_MS);
  };

  const showToast = () => {
    setToastMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setToastEntered(true)));
  };

  const choose = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setEntered(false); // slide the banner down
    setTimeout(() => setMounted(false), SLIDE_MS); // then remove it
    if (value === "accepted") showToast();
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

  // Auto-dismiss the banner a while after it has appeared
  useEffect(() => {
    if (!entered) return;
    const t = setTimeout(() => choose("declined"), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [entered]);

  // Auto-hide the green message
  useEffect(() => {
    if (!toastEntered) return;
    const t = setTimeout(closeToast, TOAST_VISIBLE_MS);
    return () => clearTimeout(t);
  }, [toastEntered]);

  // Both are rendered into <body> so a parent with an animation/transform (like the
  // page-enter wrapper) can't push these fixed elements off-screen.
  return (
    <>
      {mounted &&
        createPortal(
          <div
            role="dialog"
            aria-label="Cookie consent"
            style={{ transitionDuration: `${SLIDE_MS}ms` }}
            // Plain white, flush to the bottom, left and right edges
            className={`fixed inset-x-0 bottom-0 z-[100] rounded-t-2xl bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-center text-gray-900 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform ease-out ${
              entered ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => choose("declined")}
              className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>

            {/* side padding keeps the text clear of the X button */}
            <p className="px-9 text-[13px] font-medium leading-snug text-gray-800">
              We use cookies to improve your experience. See our{" "}
              <Link to="/policies" className="font-semibold text-primary underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>

            <Button
              size="lg"
              className="mt-3 h-11 w-full rounded-xl bg-gradient-primary text-base font-semibold text-primary-foreground"
              onClick={() => choose("accepted")}
            >
              Accept
            </Button>
          </div>,
          document.body
        )}

      {toastMounted &&
        createPortal(
          <div
            role="status"
            style={{ transitionDuration: `${SLIDE_MS}ms` }}
            className={`fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[110] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-green-400/40 bg-green-300/70 px-4 py-3 text-gray-800 shadow-lg backdrop-blur-md transition-transform ease-out ${
              toastEntered ? "translate-y-0" : "-translate-y-[200%]"
            }`}
          >
            <Check className="h-6 w-6 shrink-0 text-gray-900" strokeWidth={2.5} />
            <p className="flex-1 text-base font-medium">Cookie accepted successfully</p>
            <button
              type="button"
              aria-label="Close message"
              onClick={closeToast}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-700 transition hover:bg-black/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>,
          document.body
        )}
    </>
  );
};

export default CookieBanner;
