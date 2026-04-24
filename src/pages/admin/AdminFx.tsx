import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Save } from "lucide-react";

const AdminFx = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState("");
  const [rate, setRate] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  const { data: rates = [] } = useQuery({
    queryKey: ["admin-fx"],
    queryFn: async () => {
      const { data } = await supabase.from("fx_rates").select("*").order("quote_currency");
      return data || [];
    },
  });

  const save = async (id: string) => {
    if (!edits[id]) return;
    await supabase.from("fx_rates").update({ rate: Number(edits[id]) }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-fx"] });
    qc.invalidateQueries({ queryKey: ["fx_rates"] });
    toast({ title: "Rate updated" });
    setEdits((e) => { const n = { ...e }; delete n[id]; return n; });
  };

  const add = async () => {
    if (!quote || !rate) return;
    await supabase.from("fx_rates").insert({ base_currency: "USD", quote_currency: quote.toUpperCase(), rate: Number(rate) });
    qc.invalidateQueries({ queryKey: ["admin-fx"] });
    qc.invalidateQueries({ queryKey: ["fx_rates"] });
    toast({ title: "Rate added" });
    setOpen(false); setQuote(""); setRate("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">FX Rates</h1>
          <p className="mt-1 text-sm text-muted-foreground">All rates are USD → quote currency.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 bg-gradient-primary"><Plus className="h-4 w-4" /> Add rate</Button>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="pb-3">Pair</th><th className="pb-3">Rate (1 USD =)</th><th className="pb-3">Updated</th><th className="pb-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rates.map((r: any) => (
              <tr key={r.id}>
                <td className="py-3 font-display font-bold">USD / {r.quote_currency}</td>
                <td className="py-3">
                  <Input className="max-w-[160px]" type="number" step="0.0001"
                    value={edits[r.id] ?? r.rate} onChange={(e) => setEdits({ ...edits, [r.id]: e.target.value })} />
                </td>
                <td className="py-3 text-muted-foreground">{new Date(r.updated_at).toLocaleString()}</td>
                <td className="py-3 text-right">
                  <Button size="sm" variant="outline" disabled={!edits[r.id] || Number(edits[r.id]) === Number(r.rate)} onClick={() => save(r.id)} className="gap-1">
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add FX rate</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Quote currency (3 letter)</Label><Input maxLength={3} value={quote} onChange={(e) => setQuote(e.target.value.toUpperCase())} placeholder="EUR" /></div>
            <div className="space-y-2"><Label>Rate (1 USD = ?)</Label><Input type="number" step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
            <Button onClick={add} className="w-full bg-gradient-primary">Add rate</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFx;
