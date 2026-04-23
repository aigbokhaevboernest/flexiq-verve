import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  Search,
} from "lucide-react";

type Tx = {
  id: string;
  name: string;
  type: "Deposit" | "Transfer" | "Card" | "Refund" | "Subscription" | "FX" | "Loan";
  status: "Completed" | "Pending" | "Failed";
  amount: number;
  date: string; // ISO
};

const seed: Tx[] = [
  { id: "TX-1042", name: "Salary — Acme Inc.", type: "Deposit", status: "Completed", amount: 4200, date: "2025-04-22T09:10:00Z" },
  { id: "TX-1041", name: "Spotify Premium", type: "Subscription", status: "Completed", amount: -10.99, date: "2025-04-22T07:42:00Z" },
  { id: "TX-1040", name: "Maya Patel", type: "Transfer", status: "Completed", amount: -120, date: "2025-04-22T06:15:00Z" },
  { id: "TX-1039", name: "Whole Foods", type: "Card", status: "Completed", amount: -82.43, date: "2025-04-21T18:02:00Z" },
  { id: "TX-1038", name: "Refund — Amazon", type: "Refund", status: "Pending", amount: 39.99, date: "2025-04-21T11:35:00Z" },
  { id: "TX-1037", name: "Local transfer — D. Lee", type: "Transfer", status: "Completed", amount: -560, date: "2025-04-20T14:22:00Z" },
  { id: "TX-1036", name: "FX — EUR to USD", type: "FX", status: "Completed", amount: -1240, date: "2025-04-19T10:08:00Z" },
  { id: "TX-1035", name: "Quick Loan disbursed", type: "Loan", status: "Completed", amount: 2500, date: "2025-04-18T08:00:00Z" },
  { id: "TX-1034", name: "Uber", type: "Card", status: "Failed", amount: -24.5, date: "2025-04-17T22:14:00Z" },
  { id: "TX-1033", name: "Apple iCloud", type: "Subscription", status: "Completed", amount: -2.99, date: "2025-04-16T09:00:00Z" },
  { id: "TX-1032", name: "Sarah Kim", type: "Transfer", status: "Pending", amount: -300, date: "2025-04-16T07:30:00Z" },
  { id: "TX-1031", name: "Stripe payout", type: "Deposit", status: "Completed", amount: 980, date: "2025-04-15T12:00:00Z" },
];

const fmt = (n: number) =>
  `${n < 0 ? "−" : "+"}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const Transactions = () => {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [range, setRange] = useState<string>("30");

  const filtered = useMemo(() => {
    const days = parseInt(range, 10);
    const cutoff = isNaN(days) ? 0 : Date.now() - days * 86400000;
    return seed.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q.toLowerCase()) && !t.id.toLowerCase().includes(q.toLowerCase())) return false;
      if (type !== "all" && t.type !== type) return false;
      if (status !== "all" && t.status !== status) return false;
      if (cutoff && new Date(t.date).getTime() < cutoff) return false;
      return true;
    });
  }, [q, type, status, range]);

  const totalIn = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All your money movements in one place.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/60 p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Money in</p>
          <p className="mt-2 font-display text-2xl font-bold text-success">
            +${totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="rounded-2xl border-border/60 p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Money out</p>
          <p className="mt-2 font-display text-2xl font-bold">
            −${totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="rounded-2xl border-border/60 p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Net</p>
          <p className={`mt-2 font-display text-2xl font-bold ${totalIn - totalOut >= 0 ? "text-success" : "text-destructive"}`}>
            {totalIn - totalOut >= 0 ? "+" : "−"}${Math.abs(totalIn - totalOut).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ID…" className="pl-9" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Deposit">Deposit</SelectItem>
              <SelectItem value="Transfer">Transfer</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
              <SelectItem value="Refund">Refund</SelectItem>
              <SelectItem value="Subscription">Subscription</SelectItem>
              <SelectItem value="FX">FX</SelectItem>
              <SelectItem value="Loan">Loan</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Date range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="0">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="shrink-0" aria-label="More filters">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 font-medium">Transaction</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((t) => {
                const positive = t.amount > 0;
                return (
                  <tr key={t.id} className="group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${positive ? "bg-success/15 text-success" : "bg-muted text-foreground/70"}`}>
                          {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-muted-foreground">{t.type}</td>
                    <td className="py-4 text-muted-foreground">
                      {new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-4">
                      <Badge
                        variant="outline"
                        className={
                          t.status === "Completed"
                            ? "border-success/30 bg-success/10 text-success"
                            : t.status === "Pending"
                            ? "border-warning/30 bg-warning/10 text-warning"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className={`py-4 text-right font-display font-bold ${positive ? "text-success" : ""}`}>
                      {fmt(t.amount)}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Transactions;
