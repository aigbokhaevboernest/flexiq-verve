import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { ShieldCheck, ExternalLink, CheckCircle2, Lock, Clock, ArrowLeft, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sendEmail } from "@/lib/sendEmail";

const IDME_URL = "https://www.id.me/";
const SUPPORT_EMAIL = "support@flexiqverve.com";

const steps = [
  {
    icon: ShieldCheck,
    title: 'Click "Verify with ID.me"',
    desc: "You'll be redirected to the official ID.me website in a new tab.",
  },
  {
    icon: Lock,
    title: "Sign in or create an ID.me account",
    desc: "Use your existing ID.me account, or sign up with your email and a secure password.",
  },
  {
    icon: CheckCircle2,
    title: "Verify your identity",
    desc: "Upload a government-issued ID and take a selfie. ID.me uses bank-grade security to confirm your identity.",
  },
  {
    icon: Clock,
    title: "Return to Flexiq Verve",
    desc: 'Once verified by ID.me, come back here and tap "I\'ve verified my identity" so our team can review it.',
  },
];

const Verify = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const goToIdMe = () => {
    window.open(IDME_URL, "_blank", "noopener,noreferrer");
  };

  const queryKey = ["idme-verification", user?.id];
  const { data: status, isLoading } = useQuery<string | null>({
    queryKey,
    enabled: !!user,
    staleTime: 0,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("id_verifications")
        .select("status")
        .eq("user_id", user!.id)
        .eq("provider", "idme")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.status ?? null;
    },
  });

  const inReview = status === "pending" || status === "submitted";
  const verified = status === "approved" || status === "verified";

  const confirmVerified = async () => {
    if (!user || submitting || inReview || verified) return;
    setSubmitting(true);
    const { error } = await (supabase as any)
      .from("id_verifications")
      .insert({ user_id: user.id, provider: "idme", status: "pending" });
    setSubmitting(false);

    if (error && error.code !== "23505") {
      return toast.error("Couldn't submit your request", { description: error.message });
    }

    toast.success("Request submitted for review", {
      description: "Our team will review your ID.me verification shortly.",
    });
    qc.invalidateQueries({ queryKey });

    try {
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("first_name,last_name,email")
        .eq("id", user.id)
        .maybeSingle();
      const name = [prof?.first_name, prof?.last_name].filter(Boolean).join(" ") || "A user";
      await sendEmail({
        email: SUPPORT_EMAIL,
        first_name: "Support",
        subject: "ID.me verification submitted — Flexiq Verve",
        message: `${name} (${prof?.email || user.email || ""}) says they completed ID.me verification.\n\nPlease review it in the KYC queue and approve or reject.`,
      });
    } catch {}
  };

  // Under review or verified: hide the how-it-works instructions
  if (inReview || verified) {
    return (
      <div className="relative mx-auto max-w-4xl space-y-6 pb-28">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/profile">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to profile
          </Link>
        </Button>

        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Identity Verification
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            {verified ? "Identity verified" : "Under review"}
          </h1>
        </div>

        <Card className="rounded-3xl border-border/60 p-8 text-center shadow-card sm:p-12">
          {verified ? (
            <p className="inline-flex items-center gap-2 text-base font-semibold text-success">
              <BadgeCheck className="h-6 w-6" /> Your identity has been verified
            </p>
          ) : (
            <>
              <Clock className="mx-auto h-12 w-12 text-amber-500" />
              <p className="mt-4 text-lg font-semibold text-amber-600">
                Submitted — under review by our team
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                We received your ID.me verification. Our team will review it shortly.
                You\'ll be notified once it\'s complete.
              </p>
            </>
          )}
        </Card>

        {/* Floating action stays available only when not yet submitted */}
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-4xl space-y-6 pb-28">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard/profile">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to profile
        </Link>
      </Button>

      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Identity Verification
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
          Verify your identity with ID.me
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
          Flexiq Verve partners with ID.me — the trusted identity network used by the U.S. government,
          healthcare, and leading financial institutions — to securely verify your identity.
        </p>
      </div>

      <Card className="overflow-hidden rounded-3xl border-border/60 p-0 shadow-card">
        <div className="bg-gradient-primary p-8 text-primary-foreground sm:p-10">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest opacity-80">Powered by</p>
              <p className="mt-1 font-display text-3xl font-bold">ID.me</p>
              <p className="mt-2 max-w-md text-sm opacity-90">
                Verification takes about 5 minutes. Your information is encrypted and never shared
                without your consent.
              </p>
            </div>
            <Button
              size="lg"
              onClick={goToIdMe}
              className="bg-white text-primary hover:bg-white/90"
            >
              Verify with ID.me
              <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="font-display text-xl font-bold">How it works</h2>
          <ol className="mt-6 space-y-5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    {i < steps.length - 1 && (
                      <span className="mt-1 h-full w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-display text-sm font-bold">
                      Step {i + 1} — {s.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 rounded-2xl border border-border/60 bg-muted/40 p-5">
            <p className="text-sm">
              <span className="font-semibold">What you\'ll need:</span> a government-issued photo
              ID (passport, driver\'s license, or national ID), a smartphone or webcam for a
              selfie, and a few minutes of your time.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={goToIdMe} className="bg-gradient-primary text-primary-foreground">
              Continue to ID.me
              <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              You\'ll leave Flexiq Verve and continue on id.me
            </p>
          </div>

          {status === "rejected" && (
            <p className="mt-6 text-center text-xs text-destructive">
              Your previous request was rejected. Complete ID.me again and resubmit.
            </p>
          )}
        </div>
      </Card>

      {/* Floating "I\'ve verified" button at the bottom of the page */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Finished verifying on ID.me? Let us know so we can review it.
          </p>
          <Button
            size="lg"
            onClick={confirmVerified}
            disabled={submitting || isLoading}
            className="w-full rounded-2xl bg-gradient-primary sm:w-auto"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {submitting ? "Submitting…" : "I\'ve verified my identity"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Verify;
