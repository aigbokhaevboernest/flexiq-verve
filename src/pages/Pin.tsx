import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import adminLogo from "@/assets/logo.png";

// Simple hash for PIN — non-cryptographic but obscures plain digits at rest.
const hashPin = async (pin: string) => {
  const data = new TextEncoder().encode(`flexiq:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

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
      const { data } = await (supabase as any).rpc("get_pin_hash", { _user_id: user.id });
      const hasPin = !!data;
      localStorage.setItem(`hasPinSetup:${user.id}`, hasPin ? "1" : "0");
      setMode(hasPin ? "enter" : "create");
    })();
  }, [user, loading, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return toast({ title: "PIN must be 4 digits", variant: "destructive" });
    if (pin !== confirmPin) return toast({ title: "PINs don't match", variant: "destructive" });
    setBusy(true);
    const hash = await hashPin(pin);
    const { error } = await (supabase as any).rpc("set_pin_hash", { user_id: user!.id, hash });
    setBusy(false);
    if (error) return toast({ title: "Could not save PIN", description: error.message, variant: "destructive" });
    localStorage.setItem(`hasPinSetup:${user!.id}`, "1");
    sessionStorage.setItem("flexiq_pin_ok", "1");
    toast({ title: "PIN set" });
    navigate("/dashboard", { replace: true });
  };

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return toast({ title: "Enter your 4-digit PIN", variant: "destructive" });
    setBusy(true);
    const hash = await hashPin(pin);
    const { data } = await (supabase as any).rpc("get_pin_hash", { _user_id: user!.id });
    setBusy(false);
    if (data !== hash) return toast({ title: "Incorrect PIN", variant: "destructive" });
    sessionStorage.setItem("flexiq_pin_ok", "1");
    navigate("/dashboard", { replace: true });
  };

  if (mode === "loading") {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="page-enter flex min-h-screen items-center justify-center bg-navy-blue-mesh px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-8 shadow-elev animate-fade-in">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={adminLogo} alt="Flexiq Verve" style={{ width: 64, height: "auto" }} />
          <h1 className="mt-4 font-display text-2xl font-bold">Flexiq Verve</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "create" ? "Create a 4-digit PIN to secure your account" : "Enter your 4-digit PIN to continue"}
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

          <Button type="submit" disabled={busy} className="w-full bg-gradient-primary text-primary-foreground">
            {busy ? "Please wait…" : mode === "create" ? "Set PIN" : "Unlock"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Pin;
