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
import { Save, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { currencies } from "@/lib/currencies";
import { countries } from "@/lib/countries";
import { sendEmail } from "@/lib/sendEmail";

const Settings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", country: "", currency: "USD",
    address: "", city: "", postal_code: "",
  });
  const [pwd, setPwd] = useState({ next: "", confirm: "" });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        country: profile.country || "",
        currency: profile.currency || "USD",
        address: profile.address || "",
        city: profile.city || "",
        postal_code: profile.postal_code || "",
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
          email: em, first_name: form.first_name,
          subject: "Profile Updated — Flexiq Verve",
          message:
`Your Flexiq Verve profile information has been successfully updated.

If you did not perform this action, please contact support immediately.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.next.length < 8) return toast({ title: "At least 8 characters", variant: "destructive" });
    if (pwd.next !== pwd.confirm) return toast({ title: "Passwords don't match", variant: "destructive" });
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Password changed" });
    setPwd({ next: "", confirm: "" });

    try {
      const em = (profile as any)?.email || user?.email || "";
      const fn = (profile as any)?.first_name || "";
      if (em) {
        await sendEmail({
          email: em, first_name: fn,
          subject: "Password Changed — Flexiq Verve",
          message:
`Hello ${fn},

Your Flexiq Verve account password has been successfully changed.

If you did not perform this action, please contact support immediately as your account may be at risk.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and security.</p>
      </div>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Personal info</h2>
        <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>First name</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Last name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="space-y-2"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="space-y-2"><Label>Postal code</Label><Input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent className="max-h-72">{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Preferred currency</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button type="submit" className="sm:col-span-2 gap-2 bg-gradient-primary"><Save className="h-4 w-4" /> Save changes</Button>
        </form>
      </Card>

      <Card className="rounded-3xl border-border/60 p-6 shadow-card">
        <h2 className="font-display text-lg font-bold">Change password</h2>
        <form onSubmit={changePassword} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>New password</Label><Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} /></div>
          <div className="space-y-2"><Label>Confirm password</Label><Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></div>
          <Button type="submit" className="sm:col-span-2 gap-2 bg-gradient-primary"><Lock className="h-4 w-4" /> Update password</Button>
        </form>
      </Card>
    </div>
  );
};

export default Settings;
