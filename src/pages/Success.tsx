import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Download, X, Clock, Receipt } from "lucide-react";
import jsPDF from "jspdf";

interface SuccessState {
  title?: string;
  message?: string;
  details?: { label: string; value: string }[];
  receipt?: boolean;
  pending?: boolean;
  /** Path to navigate to when user cancels (X). Defaults to history back. */
  returnTo?: string;
}

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as SuccessState) || {};
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Flexiq Verve Wealth", 20, 20);
    doc.setFontSize(13); doc.text(state.title || "Transaction Receipt", 20, 32);
    doc.setFontSize(10); doc.text(state.message || "", 20, 40);
    let y = 56;
    (state.details || []).forEach((d) => {
      doc.setFont("helvetica", "bold"); doc.text(d.label + ":", 20, y);
      doc.setFont("helvetica", "normal"); doc.text(String(d.value || ""), 75, y);
      y += 8;
    });
    doc.save("flexiq-receipt.pdf");
  };

  const iconWrap = "bg-amber-100 ring-amber-200";
  const iconColor = "text-amber-600";
  const Icon = Clock;

  const handleCancel = () => {
    if (state.returnTo) navigate(state.returnTo);
    else navigate(-1);
  };

  return (
    <div className="font-sans flex min-h-[60vh] items-center justify-center">
      <Card className="relative w-full max-w-lg rounded-3xl border-border/60 p-8 shadow-elev animate-scale-in">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="absolute right-3 top-3 gap-1 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" /> Cancel
        </Button>
        {loading ? (
          <div className="space-y-4">
            <div className="flex justify-center"><Skeleton className="h-20 w-20 rounded-full" /></div>
            <Skeleton className="mx-auto h-7 w-2/3" />
            <Skeleton className="mx-auto h-4 w-3/4" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ring-4 ${iconWrap}`}>
              <Icon className={`h-12 w-12 ${iconColor}`} />
            </div>
            <h1 className="mt-5 font-display text-2xl font-bold">{state.title || "Transfer Submitted"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{state.message || "Pending system verification."}</p>

            {state.details && state.details.length > 0 && (
              <div className="mt-6 space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4 text-left">
                {state.details.map((d) => (
                  <div key={d.label} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="text-right font-medium break-all">{d.value || "—"}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => navigate("/dashboard/transactions")} className="rounded-xl bg-gradient-primary shadow-glow">
                <Receipt className="mr-2 h-4 w-4" /> View Transaction
              </Button>
              {state.receipt && (
                <Button variant="outline" onClick={downloadPdf} className="rounded-xl"><Download className="mr-2 h-4 w-4" /> Download</Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Success;
