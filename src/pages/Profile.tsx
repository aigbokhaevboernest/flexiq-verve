import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useAccount, useVerification, useIsAdmin, formatMoney } from "@/hooks/useAccount";
import { Settings as SettingsIcon, ShieldCheck, Mail, Phone, MapPin, Globe2, CreditCard, BadgeCheck, CalendarClock } from "lucide-react";

const Row = ({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border/50 py-3 last:border-0">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {Icon && <Icon className="h-4 w-4" />} {label}
    </div>
    <div className="text-right text-sm font-medium break-all">{value || <span className="text-muted-foreground">—</span>}</div>
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: account } = useAccount();
  const { data: verification } = useVerification();
  const { data: isAdmin } = useIsAdmin();

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Account holder";
  const initials = ((profile?.first_name?.[0] || user?.email?.[0] || "") + (profile?.last_name?.[0] || "")).toUpperCase() || "U";
  const verifStatus = verification?.status || "not_started";
  const verifColor =
    verifStatus === "approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
    : verifStatus === "pending" || verifStatus === "submitted" ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
    : verifStatus === "rejected" ? "bg-destructive/10 text-destructive border-destructive/30"
    : "bg-muted text-muted-foreground border-border";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your personal and account information.</p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/dashboard/settings"><SettingsIcon className="h-4 w-4" /> Edit profile</Link>
        </Button>
      </div>

      <Card className="overflow-hidden rounded-3xl border-border/60 shadow-card">
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-bold">{fullName}</h2>
              <p className="truncate text-sm text-white/80">{user?.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className={verifColor + " capitalize"}>
                  <BadgeCheck className="mr-1 h-3 w-3" /> {verifStatus.replace("_", " ")}
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
        <Card className="rounded-3xl border-border/60 p-6 shadow-card">
          <h3 className="font-display text-lg font-bold">Personal information</h3>
          <div className="mt-4">
            <Row label="First name" value={profile?.first_name} />
            <Row label="Last name" value={profile?.last_name} />
            <Row label="Email" value={user?.email} icon={Mail} />
            <Row label="Phone" value={profile?.phone} icon={Phone} />
            <Row label="Address" value={profile?.address} icon={MapPin} />
            <Row label="City" value={profile?.city} />
            <Row label="Postal code" value={profile?.postal_code} />
            <Row label="Country" value={profile?.country} icon={Globe2} />
            <Row label="Preferred currency" value={profile?.currency} />
            <Row label="Account type" value={profile?.account_type} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <h3 className="font-display text-lg font-bold">Account</h3>
            <div className="mt-4">
              <Row label="Account number" value={account?.account_number} icon={CreditCard} />
              <Row label="Currency" value={account?.currency} />
              <Row label="Balance" value={account ? formatMoney(Number(account.balance), account.currency) : undefined} />
              <Row label="Status" value={account?.frozen ? "Frozen" : "Active"} />
              <Row label="Member since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : undefined} icon={CalendarClock} />
              
            </div>
          </Card>

          <Card className="rounded-3xl border-border/60 p-6 shadow-card">
            <h3 className="font-display text-lg font-bold">Identity verification</h3>
            <div className="mt-4">
              <Row label="Status" value={verifStatus.replace("_", " ")} />
              <Row label="Legal name" value={[verification?.legal_first_name, verification?.legal_middle_name, verification?.legal_last_name].filter(Boolean).join(" ") || null} />
              <Row label="Date of birth" value={verification?.date_of_birth} />
              <Row label="Document type" value={verification?.document_type} />
              <Row label="Document number" value={verification?.document_number} />
              <Row label="Document country" value={verification?.document_country} />
              <Row label="Submitted" value={verification?.submitted_at ? new Date(verification.submitted_at).toLocaleString() : null} />
              <Row label="Reviewed" value={verification?.reviewed_at ? new Date(verification.reviewed_at).toLocaleString() : null} />
              {verification?.rejection_reason && <Row label="Rejection reason" value={verification.rejection_reason} />}
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
