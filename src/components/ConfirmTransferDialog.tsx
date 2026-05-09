import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface Row { label: string; value: string; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rows: Row[];
  amountLabel: string;
  recipientName: string;
  onConfirm: () => void;
  busy?: boolean;
}

export const ConfirmTransferDialog = ({ open, onOpenChange, rows, amountLabel, recipientName, onConfirm, busy }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md font-sans">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-warning" /> Confirm transfer
        </DialogTitle>
        <DialogDescription>
          Are you sure you want to send <span className="font-semibold text-foreground">{amountLabel}</span> to <span className="font-semibold text-foreground">{recipientName}</span>?
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{r.label}</span>
            <span className="text-right font-medium break-all">{r.value || "—"}</span>
          </div>
        ))}
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
        <Button onClick={onConfirm} disabled={busy} className="rounded-xl bg-gradient-primary shadow-glow">
          {busy ? "Preparing…" : "Confirm & continue"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
