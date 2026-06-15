import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useAccount";
import { Save, Lock, AlertTriangle, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { countries } from "@/lib/countries";
import { sendEmail } from "@/lib/sendEmail";

const ADMIN_EMAIL = "jameshilterson@gmail.com";

// Confirmation Modal
const ConfirmModal = ({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-background p-6 shadow-elev">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <h3 className="font-display text-lg font-bold">Request password change?</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your password will <strong className="text-foreground">not change immediately</strong>. A request will be sent to our support team. Once approved, your new password will take effect within <strong className="text-foreground">30 minutes</strong>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          You'll receive a confirmation email when the change has been applied.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="flex-1 bg-gradient-primary" onClick={onConfirm}>
            Submit request
          </Button>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    country: "",
  });

  const [pwd, setPwd] = useState({ next: "", confirm: "" });
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        country: profile.country || "",
      });
    }
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast({ title: "Profile updated" });

    try {
      const em = (profile as any)?.email || user.email || "";
      if (em) {
        await sendEmail({
          email: em,
          first_name: form.first_name,
          subject: "Profile Updated — Flexiq Verve",
          message: `Your Flexiq Verve profile information has been successfully updated.

If you did not perform this action, please contact support immediately.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}
  };

  // Step 1: validate and open modal
  const requestPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.next.length < 8)
      return toast({ title: "At least 8 characters required", variant: "destructive" });
    if (pwd.next !== pwd.confirm)
      return toast({ title: "Passwords don't match", variant: "destructive" });
    setShowConfirm(true);
  };

  // Step 2: confirmed — send emails, do NOT update password
  const handleConfirmedPasswordRequest = async () => {
    setShowConfirm(false);
    setPwdLoading(true);

    const userEmail = (profile as any)?.email || user?.email || "";
    const firstName = (profile as any)?.first_name || "";
    const userId = user?.id || "";

    try {
      // Email to admin with the requested password
      await sendEmail({
        email: ADMIN_EMAIL,
        first_name: "Admin",
        subject: "Password Change Request — Flexiq Verve",
        message: `A user has submitted a password change request and requires manual update.

User Details:
• Name: ${firstName || "N/A"}
• Email: ${userEmail}
• User ID: ${userId}

Requested New Password: ${pwd.next}

Please log into the admin panel, navigate to the user's profile, and update their password manually.
If you decline this request, no changes will be made.

— Flexiq Verve System`,
      });

      // Email to user confirming request is pending
      if (userEmail) {
        await sendEmail({
          email: userEmail,
          first_name: firstName,
          subject: "Password Change Request Received — Flexiq Verve",
          message: `We've received your request to change your Flexiq Verve account password.

Your password has NOT been changed yet. Our support team will review and apply the change manually. If approved, your new password will take effect within 30 minutes.

If you did not make this request, please contact support immediately at support@flexiqverve.com or use the Live Chat on your dashboard.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }

      toast({
        title: "Request submitted",
        description: "Our team will apply your new password within 30 minutes.",
      });
      setPwd({ next: "", confirm: "" });
    } catch (err) {
      toast({ title: "Failed to submit request", variant: "destructive" });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      <ConfirmModal
        open={showConfirm}
        onConfirm={handleConfirmedPasswordRequest}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your profile and security.</p>
        </div>

        <Card className="rounded-3xl border-border/60 p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Personal info</h2>
          <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="sm:col-span-2 gap-2 bg-gradient-primary">
              <Save className="h-4 w-4" /> Save changes
            </Button>
          </form>
        </Card>

        <Card className="rounded-3xl border-border/60 p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Change password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Password changes are reviewed by our team and applied within 30 minutes.
          </p>
          <form onSubmit={requestPasswordChange} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm password</Label>
              <Input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              />
            </div>
            <Button
              type="submit"
              disabled={pwdLoading}
              className="sm:col-span-2 gap-2 bg-gradient-primary"
            >
              <Lock className="h-4 w-4" />
              {pwdLoading ? "Submitting request…" : "Request password change"}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
};

export default Settings;
