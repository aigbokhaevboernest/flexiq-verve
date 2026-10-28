import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bitcoin, Landmark, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const METHODS = [
  { id: "crypto", label: "Crypto", hint: "BTC, ETH, USDT", icon: Bitcoin },
  { id: "bank", label: "Bank transfer", hint: "Wire or ACH", icon: Landmark },
  { id: "card", label: "Debit / credit card", hint: "Instant", icon: CreditCard },
];

const WalletDeposit = () => {
  const { currency = "USD" } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState("crypto");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = Number(amount);
    if (!n || n <= 0) return toast.error("Enter a valid amount");
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    // Creates a pending deposit for admin approval / payment provider
    const { error } = await supabase.from("wallet_deposits").insert({
      user_id: user!.id, currency, amount: n, method, status: "pending",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Deposit request created");
    navigate("/dashboard/wallets");
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5 pb-28">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-display text-xl font-bold">Add funds · {currency}</h1>

      <div className="space-y-2">
        {METHODS.map(({ id, label, hint, icon: Icon }) => (
          <button key={id} onClick={() => setMethod(id)}
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
              method === id ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted"
            }`}>
            <Icon className="h-5 w-5" />
            <span className="flex-1">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block text-xs text-muted-foreground">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
        placeholder={`Amount in ${currency}`}
        className="w-full rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm outline-none focus:border-primary" />

      <button onClick={submit} disabled={busy}
        className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        Continue
      </button>
    </div>
  );
};

export default WalletDeposit;
