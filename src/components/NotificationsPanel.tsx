import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Wallet, Copy, Check } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NotificationsPanel = () => {
  const { user } = useAuth();
  const { data: settings } = useAppSettings();
  const [revealed, setRevealed] = useState<string | null>(null);

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

  const wallet = settings?.wallet_address;
  const crypto = settings?.wallet_crypto || "BTC";

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success("Copied to clipboard"); };

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

        {wallet && (
          <button
            type="button"
            onClick={() => setRevealed((v) => (v ? null : wallet))}
            className="w-full text-left border-b border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 px-4 py-3 hover:bg-primary/10"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"><Wallet className="h-4 w-4" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Deposit wallet ({crypto})</p>
                <p className="text-xs text-muted-foreground">{revealed ? "Tap to hide" : "Tap to reveal address"}</p>
              </div>
            </div>
            {revealed && (
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 truncate rounded-md bg-background px-2 py-1.5 text-[11px] font-mono">{revealed}</code>
                <button onClick={(e) => { e.stopPropagation(); copy(revealed); }} className="rounded-md border border-border p-1.5 hover:bg-muted"><Copy className="h-3 w-3" /></button>
              </div>
            )}
          </button>
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
