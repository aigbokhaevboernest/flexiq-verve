import { serve } from "npm:@supabase/functions-js@2/serve";
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyAuthenticationResponse } from "npm:@simplewebauthn/server@10";

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID")!;
const ORIGIN = Deno.env.get("WEBAUTHN_ORIGIN")!;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const supabaseAnon = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

serve(async (req) => {
  const { email, assertionResponse } = await req.json();

  const { data: challengeRow } = await supabaseAdmin
    .from("webauthn_challenges")
    .select("challenge, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challengeRow || Date.now() - new Date(challengeRow.created_at).getTime() > 5 * 60 * 1000) {
    return new Response(JSON.stringify({ error: "Challenge missing or expired" }), { status: 400 });
  }

  const { data: cred } = await supabaseAdmin
    .from("webauthn_credentials")
    .select("*")
    .eq("email", email)
    .eq("credential_id", assertionResponse.id)
    .maybeSingle();

  if (!cred) {
    return new Response(JSON.stringify({ error: "Unknown credential" }), { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: cred.credential_id,
        publicKey: Uint8Array.from(atob(cred.public_key), (c) => c.charCodeAt(0)),
        counter: cred.counter,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Verification failed", detail: String(err) }), { status: 400 });
  }

  if (!verification.verified) {
    return new Response(JSON.stringify({ error: "Signature invalid" }), { status: 401 });
  }

  // Reject replayed/cloned authenticators
  if (verification.authenticationInfo.newCounter <= cred.counter && cred.counter !== 0) {
    return new Response(JSON.stringify({ error: "Possible cloned device detected" }), { status: 401 });
  }

  await supabaseAdmin
    .from("webauthn_credentials")
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq("credential_id", cred.credential_id);

  await supabaseAdmin.from("webauthn_challenges").delete().eq("email", email);

  // Signature is cryptographically proven — now mint a real session for this user
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !linkData?.properties?.hashed_token) {
    return new Response(JSON.stringify({ error: "Could not create session" }), { status: 500 });
  }

  const { data: sessionData, error: sessionError } = await supabaseAnon.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (sessionError || !sessionData.session) {
    return new Response(JSON.stringify({ error: "Could not establish session" }), { status: 500 });
  }

  return new Response(JSON.stringify({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  }), { headers: { "Content-Type": "application/json" } });
});
