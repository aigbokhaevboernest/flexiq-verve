import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { countries } from "@/lib/countries";
import { currencies } from "@/lib/currencies";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const Signup = () => {
  const navigate = useNavigate();

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
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/pin");
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input required placeholder="Jane Doe" /></Field>
          <Field label="Username"><Input required placeholder="janedoe" /></Field>

          <Field label="Email"><Input type="email" required placeholder="jane@email.com" /></Field>
          <Field label="Phone"><Input type="tel" required placeholder="+1 555 123 4567" /></Field>

          <Field label="Country">
            <Select required>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Gender">
            <Select required>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="nonbinary">Non-binary</SelectItem>
                <SelectItem value="other">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Account type">
            <Select required>
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
            <Select required>
              <SelectTrigger><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Date of birth"><Input type="date" required /></Field>
          <Field label="Zip code"><Input required placeholder="10001" /></Field>

          <div className="sm:col-span-2">
            <Field label="Address"><Input required placeholder="123 Main St, New York" /></Field>
          </div>

          <Field label="4-digit PIN"><Input type="password" required maxLength={4} pattern="[0-9]{4}" placeholder="••••" /></Field>
          <Field label="Confirm PIN"><Input type="password" required maxLength={4} pattern="[0-9]{4}" placeholder="••••" /></Field>

          <Field label="Password"><Input type="password" required minLength={8} placeholder="At least 8 characters" /></Field>
          <Field label="Confirm password"><Input type="password" required minLength={8} placeholder="Repeat password" /></Field>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <Checkbox required className="mt-0.5" />
          <span>
            I agree to the{" "}
            <a className="font-medium text-primary hover:underline">Terms of Service</a> and{" "}
            <a className="font-medium text-primary hover:underline">Privacy Policy</a>.
          </span>
        </label>

        <Button type="submit" size="lg" className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Signup;
