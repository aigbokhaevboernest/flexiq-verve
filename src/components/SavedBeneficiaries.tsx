// src/components/SavedBeneficiaries.tsx
// Lists the user's saved beneficiaries of one type (local, digital, fx, wire).
// Shows the most recent one by default; the ▾ button expands the full list.
// Tapping one fills the form (via onSelect), shows a toast and scrolls to the submit button.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { PulseLoader } from "@/components/PulseLoader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { BeneficiaryKind } from "@/lib/beneficiaries";

interface SavedBeneficiariesProps {
  kind: BeneficiaryKind;
  onSelect: (beneficiary: any) => void;
  className?: string;
  /** id of the Continue / Send button to scroll to after a pick. */
  scrollTargetId?: string;
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const SavedBeneficiaries = ({
  kind,
  onSelect,
  className = "",
  scrollTargetId = "transfer-submit",
}: SavedBeneficiariesProps) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const { data: beneficiaries = [], isLoading } = useQuery({
    queryKey: ["beneficiaries", user?.id, kind],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("beneficiaries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("kind", kind)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const visible = expanded ? beneficiaries : beneficiaries.slice(0, 1);
  const hiddenCount = beneficiaries.length - 1;

  const pick = (b: any) => {
    onSelect(b);
    toast.success("Beneficiary selected", { description: b.name });
    // Let the form re-render with the filled values, then bring the button into view
    setTimeout(() => {
      document
        .getElementById(scrollTargetId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  return (
    <Card className={`rounded-3xl border-border/60 p-6 shadow-card ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Saved beneficiaries</p>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Show fewer beneficiaries" : "Show all beneficiaries"}
            className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-smooth hover:bg-muted"
          >
            {expanded ? "Less" : `+${hiddenCount} more`}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {beneficiaries.length > 0 && (
        <p className="mt-0.5 text-xs text-muted-foreground">Tap one to fill in the details.</p>
      )}

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {isLoading ? (
          <PulseLoader size={32} />
        ) : beneficiaries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No saved beneficiaries yet.</p>
        ) : (
          visible.map((b: any) => {
            // second line under the account number: platform (digital) or bank name
            const extra = [b.platform, b.bank_name].filter(Boolean).join(" · ");
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => pick(b)}
                className="flex w-full items-start gap-3 rounded-xl p-2 text-left transition-smooth hover:bg-muted"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-xs font-bold text-white">
                  {initials(b.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="break-all font-mono text-xs text-muted-foreground">{b.account_number}</p>
                  {b.iban && b.iban !== b.account_number && (
                    <p className="break-all font-mono text-xs text-muted-foreground">IBAN {b.iban}</p>
                  )}
                  {extra && <p className="text-[11px] text-muted-foreground">{extra}</p>}
                </div>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default SavedBeneficiaries;
