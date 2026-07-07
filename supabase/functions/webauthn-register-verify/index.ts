import { serve } from "npm:@supabase/functions-js@2/serve";
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyRegistrationResponse } from "npm:@simplewebauthn/server@10";

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID")!;
const ORIGIN = Deno.env.get("WEBAUTHN_ORIGIN")!; // e.g. "https://flexiqverve.com"

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { email, attestationResponse } = await req.json();

  const { data: challengeRow } = await supabaseAdmin
    .from("webauthn_challenges")
    .select("challenge, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challengeRow) {
    return new Response(JSON.stringify({ error: "No pending challenge. Restart enrollment." }), { status: 400 });
  }
  // Challenges expire after 5 minutes
  if (Date.now() - new Date(challengeRow.created_at).getTime() > 5 * 60 * 1000) {
    return new Response(JSON.stringify({ error: "Challenge expired. Restart enrollment." }), { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Verification failed", detail: String(err) }), { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return new Response(JSON.stringify({ error: "Registration not verified" }), { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await supabaseAdmin.from("webauthn_credentials").upsert({
    email,
    credential_id: credential.id,
    public_key: btoa(String.fromCharCode(...credential.publicKey)),
    counter: credential.counter,
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    transports: attestationResponse.response.transports ?? [],
  }, { onConflict: "credential_id" });

  await supabaseAdmin.from("webauthn_challenges").delete().eq("email", email);

  return new Response(JSON.stringify({ verified: true }), { headers: { "Content-Type": "application/json" } });
});
