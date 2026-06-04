import { ReactNode } from "react";

/**
 * Horizontal-rule section heading used on transfer forms.
 *
 *  — Amount ——————————————
 *
 * Muted leading dash + label + muted trailing line. Premium, minimal.
 */
export const SectionLabel = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-3 select-none">
    <span aria-hidden className="text-base font-normal text-muted-foreground/50">—</span>
    <span className="font-display text-base font-bold tracking-tight text-foreground sm:text-[17px]">
      {children}
    </span>
    <span aria-hidden className="h-px flex-1 bg-border/70" />
  </div>
);

export default SectionLabel;
