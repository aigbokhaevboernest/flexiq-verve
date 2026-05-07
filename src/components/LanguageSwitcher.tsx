import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const LANGS = [
  { code: "EN", name: "English", flag: "🇺🇸" },
  { code: "ES", name: "Español", flag: "🇪🇸" },
  { code: "FR", name: "Français", flag: "🇫🇷" },
  { code: "DE", name: "Deutsch", flag: "🇩🇪" },
  { code: "IT", name: "Italiano", flag: "🇮🇹" },
  { code: "PT", name: "Português", flag: "🇵🇹" },
  { code: "NL", name: "Nederlands", flag: "🇳🇱" },
  { code: "PL", name: "Polski", flag: "🇵🇱" },
  { code: "SV", name: "Svenska", flag: "🇸🇪" },
  { code: "TR", name: "Türkçe", flag: "🇹🇷" },
  { code: "RU", name: "Русский", flag: "🇷🇺" },
  { code: "AR", name: "العربية", flag: "🇸🇦" },
  { code: "HI", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ZH", name: "中文", flag: "🇨🇳" },
  { code: "JA", name: "日本語", flag: "🇯🇵" },
  { code: "KO", name: "한국어", flag: "🇰🇷" },
];

export const LanguageSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => localStorage.getItem("flexiq_lang") || "EN");
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === active) || LANGS[0];

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 hover:bg-muted"
      >
        <span>{current.flag}</span>
        <span className="font-medium">{current.code}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 max-h-72 w-48 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setActive(l.code);
                localStorage.setItem("flexiq_lang", l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted ${active === l.code ? "bg-muted" : ""}`}
            >
              <span>{l.flag}</span>
              <span className="font-medium">{l.code}</span>
              <span className="text-muted-foreground">{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
