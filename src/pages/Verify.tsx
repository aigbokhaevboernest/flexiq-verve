import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ShieldCheck, ExternalLink, CheckCircle2, Lock, Clock, ArrowLeft } from "lucide-react";

const IDME_URL = "https://www.id.me/";

// Brand green sampled from the logo
const GREEN = "#4FA85E";
const GREEN_DEEP = "#3E9A52";
const GREEN_SOFT = "#5DB56B";

const steps = [
  {
    icon: ShieldCheck,
    title: "Click \"Verify with ID.me\"",
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
    desc: "Once verified by ID.me, come back here — your verified status will be reflected on your account.",
  },
];

const Verify = () => {
  const goToIdMe = () => {
    window.open(IDME_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard/profile">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to profile
        </Link>
      </Button>

      <div className="text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
          style={{ color: GREEN, borderColor: `${GREEN}55`, backgroundColor: `${GREEN}10` }}
        >
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
        <div
          className="p-8 text-white sm:p-10"
          style={{ backgroundImage: `linear-gradient(135deg, ${GREEN_DEEP}, ${GREEN_SOFT})` }}
        >
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
              className="bg-white hover:bg-white/90"
              style={{ color: GREEN_DEEP }}
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
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ color: GREEN, backgroundColor: `${GREEN}1A` }}
                    >
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
              <span className="font-semibold">What you'll need:</span> a government-issued photo
              ID (passport, driver's license, or national ID), a smartphone or webcam for a
              selfie, and a few minutes of your time.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              onClick={goToIdMe}
              className="text-white hover:opacity-95"
              style={{ backgroundColor: GREEN_DEEP }}
            >
              Continue to ID.me
              <ExternalLink className="ml-1 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              You'll leave Flexiq Verve and continue on id.me
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Verify;
