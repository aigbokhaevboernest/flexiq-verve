import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Send, Eye, MessageSquare } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  open: "border-primary/30 bg-primary/10 text-primary",
  pending: "border-warning/30 bg-warning/10 text-warning",
  resolved: "border-success/30 bg-success/10 text-success",
  closed: "border-border bg-muted text-muted-foreground",
};

const PRIORITY_STYLE: Record<string, string> = {
  low: "border-border text-muted-foreground",
  normal: "border-border",
  high: "border-warning/40 text-warning",
  urgent: "border-destructive/40 text-destructive",
};

const AdminTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [active, setActive] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: tickets = [] } = useQuery({
    queryKey: ["admin-tickets", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("support_tickets")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data: t, error } = await q;
      if (error) throw error;
      const userIds = [...new Set((t || []).map((x: any) => x.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id,first_name,last_name,email").in("id", userIds)
        : { data: [] as any[] };
      return (t || []).map((row: any) => ({
        ...row,
        profile: (profiles || []).find((p: any) => p.id === row.user_id),
      }));
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["admin-ticket-messages", active?.id],
    enabled: !!active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", active.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const sendReply = async () => {
    if (!user || !active || !reply.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("support_ticket_messages")
      .insert({ ticket_id: active.id, author_id: user.id, body: reply.trim(), internal });
    setSending(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setReply(""); setInternal(false);
    qc.invalidateQueries({ queryKey: ["admin-ticket-messages", active.id] });
    qc.invalidateQueries({ queryKey: ["admin-tickets", statusFilter] });
  };

  const setStatus = async (status: string) => {
    if (!active) return;
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", active.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setActive({ ...active, status });
    qc.invalidateQueries({ queryKey: ["admin-tickets", statusFilter] });
    toast({ title: `Ticket marked ${status}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Support tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Customer messages and conversation history.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <div className="divide-y divide-border/60">
          {tickets.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No tickets in this view.</p>
          )}
          {tickets.map((t: any) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 py-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-[200px]">
                <p className="font-medium">{t.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {t.profile?.first_name} {t.profile?.last_name} · {t.profile?.email} · {t.category}
                </p>
              </div>
              <Badge variant="outline" className={PRIORITY_STYLE[t.priority]}>{t.priority}</Badge>
              <Badge variant="outline" className={STATUS_STYLE[t.status]}>{t.status}</Badge>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(t.last_message_at).toLocaleString()}
              </p>
              <Button size="sm" variant="outline" onClick={() => { setActive(t); setReply(""); setInternal(false); }}>
                <Eye className="mr-1 h-3.5 w-3.5" /> Open
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {active?.subject}
              {active && <Badge variant="outline" className={STATUS_STYLE[active.status]}>{active.status}</Badge>}
              {active && <Badge variant="outline" className={PRIORITY_STYLE[active.priority]}>{active.priority}</Badge>}
            </DialogTitle>
            {active && (
              <p className="text-xs text-muted-foreground">
                {active.profile?.first_name} {active.profile?.last_name} · {active.profile?.email}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-3">
            {messages.map((m: any) => {
              const isAdmin = m.author_id !== active?.user_id;
              return (
                <div key={m.id} className={`rounded-xl p-3 text-sm ${
                  m.internal ? "bg-warning/10 border border-warning/30" :
                  isAdmin ? "bg-primary/10 ml-8" : "bg-muted mr-8"
                }`}>
                  <p className="text-xs text-muted-foreground mb-1">
                    {m.internal ? "🔒 Internal note" : isAdmin ? "Admin reply" : "Customer"} · {new Date(m.created_at).toLocaleString()}
                  </p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              );
            })}

            <div className="space-y-2 pt-2 border-t border-border/60">
              <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder={internal ? "Internal note (customer cannot see this)…" : "Reply to customer…"} />
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={internal} onCheckedChange={(v) => setInternal(!!v)} />
                Internal note (admin-only)
              </label>
              <div className="flex flex-wrap gap-2">
                <Button onClick={sendReply} disabled={sending || !reply.trim()} className="gap-2 bg-gradient-primary">
                  <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send"}
                </Button>
                <div className="flex-1" />
                {active?.status !== "resolved" && (
                  <Button variant="outline" onClick={() => setStatus("resolved")}>Mark resolved</Button>
                )}
                {active?.status !== "closed" && (
                  <Button variant="outline" onClick={() => setStatus("closed")}>Close</Button>
                )}
                {(active?.status === "resolved" || active?.status === "closed") && (
                  <Button variant="outline" onClick={() => setStatus("open")}>Reopen</Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTickets;
