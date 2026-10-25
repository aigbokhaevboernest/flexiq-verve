// src/components/SavedBeneficiaries.tsx
// Lists the user's saved beneficiaries of one type (local, digital, fx, wire) with the
// full details shown (nothing masked). Tapping one calls onSelect so the page can
// fill in its form.
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { PulseLoader } from "@/components/PulseLoader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { BeneficiaryKind } from "@/lib/beneficiaries";

interface SavedBeneficiariesProps {
  kind: BeneficiaryKind;
  onSelect: (beneficiary: any) => void;
  className?: string;
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const SavedBeneficiaries = ({ kind, onSelect, className = "" }: SavedBeneficiariesProps) => {
  const { user } = useAuth();

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

  return (
    <Card className={`rounded-3xl border-border/60 p-6 shadow-card ${className}`}>
      <p className="text-sm font-semibold">Saved beneficiaries</p>
      {beneficiaries.length > 0 && (
        <p className="mt-0.5 text-xs text-muted-foreground">Tap one to fill in the details.</p>
      )}

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {isLoading ? (
          <PulseLoader size={32} />
        ) : beneficiaries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No saved beneficiaries yet.</p>
        ) : (
          beneficiaries.map((b: any) => {
            // second line under the account number: platform (digital) or bank name
            const extra = [b.platform, b.bank_name].filter(Boolean).join(" · ");
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelect(b)}
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
