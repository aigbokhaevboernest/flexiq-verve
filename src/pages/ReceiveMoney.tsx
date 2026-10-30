import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";
import DepositFlow, { DepositSubmit } from "@/components/DepositFlow";

const ADMIN_NOTIFY_EMAIL = "support@flexiqverve.com";

const ReceiveMoney = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Per-user deposit access. null = still checking. Off unless the admin
  // turned it on for this specific user (profiles.receive_enabled).
  const [userEnabled, setUserEnabled] = useState<boolean | null>(null);
  const [cur, setCur] = useState("USD");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("receive_enabled,currency")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.currency) setCur(String(data.currency).toUpperCase());
      // Any error or missing value means off.
      setUserEnabled(error ? false : !!data?.receive_enabled);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (userEnabled === null)
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-72 w-full rounded-3xl" />
      </div>
    );

  if (!userEnabled) {
    return (
      <Dialog open onOpenChange={() => navigate("/dashboard")}>
        <DialogContent className="font-sans sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Feature unavailable</DialogTitle>
            <DialogDescription>This feature is currently unavailable. Please check back later.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate("/dashboard")}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSubmit = async ({ crypto, methodName, amount, proofUrl }: DepositSubmit): Promise<string | null> => {
    if (!user) return "You are not signed in.";

    const { error } = await (supabase as any).from("deposit_requests").insert({
      user_id: user.id,
      crypto, // "BANK" for bank transfers
      amount,
      proof_url: proofUrl,
      status: "pending",
    });
    if (error) return error.message;

    try {
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("first_name,last_name,email")
        .eq("id", user.id)
        .maybeSingle();
      const fn = prof?.first_name || "";
      const ln = prof?.last_name || "";
      const em = prof?.email || user.email || "";
      if (em) {
        await sendEmail({
          email: em,
          first_name: fn,
          subject: "Deposit Request Submitted — Flexiq Verve",
          message: `This is to inform you that your deposit request of ${cur} ${amount} via ${methodName} has been successfully submitted and is pending review.

You will receive a notification once your deposit has been confirmed.

For more information or complaints, please contact support@flexiqverve.com or make use of the Live Chat on your dashboard for assistance.

Kind Regards,
Flexiq Verve Support Team`,
        });
      }
      // Admin notification (best-effort, never blocks the user flow)
      try {
        await sendEmail({
          email: ADMIN_NOTIFY_EMAIL,
          first_name: "Admin",
          subject: "New Deposit Request — Flexiq Verve",
          message: `${fn} ${ln} has submitted a deposit request of ${cur} ${amount} via ${methodName} and it is pending review.

Please verify if the deposit was actually received and log in to the admin dashboard to either approve or decline.`,
        });
      } catch {}
    } catch {}

    navigate("/dashboard/success", {
      state: {
        title: "Deposit submitted",
        message: "Upon confirmation of your payment, we will promptly process your service request.",
        details: [
          { label: "Method", value: methodName },
          { label: "Amount", value: `${cur} ${amount}` },
          { label: "Status", value: "Pending review" },
        ],
      },
    });
    return null;
  };

  return (
    <DepositFlow
      title="Add funds"
      currency={cur}
      fundTarget="account"
      onExit={() => navigate("/dashboard")}
      onSubmit={handleSubmit}
    />
  );
};

export default ReceiveMoney;
