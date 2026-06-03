import { useFrozenGuard } from "@/hooks/useFrozenGuard";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ConfirmTransferDialog } from "@/components/ConfirmTransferDialog";
import { CodeGate } from "@/components/CodeGate";
import { formatMoney } from "@/hooks/useAccount";
import { EmptyState } from "@/components/EmptyState";
import { Inbox } from "lucide-react";

type Platform = {
  key: string;
  name: string;
  bg: string;
  fg?: string;
  send: string;
  logo: string;
  fields: { key: string; label: string; placeholder?: string }[];
};

const platforms: Platform[] = [
  { key: "cashapp", name: "Cash App", bg: "#00D632", fg: "#000", send: "#00D632", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/cashapp.svg", fields: [{ key: "tag", label: "$Cashtag", placeholder: "$username" }] },
  { key: "paypal", name: "PayPal", bg: "#003087", fg: "#fff", send: "#003087", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/paypal.svg", fields: [{ key: "email", label: "Email", placeholder: "name@email.com" }] },
  { key: "venmo", name: "Venmo", bg: "#008CFF", fg: "#fff", send: "#008CFF", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/venmo.svg", fields: [{ key: "username", label: "Username", placeholder: "@username" }] },
  { key: "zelle", name: "Zelle", bg: "#6D1ED4", fg: "#fff", send: "#6D1ED4", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/zelle.svg", fields: [{ key: "contact", label: "Email or phone", placeholder: "name@email.com or phone" }] },
  { key: "applepay", name: "Apple Pay", bg: "#000000", fg: "#fff", send: "#000000", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/applepay.svg", fields: [{ key: "phone", label: "Phone or email", placeholder: "+1 555 555 5555" }] },
  { key: "googlepay", name: "Google Pay", bg: "#4285F4", fg: "#fff", send: "#4285F4", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/googlepay.svg", fields: [{ key: "contact", label: "Email or phone", placeholder: "name@email.com" }] },
  { key: "stripe", name: "Stripe", bg: "#635BFF", fg: "#fff", send: "#635BFF", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/stripe.svg", fields: [{ key: "email", label: "Email", placeholder: "name@email.com" }] },
  { key: "wise", name: "Wise", bg: "#163300", fg: "#9FE870", send: "#9FE870", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/wise.svg", fields: [{ key: "email", label: "Email", placeholder: "name@email.com" }] },
  { key: "revolut", name: "Revolut", bg: "#191C1F", fg: "#fff", send: "#191C1F", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/revolut.svg", fields: [{ key: "username", label: "@revtag", placeholder: "@revtag" }] },
  { key: "worldremit", name: "WorldRemit", bg: "#E2001A", fg: "#fff", send: "#E2001A", logo: "https://logo.clearbit.com/worldremit.com", fields: [{ key: "phone", label: "Phone", placeholder: "+1 555 555 5555" }] },
  { key: "chime", name: "Chime", bg: "#1EC677", fg: "#fff", send: "#1EC677", logo: "https://logo.clearbit.com/chime.com", fields: [{ key: "username", label: "Chime username/email", placeholder: "$ChimeSign" }] },
  { key: "westernunion", name: "Western Union", bg: "#FFDD00", fg: "#000", send: "#FFDD00", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/westernunion.svg", fields: [{ key: "receiver", label: "Receiver name", placeholder: "Full name" }] },

];

const StatusBadge = ({ s }: { s: string }) => {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    completed: "bg-success/15 text-success",
    rejected: "bg-destructive/15 text-destructive",
  };
  return <Badge className={`rounded-full border-0 ${map[s] || "bg-muted text-muted-foreground"}`}>{s}</Badge>;
};

const SendMoney = () => {
  useFrozenGuard();

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<Platform | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [codeGateOpen, setCodeGateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [pendingPlatform, setPendingPlatform] = useState<Platform | null>(null);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingRecipient, setPendingRecipient] = useState("");
  const [pendingNote, setPendingNote] = useState("");

  const recipient = useMemo(() => Object.values(form).find(Boolean) || "", [form]);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await (supabase as any)
      .from("digital_payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory(data || []);
    setLoadingHistory(false);
  };

  useEffect(() => { loadHistory(); }, [user]);

  const open = (p: Platform) => {
    setSelected(p);
    setForm({});
    setAmount("");
    setNote("");
  };

  const submit = () => {
    if (!selected) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast({ title: "Enter a valid amount", variant: "destructive" });
    if (!recipient) return toast({ title: "Recipient required", variant: "destructive" });
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setPendingPlatform(selected);
    setPendingAmount(Number(amount));
    setPendingRecipient(recipient);
    setPendingNote(note);
    setConfirmOpen(false);
    setSelected(null);
    setCodeGateOpen(true);
  };

  const onVerified = async () => {
    if (!pendingPlatform || !user) return;
    setBusy(true);
    const { error } = await (supabase as any).from("digital_payments").insert({
      user_id: user.id,
      platform: pendingPlatform.name,
      amount: pendingAmount,
      recipient: pendingRecipient,
      note: pendingNote || null,
      status: "pending",
    });
    setBusy(false);
    if (error) return toast({ title: "Could not submit", description: error.message, variant: "destructive" });
    loadHistory();
    navigate("/dashboard/success", {
      state: {
        title: "Transfer Submitted",
        message: "Pending system verification. Your transfer is under review.",
        receipt: true,
        returnTo: "/dashboard/send",
        details: [
          { label: "Date", value: new Date().toLocaleString() },
          { label: "Platform", value: pendingPlatform.name },
          { label: "Recipient", value: pendingRecipient },
          { label: "Amount", value: formatMoney(pendingAmount) },
          { label: "Status", value: "Pending Review" },
        ],
      },
    });
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Digital Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send to any wallet or payment platform.</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-4">
        {platforms.map((p) => (
          <Card key={p.key} className="overflow-hidden rounded-2xl border-border/60 p-4 text-center shadow-card transition hover:shadow-glow">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: p.bg }}
            >
              <img
                src={p.logo}
                alt={p.name}
                className="h-8 w-8 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <p className="mt-3 text-sm font-semibold">{p.name}</p>
            <Button
              onClick={() => open(p)}
              className="mt-3 h-8 w-full rounded-full text-xs font-semibold"
              style={{ background: p.send, color: p.send === "#9FE870" ? "#163300" : "#fff", border: 0 }}
            >
              Send
            </Button>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Recent Transactions</h2>
        <div className="mt-4 divide-y divide-border/60">
          {loadingHistory ? (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : history.length === 0 ? (
            <EmptyState icon={Inbox} title="No payments yet" description="Send money to a wallet to see it here." />
          ) : (
            history.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{h.platform}</p>
                  <p className="truncate text-xs text-muted-foreground">{h.recipient} · {new Date(h.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatMoney(Number(h.amount))}</p>
                  <StatusBadge s={h.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="font-sans sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selected && (
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: selected.bg }}
                >
                  <img
                    src={selected.logo}
                    alt={selected.name}
                    className="h-5 w-5 object-contain"
                    style={{ filter: "brightness(0) invert(1)" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </span>
              )}
              Send via {selected?.name}
            </DialogTitle>
            <DialogDescription>Enter recipient and amount details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selected?.fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                <Input
                  value={form[f.key] || ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)} className="rounded-xl">Close</Button>
            <Button
              onClick={submit}
              className="rounded-xl"
              style={{ background: selected?.send || "", color: selected?.send === "#9FE870" ? "#163300" : "#fff" }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmTransferDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        amountLabel={formatMoney(Number(amount || 0))}
        recipientName={recipient || "recipient"}
        rows={[
          { label: "Platform", value: selected?.name || "" },
          { label: "Recipient", value: recipient },
          { label: "Note", value: note || "—" },
        ]}
        onConfirm={handleConfirm}
        busy={busy}
      />

      <CodeGate
        open={codeGateOpen}
        onOpenChange={setCodeGateOpen}
        title="Authorize Digital Payment"
        onVerified={onVerified}
      />
    </div>
  );
};

export default SendMoney;
