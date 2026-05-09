import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCta?: () => void;
}

export const EmptyState = ({ icon: Icon, title, description, ctaLabel, ctaTo, onCta }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center px-6 py-12 text-center animate-fade-in">
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 to-accent/10 ring-1 ring-primary/20">
      <Icon className="h-9 w-9 text-primary" />
    </div>
    <h3 className="font-display text-lg font-bold">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    {ctaLabel && (ctaTo || onCta) && (
      <Button asChild={!!ctaTo} onClick={onCta} className="mt-5 gap-2 rounded-2xl bg-gradient-primary shadow-glow">
        {ctaTo ? <Link to={ctaTo}>{ctaLabel}</Link> : <span>{ctaLabel}</span>}
      </Button>
    )}
  </div>
);
