import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { countries } from "@/lib/countries";
import { currencies } from "@/lib/currencies";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/BrandLogo";
import { sendEmail } from "@/lib/sendEmail";

// Public site key (safe in the browser). Set VITE_RECAPTCHA_SITE_KEY in .env / Vercel.
const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined) ?? "";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

const nativeSelectClass =
  "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

// Theme-aware native date field: follows light/dark instead of staying white.
const dateInputClass =
  "mt-1 block h-10 w-full max-w-full rounded-md border bg-background px-3 text-sm text-foreground [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-ring";

const ERROR_RING = "border-red-500 focus-visible:ring-red-500 focus:ring-red-500";

// Order used to scroll to the first problem on submit.
const FIELD_ORDER = [
  "first_name", "last_name", "username", "email", "phone", "country",
  "account_type", "currency", "city", "date_of_birth", "address",
  "password", "confirm_password", "terms", "captcha",
] as const;

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p role="alert" className="mt-1 text-xs text-red-500">
      {msg}
    </p>
  ) : null;

const Signup = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    country: "",
    currency: "",
    account_type: "",
    address: "",
    city: "",
    postal_code: "",
    date_of_birth: "",
    password: "",
    confirm_password: "",
  });

  // ── reCAPTCHA v2 (checkbox) ──
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.warn("VITE_RECAPTCHA_SITE_KEY is not set — reCAPTCHA will not load.");
      return;
    }

    const renderWidget = () => {
      window.grecaptcha?.ready(() => {
        if (!captchaRef.current || widgetIdRef.current !== null) return;
        widgetIdRef.current = window.grecaptcha!.render(captchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token) => {
            setRecaptchaToken(token);
            setErrors((prev) => {
              const next = { ...prev };
              delete next.captcha;
              return next;
            });
          },
          "expired-callback": () => setRecaptchaToken(null),
          "error-callback": () => setRecaptchaToken(null),
        });
      });
    };

    if (window.grecaptcha) {
      renderWidget();
      return;
    }

    let script = document.getElementById("recaptcha-script") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "recaptcha-script";
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderWidget);
    return () => script?.removeEventListener("load", renderWidget);
  }, []);

  // A token can only be verified once, so reset the widget after every attempt that used it.
  const resetCaptcha = () => {
    if (widgetIdRef.current !== null) window.grecaptcha?.reset(widgetIdRef.current);
    setRecaptchaToken(null);
  };

  // Returns an error message for one field, or "" if it's fine.
  const validateField = (name: string, value: string, pwd = form.password): string => {
    switch (name) {
      case "first_name":
        return value.trim() ? "" : "First name is required";
      case "last_name":
        return value.trim() ? "" : "Last name is required";
      case "username":
        if (!value.trim()) return "User ID is required";
        if (value.trim().length < 3) return "User ID must be at least 3 characters";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
        return "";
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (value.replace(/\D/g, "").length < 6) return "Enter a valid phone number";
        return "";
      case "country":
        return value ? "" : "Please select a country";
      case "account_type":
        return value ? "" : "Please choose an account type";
      case "currency":
        return value ? "" : "Please select a currency";
      case "city":
        return value.trim() ? "" : "City is required";
      case "address":
        return value.trim() ? "" : "Address is required";
      case "date_of_birth":
        if (!value) return "Date of birth is required";
        if (new Date(value) > new Date()) return "Date of birth can't be in the future";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";
      case "confirm_password":
        if (!value) return "Please confirm your password";
        if (value !== pwd) return "Passwords don't match";
        return "";
      default:
        return "";
    }
  };

  const setError = (name: string, msg: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[name] = msg;
      else delete next[name];
      return next;
    });

  const update = (name: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setFormError("");
    // Clear / refresh an error as soon as the user fixes the field.
    if (errors[name]) setError(name, validateField(name, value));
    // Typing a new password re-checks the confirm field if it was already filled.
    if (name === "password" && form.confirm_password) {
      setError("confirm_password", validateField("confirm_password", form.confirm_password, value));
    }
  };

  const onBlur = (name: keyof typeof form) => () =>
    setError(name, validateField(name, form[name]));

  const validateAll = (): boolean => {
    const next: Record<string, string> = {};
    (Object.keys(form) as Array<keyof typeof form>).forEach((key) => {
      if (key === "postal_code") return; // optional
      const msg = validateField(key, form[key]);
      if (msg) next[key] = msg;
    });
    if (!agreed) next.terms = "You must agree to the Terms and Privacy Policy";
    if (!recaptchaToken) next.captcha = "Please complete the security check";
    setErrors(next);

    const first = FIELD_ORDER.find((k) => next[k]);
    if (first) {
      document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return Object.keys(next).length === 0;
  };

  const inputCls = (name: string) => (errors[name] ? ERROR_RING : "");
  const selectCls = (name: string) =>
    `${nativeSelectClass} ${errors[name] ? "border-red-500" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (submitting) return;
    if (!validateAll()) return;

    setSubmitting(true);
    const releaseTimeout = setTimeout(() => setSubmitting(false), 10000);

    try {
      // 1) Verify the reCAPTCHA token on the server BEFORE creating the auth user,
      //    so bots never get an account.
      const { data: captcha, error: captchaErr } = await supabase.functions.invoke(
        "verify-recaptcha",
        { body: { token: recaptchaToken } }
      );

      if (captchaErr || !captcha?.success) {
        clearTimeout(releaseTimeout);
        setSubmitting(false);
        resetCaptcha();
        setError("captcha", "Security check failed. Please complete the check and try again.");
        document.getElementById("captcha")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      // 2) Create the account.
      // Clear any old PIN unlock BEFORE the session exists. The moment signUp
      // returns, GuestOnly sees a logged-in user and sends them to /pin (not
      // /dashboard) because the PIN isn't unlocked, so the dashboard never paints.
      sessionStorage.removeItem("flexiq_pin_ok");

      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          // Email links also land on the PIN screen, never straight on the dashboard
          emailRedirectTo: `${window.location.origin}/pin`,
          data: {
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            country: form.country,
            currency: form.currency,
            account_type: form.account_type,
            address: form.address,
            city: form.city,
            postal_code: form.postal_code,
            username: form.username,
            date_of_birth: form.date_of_birth,
            plain_password: form.password,
          },
        },
      });

      if (error) {
        clearTimeout(releaseTimeout);
        setSubmitting(false);
        resetCaptcha(); // the token was already used up
        // Put the message next to the field it's about, otherwise in a banner.
        if (/already registered|already exists|user already/i.test(error.message)) {
          setError("email", "An account with this email already exists. Try logging in.");
          document.getElementById("email")?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (/password/i.test(error.message)) {
          setError("password", error.message);
          document.getElementById("password")?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (/email/i.test(error.message)) {
          setError("email", error.message);
          document.getElementById("email")?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          setFormError(error.message);
        }
        return;
      }

      // Go to the PIN screen right away (replace: Back never returns to signup).
      // The profile setup below keeps running in the background.
      navigate("/pin", { replace: true });

      if (data.user) {
        await new Promise((res) => setTimeout(res, 1500));
        await (supabase as any).from("profiles").update({
          username: form.username,
          plain_password: form.password,
          date_of_birth: form.date_of_birth || null,
        }).eq("id", data.user.id);

        const { data: existing } = await (supabase as any)
          .from("id_verifications")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (!existing) {
          await (supabase as any).from("id_verifications").insert({
            user_id: data.user.id,
            status: "not_started",
            legal_first_name: form.first_name,
            legal_last_name: form.last_name,
            date_of_birth: form.date_of_birth || null,
            document_country: form.country,
          });
        }
      }

      clearTimeout(releaseTimeout);
      setSubmitting(false);

      try {
        await sendEmail({
          email: form.email,
          first_name: form.first_name,
          subject: "Welcome to Flexiq Verve — Account Created Successfully",
          message:
`Welcome to Flexiq Verve! Your account has been successfully created.

Here are your account details:
User ID: ${form.username}
Account Type: ${form.account_type}
Currency: ${form.currency}

Please keep your login details safe and do not share them with anyone.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      } catch {}

      toast({
        title: "Account created",
        description: "Welcome to Flexiq Verve, Create a pin to continue!",
      });
    } catch (err: any) {
      clearTimeout(releaseTimeout);
      setSubmitting(false);
      resetCaptcha();
      setFormError(err?.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="page-enter relative min-h-screen bg-navy-blue-mesh px-4 py-5">
      {/* Full-screen cover while the account is created, so nothing else paints before /pin */}
      {submitting && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background/95 backdrop-blur-sm">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">Creating your account…</p>
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-elev animate-fade-in">
        <div className="bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A78BFA] px-6 pb-4 pt-5 text-center sm:px-10">
          <Link to="/" className="flex flex-col items-center justify-center">
            <BrandLogo className="h-14 w-auto object-contain drop-shadow-lg sm:h-16" />
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
            Create Your Account
          </h1>
          <p className="mt-1 text-sm text-white/80">Start banking smarter — safe, secure, and ready in minutes.</p>
        </div>

        <div className="px-6 py-5 sm:px-10">
          {/* noValidate: we show our own inline errors instead of the browser's pop-ups */}
          <form className="space-y-3" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              <div>
                <Label htmlFor="first_name">First name</Label>
                <Input id="first_name" className={`mt-1 ${inputCls("first_name")}`} placeholder="John" value={form.first_name} onChange={(e) => update("first_name")(e.target.value)} onBlur={onBlur("first_name")} />
                <FieldError msg={errors.first_name} />
              </div>
              <div>
                <Label htmlFor="last_name">Last name</Label>
                <Input id="last_name" className={`mt-1 ${inputCls("last_name")}`} placeholder="Doe" value={form.last_name} onChange={(e) => update("last_name")(e.target.value)} onBlur={onBlur("last_name")} />
                <FieldError msg={errors.last_name} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="username">User ID</Label>
                <Input id="username" className={`mt-1 ${inputCls("username")}`} placeholder="Johndoe" value={form.username} onChange={(e) => update("username")(e.target.value.replace(/\s+/g, ""))} onBlur={onBlur("username")} />
                <FieldError msg={errors.username} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" className={`mt-1 ${inputCls("email")}`} placeholder="john@example.com" value={form.email} onChange={(e) => update("email")(e.target.value)} onBlur={onBlur("email")} />
                <FieldError msg={errors.email} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" className={`mt-1 ${inputCls("phone")}`} placeholder="+__ ___ ___ ____ ____" value={form.phone} onChange={(e) => update("phone")(e.target.value)} onBlur={onBlur("phone")} />
                <FieldError msg={errors.phone} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="country">Country</Label>
                <select id="country" className={selectCls("country")} value={form.country} onChange={(e) => update("country")(e.target.value)} onBlur={onBlur("country")}>
                  <option value="">Select country</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <FieldError msg={errors.country} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="account_type">Account type</Label>
                <select id="account_type" className={selectCls("account_type")} value={form.account_type} onChange={(e) => update("account_type")(e.target.value)} onBlur={onBlur("account_type")}>
                  <option value="">Choose account</option>
                  <option value="checking">Checking Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="retirement">Retirement Account</option>
                  <option value="business">Business Account</option>
                </select>
                <FieldError msg={errors.account_type} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="currency">Currency</Label>
                <select id="currency" className={selectCls("currency")} value={form.currency} onChange={(e) => update("currency")(e.target.value)} onBlur={onBlur("currency")}>
                  <option value="">Currency</option>
                  {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
                <FieldError msg={errors.currency} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="city">City</Label>
                <Input id="city" className={`mt-1 ${inputCls("city")}`} placeholder="London" value={form.city} onChange={(e) => update("city")(e.target.value)} onBlur={onBlur("city")} />
                <FieldError msg={errors.city} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date_of_birth">Date of birth</Label>
                  <span className="text-xs text-muted-foreground">(click to select)</span>
                </div>
                <input
                  id="date_of_birth"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={form.date_of_birth}
                  onChange={(e) => update("date_of_birth")(e.target.value)}
                  onBlur={onBlur("date_of_birth")}
                  className={`${dateInputClass} ${errors.date_of_birth ? "border-red-500" : "border-input"}`}
                />
                <FieldError msg={errors.date_of_birth} />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" className={`mt-1 ${inputCls("address")}`} placeholder="123 Main Street" value={form.address} onChange={(e) => update("address")(e.target.value)} onBlur={onBlur("address")} />
                <FieldError msg={errors.address} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" className={`mt-1 ${inputCls("password")}`} placeholder="At least 8 characters" value={form.password} onChange={(e) => update("password")(e.target.value)} onBlur={onBlur("password")} />
                <FieldError msg={errors.password} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="confirm_password">Confirm password</Label>
                <Input id="confirm_password" type="password" className={`mt-1 ${inputCls("confirm_password")}`} placeholder="Repeat password" value={form.confirm_password} onChange={(e) => update("confirm_password")(e.target.value)} onBlur={onBlur("confirm_password")} />
                <FieldError msg={errors.confirm_password} />
              </div>
            </div>

            <div>
              <label id="terms" className="flex items-start gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={agreed}
                  onCheckedChange={(v) => {
                    setAgreed(v === true);
                    if (v === true) setError("terms", "");
                  }}
                  className={`mt-0.5 ${errors.terms ? "border-red-500" : ""}`}
                />
                <span>
                  I agree to the{" "}
                  <Link to="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>{" "}
                  and{" "}
                  <Link to="/policies" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
                </span>
              </label>
              <FieldError msg={errors.terms} />
            </div>

            {/* reCAPTCHA v2 checkbox */}
            <div id="captcha">
              <div className="overflow-x-auto">
                <div ref={captchaRef} />
              </div>
              <FieldError msg={errors.captcha} />
            </div>

            {formError && (
              <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {formError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={submitting || !recaptchaToken}
              className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95"
            >
              {submitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-3 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
