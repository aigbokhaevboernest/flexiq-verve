import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, KeyRound, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CodeGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ordered list of code types required (e.g. ["cot","imf","tax"]). */
  required: ("cot" | "imf" | "tax" | "loan")[];
  title?: string;
  description?: string;
  onVerified: (codeIds: string[]) => Promise<void> | void;
}

const labels: Record<string, string> = {
  cot: "COT (Cost of Transfer) Code",
  imf: "IMF Authorization Code",
  tax: "Tax Clearance Code",
  loan: "Loan Authorization Code",
};

export const CodeGate = ({ open, onOpenChange, required, title, description, onVerified }: CodeGateProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const current = required[step];

  const reset = () => {
    setStep(0);
    setValues({});
    setVerifiedIds([]);
    setBusy(false);
  };

  const verifyCurrent = async () => {
    if (!user || !current) return;
    setBusy(true);
    const code = (values[current] || "").trim();
    if (!code) {
      toast({ title: "Enter the code", variant: "destructive" });
      setBusy(false);
      return;
    }
    const { data, error } = await supabase
      .from("auth_codes")
      .select("id, used, expires_at")
      .eq("user_id", user.id)
      .eq("code_type", current)
      .eq("code", code)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Invalid code", description: `The ${labels[current]} you entered is not valid. Contact support to obtain a valid code.`, variant: "destructive" });
      setBusy(false);
      return;
    }
    if (data.used) {
      toast({ title: "Code already used", description: "This code has already been redeemed.", variant: "destructive" });
      setBusy(false);
      return;
    }
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      toast({ title: "Code expired", variant: "destructive" });
      setBusy(false);
      return;
    }

    const nextVerified = [...verifiedIds, data.id];
    setVerifiedIds(nextVerified);

    if (step + 1 < required.length) {
      setStep(step + 1);
      setBusy(false);
    } else {
      // Mark all codes as used
      await supabase
        .from("auth_codes")
        .update({ used: true, used_at: new Date().toISOString() })
        .in("id", nextVerified);

      try {
        await onVerified(nextVerified);
        onOpenChange(false);
        reset();
      } catch (e: any) {
        toast({ title: "Action failed", description: e.message, variant: "destructive" });
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {title || "Authorization required"}
          </DialogTitle>
          <DialogDescription>
            {description || "Enter the codes provided by your account manager to authorize this action."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-foreground/80">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p>
              Step {step + 1} of {required.length}. Each code can only be used once and must be issued by the bank.
            </p>
          </div>
        </div>

        {current && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <KeyRound className="h-3.5 w-3.5" />
              {labels[current]}
            </Label>
            <Input
              value={values[current] || ""}
              onChange={(e) => setValues({ ...values, [current]: e.target.value.toUpperCase() })}
              placeholder="e.g. NX-A4F2-9KQ7"
              className="font-mono tracking-widest"
              autoFocus
            />
          </div>
        )}

        <Button
          onClick={verifyCurrent}
          disabled={busy}
          className="w-full bg-gradient-primary"
        >
          {busy ? "Verifying…" : step + 1 < required.length ? "Verify & continue" : "Verify & authorize"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
