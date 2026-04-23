import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue managing your money."
      footer={
        <>
          New to Norvex?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Open an account
          </Link>
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
        <div className="space-y-2">
          <Label htmlFor="id">Email or username</Label>
          <Input id="id" placeholder="you@norvex.com" required />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pwd">Password</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Input id="pwd" type={showPwd ? "text" : "password"} placeholder="••••••••" required />
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

        <Button type="submit" size="lg" className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95">
          Continue
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
