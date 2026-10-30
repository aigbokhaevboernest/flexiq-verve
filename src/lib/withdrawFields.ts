// Config-driven withdraw form: which fields to ask for depends on the wallet currency
// and on whether the payout is domestic (home banking system) or international (SWIFT).

export type WithdrawType = "domestic" | "international";

export type WField = {
  key: string;
  label: string;
  placeholder?: string;
  /** default true */
  required?: boolean;
  options?: { value: string; label: string }[];
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
  digitsOnly?: boolean;
  /** uppercase + strip spaces (IBAN, SWIFT, sort code…) */
  upper?: boolean;
  /** return an error message, or "" when valid */
  check?: (v: string) => string;
};

export const normalizeValue = (f: WField, raw: string): string => {
  let v = raw;
  if (f.digitsOnly) v = v.replace(/\D/g, "");
  if (f.upper) v = v.replace(/\s+/g, "").toUpperCase();
  if (f.maxLength) v = v.slice(0, f.maxLength);
  return v;
};

// ── building blocks ──
const text = (key: string, label: string, extra: Partial<WField> = {}): WField => ({ key, label, ...extra });

const digits = (key: string, label: string, n: number, extra: Partial<WField> = {}): WField => ({
  key,
  label,
  inputMode: "numeric",
  digitsOnly: true,
  maxLength: n,
  check: (v) => (v.length === n ? "" : `${label} must be ${n} digits`),
  ...extra,
});

const iban = (label = "IBAN", pattern: RegExp = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, extra: Partial<WField> = {}): WField => ({
  key: "iban",
  label,
  upper: true,
  maxLength: 34,
  check: (v) => (pattern.test(v) ? "" : "Enter a valid IBAN"),
  ...extra,
});

const swift: WField = {
  key: "swift",
  label: "SWIFT / BIC",
  upper: true,
  maxLength: 11,
  check: (v) => (/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(v) ? "" : "SWIFT/BIC must be 8 or 11 characters"),
};

const accountType: WField = {
  key: "account_type",
  label: "Account type",
  options: [
    { value: "checking", label: "Checking" },
    { value: "savings", label: "Savings" },
  ],
};

const NAME = text("name", "Recipient name");
const BANK = text("bank_name", "Bank name");
const ACCOUNT = text("account_number", "Account number", { inputMode: "numeric", digitsOnly: true, maxLength: 34 });

// ── domestic fields per wallet currency ──
const DOMESTIC: Record<string, WField[]> = {
  USD: [NAME, BANK, ACCOUNT, digits("routing_number", "Routing number", 9), accountType, text("address", "Recipient address")],
  CHF: [
    NAME,
    iban("IBAN", /^CH\d{2}\d{5}[A-Z0-9]{12}$/),
    BANK,
    text("address", "Recipient address", { required: false }),
  ],
  GBP: [NAME, digits("sort_code", "Sort code", 6), digits("account_number", "Account number", 8), BANK],
  EUR: [NAME, iban(), { ...BANK, required: false }],
  CNY: [
    NAME,
    BANK,
    ACCOUNT,
    text("branch", "Branch name / code"),
    text("phone", "Phone number", { required: false, inputMode: "tel" }),
  ],
  AUD: [NAME, digits("bsb", "BSB", 6), { ...ACCOUNT, maxLength: 9 }, BANK],
  JPY: [
    NAME,
    BANK,
    digits("bank_code", "Bank code", 4),
    text("branch_name", "Branch name"),
    digits("branch_code", "Branch code", 3),
    { ...ACCOUNT, maxLength: 7 },
    accountType,
  ],
  RON: [NAME, iban("IBAN (Romania)", /^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/), BANK],
  HUF: [NAME, text("account_number", "IBAN or account number", { upper: true, maxLength: 34 }), BANK],
  CAD: [
    NAME,
    digits("institution", "Institution number", 3),
    digits("transit", "Transit number", 5),
    { ...ACCOUNT, maxLength: 12 },
    BANK,
  ],
  INR: [
    NAME,
    text("ifsc", "IFSC code", {
      upper: true,
      maxLength: 11,
      check: (v) => (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v) ? "" : "Enter a valid IFSC code"),
    }),
    ACCOUNT,
    BANK,
  ],
  MXN: [NAME, digits("clabe", "CLABE", 18), BANK],
};

const DOMESTIC_DEFAULT: WField[] = [NAME, BANK, ACCOUNT];

// Payment purpose is only asked where it is typically required
const PURPOSE_CURRENCIES = new Set(["USD", "EUR", "CNY"]);

const INTERNATIONAL = (currency: string): WField[] => [
  NAME,
  text("address", "Recipient address"),
  BANK,
  text("bank_address", "Bank address"),
  swift,
  text("iban", "IBAN / account number", { upper: true, maxLength: 34 }),
  ...(PURPOSE_CURRENCIES.has(currency) ? [text("purpose", "Payment purpose")] : []),
];

export const getWithdrawFields = (currency: string, type: WithdrawType): WField[] =>
  type === "international" ? INTERNATIONAL(currency) : DOMESTIC[currency] ?? DOMESTIC_DEFAULT;

/** Maps the form values onto the columns the transactions table already has. */
export const recipientFromFields = (v: Record<string, string>) => ({
  name: (v.name || "").trim(),
  account: (v.iban || v.account_number || v.clabe || "").trim(),
  bank: (v.bank_name || "").trim() || "External",
  routing: (v.routing_number || v.sort_code || v.bsb || v.swift || v.ifsc || "").trim() || null,
});
