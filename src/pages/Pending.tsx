import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { sendEmail } from "@/lib/sendEmail";
import { Clock, RefreshCw, ArrowLeft } from "lucide-react";

const Pending = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string>("pending");

  const checkStatus = async (notifyIfPending: boolean = false) => {
    setChecking(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setChecking(false);
      navigate("/login");
      return;
    }

    const { data } = await (supabase as any)
      .from("profiles")
      .select("status,application_status,first_name,email")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (data?.status === "blocked") {
      setChecking(false);
      await supabase.auth.signOut();
      navigate("/login");
      return;
    }

    if (data?.application_status === "approved") {
      setChecking(false);
      navigate("/dashboard");
      return;
    }

    if (data?.application_status === "rejected") {
      setStatus("rejected");
      setChecking(false);
      return;
    }

    // Still pending
    setStatus("pending");

    if (notifyIfPending) {
      const em = data?.email || userData.user.email || "";
      const fn = data?.first_name || "";
      if (em) {
        try {
          await sendEmail({
            email: em,
            first_name: fn,
            subject: "Your Flexiq Verve Application Is Still Pending",
            message:
`We're writing to let you know your Flexiq Verve account application is still under review. Our team is verifying your details — this usually takes less than 24 hours. You'll be able to sign in as soon as it's approved.

If you have any questions, feel free to reach out to us at support@flexiqverve.com.

Kind Regards,
Flexiq Verve Support Team`,
          });
        } catch {}
      }
    }

    setChecking(false);
  };

  useEffect(() => {
    checkStatus(false);
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="page-enter relative flex min-h-screen items-center justify-center bg-navy-blue-mesh px-4 py-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[hsl(var(--mediumblue))]/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[hsl(var(--mediumblue))]/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-elev animate-fade-in">
          <div className="bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] px-8 pb-8 pt-10 text-center sm:px-10">
            <Link to="/" className="flex flex-col items-center justify-center">
              <BrandLogo className="h-10 w-auto object-contain drop-shadow-lg sm:h-12" />
            </Link>
          </div>

          <div className="p-8 sm:p-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-7 w-7 text-amber-600" />
            </div>

            {status === "rejected" ? (
              <>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Application needs attention
                </h1>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  We reviewed your account application and need to clarify some
                  information you provided. Please contact our support team
                  referencing your account details so we can complete your review.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Your account is under review
                </h1>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Thanks for signing up with Flexiq Verve. Our team is verifying
                  your details — this usually takes less than 24 hours. You'll be
                  able to sign in as soon as it's approved.
                </p>
              </>
            )}

            <a
              href="mailto:support@flexiqverve.com"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              support@flexiqverve.com
            </a>

            <div className="mt-8 space-y-3">
              <Button
                onClick={() => checkStatus(true)}
                disabled={checking}
                size="lg"
                className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                {checking ? "Checking…" : "Check status"}
              </Button>

              <Button
                onClick={handleGoBack}
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pending;
