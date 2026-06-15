import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useAccount, useVerification, useIsAdmin, formatMoney } from "@/hooks/useAccount";
import { Settings as SettingsIcon, ShieldCheck, Mail, Phone, Globe2, CreditCard, BadgeCheck, CalendarClock, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const Row = ({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border/50 py-3 last:border-0">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {Icon && <Icon className="h-4 w-4" />} {label}
    </div>
    <div className="text-right text-sm font-medium break-all">
      {value || <span className="text-muted-foreground">—</span>}
    </div>
  </div>
);

/** Mask all but last 4 chars: e.g. "1234567890" → "••••••7890" */
const maskValue = (val?: string | null, visibleChars = 4): string | null => {
  if (!val) return null;
  const clean = val.replace(/\s/g, "");
  if (clean.length <= visibleChars) return val;
  return "•".repeat(clean.length - visibleChars) + clean.slice(-visibleChars);
};

const Profile = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: account } = useAccount();
  const { data: verification } = useVerification();
  const { data: isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Account holder";
  const initials = (
    (profile?.first_name?.[0] || user?.email?.[0] || "") +
    (profile?.last_name?.[0] || "")
  ).toUpperCase() || "U";

  const verifStatus = verification?.status || "not_started";
  const verifColor =
    verifStatus === "approved"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      : verifStatus === "pending" || verifStatus === "submitted"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
      : verifStatus === "rejected"
      ? "bg-red-500/20 text-red-400 border-red-500/40"
      : "bg-white/10 text-white/70 border-white/20";

  const avatarUrl = (profile as any)?.avatar_url || null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, or WebP image.", variant: "destructive" });
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast({ title: "File too large", description: "Max file size is 5MB.", variant: "destructive" });
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("app-assets")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("app-assets")
        .getPublicUrl(path);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error("Could not get public URL");

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      qc.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Photo updated" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      // reset input so same file can be re-selected
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your personal and account information.</p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/dashboard/settings">
            <SettingsIcon className="h-4 w-4" /> Edit profile
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden rounded-3xl border-border/60 shadow-card">
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow-md transition hover:scale-105 disabled:opacity-60"
                title="Upload photo"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold">{fullName}</h2>
              <p className="truncate text-sm text-white/80">{user?.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {/* Stable badge — key forces no re-mount flicker */}
                <Badge
                  key={verifStatus}
                  variant="outline"
                  className={verifColor + " capitalize font-semibold"}
                >
                  <BadgeCheck className="mr-1 h-3 w-3" />
                  {verifStatus.replace(/_/g, " ")}
                </Badge>
                {isAdmin && (
                  <Badge variant="outline" className="border-white/40 bg-white/10 text-white">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Admin
                  </Badge>
                )}
                {profile?.account_type && (
                  <Badge variant="outline" className="border-white/40 bg-white/10 text-white capitalize">
                    {profile.account_type}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal information — address/city/postal/currency hidden */}
        <Card className="rounded-3xl border-border/60 p-6 shadow-card">
          <h3 className="font-display text-lg font-bold">Personal information</h3>
          <div className="mt-4">
            <Row label="First name" value={profile?.first_name} />
            <Row label="Last name" value={profile?.last_name} />
            <Row label="Email" value={user?.email} icon={Mail} />
            <Row label="Phone" value={profile?.phone} icon={Phone} />
            <Row label="Country" value={profile?.country} icon={Globe2} />
            <Row label="Account type" value={profile?.account_type} />
          </div>
        </Card>

        <div className="space-y-6">
          {/* Account — account number hidden */}
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <h3 className="font-display text-lg font-bold">Account</h3>
            <div className="mt-4">
              <Row label="Currency" value={(account as any)?.currency} />
              <Row
                label="Balance"
                value={
                  account
                    ? formatMoney(Number((account as any).balance), (account as any).currency)
                    : undefined
                }
              />
              <Row
                label="Status"
                value={(account as any)?.frozen ? "Frozen" : ((account as any)?.status || "Active")}
              />
              <Row
                label="Member since"
                value={
                  profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : undefined
                }
                icon={CalendarClock}
              />
            </div>
          </Card>

          {/* Identity verification — document number masked, submitted/reviewed hidden */}
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <h3 className="font-display text-lg font-bold">Identity verification</h3>
            <div className="mt-4">
              <Row label="Legal name" value={[verification?.legal_first_name, verification?.legal_middle_name, verification?.legal_last_name].filter(Boolean).join(" ") || null} />
              <Row label="Date of birth" value={verification?.date_of_birth} />
              <Row label="Document type" value={verification?.document_type} />
              <Row
                label="Document number"
                icon={CreditCard}
                value={maskValue(verification?.document_number, 4)}
              />
              <Row label="Document country" value={verification?.document_country} />
              {verification?.rejection_reason && (
                <Row label="Rejection reason" value={verification.rejection_reason} />
              )}
            </div>
            {verifStatus !== "approved" && (
              <Button asChild className="mt-4 w-full bg-gradient-primary">
                <Link to="/verify">Complete verification</Link>
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
