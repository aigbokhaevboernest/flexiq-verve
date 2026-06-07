import { useEffect } from "react";

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export const GoogleTranslateInline = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .goog-te-banner-frame { display: none !important; }
      .skiptranslate { display: none !important; }
      body { top: 0 !important; }
      #goog-gt-tt { display: none !important; }
      .goog-te-balloon-frame { display: none !important; }
    `;
    document.head.appendChild(style);

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
      style={{
        width: "fit-content",
        maxWidth: "130px",
        transform: "scale(0.7)",
        transformOrigin: "right top",
        overflow: "hidden",
      }}
      className="inline-block"
    />
  );
};
