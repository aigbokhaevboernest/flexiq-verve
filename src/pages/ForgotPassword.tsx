import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a secure reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Back to login</Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-6 text-success">
          <CheckCircle2 className="mb-3 h-6 w-6" />
          <p className="font-semibold text-foreground">Check your inbox</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We've sent a reset link. The link expires in 30 minutes.
          </p>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" required placeholder="you@norvex.com" />
          </div>
          <Button type="submit" size="lg" className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
