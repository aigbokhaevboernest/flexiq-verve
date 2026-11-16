import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  { value: "others", label: "Others" },
];

const HOW_IT_WORKS = [
  {
    title: "Send money",
    body: "Open Send Money and choose Digital Payments, Wire Transfer or FX Transfer. Enter the recipient and amount, review the details, then confirm with your PIN.",
  },
  {
    title: "Add funds",
    body: "Go to Add money to see your account details and deposit options. Funds appear in your balance once the deposit is confirmed.",
  },
  {
    title: "Currency wallets",
    body: "Wallets lets you hold and manage balances in different currencies. Open a wallet to view its activity or make a deposit into it.",
  },
  {
    title: "Lock funds",
    body: "Lock funds sets money aside for a period you choose. Locked money can't be spent until the lock period ends.",
  },
  {
    title: "Cards",
    body: "Open Cards to view your cards, check their status and manage them.",
  },
  {
    title: "Quick loans",
    body: "Open Quick Loans, choose an amount and follow the steps to apply. You'll be notified once your request is reviewed.",
  },
];

const HELP_ARTICLES = [
  {
    title: "How do I verify my identity?",
    body: "Open Verify from your dashboard and follow the steps. Verification helps keep your account secure and unlocks all features.",
  },
  {
    title: "How long do transfers take?",
    body: "Local and digital transfers are usually quick. Wire and FX transfers can take longer depending on the destination and the receiving bank.",
  },
  {
    title: "I forgot my password",
    body: "On the login page choose Forgot password and enter your email. We'll send you a link to set a new one.",
  },
  {
    title: "My account is frozen. What now?",
    body: "A frozen account limits most transactions and features. Create a ticket below or use live chat and our team will help you.",
  },
  {
    title: "How do I update my profile or photo?",
    body: "Open your profile from the avatar at the top right of the dashboard. You can update your details and photo there.",
  },
  {
    title: "How do I contact support?",
    body: `Use live chat on this page, create a ticket below, or email ${SUPPORT_EMAIL}. We reply to tickets by email.`,
  },
];

const Support = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hash } = useLocation();

  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [profile, setProfile] = useState<{ first_name?: string; last_name?: string; email?: string } | null>(null);

  const isOthers = category === "others";
  const accountEmail = profile?.email || user?.email || "your account email";

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("profiles")
      .select("first_name,last_name,email")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setProfile(data || null));
  }, [user]);

  // Deep links such as /dashboard/support#how-it-works
  useEffect(() => {
    if (!hash) return;
    const id = hash.replace("#", "");
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 350); // wait for the page slide-in
    return () => clearTimeout(t);
  }, [hash]);

  const openLiveChat = () => {
    const api = (window as any).tidioChatApi;
    if (api) {
      api.show();
      api.open();
    } else {
      toast({
        title: "Live chat is loading",
        description: "Please try again in a moment, or create a ticket below.",
      });
    }
  };

  const resetForm = () => {
    setSubject("");
    setMessage("");
    setCategory("general");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || sending) return;

    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Flexiq Verve user";
    const userEmail = profile?.email || user.email || "";
    const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category;
    const finalSubject = subject.trim() || (isOthers ? "Other enquiry" : "Support request");

    setSending(true);
    let delivered = true;
    try {
      const result: any = await sendEmail({
        email: SUPPORT_EMAIL,
        first_name: "Support",
        subject: `[${categoryLabel}] ${finalSubject}`,
        message:
`New support ticket

Name: ${name}
Email: ${userEmail}
Category: ${categoryLabel}

Subject: ${finalSubject}

${message}`,
      });
      // Only a thrown error counts as a failure. A non-success flag is logged but
      // never shown to the user as an error, because the email can still be delivered.
      if (result && result.success === false) {
        console.warn("Support email returned a non-success flag:", result.error);
      }
    } catch (err) {
      console.error("Support email failed:", err);
      delivered = false;
    }
    setSending(false);

    if (!delivered) {
      toast({
        title: "Couldn't create your ticket",
        description: `Please try again, or email ${SUPPORT_EMAIL} directly.`,
        variant: "destructive",
      });
      return;
    }

    resetForm();
    setSuccessOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">We're here to help, 24/7.</p>
      </div>

      {/* Contact options */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">Email</p>
          <p className="mt-1 break-all font-display font-bold">{SUPPORT_EMAIL}</p>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          onClick={openLiveChat}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openLiveChat();
            }
          }}
          className="cursor-pointer rounded-3xl border-border/60 p-6 shadow-card transition-smooth hover:border-primary/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageCircle className="h-5 w-5" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">Live chat</p>
          <p className="mt-1 font-display font-bold">Available 24/7</p>
        </Card>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <h2 className="font-display text-lg font-bold">How it works</h2>
          <p className="mt-1 text-sm text-muted-foreground">A quick guide to the main features.</p>
          <ol className="mt-5 space-y-4">
            {HOW_IT_WORKS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      {/* Help articles */}
      <section id="help-articles" className="scroll-mt-24">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <h2 className="font-display text-lg font-bold">Help articles</h2>
          <Accordion type="single" collapsible className="mt-2">
            {HELP_ARTICLES.map((a, i) => (
              <AccordionItem key={a.title} value={`article-${i}`}>
                <AccordionTrigger className="text-left">{a.title}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{a.body}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>

      {/* Ticket form */}
      <section id="create-ticket" className="scroll-mt-24">
        <Card className="rounded-3xl border-border/60 p-6 shadow-card sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            <h2 className="font-display text-lg font-bold">Create a ticket</h2>

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
              <Label>
                Subject
                {isOthers && <span className="text-muted-foreground"> (optional)</span>}
              </Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required={!isOthers}
                maxLength={200}
                placeholder={isOthers ? "Anything else" : undefined}
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              {/* 16px on mobile stops the browser zooming in when the field is focused */}
              <Textarea
                className="text-base md:text-sm"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder={isOthers ? "Tell us anything you need help with" : undefined}
              />
            </div>

            <Button type="submit" disabled={sending} className="w-full gap-2 bg-gradient-primary">
              <Send className="h-4 w-4" /> {sending ? "Creating ticket…" : "Create ticket"}
            </Button>
          </form>
        </Card>
      </section>

      {/* Success modal */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader className="items-center text-center sm:text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <DialogTitle className="mt-2">Ticket created</DialogTitle>
            <DialogDescription className="text-center">
              Thanks for reaching out. Our support team will reply by email to{" "}
              <span className="break-all font-medium text-foreground">{accountEmail}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="h-11 w-full rounded-2xl bg-gradient-primary" onClick={() => setSuccessOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
