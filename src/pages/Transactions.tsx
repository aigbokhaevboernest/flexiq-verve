import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownLeft, ArrowUpRight, Download, FileText, Filter, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney, useAccount, useProfile } from "@/hooks/useAccount";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Transactions = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: account } = useAccount();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("30");

  const { data: txs = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    const days = parseInt(range, 10);
    const cutoff = isNaN(days) || days === 0 ? 0 : Date.now() - days * 86400000;
    return txs.filter((t: any) => {
      const name = (t.description || t.recipient_name || t.reference || "").toLowerCase();
      if (q && !name.includes(q.toLowerCase()) && !t.reference?.toLowerCase().includes(q.toLowerCase())) return false;
      if (type !== "all" && t.type !== type) return false;
      if (status !== "all" && t.status !== status) return false;
      if (cutoff && new Date(t.created_at).getTime() < cutoff) return false;
      return true;
    });
  }, [txs, q, type, status, range]);

  const totalIn = filtered.filter((t: any) => Number(t.amount) > 0).reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalOut = filtered.filter((t: any) => Number(t.amount) < 0).reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
  const currency = txs[0]?.currency || "USD";

  const exportCsv = () => {
    const rows = [
      ["Reference", "Date", "Type", "Status", "Description", "Amount", "Currency"],
      ...filtered.map((t: any) => [
        t.reference,
        new Date(t.created_at).toISOString(),
        t.type,
        t.status,
        (t.description || t.recipient_name || "").replace(/,/g, ";"),
        t.amount,
        t.currency,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user?.email || "Account holder";
    const periodLabel = range === "0" ? "All time" : `Last ${range} days`;
    const generated = new Date().toLocaleString();

    // Header band
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("FLEXIQ VERVE", 14, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Account Statement", pageW - 14, 18, { align: "right" });

    // Account block
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(fullName, 14, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Email: ${user?.email ?? "-"}`, 14, 46);
    doc.text(`Account: ${account?.account_number ?? "-"}`, 14, 51);
    doc.text(`Currency: ${account?.currency ?? currency}`, 14, 56);
    doc.text(`Statement period: ${periodLabel}`, pageW - 14, 46, { align: "right" });
    doc.text(`Generated: ${generated}`, pageW - 14, 51, { align: "right" });
    doc.text(`Current balance: ${account ? formatMoney(Number(account.balance), account.currency) : "-"}`, pageW - 14, 56, { align: "right" });

    // Summary
    doc.setDrawColor(220);
    doc.line(14, 62, pageW - 14, 62);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Money in: +${formatMoney(totalIn, currency)}`, 14, 70);
    doc.text(`Money out: -${formatMoney(totalOut, currency)}`, 75, 70);
    const net = totalIn - totalOut;
    doc.text(`Net: ${net >= 0 ? "+" : "-"}${formatMoney(Math.abs(net), currency)}`, 140, 70);

    autoTable(doc, {
      startY: 76,
      head: [["Date", "Reference", "Type", "Description", "Status", "Amount"]],
      body: filtered.map((t: any) => [
        new Date(t.created_at).toLocaleDateString(),
        t.reference,
        (t.type || "").replace(/_/g, " "),
        (t.description || t.recipient_name || "").substring(0, 40),
        t.status,
        `${Number(t.amount) >= 0 ? "+" : "-"}${formatMoney(Math.abs(Number(t.amount)), t.currency || currency)}`,
      ]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 5: { halign: "right" } },
      margin: { left: 14, right: 14 },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Flexiq Verve Bank • This statement is generated electronically and is valid without signature. Page ${i} of ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    }

    doc.save(`flexiq-statement-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your money movements in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button className="gap-2 bg-gradient-primary" onClick={exportPdf}>
            <FileText className="h-4 w-4" /> PDF Statement
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-border/60 p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Money in</p>
          <p className="mt-2 font-display text-2xl font-bold text-success">+{formatMoney(totalIn, currency)}</p>
        </Card>
        <Card className="rounded-2xl border-border/60 p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Money out</p>
          <p className="mt-2 font-display text-2xl font-bold">−{formatMoney(totalOut, currency)}</p>
        </Card>
        <Card className="rounded-2xl border-border/60 p-5 shadow-card">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Net</p>
          <p className={`mt-2 font-display text-2xl font-bold ${totalIn - totalOut >= 0 ? "text-success" : "text-destructive"}`}>
            {totalIn - totalOut >= 0 ? "+" : "−"}{formatMoney(Math.abs(totalIn - totalOut), currency)}
          </p>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or reference…" className="pl-9" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="transfer_out">Transfer out</SelectItem>
              <SelectItem value="transfer_in">Transfer in</SelectItem>
              <SelectItem value="fx">FX</SelectItem>
              <SelectItem value="loan_disbursement">Loan</SelectItem>
              <SelectItem value="bill_payment">Bill</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="awaiting_code">Awaiting code</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="0">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
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
              {filtered.map((t: any) => {
                const positive = Number(t.amount) > 0;
                return (
                  <tr key={t.id}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${positive ? "bg-success/15 text-success" : "bg-muted text-foreground/70"}`}>
                          {positive ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{t.description || t.recipient_name || t.type.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">{t.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 capitalize text-muted-foreground">{t.type.replace(/_/g, " ")}</td>
                    <td className="py-4 text-muted-foreground">{new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="py-4">
                      <Badge variant="outline" className={
                        t.status === "completed" ? "border-success/30 bg-success/10 text-success capitalize" :
                        t.status === "pending" || t.status === "awaiting_code" ? "border-warning/30 bg-warning/10 text-warning capitalize" :
                        "border-destructive/30 bg-destructive/10 text-destructive capitalize"
                      }>
                        {t.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className={`py-4 text-right font-display font-bold ${positive ? "text-success" : ""}`}>
                      {positive ? "+" : "−"}{formatMoney(Math.abs(Number(t.amount)), t.currency)}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No transactions match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Transactions;
