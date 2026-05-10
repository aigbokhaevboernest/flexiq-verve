import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, KeyRound, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LoanCodeGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string | null;
  onVerified: () => void;
}

export const LoanCodeGate = ({
  open,
  onOpenChange,
  loanId,
  onVerified,
}: LoanCodeGateProps) => {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCode("");
    setError(null);
    setState("idle");
  };

  const verify = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter your authorization code.");
      setState("error");
      return;
    }
    if (!loanId) return;
    setState("checking");
    setError(null);

    const { data, error: dbErr } = await supabase
      .from("loans")
      .select("disbursement_code, code_used")
      .eq("id", loanId)
      .maybeSingle();

    if (dbErr || !data) {
      setState("error");
      setError("Could not verify code. Try again.");
      return;
    }

    if (data.code_used) {
      setState("error");
      setError("This code has already been used.");
      return;
    }

    if (!data.disbursement_code || data.disbursement_code.toUpperCase() !== trimmed) {
      setState("error");
      setError("Invalid Loan Code. Please contact support.");
      return;
    }

    await supabase
      .from("loans")
      .update({ code_used: true })
      .eq("id", loanId);

    setState("success");

    setTimeout(() => {
      reset();
      onOpenChange(false);
      onVerified();
    }, 700);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md font-sans p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/5 p-7">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </span>
              <DialogTitle className="text-base font-bold">
                Authorize loan disbursement
              </DialogTitle>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Enter the Loan Authorization Code provided by your account manager to release funds.
            </p>
          </DialogHeader>

          <div className="mt-6 space-y-3">
            <div>
              <p className="font-display text-xl font-bold leading-tight">
                Loan Authorization Code
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter your code to release your loan funds.
              </p>
            </div>

            <div className={`rounded-2xl border-2 bg-card p-1 transition-all duration-300 ${
              state === "error"
                ? "border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]"
                : state === "success"
                ? "border-green-600 shadow-[0_0_0_4px_rgba(22,163,74,0.18)]"
                : "border-border focus-within:border-primary focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
            }`}>
              <Input
                autoFocus
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError(null);
                  if (state === "error") setState("idle");
                }}
                onKeyDown={(e) => { if (e.key === "Enter") verify(); }}
                placeholder="ENTER CODE"
                className="h-14 border-0 bg-transparent text-center font-mono text-xl font-bold tracking-[0.35em] shadow-none focus-visible:ring-0"
                disabled={state === "checking" || state === "success"}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300 animate-fade-in">
                <XCircle className="h-3.5 w-3.5" /> {error}
              </div>
            )}

            <Button
              onClick={verify}
              disabled={state === "checking" || state === "success"}
              className="h-12 w-full rounded-2xl bg-gradient-primary text-base font-semibold shadow-glow"
            >
              {state === "checking" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</>
              ) : state === "success" ? (
                <><CheckCircle2 className="mr-2 h-4 w-4" /> Verified</>
              ) : (
                <><KeyRound className="mr-2 h-4 w-4" /> Verify & release funds</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
