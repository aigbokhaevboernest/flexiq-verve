import { useEffect } from "react";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export const GoogleTranslateInline = () => {
  useEffect(() => {
    const mount = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_inline"
      );
    };

    if (window.google?.translate?.TranslateElement) {
      mount();
    } else {
      const t = setInterval(() => {
        if (window.google?.translate?.TranslateElement) {
          clearInterval(t);
          mount();
        }
      }, 200);
      return () => clearInterval(t);
    }
  }, []);

  return (
    <div
      id="google_translate_inline"
      style={{ minWidth: "120px", minHeight: "40px" }}
      className="inline-block"
    />
  );
};
