import { useFrozenGuard } from "@/hooks/useFrozenGuard";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { useTotalBalance, getBalanceBreakdown, planDeduction } from "@/hooks/useTotalBalance";
import { EmptyState } from "@/components/EmptyState";
import { PulseLoader } from "@/components/PulseLoader";
import { saveBeneficiary } from "@/lib/beneficiaries";
import { Inbox } from "lucide-react";
import { sendEmail } from "@/lib/sendEmail";

type Platform = {
  key: string;
  name: string;
  bg: string;
  fg?: string;
  send: string;
  /** Leave empty to show the first letter of the name instead of a logo. */
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
  // No stable icon source for these two: they show a letter. To use a real logo,
  // add public/logos/worldremit.svg or chime.svg and set the path here.
  { key: "worldremit", name: "WorldRemit", bg: "#E2001A", fg: "#fff", send: "#E2001A", logo: "", fields: [{ key: "phone", label: "Phone", placeholder: "+1 555 555 5555" }] },
  { key: "chime", name: "Chime", bg: "#1EC677", fg: "#fff", send: "#1EC677", logo: "", fields: [{ key: "username", label: "Chime username/email", placeholder: "$ChimeSign" }] },
  { key: "westernunion", name: "Western Union", bg: "#FFDD00", fg: "#000", send: "#FFDD00", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/westernunion.svg", fields: [{ key: "receiver", label: "Receiver name", placeholder: "Full name" }] },
];

// Shows the logo, or the first letter of the platform if there is no logo or it fails to load.
const PlatformLogo = ({ p, size }: { p: Platform; size: "sm" | "lg" }) => {
  const [failed, setFailed] = useState(false);
  const showLetter = !p.logo || failed;
  const imgCls = size === "lg" ? "h-8 w-8" : "h-5 w-5";
  const letterCls = size === "lg" ? "text-2xl" : "text-base";
  return showLetter ? (
    <span className={`${letterCls} font-bold leading-none`} style={{ color: p.fg || "#fff" }}>
      {p.name.charAt(0)}
    </span>
  ) : (
    <img
      src={p.logo}
      alt={p.name}
      className={`${imgCls} object-contain`}
      style={{ filter: "brightness(0) invert(1)" }}
      onError={() => setFailed(true)}
    />
  );
};

// Shows exactly what is stored in the database: pending | processing | completed | failed.
const StatusBadge = ({ s }: { s: string }) => {
  const key = (s || "pending").toLowerCase();
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning",
    processing: "bg-blue-500/15 text-blue-600",
    completed: "bg-success/15 text-success",
    failed: "bg-destructive/15 text-destructive",
    rejected: "bg-destructive/15 text-destructive",
  };
  return <Badge className={`rounded-full border-0 capitalize ${map[key] || "bg-muted text-muted-foreground"}`}>{key}</Badge>;
};

const SendMoney = () => {
  useFrozenGuard();

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Available balance = primary + opened secondary accounts (same as the dashboard).
  const { account, total: availableBalance } = useTotalBalance();
  const currency: string = account?.currency || "USD";

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

  const loadHistory = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoadingHistory(true);
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

  // Keep the list in step with the database: when an admin changes a status it updates here
  // (live if Realtime is on for digital_payments, otherwise when the user returns to the tab).
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`digital_payments_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "digital_payments", filter: `user_id=eq.${user.id}` },
        () => loadHistory(true)
      )
      .subscribe();
    const onFocus = () => loadHistory(true);
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [user]);

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
    if (amt > availableBalance) {
      return toast({
        title: "Insufficient balance",
        description: `Available: ${formatMoney(availableBalance, currency)}`,
        variant: "destructive",
      });
    }

    // Save the recipient as soon as Submit is clicked and the details are valid
    if (user) {
      saveBeneficiary(user.id, "digital", {
        name: recipient,
        account_number: recipient,
        platform: selected.name,
      }).then(() => queryClient.invalidateQueries({ queryKey: ["beneficiaries"] }));
    }
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

    // Re-read the balance now so a stale screen can never overdraw the account.
    const { data: fresh } = await (supabase as any)
      .from("profiles").select("*").eq("id", user.id).maybeSingle();
    const plan = planDeduction(fresh, pendingAmount);
    if (!fresh || !plan.ok) {
      setBusy(false);
      return toast({
        title: "Insufficient balance",
        description: `Available: ${formatMoney(getBalanceBreakdown(fresh).total, currency)}`,
        variant: "destructive",
      });
    }

    const { error } = await (supabase as any).from("digital_payments").insert({
      user_id: user.id,
      platform: pendingPlatform.name,
      amount: pendingAmount,
      recipient: pendingRecipient,
      note: pendingNote || null,
      status: "pending",
    });
    if (error) {
      setBusy(false);
      return toast({ title: "Could not submit", description: error.message, variant: "destructive" });
    }

    // Also record in transactions so it shows on the Transactions page
    await (supabase as any).from("transactions").insert({
      user_id: user.id,
      type: "digital_payment",
      status: "pending",
      amount: -pendingAmount,
      currency,
      recipient_name: pendingRecipient,
      description: `${pendingPlatform.name} payment to ${pendingRecipient}`,
      metadata: { platform: pendingPlatform.name, note: pendingNote || null },
    });

    // Take the money out once, now. Later status changes (processing / completed)
    // don't touch the balance; a failed payment is refunded by the admin.
    const { error: balErr } = await (supabase as any)
      .from("profiles").update(plan.patch).eq("id", user.id);
    if (balErr) {
      toast({ title: "Balance could not be updated", description: balErr.message, variant: "destructive" });
    }
    queryClient.invalidateQueries();

    setBusy(false);
    loadHistory();

    try {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("first_name,last_name,email").eq("id", user.id).maybeSingle();
      const fn = prof?.first_name || "";
      const em = prof?.email || user.email || "";
      if (em) {
        await sendEmail({
          email: em, first_name: fn,
          subject: "Digital Payment — Flexiq Verve",
          message:
`This is to inform you that your ${pendingPlatform.name} payment of ${pendingAmount} ${currency} has been submitted and is currently pending review.

Please wait while we process your request. You will receive a notification regarding the status of your payment.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}

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
          { label: "Amount", value: formatMoney(pendingAmount, currency) },
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
        <p className="mt-2 text-sm font-medium">
          Available balance: <span className="font-bold">{formatMoney(availableBalance, currency)}</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-4">
        {platforms.map((p) => (
          <Card key={p.key} className="overflow-hidden rounded-2xl border-border/60 p-4 text-center shadow-card transition hover:shadow-glow">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: p.bg }}
            >
              <PlatformLogo p={p} size="lg" />
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
            <PulseLoader />
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
                  <p className="text-sm font-bold">{formatMoney(Number(h.amount), currency)}</p>
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
                  <PlatformLogo p={selected} size="sm" />
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
              <Label>Amount ({currency})</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Available: {formatMoney(availableBalance, currency)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              {/* 16px on mobile stops the browser zooming in when the field is focused */}
              <Textarea className="text-base md:text-sm" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
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
        amountLabel={formatMoney(Number(amount || 0), currency)}
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
        onVerified={() => { onVerified(); }}
      />
    </div>
  );
};

export default SendMoney;
