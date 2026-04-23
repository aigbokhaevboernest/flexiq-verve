import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Pin = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");

  return (
    <AuthLayout
      title="Enter your PIN"
      subtitle="For your security, please confirm your 4-digit account PIN."
    >
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (pin.length === 4) navigate("/dashboard");
        }}
      >
        <div className="flex justify-center">
          <InputOTP maxLength={4} value={pin} onChange={setPin}>
            <InputOTPGroup>
              <InputOTPSlot index={0} className="h-14 w-14 text-2xl" />
              <InputOTPSlot index={1} className="h-14 w-14 text-2xl" />
              <InputOTPSlot index={2} className="h-14 w-14 text-2xl" />
              <InputOTPSlot index={3} className="h-14 w-14 text-2xl" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={pin.length !== 4}
          className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95"
        >
          Continue to dashboard
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Forgot your PIN?{" "}
          <a className="cursor-pointer font-medium text-primary hover:underline">Reset PIN</a>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Pin;
