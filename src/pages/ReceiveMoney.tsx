import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Copy, Upload, Wallet } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const ReceiveMoney = () => {
  const { data: settings, isLoading } = useAppSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [crypto, setCrypto] = useState("BTC");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-60" />
      <Skeleton className="h-72 w-full rounded-3xl" />
    </div>
  );

  if (!settings?.receive_enabled) {
    return (
      <Dialog open onOpenChange={() => navigate("/dashboard")}>
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Feature unavailable</DialogTitle>
            <DialogDescription>This feature is currently unavailable. Please check back later.</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => navigate("/dashboard")}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const walletMap: Record<string, string> = {
  BTC: settings.btc_wallet_address || "—",
  ETH: settings.eth_wallet_address || "—",
  USDT: settings.usdt_wallet_address || "—",
};

const wallet = walletMap[crypto] || "—";
const cryptoName = crypto;

  const copy = () => { navigator.clipboard.writeText(wallet); toast({ title: "Wallet address copied" }); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!amount || Number(amount) <= 0) return toast({ title: "Enter an amount", variant: "destructive" });
    setSubmitting(true);
    let proofUrl: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("id-verification").upload(path, file);
      if (!up.error) proofUrl = path;
    }
    const { error } = await (supabase as any).from("deposit_requests").insert({
      user_id: user.id, crypto, amount: Number(amount), proof_url: proofUrl, status: "pending",
    });
    setSubmitting(false);
    if (error) return toast({ title: "Failed to submit", description: error.message, variant: "destructive" });

    navigate("/dashboard/success", {
      state: {
        title: "Deposit submitted",
        message: "Upon confirmation of your payment, we will promptly process your service request.",
        details: [
          { label: "Crypto", value: crypto },
          { label: "Amount", value: amount },
          { label: "Status", value: "Pending review" },
        ],
      },
    });
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Make Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send crypto to the address below to make payment.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-4 shadow-card sm:p-8 min-w-0">
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Payment method</Label>
                <select
                  value={crypto}
                  onChange={(e) => setCrypto(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="BTC">BTC — Bitcoin</option>
                  <option value="ETH">ETH — Ethereum</option>
                  <option value="USDT">USDT — Tether</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" step="0.0001" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required /></div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Wallet address ({cryptoName})</p>
              <div className="mt-2 flex items-center gap-2 min-w-0">
                <code className="flex-1 min-w-0 truncate rounded-lg bg-background px-3 py-2 font-mono text-xs">{wallet}</code>
                <Button type="button" variant="outline" size="icon" onClick={copy} className="shrink-0"><Copy className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upload payment proof (optional)</Label>
              <div className="flex items-center gap-3">
                <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 text-sm text-muted-foreground hover:bg-muted/40">
                  <Upload className="h-4 w-4" /> {file?.name || "Choose file…"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="h-12 w-full rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
              <Wallet className="mr-2 h-4 w-4" /> {submitting ? "Submitting…" : "Submit payment"}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col items-center rounded-3xl border-border/60 p-6 shadow-card text-center min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Scan to pay</p>
          <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-border">
            {wallet && wallet !== "—" ? <QRCodeSVG value={wallet} size={180} /> : <div className="h-44 w-44 bg-muted" />}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Open your crypto wallet, tap scan, and send {cryptoName} .</p>
        </Card>
      </div>
    </div>
  );
};

export default ReceiveMoney;
