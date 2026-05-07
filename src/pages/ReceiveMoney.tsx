import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, QrCode, Share2 } from "lucide-react";
import { useAccount, useProfile } from "@/hooks/useAccount";
import { useToast } from "@/hooks/use-toast";

const ReceiveMoney = () => {
  const { data: account } = useAccount();
  const { data: profile } = useProfile();
  const { toast } = useToast();

  const copy = (txt: string, label: string) => {
    navigator.clipboard.writeText(txt);
    toast({ title: `${label} copied` });
  };

  const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Receive Money</h1>
        <p className="mt-1 text-sm text-muted-foreground">Share your account details to receive funds.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <div className="space-y-4">
            {[
              { label: "Account holder", value: fullName },
              { label: "Account number", value: account?.account_number || "—" },
              { label: "Currency", value: account?.currency || "USD" },
              { label: "Bank name", value: "Flexiq Verve Wealth" },
              { label: "SWIFT / BIC", value: "NRVXUS33" },
              { label: "Routing number", value: "021000089" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-2xl border border-border/60 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{row.label}</p>
                  <p className="mt-1 font-display font-bold">{row.value}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copy(row.value, row.label)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button className="mt-6 w-full gap-2 bg-gradient-primary" onClick={() => copy(
            `Account: ${account?.account_number}\nBank: Flexiq Verve Wealth\nSWIFT: NRVXUS33\nBeneficiary: ${fullName}`,
            "Bank details"
          )}>
            <Share2 className="h-4 w-4" /> Copy all details
          </Button>
        </Card>

        <Card className="rounded-3xl border-border/60 p-6 shadow-card flex flex-col items-center justify-center text-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-muted">
            <QrCode className="h-20 w-20 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-semibold">Scan to pay</p>
          <p className="mt-1 text-xs text-muted-foreground">Compatible with most mobile banking apps.</p>
        </Card>
      </div>
    </div>
  );
};

export default ReceiveMoney;
