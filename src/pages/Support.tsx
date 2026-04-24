import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Support = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message sent", description: "Our team will get back to you within 24 hours." });
    setSubject(""); setMessage("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">We're here to help, 24/7.</p>
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
        <h2 className="font-display text-lg font-bold">Send us a message</h2>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2"><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Message</Label><Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} required /></div>
          <Button type="submit" className="gap-2 bg-gradient-primary"><Send className="h-4 w-4" /> Send message</Button>
        </form>
      </Card>
    </div>
  );
};

export default Support;
