import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/BrandLogo";
import { sendEmail } from "@/lib/sendEmail";

const ERROR_RING = "border-red-500 focus-visible:ring-red-500";

const InlineError = ({ msg }: { msg: string }) =>
  msg ? (
    <p role="alert" className="text-center text-xs text-red-500">
      {msg}
    </p>
  ) : null;

const Pin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  // Start from the cached answer when we already know the user, so the right form paints on the first frame
  const [mode, setMode] = useState<"loading" | "create" | "enter">(() => {
    try {
      const cached = user ? localStorage.getItem(`hasPinSetup:${user.id}`) : null;
      return cached === "1" ? "enter" : cached === "0" ? "create" : "loading";
    } catch {
      return "loading";
    }
  });
  const ready = mode !== "loading";
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);

  // Inline errors (shown under the field instead of a toast)
  const [pinError, setPinError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    const cached = localStorage.getItem(`hasPinSetup:${user.id}`);
    if (cached === "1") setMode("enter");
    else if (cached === "0") setMode("create");

    (async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("pin,status")
        .eq("id", user.id)
        .single();

      if (data?.status === "blocked") {
        sessionStorage.setItem("flexiq_blocked", "1");
        sessionStorage.removeItem("flexiq_pin_ok");
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
        return;
      }

      const hasPin = !!data?.pin;
      localStorage.setItem(`hasPinSetup:${user.id}`, hasPin ? "1" : "0");
      setMode(hasPin ? "enter" : "create");
    })();
  }, [user, loading, navigate]);

  // The ✕ must sign the user out. If it only navigated to /login, the guards would see a
  // logged-in user without the PIN flag and send them straight back here.
  const handleCancel = async () => {
    sessionStorage.removeItem("flexiq_pin_ok");
    sessionStorage.removeItem("flexiq_blocked");
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    navigate("/login", { replace: true });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setConfirmError("");

    if (!/^\d{4}$/.test(pin)) return setPinError("PIN must be 4 digits");
    if (pin !== confirmPin) return setConfirmError("PINs don't match");

    setBusy(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ pin })
      .eq("id", user!.id);

    if (error) {
      setBusy(false);
      return setPinError("Could not save PIN. Please try again.");
    }

    localStorage.setItem(`hasPinSetup:${user!.id}`, "1");
    sessionStorage.setItem("flexiq_pin_ok", "1");
    toast({ title: "PIN set" });

    // Best-effort PIN confirmation email
    try {
      const { data: prof } = await (supabase as any)
        .from("profiles").select("first_name,email").eq("id", user!.id).maybeSingle();
      const fn = prof?.first_name || "";
      const em = prof?.email || user!.email || "";
      if (em) {
        await sendEmail({
          email: em, first_name: fn,
          subject: "Your Account PIN Has Been Set — Flexiq Verve",
          message:
`Your Flexiq Verve account PIN has been successfully created. Your account is now secured with a PIN. Do not share your PIN or login credentials with anyone for your security.

If you did not set this PIN, please contact us immediately at support@flexiqverve.com.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}

    // Gate dashboard access on admin approval of the application
    const { data: appData } = await (supabase as any)
      .from("profiles")
      .select("application_status")
      .eq("id", user!.id)
      .maybeSingle();

    setBusy(false);
    navigate(appData?.application_status === "approved" ? "/dashboard" : "/pending", { replace: true });
  };

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    if (!/^\d{4}$/.test(pin)) return setPinError("Enter your 4-digit PIN");

    setBusy(true);
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("pin,application_status")
      .eq("id", user!.id)
      .single();

    if (error || !data) {
      setBusy(false);
      return setPinError("Could not check your PIN. Please try again.");
    }

    if (data.pin !== pin) {
      setBusy(false);
      return setPinError("Incorrect PIN");
    }

    sessionStorage.setItem("flexiq_pin_ok", "1");
    setBusy(false);
    navigate(data.application_status === "approved" ? "/dashboard" : "/pending", { replace: true });
  };

  return (
    <div className="page-enter flex min-h-screen items-center justify-center bg-navy-blue-mesh px-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-elev animate-fade-in">
        <button
          type="button"
          aria-label="Close"
          onClick={() => void handleCancel()}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          ✕
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo className="h-10 w-auto object-contain sm:h-12" />
          <p className="mt-4 text-sm text-muted-foreground">
            {!ready
              ? "\u00A0"
              : mode === "create"
              ? "Create a 4-digit PIN to secure your account"
              : "Enter your 4-digit PIN to continue"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={mode === "create" ? handleCreate : handleEnter} noValidate>
          <div className="space-y-2">
            <Label>{mode === "create" ? "New PIN" : "PIN"}</Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                if (pinError) setPinError("");
              }}
              placeholder="••••"
              className={`text-center text-2xl tracking-[0.6em] ${pinError ? ERROR_RING : ""}`}
              autoFocus
            />
            <InlineError msg={pinError} />
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, ""));
                  if (confirmError) setConfirmError("");
                }}
                placeholder="••••"
                className={`text-center text-2xl tracking-[0.6em] ${confirmError ? ERROR_RING : ""}`}
              />
              <InlineError msg={confirmError} />
            </div>
          )}

          <Button
            type="submit"
            disabled={busy || !ready}
            className="w-full bg-gradient-primary text-primary-foreground"
          >
            {busy ? "Please wait…" : mode === "create" ? "Set PIN" : "Unlock"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Pin;
