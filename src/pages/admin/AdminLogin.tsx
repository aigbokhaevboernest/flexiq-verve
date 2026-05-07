import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAccount";
import { toast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed-in admin? Skip the form.
  if (!loading && !roleLoading && user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr || !data.user) {
      setSubmitting(false);
      setError(signInErr?.message || "Invalid credentials");
      return;
    }

    // Verify admin role before letting them in
    const { data: roleRow, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleErr) {
      setSubmitting(false);
      setError("Could not verify admin access. Try again.");
      return;
    }

    if (!roleRow) {
      // Sign them out — this portal is admin-only
      await supabase.auth.signOut();
      setSubmitting(false);
      setError("This account does not have admin access.");
      return;
    }

    setSubmitting(false);
    toast({ title: "Welcome back, admin" });
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-coral text-white shadow-glow">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold">Admin Console</h1>
          <p className="text-sm text-muted-foreground">
            Restricted access. Authorized personnel only.
          </p>
        </div>

        <Card className="rounded-3xl border-border/60 p-8 shadow-elev">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Admin email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@flexiq.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pwd">Password</Label>
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

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full bg-gradient-primary text-primary-foreground shadow-md hover:opacity-95"
            >
              {submitting ? "Verifying access…" : "Sign in to admin"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              All access attempts are logged. Customer accounts use the{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium text-primary hover:underline"
              >
                customer login
              </button>
              .
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
