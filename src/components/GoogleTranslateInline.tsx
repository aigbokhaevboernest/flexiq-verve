import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

/**
 * Renders a visible Google Translate widget. Once a language is chosen, the
 * Google Translate cookie persists, so the selection silently applies to all
 * other pages in the app.
 */
export const GoogleTranslateInline = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elId = "google_translate_inline";
    if (!containerRef.current) return;
    containerRef.current.id = elId;

    const mount = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false, layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE },
        elId,
      );
    };

    if (window.google?.translate?.TranslateElement) {
      mount();
    } else {
      // Script is loaded in index.html; poll briefly until ready.
      const t = setInterval(() => {
        if (window.google?.translate?.TranslateElement) {
          clearInterval(t);
          mount();
        }
      }, 200);
      return () => clearInterval(t);
    }
  }, []);

  return <div ref={containerRef} className="inline-block" />;
};
