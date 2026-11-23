import { Snowflake, Wifi } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/** One solid base + accent per card. Picked by the card's position in the list. */
export const cardThemes = [
  { bg: "#0f1b33", accent: "#F5A623" }, // navy + gold
  { bg: "#0b3d2e", accent: "#34d399" }, // emerald
  { bg: "#4a1428", accent: "#fb7185" }, // burgundy
  { bg: "#18181b", accent: "#F5A623" }, // graphite + gold
  { bg: "#2e1a5c", accent: "#a78bfa" }, // violet
  { bg: "#0c3b4a", accent: "#22d3ee" }, // deep teal
];

type CardFaceProps = {
  /** Position of the card in the list; decides its color */
  index?: number;
  card?: any;
  /** Used when the card row has no holder name (e.g. profile first name) */
  holderFallback?: string;
  /** Show the full card number instead of the masked one */
  revealed?: boolean;
  /** Optional balance shown next to the chip (e.g. "$1,200.00") */
  balanceText?: string;
  /** Greys the card out (stays fully opaque so cards stacked behind never show through) */
  inactive?: boolean;
  /** Centered pill over the card, e.g. "Card frozen" */
  overlayLabel?: string | null;
  loading?: boolean;
  className?: string;
};

/**
 * Premium card face used on the dashboard and the Cards page.
 * Solid navy, gold chip, soft decorative circles. Fills its parent
 * (parent controls size / aspect ratio / drag).
 */
const CardFace = ({
  card,
  holderFallback,
  revealed = false,
  balanceText,
  inactive = false,
  overlayLabel,
  loading = false,
  className = "",
  index = 0,
}: CardFaceProps) => {
  const theme = cardThemes[Math.abs(index) % cardThemes.length];
  const raw = String(card?.card_number || "").replace(/\D/g, "");
  const last4 = raw.slice(-4);
  const masked = `•••• •••• •••• ${last4 || "————"}`;
  const full = raw ? raw.replace(/(.{4})/g, "$1 ").trim() : masked;
  const holder =
    card?.card_holder?.trim() ||
    card?.cardholder_name?.trim() ||
    (holderFallback || "").trim().toUpperCase() ||
    "—";
  const expiry = card?.expiry || "—";
  const isPhysical = card?.card_type === "physical";

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl p-5 text-white transition-all duration-300 ${
        // No opacity here: a see-through front card let the cards stacked
        // behind it show through (doubled text). Grey + dim instead.
        inactive ? "grayscale brightness-[0.65]" : ""
      } ${className}`}
      style={{ backgroundColor: theme.bg }}
    >
      <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/[0.05]" />
      <span
        className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full"
        style={{ backgroundColor: `${theme.accent}22` }}
      />
      <span className="pointer-events-none absolute inset-0 rounded-2xl border border-white/10" />

      <div className="relative flex h-full flex-col justify-between">
        {/* Top: type + contactless */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/60">
              {isPhysical ? "Physical" : "Virtual"}
            </p>
            <p className="mt-0.5 text-sm font-semibold tracking-wide">Debit</p>
          </div>
          <Wifi className="h-5 w-5 rotate-90 text-white/70" />
        </div>

        {/* Chip (+ optional balance) */}
        <div className="flex items-end justify-between gap-3">
          <div className="relative h-8 w-11 shrink-0 overflow-hidden rounded-md bg-[#F5A623]">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/25" />
            <span className="absolute inset-y-0 left-1/3 w-px bg-black/25" />
            <span className="absolute inset-y-0 right-1/3 w-px bg-black/25" />
            <span className="absolute inset-[5px] rounded-[3px] border border-black/25" />
          </div>
          {balanceText && !loading && (
            <div className="min-w-0 text-right">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/50">Balance</p>
              <p className="truncate font-display text-base font-bold tabular-nums">
                {balanceText}
              </p>
            </div>
          )}
        </div>

        {/* Number + holder / expiry */}
        {loading ? (
          <div>
            <Skeleton className="h-5 w-48 bg-white/25" />
            <div className="mt-4 flex justify-between">
              <Skeleton className="h-3 w-24 bg-white/25" />
              <Skeleton className="h-3 w-12 bg-white/25" />
            </div>
          </div>
        ) : (
          <div>
            <p className="font-mono text-[15px] tracking-[0.18em] sm:text-base">
              {revealed ? full : masked}
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/50">Card holder</p>
                <p className="mt-0.5 truncate text-xs font-medium uppercase tracking-wider">
                  {holder}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/50">Expires</p>
                <p className="mt-0.5 text-xs font-medium tabular-nums tracking-wider">{expiry}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {overlayLabel && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900">
            <Snowflake className="mr-2 h-4 w-4" />
            {overlayLabel}
          </span>
        </div>
      )}
    </div>
  );
};

export default CardFace;
