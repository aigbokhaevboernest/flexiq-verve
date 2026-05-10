import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { toast } from "sonner";

interface LoanCodeGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string | null;
  userId: string;
  onVerified: () => void;
}

export const LoanCodeGate = ({
  open,
  onOpenChange,
  loanId,
  userId,
  onVerified,
}: LoanCodeGateProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (!code.trim()) return toast.error("Please enter your loan authorization code");
    if (!loanId) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("loan_codes")
      .select("*")
      .eq("loan_id", loanId)
      .eq("user_id", userId)
      .eq("code", code.trim())
      .eq("used", false)
      .maybeSingle();

    if (error || !data) {
      setLoading(false);
      return toast.error("Invalid or already used authorization code");
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setLoading(false);
      return toast.error("This code has expired. Please contact support.");
    }

    // Mark code as used
    await supabase
      .from("loan_codes")
      .update({ used: true })
      .eq("id", data.id);

    setLoading(false);
    setCode("");
    onOpenChange(false);
    onVerified();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setCode(""); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Loan Authorization Code
          </DialogTitle>
          <DialogDescription>
            Enter the Loan Authorization Code provided by your account manager to release your funds.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Authorization Code</Label>
            <Input
              placeholder="Enter code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              autoFocus
            />
          </div>
          <Button
            className="w-full bg-gradient-primary"
            onClick={verify}
            disabled={loading}
          >
            {loading ? "Verifying…" : "Release Funds"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
