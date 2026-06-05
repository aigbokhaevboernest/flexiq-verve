import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import adminLogo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If a previous session was force-signed-out due to a block, just clear the flag.
  if (typeof window !== "undefined" && sessionStorage.getItem("flexiq_blocked") === "1") {
    sessionStorage.removeItem("flexiq_blocked");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setBlockedMsg(null);

    let email = identifier.trim();
    if (!email.includes("@")) {
      // Treat as username — resolve to email via RPC
      const { data, error } = await supabase.rpc("get_email_by_username", { _username: email });
      if (error || !data) {
        setSubmitting(false);
        toast({ title: "Sign in failed", description: "No account found for that username.", variant: "destructive" });
        return;
      }
      email = data as string;
    }

    const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSubmitting(false);
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }

    // Hard block check before letting the user past the login screen
    const userId = signIn.user?.id;
    if (userId) {
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("status")
        .eq("id", userId)
        .maybeSingle();
      if (prof?.status === "blocked") {
        await supabase.auth.signOut();
        sessionStorage.removeItem("flexiq_pin_ok");
        setSubmitting(false);
        setBlockedMsg("Your account has been blocked. Please contact support.");
        return;
      }
    }

    setSubmitting(false);
    sessionStorage.removeItem("flexiq_pin_ok");
    toast({ title: "Welcome back" });
    navigate("/pin");
  };

  return (
    <div className="page-enter relative flex min-h-screen items-center justify-center bg-navy-blue-mesh px-4 py-10">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[hsl(var(--mediumblue))]/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[hsl(var(--mediumblue))]/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white shadow-elev animate-fade-in">
        <div className="bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] px-8 pb-8 pt-10 text-center sm:px-10">
          <Link to="/" className="flex flex-col items-center">
            <img src={adminLogo} alt="Flexiq Verve" style={{ width: 72, height: "auto", display: "block" }} className="drop-shadow-lg" />
            <span className="mt-3 font-display text-xl font-bold text-white">Flexiq Verve</span>
          </Link>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-white/80">Sign in to take control of your finances.</p>
        </div>
        <div className="p-8 sm:p-10">

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {blockedMsg && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
              <p className="text-sm font-semibold text-destructive">{blockedMsg}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="id">Email or username</Label>
            <Input
              id="id"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@flexiqverve.com or username"
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pwd">Password</Label>
            <div className="relative">
              <Input
                id="pwd"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Toggle password"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox id="remember" />
            Remember me on this device
          </label>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95"
          >
            {submitting ? "Signing in…" : "Continue"}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Secured with 256-bit encryption
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Flexiq Verve?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">Open an account</Link>
        </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
