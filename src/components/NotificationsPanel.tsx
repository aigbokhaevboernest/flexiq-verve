import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Wallet, Copy, Check, ChevronDown } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Asset = "BTC" | "ETH" | "USDT";

// Addresses come from app_settings (the same columns the admin settings page saves).
const ASSETS: { key: Asset; name: string; field: string }[] = [
  { key: "BTC", name: "Bitcoin", field: "btc_wallet_address" },
  { key: "ETH", name: "Ethereum", field: "eth_wallet_address" },
  { key: "USDT", name: "USDT", field: "usdt_wallet_address" },
];

const AssetLabel = ({ asset }: { asset: Asset }) =>
  asset === "USDT" ? (
    <>USDT (<span className="font-semibold text-red-500">TRON</span>)</>
  ) : (
    <>{asset}</>
  );

export const NotificationsPanel = () => {
  const { user } = useAuth();
  const { data: settings } = useAppSettings();
  const [revealed, setRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Asset>("BTC"); // BTC is the default

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const s = settings as any;

  // Only wallets the admin has actually filled in.
  const wallets = ASSETS
    .map((a) => ({ ...a, address: (s?.[a.field] as string | null | undefined) || "" }))
    .filter((a) => a.address);

  // Falls back to the first available wallet if the selected one has no address.
  const active = wallets.find((w) => w.key === selected) ?? wallets[0];

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success("Copied to clipboard"); };

  const pick = (asset: Asset) => {
    setSelected(asset);
    setRevealed(false);
    setMenuOpen(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-smooth hover:bg-accent" aria-label="Notifications">
          <Bell className="h-4 w-4 animate-pulse" />
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 font-sans" align="end">
        <div className="border-b border-border/60 px-4 py-3">
          <p className="font-display text-sm font-bold">Notifications</p>
        </div>

        {active && (
          <div className="border-b border-border/60 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-center gap-1 pr-2">
              {/* Tap to reveal / hide the address */}
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                className="flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left hover:bg-primary/10"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Wallet className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Deposit wallet (<AssetLabel asset={active.key} />)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {revealed ? "Tap to hide" : "Tap to reveal address"}
                  </p>
                </div>
              </button>

              {/* v button to switch wallet */}
              {wallets.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Switch wallet"
                  aria-expanded={menuOpen}
                  className="shrink-0 rounded-md border border-border bg-background p-1.5 hover:bg-muted"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>

            {menuOpen && (
              <div className="mx-4 mb-3 divide-y divide-border/60 overflow-hidden rounded-md border border-border bg-background">
                {wallets.map((w) => (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => pick(w.key)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted ${
                      w.key === active.key ? "font-semibold" : ""
                    }`}
                  >
                    <span><AssetLabel asset={w.key} /></span>
                    {w.key === active.key && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}

            {revealed && (
              <div className="flex items-center gap-2 px-4 pb-3">
                <code className="flex-1 truncate rounded-md bg-background px-2 py-1.5 text-[11px] font-mono">{active.address}</code>
                <button
                  type="button"
                  onClick={() => copy(active.address)}
                  className="rounded-md border border-border p-1.5 hover:bg-muted"
                  aria-label="Copy address"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">You're all caught up.</p>
          ) : (
            items.map((n: any) => (
              <div key={n.id} className="border-b border-border/60 px-4 py-3 text-sm last:border-b-0">
                <div className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
