import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, KeyRound, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type CodeType = "cot" | "tax" | "imf" | "itc" | "loan";

interface CodeGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  required?: CodeType[];
  title?: string;
  description?: string;
  onVerified: (codeIds: string[]) => Promise<void> | void;
}

const meta: Record<CodeType, { name: string; full: string; desc: string }> = {
  cot: { name: "COT Code", full: "Cost of Transfer", desc: "Enter your Cost of Transfer Code to continue." },
  tax: { name: "Tax Code", full: "Tax Clearance", desc: "Enter your Tax Clearance Code to continue." },
  itc: { name: "ITC Code", full: "International Transfer", desc: "Enter your International Transfer Code to continue." },
  imf: { name: "IMF Code", full: "International Monetary Fund", desc: "Enter your IMF Authorization Code to continue." },
  loan: { name: "Loan Code", full: "Loan Authorization", desc: "Enter your Loan Authorization Code to continue." },
};

export const CodeGate = ({ open, onOpenChange, required, title, description, onVerified }: CodeGateProps) => {
  const { user } = useAuth();
  const [enabledCodes, setEnabledCodes] = useState<CodeType[]>(["cot"]);
  const [step, setStep] = useState(0);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "checking" | "success" | "error">("idle");

  // Fetch only enabled codes from withdrawal_codes table
  useEffect(() => {
    if (!user || !open) return;
    supabase
      .from("withdrawal_codes")
      .select("code_type, enabled")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .then(({ data }) => {
        const list: CodeType[] = ["cot"]; // COT always required
        if (data?.find(d => d.code_type === "TAX")) list.push("tax");
        if (data?.find(d => d.code_type === "ITC")) list.push("itc");
        if (data?.find(d => d.code_type === "IMF")) list.push("imf");
        setEnabledCodes(list);
      });
  }, [user, open]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setValue("");
      setError(null);
      setVerifiedIds([]);
      setState("idle");
    }
  }, [open]);

  const computed = useMemo<CodeType[]>(() => {
    if (required && required.length) return required;
    return enabledCodes;
  }, [required, enabledCodes]);

  const current = computed[step];
  const total = computed.length;

  const verify = async () => {
    if (!user || !current) return;
    const code = value.trim();
    if (!code) { setError("Please enter the code."); setState("error"); return; }
    setState("checking");
    setError(null);

    const { data, error: qErr } = await supabase
      .from("withdrawal_codes")
      .select("id, verified, enabled")
      .eq("user_id", user.id)
      .eq("code_type", current.toUpperCase())
      .eq("code", code)
      .eq("enabled", true)
      .maybeSingle();

    if (qErr || !data) {
      setState("error");
      setError(`Invalid ${meta[current].name}. Please contact support.`);
      return;
    }

    const next = [...verifiedIds, data.id];
    setVerifiedIds(next);
    setState("success");

    setTimeout(async () => {
      if (step + 1 < total) {
        // More steps — move to next code
        setStep(step + 1);
        setValue("");
        setState("idle");
      } else {
        // All codes verified — mark as verified and exit
        await supabase
          .from("withdrawal_codes")
          .update({ verified: true })
          .in("id", next);
        try {
          await onVerified(next);
          onOpenChange(false);
        } catch {/* parent handles */}
      }
    }, 600);
  };

  const m = current ? meta[current] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md font-sans p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/5 p-7">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </span>
              <DialogTitle className="text-base font-bold">{title || "Authorization required"}</DialogTitle>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {description || "Enter the codes provided by your account manager."}
            </p>
          </DialogHeader>

          {/* Only show steps if more than 1 code required */}
          {total > 1 && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Step {step + 1} of {total}</span>
                <span>{m?.name}</span>
              </div>
              <div className="flex gap-1.5">
                {computed.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i < step ? "bg-green-600" : i === step ? "bg-gradient-to-r from-primary to-accent" : "bg-border"
                  }`} />
                ))}
              </div>
            </div>
          )}

          {m && (
            <div key={current} className="mt-6 animate-fade-in space-y-3">
              <div>
                <p className="font-display text-xl font-bold leading-tight">{m.full} Code</p>
                <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
              </div>

              <div className={`rounded-2xl border-2 bg-card p-1 transition-all duration-300 ${
                state === "error" ? "border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]" :
                state === "success" ? "border-green-600 shadow-[0_0_0_4px_rgba(22,163,74,0.18)]" :
                "border-border focus-within:border-primary focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]"
              }`}>
                <Input
                  autoFocus
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value.toUpperCase());
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
                  <><KeyRound className="mr-2 h-4 w-4" /> {step + 1 < total ? "Verify & continue" : "Verify & authorize"}</>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
