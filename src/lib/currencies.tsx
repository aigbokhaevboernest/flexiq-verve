// Save as src/lib/currencies.tsx
// Shared by CurrencyWallets.tsx and CurrencyWalletDetail.tsx

export const QUICK_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY"];

// "Others" list. Anything already in QUICK_CURRENCIES is filtered out by the picker.
export const ISO_CURRENCIES = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AWG", "AZN", "BAM", "BBD", "BDT", "BGN", "BHD", "BIF",
  "BMD", "BND", "BOB", "BRL", "BSD", "BTN", "BWP", "BYN", "BZD", "CDF", "CLP", "COP", "CRC", "CUP", "CVE",
  "CZK", "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "FJD", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ",
  "GYD", "HKD", "HNL", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "KES", "KGS",
  "KHR", "KMF", "KRW", "KWD", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA",
  "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK",
  "NPR", "NZD", "OMR", "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF",
  "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SLE", "SOS", "SRD", "SSP", "STN", "SYP", "SZL", "THB", "TJS",
  "TMT", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "UYU", "UZS", "VES", "VND", "VUV", "WST",
  "XAF", "XCD", "XOF", "XPF", "YER", "ZAR", "ZMW",
];

// Currencies whose flag isn't simply the first two letters of the code
const FLAG_OVERRIDES: Record<string, string> = {
  EUR: "eu",
  XAF: "cm",
  XOF: "sn",
  XCD: "ag",
  XPF: "pf",
  ANG: "cw",
  CHF: "ch",
};

export const flagCode = (currency: string) =>
  FLAG_OVERRIDES[currency] ?? currency.slice(0, 2).toLowerCase();

let displayNames: Intl.DisplayNames | null = null;
export const currencyName = (code: string) => {
  try {
    displayNames ??= new Intl.DisplayNames(["en"], { type: "currency" });
    return displayNames.of(code) || code;
  } catch {
    return code;
  }
};

export const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

export const Flag = ({
  currency,
  className = "h-5 w-5",
  size = 40,
}: {
  currency: string;
  className?: string;
  size?: 40 | 80;
}) => (
  <img
    src={`https://flagcdn.com/w${size}/${flagCode(currency)}.png`}
    alt={`${currency} flag`}
    loading="lazy"
    onError={(e) => {
      const el = e.currentTarget;
      if (!el.dataset.fallback) {
        el.dataset.fallback = "1";
        el.src = `https://flagcdn.com/w${size}/un.png`;
      }
    }}
    className={`${className} shrink-0 rounded-full object-cover ring-1 ring-border`}
  />
);

export const PrimaryBadge = () => (
  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
    Primary
  </span>
);
