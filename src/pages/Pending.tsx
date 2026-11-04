import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { Clock, AlertCircle, RefreshCw, LogOut } from "lucide-react";
import { toast } from "sonner";

// Photo lives in public/login-bg.JPG (name is case-sensitive)
const BG_IMAGE = "/login-bg.JPG";

const Pending = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string>("pending");

  const checkStatus = async (showToast = false) => {
    setChecking(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setChecking(false);
      navigate("/login");
      return;
    }

    const { data } = await (supabase as any)
      .from("profiles")
      .select("status,application_status")
      .eq("id", userData.user.id)
      .maybeSingle();

    setChecking(false);

    if (data?.status === "blocked") {
      await supabase.auth.signOut();
      navigate("/login");
      return;
    }

    if (data?.application_status === "approved") {
      navigate("/dashboard");
    } else if (data?.application_status === "rejected") {
      setStatus("rejected");
    } else {
      setStatus("pending");
      if (showToast) {
        toast.info(
          "Your account is still under review. You will receive an email when the review is completed."
        );
      }
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const rejected = status === "rejected";

  return (
    <div className="page-enter relative flex min-h-screen items-center justify-center bg-navy px-4 py-8">
      {/* Photo + dark overlay, same as the login and PIN pages */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      <div
        className="fixed inset-0"
        style={{ background: "linear-gradient(180deg, rgba(8,14,32,0.72) 0%, rgba(8,14,32,0.62) 50%, rgba(8,14,32,0.82) 100%)" }}
      />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Link to="/" className="mb-6 flex items-center justify-center">
          <BrandLogo
            className="h-16 w-auto object-contain sm:h-20"
            style={{
              filter:
                "drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff)",
            }}
          />
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white p-8 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] sm:p-10">
          <div
            className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
              rejected ? "bg-red-100" : "bg-amber-100"
            }`}
          >
            {rejected ? (
              <AlertCircle className="h-7 w-7 text-red-600" />
            ) : (
              <Clock className="h-7 w-7 text-amber-600" />
            )}
          </div>

          {rejected ? (
            <>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Application needs attention
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
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
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Thanks for signing up with Flexiq Verve. Your account is under
                review. This usually takes less than 24 hours. You'll be able
                to sign in as soon as it's approved.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                An email confirmation will be sent to you once approved.
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
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Checking…" : "Check status"}
            </Button>

            <Button
              onClick={handleSignOut}
              variant="outline"
              size="lg"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl"
            >
              <LogOut className="h-4 w-4" />
              Go back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pending;
