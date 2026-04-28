import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, MessageCircle, Phone, Send, Plus, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STATUS_STYLE: Record<string, string> = {
  open: "border-primary/30 bg-primary/10 text-primary",
  pending: "border-warning/30 bg-warning/10 text-warning",
  resolved: "border-success/30 bg-success/10 text-success",
  closed: "border-border bg-muted text-muted-foreground",
};

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [newOpen, setNewOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [active, setActive] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["ticket-messages", active?.id],
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

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject, category, priority })
      .select()
      .single();
    if (error || !ticket) {
      setSubmitting(false);
      toast({ title: "Failed", description: error?.message, variant: "destructive" });
      return;
    }
    const { error: msgErr } = await supabase
      .from("support_ticket_messages")
      .insert({ ticket_id: ticket.id, author_id: user.id, body: message });
    setSubmitting(false);
    if (msgErr) {
      toast({ title: "Failed", description: msgErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ticket opened", description: "Our team will respond shortly." });
    setSubject(""); setMessage(""); setCategory("general"); setPriority("normal");
    setNewOpen(false);
    qc.invalidateQueries({ queryKey: ["tickets", user.id] });
  };

  const sendReply = async () => {
    if (!user || !active || !reply.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("support_ticket_messages")
      .insert({ ticket_id: active.id, author_id: user.id, body: reply.trim() });
    setSending(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    setReply("");
    qc.invalidateQueries({ queryKey: ["ticket-messages", active.id] });
    qc.invalidateQueries({ queryKey: ["tickets", user.id] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">We're here to help, 24/7.</p>
        </div>
        <Button onClick={() => setNewOpen(true)} className="gap-2 bg-gradient-primary">
          <Plus className="h-4 w-4" /> New ticket
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, label: "Email", value: "support@norvexwealth.com" },
          { icon: Phone, label: "Phone", value: "+1 (800) 555-0199" },
          { icon: MessageCircle, label: "Live chat", value: "Available 24/7" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="rounded-3xl border-border/60 p-6 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <p className="mt-4 text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-1 font-display font-bold">{c.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
        <h2 className="font-display text-lg font-bold">Your tickets</h2>
        <div className="mt-4 divide-y divide-border/60">
          {tickets.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No tickets yet. Open one to get help from our team.
            </p>
          )}
          {tickets.map((t: any) => (
            <button
              key={t.id}
              onClick={() => { setActive(t); setReply(""); }}
              className="flex w-full flex-wrap items-center gap-3 py-3 text-left transition-smooth hover:bg-muted/40 rounded-lg px-2"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{t.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {t.category} · {new Date(t.last_message_at).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline" className={STATUS_STYLE[t.status]}>{t.status}</Badge>
            </button>
          ))}
        </div>
      </Card>

      {/* New ticket dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Open a new ticket</DialogTitle></DialogHeader>
          <form onSubmit={createTicket} className="space-y-4">
            <div className="space-y-2"><Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2"><Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="transfer">Transfers</SelectItem>
                    <SelectItem value="card">Cards</SelectItem>
                    <SelectItem value="loan">Loans</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Message</Label>
              <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
            <Button type="submit" disabled={submitting} className="gap-2 bg-gradient-primary w-full">
              <Send className="h-4 w-4" /> {submitting ? "Sending…" : "Open ticket"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket thread dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {active?.subject}
              {active && <Badge variant="outline" className={STATUS_STYLE[active.status]}>{active.status}</Badge>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {messages.map((m: any) => (
              <div key={m.id} className={`rounded-xl p-3 text-sm ${m.author_id === user?.id ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}>
                <p className="text-xs text-muted-foreground mb-1">
                  {m.author_id === user?.id ? "You" : "Support"} · {new Date(m.created_at).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
            {active?.status !== "closed" && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply…" />
                <Button onClick={sendReply} disabled={sending || !reply.trim()} className="gap-2 bg-gradient-primary w-full">
                  <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send reply"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
