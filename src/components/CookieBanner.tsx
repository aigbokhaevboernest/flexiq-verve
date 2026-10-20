import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "flexiq_cookie_consent"; // "accepted" | "declined"
const AUTO_DISMISS_MS = 5000;

/**
 * Cookie banner that shows on every page load / refresh.
 * - Accept / Decline close it for this visit (the choice is also saved in localStorage).
 * - If the visitor does nothing for 5 seconds it closes and the choice is saved as "declined".
 */
export const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  const choose = (value: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setVisible(false);
  };

  // Show on every load (after a short pause so it doesn't flash in)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss 5 seconds after it appears
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => choose("declined"), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  // Rendered into <body> so a parent with an animation/transform (like the page-enter
  // wrapper on the homepage) can't push the fixed banner off-screen.
  return createPortal(
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-[100] animate-fade-in rounded-2xl border border-border/60 bg-white p-4 text-foreground shadow-elev sm:left-auto sm:right-4 sm:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Cookie className="h-5 w-5" />
        </span>
        <p className="text-sm text-muted-foreground">
          We use cookies to improve your experience. See our{" "}
          <Link to="/policies" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => choose("declined")}>
          Decline
        </Button>
        <Button size="sm" className="bg-gradient-primary" onClick={() => choose("accepted")}>
          Accept
        </Button>
      </div>
    </div>,
    document.body
  );
};

export default CookieBanner;
