// src/components/dashboard/SendChooserModal.tsx
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRightLeft, Building2, ChevronRight, Repeat, Smartphone } from "lucide-react";

const OPTIONS = [
  { to: "/dashboard/local", label: "Local transfer", hint: "Flexiq Verve users or local banks", icon: Repeat },
  { to: "/dashboard/send", label: "Digital payment", hint: "Wallets and payment apps", icon: Smartphone },
  { to: "/dashboard/send/wire", label: "Wire transfer", hint: "Bank-to-bank, international", icon: Building2 },
  { to: "/dashboard/send/fx", label: "FX transfer", hint: "Send in another currency", icon: ArrowRightLeft },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SendChooserModal = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();

  const choose = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl font-sans">
        <DialogHeader>
          <DialogTitle className="font-display">Send money</DialogTitle>
          <DialogDescription>Choose how you want to send.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {OPTIONS.map(({ to, label, hint, icon: Icon }) => (
            <button
              key={to}
              type="button"
              onClick={() => choose(to)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/60 p-3 text-left transition-smooth hover:bg-muted"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendChooserModal;
