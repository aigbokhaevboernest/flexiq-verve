import { serve } from "npm:@supabase/functions-js@2/serve";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateRegistrationOptions } from "npm:@simplewebauthn/server@10";

const RP_NAME = "Flexiq Verve";
const RP_ID = Deno.env.get("WEBAUTHN_RP_ID")!; // e.g. "flexiqverve.com" (no scheme, no port)

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { email } = await req.json();
  if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("webauthn_credentials")
    .select("credential_id")
    .eq("email", email);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: email,
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((c) => ({ id: c.credential_id })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
      residentKey: "preferred",
    },
  });

  // Wipe any stale challenge for this email, store the new one
  await supabaseAdmin.from("webauthn_challenges").delete().eq("email", email);
  await supabaseAdmin.from("webauthn_challenges").insert({ email, challenge: options.challenge });

  return new Response(JSON.stringify(options), { headers: { "Content-Type": "application/json" } });
});
