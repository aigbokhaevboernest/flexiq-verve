import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/BrandLogo";
import { sendEmail } from "@/lib/sendEmail";
import { Loader2, CheckCircle2 } from "lucide-react";

// Photo lives in public/login-bg.JPG (name is case-sensitive)
const BG_IMAGE = "/login-bg.JPG";

type BoxStatus = "idle" | "error" | "success";

const InlineError = ({ msg }: { msg: string }) =>
  msg ? (
    <p role="alert" className="mt-2 text-center text-xs text-red-500">
      {msg}
    </p>
  ) : null;

// ─── Segmented PIN input ──────────────────────────────────────────────────────
// One hidden real <input> holds the value (so paste, backspace and autofill work
// natively). The boxes are a visual layer with a pop-in animation and feedback.

const PinInput = ({
  value,
  onChange,
  inputRef,
  length = 4,
  status = "idle",
  disabled = false,
  autoFocus = false,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  length?: number;
  status?: BoxStatus;
  disabled?: boolean;
  autoFocus?: boolean;
  label: string;
}) => {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [autoFocus, inputRef]);

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <div className="relative">
      <style>{`
        @keyframes pin-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pin-shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(3px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }
        @keyframes pin-caret {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .pin-pop { animation: pin-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .pin-shake { animation: pin-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        .pin-caret { animation: pin-caret 1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pin-pop, .pin-shake, .pin-caret { animation: none; }
        }
      `}</style>

      <div className={`flex justify-center gap-2.5 ${status === "error" ? "pin-shake" : ""}`}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const isActive = focused && i === activeIndex && status === "idle" && !disabled;

          const tone =
            status === "error"
              ? "border-red-400 bg-red-50 text-red-600"
              : status === "success"
              ? "border-emerald-400 bg-emerald-50 text-emerald-600"
              : isActive
              ? "-translate-y-0.5 border-primary bg-white text-foreground ring-4 ring-primary/20"
              : filled
              ? "border-primary/40 bg-white text-foreground"
              : "border-border bg-white text-foreground";

          return (
            <div
              key={i}
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl border text-2xl font-semibold shadow-[0_3px_10px_-5px_rgba(15,23,42,0.25)] transition-all duration-200 ${tone}`}
            >
              {filled && (
                <span key={`${i}-${value[i]}`} className="pin-pop leading-none">
                  •
                </span>
              )}
              {isActive && !filled && (
                <span className="pin-caret absolute h-5 w-0.5 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        disabled={disabled}
        aria-label={label}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [pinStatus, setPinStatus] = useState<BoxStatus>("idle");
  const [confirmStatus, setConfirmStatus] = useState<BoxStatus>("idle");

  // Inline errors (shown under the boxes instead of a toast)
  const [pinError, setPinError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const pinRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

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

  // Create mode: once the first PIN is complete, jump to the confirm boxes
  useEffect(() => {
    if (mode === "create" && pin.length === 4 && confirmPin.length === 0) {
      confirmRef.current?.focus();
    }
  }, [pin, mode, confirmPin.length]);

  // Auto-submit when the last digit is typed
  useEffect(() => {
    if (!ready || busy || submittingRef.current) return;
    if (mode === "enter" && pin.length === 4 && pinStatus === "idle") {
      void doEnter(pin);
    }
    if (mode === "create" && pin.length === 4 && confirmPin.length === 4 && confirmStatus === "idle") {
      void doCreate(pin, confirmPin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, confirmPin, mode, ready]);

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

  // Shake + red, then clear the boxes so the person can retype right away
  const failPin = (msg: string) => {
    setPinError(msg);
    setPinStatus("error");
    setBusy(false);
    setTimeout(() => {
      setPin("");
      setPinStatus("idle");
      submittingRef.current = false;
      pinRef.current?.focus();
    }, 650);
  };

  const failConfirm = (msg: string) => {
    setConfirmError(msg);
    setConfirmStatus("error");
    setBusy(false);
    setTimeout(() => {
      setConfirmPin("");
      setConfirmStatus("idle");
      submittingRef.current = false;
      confirmRef.current?.focus();
    }, 650);
  };

  const doCreate = async (pinValue: string, confirmValue: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPinError("");
    setConfirmError("");

    if (!/^\d{4}$/.test(pinValue)) {
      submittingRef.current = false;
      return setPinError("PIN must be 4 digits");
    }
    if (pinValue !== confirmValue) return failConfirm("PINs don't match");

    setBusy(true);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ pin: pinValue })
      .eq("id", user!.id);

    if (error) {
      return failConfirm("Could not save PIN. Please try again.");
    }

    setPinStatus("success");
    setConfirmStatus("success");
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

  const doEnter = async (pinValue: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPinError("");

    if (!/^\d{4}$/.test(pinValue)) {
      submittingRef.current = false;
      return setPinError("Enter your 4-digit PIN");
    }

    setBusy(true);
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("pin,application_status")
      .eq("id", user!.id)
      .single();

    if (error || !data) return failPin("Could not check your PIN. Please try again.");
    if (data.pin !== pinValue) return failPin("Incorrect PIN");

    setPinStatus("success");
    sessionStorage.setItem("flexiq_pin_ok", "1");
    // Brief green confirmation before moving on
    setTimeout(() => {
      setBusy(false);
      navigate(data.application_status === "approved" ? "/dashboard" : "/pending", { replace: true });
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") void doCreate(pin, confirmPin);
    else void doEnter(pin);
  };

  const locked = busy || pinStatus !== "idle";
  const buttonDone = pinStatus === "success";

  return (
    <div className="page-enter relative flex min-h-screen items-center justify-center bg-navy px-4 py-8">
      {/* Photo + dark overlay, same as the login page */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      <div
        className="fixed inset-0"
        style={{ background: "linear-gradient(180deg, rgba(8,14,32,0.72) 0%, rgba(8,14,32,0.62) 50%, rgba(8,14,32,0.82) 100%)" }}
      />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        <div className="mb-6 flex items-center justify-center">
          <BrandLogo
            className="h-16 w-auto object-contain sm:h-20"
            style={{
              filter:
                "drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff)",
            }}
          />
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
          <button
            type="button"
            aria-label="Close"
            onClick={() => void handleCancel()}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>

          <div className="mb-5 text-center">
            <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
              {!ready ? "\u00A0" : mode === "create" ? "Create your PIN" : "Enter your PIN"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {!ready
                ? "\u00A0"
                : mode === "create"
                ? "Choose 4 digits to secure your account."
                : "Enter your 4-digit PIN to continue."}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              {mode === "create" && (
                <p className="mb-2 text-center text-sm font-medium text-foreground">New PIN</p>
              )}
              <PinInput
                value={pin}
                inputRef={pinRef}
                label={mode === "create" ? "New PIN" : "PIN"}
                status={pinStatus}
                disabled={!ready || busy || pinStatus === "success"}
                autoFocus={ready}
                onChange={(v) => {
                  if (locked) return;
                  setPin(v);
                  if (pinError) setPinError("");
                }}
              />
              <InlineError msg={pinError} />
            </div>

            {mode === "create" && (
              <div>
                <p className="mb-2 text-center text-sm font-medium text-foreground">Confirm PIN</p>
                <PinInput
                  value={confirmPin}
                  inputRef={confirmRef}
                  label="Confirm PIN"
                  status={confirmStatus}
                  disabled={busy || confirmStatus === "success"}
                  onChange={(v) => {
                    if (busy || confirmStatus !== "idle") return;
                    setConfirmPin(v);
                    if (confirmError) setConfirmError("");
                  }}
                />
                <InlineError msg={confirmError} />
              </div>
            )}

            <Button
              type="submit"
              disabled={
                busy ||
                !ready ||
                buttonDone ||
                pin.length !== 4 ||
                (mode === "create" && confirmPin.length !== 4)
              }
              className="h-11 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {buttonDone ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {mode === "create" ? "PIN set" : "Unlocked"}
                </span>
              ) : busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : mode === "create" ? (
                "Set PIN"
              ) : (
                "Unlock"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Pin;
