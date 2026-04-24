import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { countries } from "@/lib/countries";
import { currencies } from "@/lib/currencies";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const Signup = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
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

  const update = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
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
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Account created", description: "Welcome to Norvex!" });
    navigate("/dashboard");
  };

  return (
    <AuthLayout
      title="Open your account"
      subtitle="Takes about 2 minutes. No paperwork."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input required placeholder="Jane" value={form.first_name} onChange={(e) => update("first_name")(e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input required placeholder="Doe" value={form.last_name} onChange={(e) => update("last_name")(e.target.value)} />
          </Field>

          <Field label="Email">
            <Input type="email" required placeholder="jane@email.com" value={form.email} onChange={(e) => update("email")(e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input type="tel" required placeholder="+1 555 123 4567" value={form.phone} onChange={(e) => update("phone")(e.target.value)} />
          </Field>

          <Field label="Country">
            <Select required value={form.country} onValueChange={update("country")}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Account type">
            <Select required value={form.account_type} onValueChange={update("account_type")}>
              <SelectTrigger><SelectValue placeholder="Choose account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Preferred currency">
            <Select required value={form.currency} onValueChange={update("currency")}>
              <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="City">
            <Input required placeholder="New York" value={form.city} onChange={(e) => update("city")(e.target.value)} />
          </Field>
          <Field label="Postal code">
            <Input required placeholder="10001" value={form.postal_code} onChange={(e) => update("postal_code")(e.target.value)} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Address">
              <Input required placeholder="123 Main St" value={form.address} onChange={(e) => update("address")(e.target.value)} />
            </Field>
          </div>

          <Field label="Password">
            <Input type="password" required minLength={8} placeholder="At least 8 characters" value={form.password} onChange={(e) => update("password")(e.target.value)} />
          </Field>
          <Field label="Confirm password">
            <Input type="password" required minLength={8} placeholder="Repeat password" value={form.confirm_password} onChange={(e) => update("confirm_password")(e.target.value)} />
          </Field>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox required className="mt-0.5" />
          <span>
            I agree to the{" "}
            <a className="font-medium text-primary hover:underline">Terms of Service</a> and{" "}
            <a className="font-medium text-primary hover:underline">Privacy Policy</a>.
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
    </AuthLayout>
  );
};

export default Signup;
