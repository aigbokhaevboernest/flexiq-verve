import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2, AlertCircle, CheckCircle2, User, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { sendEmail } from "@/lib/sendEmail";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

type ForgotStep = "email" | "code" | "password";
type OtpStatus = "idle" | "error" | "success";

const InlineNotice = ({
  type = "error",
  dark = false,
  children,
}: {
  type?: "error" | "success";
  dark?: boolean;
  children: React.ReactNode;
}) => {
  const isError = type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  const tone = dark
    ? isError
      ? "border-red-400/30 bg-red-500/15 text-red-200"
      : "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
    : isError
    ? "border-red-200 bg-red-50 text-red-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${tone}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
};

// ─── Segmented code input ─────────────────────────────────────────────────────
// One hidden real <input> holds the value (so paste, backspace and SMS
// autofill all work natively). The six boxes are just a visual layer.

const OtpInput = ({
  value,
  onChange,
  length = 6,
  status = "idle",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  status?: OtpStatus;
  disabled?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // Re-focus after an error clears the code
  useEffect(() => {
    if (status === "idle" && value === "") inputRef.current?.focus();
  }, [status, value]);

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <div className="relative">
      <style>{`
        @keyframes otp-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes otp-shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(3px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }
        @keyframes otp-caret {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .otp-pop { animation: otp-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .otp-shake { animation: otp-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        .otp-caret { animation: otp-caret 1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .otp-pop, .otp-shake, .otp-caret { animation: none; }
        }
      `}</style>

      <div className={`flex justify-center gap-2 ${status === "error" ? "otp-shake" : ""}`}>
        {Array.from({ length }).map((_, i) => {
          const digit = value[i] ?? "";
          const isActive = focused && i === activeIndex && status === "idle";
          const isFilled = digit !== "";

          const tone =
            status === "error"
              ? "border-red-400 bg-red-50 text-red-600"
              : status === "success"
              ? "border-emerald-400 bg-emerald-50 text-emerald-600"
              : isActive
              ? "border-primary bg-white text-foreground ring-4 ring-primary/20 -translate-y-0.5"
              : isFilled
              ? "border-primary/40 bg-white text-foreground"
              : "border-border bg-white text-foreground";

          return (
            <div
              key={i}
              className={`relative flex h-14 w-11 items-center justify-center rounded-xl border text-2xl font-semibold shadow-[0_4px_14px_-6px_rgba(15,23,42,0.25)] transition-all duration-200 sm:h-16 sm:w-12 sm:text-3xl ${tone}`}
            >
              {isFilled && (
                <span key={`${i}-${digit}`} className="otp-pop">
                  {digit}
                </span>
              )}
              {isActive && !isFilled && (
                <span className="otp-caret absolute h-6 w-0.5 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        disabled={disabled}
        aria-label={`${length}-digit code`}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        onFocus={(e) => {
          setFocused(true);
          const end = e.target.value.length;
          e.target.setSelectionRange(end, end);
        }}
        onBlur={() => setFocused(false)}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
        style={{ caretColor: "transparent" }}
      />
    </div>
  );
};

// ─── Forgot password modal ────────────────────────────────────────────────────

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
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [resendIn, setResendIn] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Auto-verify as soon as the 6th digit is typed
  useEffect(() => {
    if (step === "code" && codeInput.length === 6 && otpStatus === "idle" && !loading) {
      handleCodeSubmit(codeInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeInput, step]);

  const resetModal = () => {
    setStep("email");
    setEmailInput("");
    setFoundUser(null);
    setCodeInput("");
    setOtpStatus("idle");
    setResendIn(0);
    setNewPassword("");
    setConfirmPassword("");
    setLoading(false);
    setError("");
    setInfo("");
  };

  const handleClose = () => { resetModal(); onClose(); };

  // Creates a fresh code, stores it, and emails it
  const issueCode = async (email: string, firstName: string) => {
    const code = generateCode();

    await (supabase as any)
      .from("password_reset_codes")
      .delete()
      .eq("email", email)
      .eq("used", false);

    const { error: insertError } = await (supabase as any)
      .from("password_reset_codes")
      .insert({ email, code });

    if (insertError) return false;

    await sendEmail({
      email,
      first_name: firstName,
      subject: "Your Password Reset Code — Flexiq Verve",
      message: `<strong>Your Password Reset Code:</strong><br/><table cellpadding="0" cellspacing="0" border="0" style="margin:4px 0;"><tr><td style="background:#f8fafc; border:2px dashed #e2e8f0; border-radius:10px; padding:14px 24px;"><span style="font-size:26px; font-weight:700; letter-spacing:6px; font-family:'Courier New',monospace; color:#111827;">${code}</span></td></tr></table><br/>Enter this code on the Flexiq Verve password reset page. This code expires in <strong>15 minutes</strong>. Do not share this code with anyone for your security.<br/><br/>For more information or complaints, please contact <a href="mailto:support@flexiqverve.com" style="color:#2563eb;">support@flexiqverve.com</a> or make use of the Live Chat on your dashboard for assistance.`,
    });

    return true;
  };

  const handleEmailSubmit = async () => {
    if (!emailInput.trim()) return;
    setError("");
    setInfo("");
    setLoading(true);

    const email = emailInput.trim().toLowerCase();

    const { data: profileData, error: rpcError } = await supabase
      .rpc("get_profile_by_email", { _email: email });

    const user = Array.isArray(profileData) ? profileData[0] : profileData;

    if (rpcError || !user) {
      setLoading(false);
      setError("No account found with that email address.");
      return;
    }

    const firstName = (user as any).full_name?.split(" ")[0] ?? "there";
    const ok = await issueCode(email, firstName);

    if (!ok) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    setFoundUser({ email, first_name: firstName });
    setCodeInput("");
    setOtpStatus("idle");
    setResendIn(30);
    setLoading(false);
    setStep("code");
  };

  const handleResend = async () => {
    if (!foundUser || resendIn > 0 || loading) return;
    setError("");
    setInfo("");
    setLoading(true);
    const ok = await issueCode(foundUser.email, foundUser.first_name);
    setLoading(false);
    if (!ok) {
      setError("Could not send a new code. Please try again.");
      return;
    }
    setCodeInput("");
    setOtpStatus("idle");
    setResendIn(30);
    setInfo("A new code is on its way.");
  };

  const failCode = (message: string, backToEmail = false) => {
    setLoading(false);
    setError(message);
    setOtpStatus("error");
    setTimeout(() => {
      setCodeInput("");
      setOtpStatus("idle");
      if (backToEmail) setStep("email");
    }, 650);
  };

  const handleCodeSubmit = async (code: string = codeInput) => {
    if (code.length !== 6 || !foundUser) return;
    setError("");
    setInfo("");
    setLoading(true);

    const { data, error: selectError } = await (supabase as any)
      .from("password_reset_codes")
      .select("id, expires_at, used")
      .eq("email", foundUser.email)
      .eq("code", code)
      .eq("used", false)
      .maybeSingle();

    if (selectError || !data) {
      failCode("Invalid or expired code. Please try again.");
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      failCode("This code has expired. Please request a new one.", true);
      return;
    }

    setLoading(false);
    setOtpStatus("success");
    setTimeout(() => {
      setStep("password");
      setOtpStatus("idle");
    }, 600);
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
                  setInfo("");
                  setCodeInput("");
                  setOtpStatus("idle");
                  setStep(step === "code" ? "email" : "code");
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <DialogTitle>
              {step === "email" && "Reset your password"}
              {step === "code" && "Enter the code"}
              {step === "password" && "Set new password"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {error && <InlineNotice>{error}</InlineNotice>}
          {info && <InlineNotice type="success">{info}</InlineNotice>}

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
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset code"}
              </Button>
            </>
          )}

          {step === "code" && (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Sent to <strong className="text-foreground">{foundUser?.email}</strong>
              </p>

              <div className="py-2">
                <OtpInput
                  value={codeInput}
                  onChange={(v) => {
                    if (otpStatus !== "idle" || loading) return;
                    setError("");
                    setInfo("");
                    setCodeInput(v);
                  }}
                  status={otpStatus}
                  disabled={loading || otpStatus === "success"}
                />
              </div>

              <Button
                onClick={() => handleCodeSubmit()}
                disabled={loading || codeInput.length !== 6 || otpStatus !== "idle"}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : otpStatus === "success" ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Verified
                  </span>
                ) : (
                  "Verify code"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Didn't get it?{" "}
                {resendIn > 0 ? (
                  <span>Resend in {resendIn}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="font-medium text-primary hover:underline"
                  >
                    Resend code
                  </button>
                )}
              </p>
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
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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

const darkInput =
  "h-12 rounded-xl border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/40 focus-visible:border-[hsl(212_72%_58%)] focus-visible:ring-2 focus-visible:ring-[hsl(212_72%_58%)]/30 focus-visible:ring-offset-0";
const darkIcon =
  "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45";

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
    <div
      className="page-enter relative flex min-h-screen items-center justify-center bg-navy bg-cover bg-center px-4 py-8"
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      {/* Dark overlay keeps the photo subtle and the card readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(222_60%_8%)]/65 via-[hsl(222_55%_10%)]/40 to-[hsl(222_60%_6%)]/75" />

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

        <div className="rounded-3xl border border-white/10 bg-[hsl(222_45%_13%)]/90 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-9">
          <div className="mb-7 text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white">Sign in to your account</h1>
            <p className="mt-1.5 text-sm text-white/60">Enter your details to continue.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="id" className="text-white/90">Email or User ID</Label>
              <div className="relative">
                <User className={darkIcon} />
                <Input
                  id="id"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email or User ID"
                  required
                  autoComplete="username"
                  className={darkInput}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pwd" className="text-white/90">Password</Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-medium text-[hsl(205_80%_72%)] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className={darkIcon} />
                <Input
                  id="pwd"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className={`${darkInput} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
                  aria-label="Toggle password"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {notice && <InlineNotice type="success" dark>{notice}</InlineNotice>}
            {error && <InlineNotice dark>{error}</InlineNotice>}

            <label className="flex items-center gap-2.5 text-sm text-white/70">
              <Checkbox
                id="remember"
                className="border-white/40 data-[state=checked]:border-[hsl(212_72%_50%)] data-[state=checked]:bg-[hsl(212_72%_50%)]"
              />
              Keep me signed in
            </label>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="h-12 w-full rounded-xl bg-[hsl(212_72%_50%)] text-base font-semibold text-white shadow-lg shadow-black/30 hover:bg-[hsl(212_72%_45%)]"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            New to Flexiq Verve?{" "}
            <Link to="/signup" className="font-medium text-[hsl(205_80%_72%)] hover:underline">
              Open an account
            </Link>
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/55">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Secured with 256-bit encryption
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
