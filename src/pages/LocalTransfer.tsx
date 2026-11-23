import { useFrozenGuard } from "@/hooks/useFrozenGuard";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Check, Loader2, Lock, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatMoney, currencySymbol } from "@/hooks/useAccount";
import { useTotalBalance, planDeduction } from "@/hooks/useTotalBalance";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CodeGate } from "@/components/CodeGate";
import { SavedBeneficiaries } from "@/components/SavedBeneficiaries";
import { saveBeneficiary } from "@/lib/beneficiaries";
import { useNavigate } from "react-router-dom";
import { sendEmail } from "@/lib/sendEmail";

// TEMP: full file restore in progress — this stub prevents a blank build.
// Replace with full LocalTransfer from git history if this commit lands alone.
export default function LocalTransfer() {
  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold">Local Transfer</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Restoring page… please refresh after the next deploy.
      </p>
    </div>
  );
}
