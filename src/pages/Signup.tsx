import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { countries } from "@/lib/countries";
import { currencies } from "@/lib/currencies";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import adminLogo from "@/assets/logo.png";

const nativeSelectClass =
  "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const Signup = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
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
    password: "",
    confirm_password: "",
  });

  // Inject Google Translate widget on this page only
  useEffect(() => {
    (window as any).googleTranslateElementInit = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "es,fr,de,zh-CN,ar,ja,ko,pt,ru,hi,it,nl,tr,pl,sv",
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);

    const style = document.createElement("style");
    style.id = "gt-style";
    style.textContent = `.goog-te-banner-frame{display:none !important;} body{top:0 !important;}`;
    document.head.appendChild(style);

    return () => {
      script.remove();
      style.remove();
      const el = document.getElementById("google_translate_element");
      if (el) el.innerHTML = "";
    };
  }, []);

  const update = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
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
        },
      },
    });
    if (error) {
      setSubmitting(false);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }

    // Save username to profile if we have a session
    if (data.user && form.username) {
      await supabase.from("profiles").update({ username: form.username }).eq("id", data.user.id);
    }
    setSubmitting(false);
    toast({ title: "Account created", description: "Welcome to Flexiq Verve!" });
    sessionStorage.removeItem("flexiq_pin_ok");
    navigate("/pin");
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-10">
      <div
        id="google_translate_element"
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          background: "white",
          borderRadius: 8,
          padding: 4,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 9999,
        }}
      />

      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-border/60 bg-card/90 p-8 shadow-elev backdrop-blur-xl sm:p-10">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex flex-col items-center">
            <img src={adminLogo} alt="Flexiq Verve" style={{ width: 96, height: "auto", display: "block" }} />
            <span className="mt-3 font-display text-2xl font-bold">Flexiq Verve</span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">Open your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Takes about 2 minutes. No paperwork.</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>First name</Label>
              <Input required className="mt-1" placeholder="First name" value={form.first_name} onChange={(e) => update("first_name")(e.target.value)} />
            </div>
            <div>
              <Label>Last name</Label>
              <Input required className="mt-1" placeholder="Last name" value={form.last_name} onChange={(e) => update("last_name")(e.target.value)} />
            </div>

            <div>
              <Label>Username</Label>
              <Input required className="mt-1" placeholder="username" value={form.username} onChange={(e) => update("username")(e.target.value.replace(/\s+/g, ""))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" required className="mt-1" placeholder="jane@email.com" value={form.email} onChange={(e) => update("email")(e.target.value)} />
            </div>

            <div>
              <Label>Phone</Label>
              <Input type="tel" required className="mt-1" placeholder="Phone number" value={form.phone} onChange={(e) => update("phone")(e.target.value)} />
            </div>
            <div>
              <Label>Country</Label>
              <select required className={nativeSelectClass} value={form.country} onChange={(e) => update("country")(e.target.value)}>
                <option value="">Select country</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <Label>Account type</Label>
              <select required className={nativeSelectClass} value={form.account_type} onChange={(e) => update("account_type")(e.target.value)}>
                <option value="">Choose account</option>
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            <div>
              <Label>Preferred currency</Label>
              <select required className={nativeSelectClass} value={form.currency} onChange={(e) => update("currency")(e.target.value)}>
                <option value="">Currency</option>
                {currencies.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>

            <div>
              <Label>City</Label>
              <Input required className="mt-1" placeholder="City" value={form.city} onChange={(e) => update("city")(e.target.value)} />
            </div>
            <div>
              <Label>Postal code</Label>
              <Input required className="mt-1" placeholder="Postal code" value={form.postal_code} onChange={(e) => update("postal_code")(e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input required className="mt-1" placeholder="Street address" value={form.address} onChange={(e) => update("address")(e.target.value)} />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" required minLength={8} className="mt-1" placeholder="At least 8 characters" value={form.password} onChange={(e) => update("password")(e.target.value)} />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" required minLength={8} className="mt-1" placeholder="Repeat password" value={form.confirm_password} onChange={(e) => update("confirm_password")(e.target.value)} />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox required className="mt-0.5" />
            <span>
              I agree to the{" "}
              <Link to="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link> and{" "}
              <Link to="/policies" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
            </span>
          </label>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95"
          >
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
