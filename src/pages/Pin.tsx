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

const Pin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"loading" | "create" | "enter">("loading");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [busy, setBusy] = useState(false);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin))
      return toast({ title: "PIN must be 4 digits", variant: "destructive" });
    if (pin !== confirmPin)
      return toast({ title: "PINs don't match", variant: "destructive" });

    setBusy(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ pin })
      .eq("id", user!.id);
    setBusy(false);

    if (error)
      return toast({ title: "Could not save PIN", description: error.message, variant: "destructive" });

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

    navigate("/dashboard", { replace: true });
  };

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin))
      return toast({ title: "Enter your 4-digit PIN", variant: "destructive" });

    setBusy(true);
    const { data } = await (supabase as any)
      .from("profiles")
      .select("pin")
      .eq("id", user!.id)
      .single();
    setBusy(false);

    if (!data || data.pin !== pin)
      return toast({ title: "Incorrect PIN", variant: "destructive" });

    sessionStorage.setItem("flexiq_pin_ok", "1");
    navigate("/dashboard", { replace: true });
  };

  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="page-enter flex min-h-screen items-center justify-center bg-navy-blue-mesh px-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-elev animate-fade-in">
        <button
          type="button"
          aria-label="Close"
          onClick={() => navigate("/login", { replace: true })}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          ✕
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo className="h-10 w-auto object-contain sm:h-12" />
          <p className="mt-4 text-sm text-muted-foreground">
            {mode === "create"
              ? "Create a 4-digit PIN to secure your account"
              : "Enter your 4-digit PIN to continue"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={mode === "create" ? handleCreate : handleEnter}>
          <div className="space-y-2">
            <Label>{mode === "create" ? "New PIN" : "PIN"}</Label>
            <Input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              className="text-center text-2xl tracking-[0.6em]"
              autoFocus
            />
          </div>

          {mode === "create" && (
            <div className="space-y-2">
              <Label>Confirm PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-2xl tracking-[0.6em]"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={busy}
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
