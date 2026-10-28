import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Mail, MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendEmail } from "@/lib/sendEmail";

const SUPPORT_EMAIL = "support@flexiqverve.com";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "account", label: "Account" },
  { value: "transfer", label: "Transfers" },
  { value: "card", label: "Cards" },
  { value: "loan", label: "Loans" },
  { value: "security", label: "Security" },
];

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [profile, setProfile] = useState<{ first_name?: string; last_name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("profiles")
      .select("first_name,last_name,email")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setProfile(data || null));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || sending) return;

    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Flexiq Verve user";
    const userEmail = profile?.email || user.email || "";
    const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category;

    setSending(true);
    // Email only — nothing is stored as a ticket.
    const result = await sendEmail({
      email: SUPPORT_EMAIL,
      first_name: "Support",
      subject: `[${categoryLabel}] ${subject}`,
      message:
`New support request

Name: ${name}
Email: ${userEmail}
User ID: ${user.id}
Category: ${categoryLabel}

Subject: ${subject}

${message}`,
    });
    setSending(false);

    if (!result.success) {
      toast({
        title: "Couldn't send your message",
        description: result.error || "Please try again, or email support@flexiqverve.com directly.",
        variant: "destructive",
      });
      return;
    }

    setSent(true);
    setSubject("");
    setMessage("");
    setCategory("general");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">We're here to help, 24/7.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: Mail, label: "Email", value: SUPPORT_EMAIL },
          { icon: MessageCircle, label: "Live chat", value: "Available 24/7" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="rounded-3xl border-border/60 p-6 shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <p className="mt-4 text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-1 break-all font-display font-bold">{c.value}</p>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
        {sent ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold">Message sent</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Our team will reply to {profile?.email || user?.email || "your email"}.
            </p>
            <Button variant="outline" className="mt-5" onClick={() => setSent(false)}>
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="font-display text-lg font-bold">Contact support</h2>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              {/* 16px on mobile stops the browser zooming in when the field is focused */}
              <Textarea className="text-base md:text-sm" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required />
            </div>
            <Button type="submit" disabled={sending} className="w-full gap-2 bg-gradient-primary">
              <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Support;
