import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Globe, X, Loader2 } from "lucide-react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages?: string;
            autoDisplay: boolean;
          },
          elementId: string
        ) => void;
      };
    };
  }
}

// Add/remove languages here freely — code must be a valid Google Translate code.
const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "hu", label: "Magyar", flag: "🇭🇺" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "sv", label: "Svenska", flag: "🇸🇪" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇧🇩" },
  { code: "zh-CN", label: "中文 (简体)", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪" },
];

// The switcher button is HIDDEN on these routes (and anything under them).
// Everything else (the public marketing pages) shows it.
// The translation engine itself keeps running everywhere.
const HIDE_ON_PREFIXES = [

  "/dashboard",
];

const PAGE_LANGUAGE = "en";
const COOKIE_NAME = "googtrans";
const AUTO_DETECT_FLAG = "lang_auto_detected";
const USER_CHOICE_KEY = "lang_user_choice";
const RELOAD_GUARD_KEY = "lang_reload_at";

const isIpHost = (host: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setLangCookie(targetCode: string) {
  const value = `/${PAGE_LANGUAGE}/${targetCode}`;
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${oneYear}`;
  const host = window.location.hostname;
  // Skip domain-scoped cookies on plain IPs / localhost, where a leading
  // dot isn't valid.
  if (host === "localhost" || isIpHost(host)) return;
  const parts = host.split(".");
  if (parts.length >= 2) {
    const parentDomain = "." + parts.slice(-2).join(".");
    document.cookie = `${COOKIE_NAME}=${value}; path=/; domain=${parentDomain}; max-age=${oneYear}`;
  }
}

// Google can set the cookie on several domain variants, so every one of them
// has to be expired or the old language keeps coming back.
function clearLangCookie() {
  const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
  const host = window.location.hostname;
  const domains: string[] = [""];
  if (host !== "localhost" && !isIpHost(host)) {
    domains.push(`; domain=${host}`, `; domain=.${host}`);
    const parts = host.split(".");
    if (parts.length >= 2) {
      const parent = parts.slice(-2).join(".");
      domains.push(`; domain=${parent}`, `; domain=.${parent}`);
    }
  }
  domains.forEach((d) => {
    document.cookie = `${COOKIE_NAME}=; path=/; expires=${expire}; max-age=0${d}`;
  });
}

// Google adds translated-ltr / translated-rtl to <html> while a page is translated.
function isPageTranslated(): boolean {
  const cl = document.documentElement.classList;
  return cl.contains("translated-ltr") || cl.contains("translated-rtl");
}

// One reload at most per 10 seconds, so a failing widget can never loop.
function reloadOnce() {
  const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
  if (Date.now() - last < 10000) return;
  sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  window.location.reload();
}

function loadGoogleTranslateScript() {
  if (document.getElementById("google-translate-script")) return;

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate) return;
    new window.google.translate.TranslateElement(
      {
        pageLanguage: PAGE_LANGUAGE,
        includedLanguages: LANGUAGES.map((l) => l.code).join(","),
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

// Drives Google's own hidden <select class="goog-te-combo"> directly instead
// of reloading the page. Checking combo.options.length matters: right after a
// cold page load the <select> can exist before Google has populated it.
function applyGoogleLang(code: string, force = false): boolean {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo || combo.options.length <= 1) return false;
  if (combo.value === code && !force) return true;
  combo.value = code;
  combo.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

// Tries to apply the language for up to 5 seconds, then checks the page
// really changed. If it didn't, reload once (the cookie is already set, so
// Google translates on load; for English the cookie is cleared first).
function applyAndVerify(code: string) {
  let tries = 0;
  const poll = setInterval(() => {
    tries += 1;
    if (applyGoogleLang(code) || tries >= 25) clearInterval(poll);
  }, 200);
  if (applyGoogleLang(code)) clearInterval(poll);

  setTimeout(() => {
    const ok = code === PAGE_LANGUAGE ? !isPageTranslated() : isPageTranslated();
    if (!ok) {
      if (code === PAGE_LANGUAGE) clearLangCookie();
      reloadOnce();
    }
  }, 5000);
}

// Re-firing "change" makes Google re-walk the DOM and translate anything new
// (dialogs, toasts mounted into portals after the initial scan).
function forceRetranslate(code: string) {
  applyGoogleLang(code, true);
}

type EngineState = "loading" | "ready" | "failed";

export default function LanguageSwitcher() {
  const { pathname } = useLocation();
  const [current, setCurrent] = useState("en");
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [engine, setEngine] = useState<EngineState>("loading");

  const rootRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef("en");
  const retranslateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const routeHidden = HIDE_ON_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const hidden = routeHidden || dismissed;

  const setLang = (code: string) => {
    currentRef.current = code;
    setCurrent(code);
  };

  // Engine readiness: only enable languages once Google's dropdown has options.
  useEffect(() => {
    loadGoogleTranslateScript();
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (combo && combo.options.length > 1) {
        setEngine("ready");
        clearInterval(id);
      } else if (tries >= 66) {
        // ~20 seconds
        setEngine("failed");
        clearInterval(id);
      }
    }, 300);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const suppressBanner = () => {
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.top = "0px";
      }
      document.querySelectorAll<HTMLElement>(
        'iframe.goog-te-banner-frame, iframe[id^="goog-gt-tt"], .goog-te-banner-frame, .skiptranslate iframe, body > .skiptranslate'
      ).forEach((el) => {
        el.style.display = "none";
        el.style.visibility = "hidden";
        el.style.height = "0px";
      });
    };

    let retranslating = false;
    const scheduleRetranslate = () => {
      if (currentRef.current === PAGE_LANGUAGE || retranslating) return;
      if (retranslateTimer.current) clearTimeout(retranslateTimer.current);
      retranslateTimer.current = setTimeout(() => {
        retranslating = true;
        forceRetranslate(currentRef.current);
        setTimeout(() => { retranslating = false; }, 1500);
      }, 400);
    };

    const bannerObserver = new MutationObserver(suppressBanner);
    bannerObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true,
    });
    suppressBanner();

    const portalObserver = new MutationObserver((mutations) => {
      const hasNewNodes = mutations.some((m) => m.addedNodes.length > 0);
      if (hasNewNodes) scheduleRetranslate();
    });
    portalObserver.observe(document.body, { childList: true });

    const cleanup = () => {
      bannerObserver.disconnect();
      portalObserver.disconnect();
      if (retranslateTimer.current) clearTimeout(retranslateTimer.current);
    };

    // Re-apply translation state on load/refresh.
    const cookieVal = getCookie(COOKIE_NAME);
    if (cookieVal) {
      const to = cookieVal.split("/")[2];
      if (to && to !== PAGE_LANGUAGE) {
        setLang(to);
        document.documentElement.setAttribute("lang", to);
        applyAndVerify(to);
      }
      return cleanup;
    }

    // Browser-language auto-detect runs once per session, and never if the
    // user has already picked a language themselves (including English).
    if (
      !sessionStorage.getItem(AUTO_DETECT_FLAG) &&
      !localStorage.getItem(USER_CHOICE_KEY)
    ) {
      sessionStorage.setItem(AUTO_DETECT_FLAG, "1");
      const browserLang = (navigator.language || "en").toLowerCase();
      const short = browserLang.split("-")[0];
      const supported = LANGUAGES.find(
        (l) => l.code.toLowerCase() === browserLang || l.code.toLowerCase() === short
      );
      if (supported && supported.code !== PAGE_LANGUAGE) {
        setLangCookie(supported.code);
        setLang(supported.code);
        document.documentElement.setAttribute("lang", supported.code);
        applyAndVerify(supported.code);
      }
    }

    return cleanup;
  }, []);

  // Close the dropdown whenever the switcher becomes hidden (route change / dismiss).
  useEffect(() => {
    if (hidden) setOpen(false);
  }, [hidden]);

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;

    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function selectLanguage(code: string) {
    setOpen(false);
    if (code === current) return;
    localStorage.setItem(USER_CHOICE_KEY, "1");
    setLang(code);
    document.documentElement.setAttribute("lang", code);

    if (code === PAGE_LANGUAGE) {
      clearLangCookie();
    } else {
      setLangCookie(code);
    }
    applyAndVerify(code);
  }

  // Hides the button only. The current language stays applied.
  function dismiss() {
    setOpen(false);
    setDismissed(true);
  }

  const currentLang = LANGUAGES.find((l) => l.code === current) ?? LANGUAGES[0];

  return (
    <div ref={rootRef} className="fixed bottom-4 left-4 z-[9999]">
      {/* Host div for Google's script. Always mounted (even when the button is
          hidden) so translation keeps working across routes. */}
      <div
        id="google_translate_element"
        className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none"
      />

      {!hidden && (
        <>
          {/* Dropdown panel — opens upward since the button sits at the bottom */}
          {open && (
            <div
              role="listbox"
              aria-label="Select language"
              className="absolute bottom-full left-0 mb-2 w-64 max-h-80 overflow-y-auto rounded-xl border border-black/10 bg-white shadow-xl py-1"
            >
              {engine === "loading" && (
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-black/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading translation…
                </div>
              )}
              {engine === "failed" && (
                <div className="flex items-center justify-between gap-2 px-4 py-2 text-xs text-black/70">
                  <span>Translation unavailable</span>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-md border border-black/15 px-2 py-1 font-medium hover:bg-black/5"
                  >
                    Retry
                  </button>
                </div>
              )}

              {LANGUAGES.map((lang) => {
                // English can always be chosen (it just clears the translation).
                const disabled = engine !== "ready" && lang.code !== PAGE_LANGUAGE;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={lang.code === current}
                    disabled={disabled}
                    onClick={() => selectLanguage(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[15px] transition-colors ${
                      disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-black/5"
                    } ${lang.code === current ? "bg-black/[0.04] font-medium" : ""}`}
                  >
                    <span className="text-lg leading-none shrink-0">{lang.flag}</span>
                    <span className="text-[#111] truncate">{lang.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Floating trigger button + dismiss (X) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="listbox"
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 backdrop-blur px-3.5 py-2.5 text-white shadow-lg hover:bg-black/80 transition-colors"
            >
              <Globe className={`w-4 h-4 ${engine === "loading" ? "animate-pulse" : ""}`} />
              <span className="text-lg leading-none">{currentLang.flag}</span>
              <span className="text-[10px] text-white/70">▼</span>
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Hide language selector"
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/85 text-white shadow hover:bg-black"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
