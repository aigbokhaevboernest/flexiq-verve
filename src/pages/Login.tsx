import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { sendEmail } from "@/lib/sendEmail";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

type ForgotStep = "email" | "code" | "password";

const InlineNotice = ({ type = "error", children }: { type?: "error" | "success"; children: React.ReactNode }) => {
  const isError = type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
};

const ForgotPasswordModal = ({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) => {
  const [step, setStep] = useState<ForgotStep>("email");
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [foundUser, setFoundUser] = useState<{ email: string; first_name: string } | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  const resetModal = () => {
    setStep("email");
    setEmailInput("");
    setFoundUser(null);
    setCodeInput("");
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
    setError("");
  };

  const handleClose = () => { resetModal(); onClose(); };

  const handleEmailSubmit = async () => {
    if (!emailInput.trim()) return;
    setError("");
    setLoading(true);

    const { data: profileData, error } = await supabase
      .rpc("get_profile_by_email", { _email: emailInput.trim().toLowerCase() });

    const user = Array.isArray(profileData) ? profileData[0] : profileData;

    if (error || !user) {
      setLoading(false);
      setError("No account found with that email address.");
      return;
    }

    const firstName = (user as any).full_name?.split(" ")[0] ?? "there";
    const code = generateCode();

    await (supabase as any)
      .from("password_reset_codes")
      .delete()
      .eq("email", emailInput.trim().toLowerCase())
      .eq("used", false);

    const { error: insertError } = await (supabase as any)
      .from("password_reset_codes")
      .insert({ email: emailInput.trim().toLowerCase(), code });

    if (insertError) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    await sendEmail({
      email: emailInput.trim().toLowerCase(),
      first_name: firstName,
      subject: "Your Password Reset Code — Flexiq Verve",
      message: `<strong>Your Password Reset Code:</strong><br/><table cellpadding="0" cellspacing="0" border="0" style="margin:4px 0;"><tr><td style="background:#f8fafc; border:2px dashed #e2e8f0; border-radius:10px; padding:14px 24px;"><span style="font-size:26px; font-weight:700; letter-spacing:6px; font-family:'Courier New',monospace; color:#111827;">${code}</span></td></tr></table><br/>Enter this code on the Flexiq Verve password reset page. This code expires in <strong>15 minutes</strong>. Do not share this code with anyone for your security.<br/><br/>For more information or complaints, please contact <a href="mailto:support@flexiqverve.com" style="color:#2563eb;">support@flexiqverve.com</a> or make use of the Live Chat on your dashboard for assistance.`,
    });

    setFoundUser({ email: emailInput.trim().toLowerCase(), first_name: firstName });
    setLoading(false);
    setStep("code"); // always advance if code was saved
  };

  const handleCodeSubmit = async () => {
    if (!codeInput.trim() || !foundUser) return;
    setError("");
    setLoading(true);

    const { data, error } = await (supabase as any)
      .from("password_reset_codes")
      .select("id, expires_at, used")
      .eq("email", foundUser.email)
      .eq("code", codeInput.trim())
      .eq("used", false)
      .maybeSingle();

    if (error || !data) {
      setLoading(false);
      setError("Invalid or expired code. Please try again.");
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setLoading(false);
      setError("This code has expired. Please request a new one.");
      setStep("email");
      return;
    }

    setLoading(false);
    setStep("password");
  };

  const handlePasswordSubmit = async () => {
    if (!newPassword || !confirmPassword || !foundUser) return;

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    const { error: profileError } = await (supabase as any)
      .from("profiles")
      .update({ plain_password: newPassword })
      .eq("email", foundUser.email);

    if (profileError) {
      setLoading(false);
      setError("Failed to update password. Please try again.");
      return;
    }

    await (supabase as any)
      .from("password_reset_codes")
      .update({ used: true })
      .eq("email", foundUser.email)
      .eq("used", false);

    await sendEmail({
      email: foundUser.email,
      first_name: foundUser.first_name,
      subject: "Your Password Has Been Changed — Flexiq Verve",
      message: `Your Flexiq Verve password was <strong>successfully changed</strong>.<br/><br/>If you did not make this change, please contact our support team immediately at <a href="mailto:support@flexiqverve.com" style="color:#2563eb;">support@flexiqverve.com</a> or use the Live Chat on your dashboard.`,
    });

    setLoading(false);
    handleClose();
    onDone(); // login page shows the inline success notice
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "email" && (
              <button
                onClick={() => {
                  setError("");
                  setStep(step === "code" ? "email" : "code");
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <DialogTitle>
              {step === "email" && "Reset your password"}
              {step === "code" && "Enter your code"}
              {step === "password" && "Set new password"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {error && <InlineNotice>{error}</InlineNotice>}

          {step === "email" && (
            <>
              <p className="text-sm text-muted-foreground">
                Enter the email address on your account and we'll send you a reset code.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@example.com"
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                />
              </div>
              <Button
                onClick={handleEmailSubmit}
                disabled={loading || !emailInput.trim()}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset code"}
              </Button>
            </>
          )}

          {step === "code" && (
            <>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <strong>{foundUser?.email}</strong>. Enter it below.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset-code">6-digit code</Label>
                <Input
                  id="reset-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="text-center text-xl tracking-widest font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                />
              </div>
              <Button
                onClick={handleCodeSubmit}
                disabled={loading || codeInput.length !== 6}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify code"}
              </Button>
            </>
          )}

          {step === "password" && (
            <>
              <p className="text-sm text-muted-foreground">
                Choose a new password for your account. Must be at least 8 characters.
              </p>
              <div className="space-y-2">
                <Label htmlFor="new-pwd">New password</Label>
                <div className="relative">
                  <Input
                    id="new-pwd"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowNew((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pwd">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirm-pwd"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  />
                  <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={handlePasswordSubmit}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change password"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Login Page ──────────────────────────────────────────────────────────

const Login = () => {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (typeof window !== "undefined" && sessionStorage.getItem("flexiq_blocked") === "1") {
    sessionStorage.removeItem("flexiq_blocked");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    let email = identifier.trim().toLowerCase();
    if (!email.includes("@")) {
      const { data, error } = await supabase.rpc("get_email_by_username", { _username: email });
      if (error || !data) {
        setSubmitting(false);
        setError("No account found for that username.");
        return;
      }
      email = (data as string).toLowerCase();
    }

    let res: Response;
    try {
      res = await fetch(`${SUPABASE_URL}/functions/v1/admin-actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: "signin_with_plain_password",
        target_user_id: "",
        email,
        plain_password: password,
      }),
    });
    } catch {
      setSubmitting(false);
      setError("Network error. Check your connection and try again.");
      return;
    }

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitting(false);
      const msg = result?.error === "Incorrect password"
        ? "Incorrect password."
        : result?.error === "Account is blocked"
        ? "Your account has been blocked. Please contact support."
        : result?.error ?? "Sign in failed.";
      setError(msg);
      return;
    }

    const { error: sessionErr } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
    });

    if (sessionErr) {
      setSubmitting(false);
      setError("Could not establish session. Please try again.");
      return;
    }

    setSubmitting(false);
    sessionStorage.removeItem("flexiq_pin_ok");
    navigate("/pin");
  };

  return (
    <div className="page-enter relative flex min-h-screen items-center justify-center bg-navy-blue-mesh px-4 py-6">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[hsl(var(--mediumblue))]/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[hsl(var(--mediumblue))]/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-elev animate-fade-in">
          <div className="bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] px-8 pb-5 pt-6 text-center sm:px-10">
            <Link to="/" className="flex flex-col items-center justify-center">
              <BrandLogo className="h-14 w-auto object-contain drop-shadow-lg sm:h-16" />
            </Link>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-white/80">Sign in to take control of your finances.</p>
          </div>

          <div className="px-8 py-6 sm:px-10">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="id">Email or User ID</Label>
                <Input
                  id="id"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder=""
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pwd">Password</Label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
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

              {notice && <InlineNotice type="success">{notice}</InlineNotice>}
              {error && <InlineNotice>{error}</InlineNotice>}

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

            <p className="mt-4 text-center text-sm text-muted-foreground">
              New to Flexiq Verve?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Open an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        onDone={() => {
          setError("");
          setNotice("Password changed successfully. You can now sign in.");
        }}
      />
    </div>
  );
};

export default Login;
