import { serve } from "npm:@supabase/functions-js@2/serve";
import { createClient } from "npm:@supabase/supabase-js@2";
import { generateAuthenticationOptions } from "npm:@simplewebauthn/server@10";

const RP_ID = Deno.env.get("WEBAUTHN_RP_ID")!;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const { email } = await req.json();

  const { data: creds } = await supabaseAdmin
    .from("webauthn_credentials")
    .select("credential_id, transports")
    .eq("email", email);

  if (!creds || creds.length === 0) {
    return new Response(JSON.stringify({ error: "No credential on file" }), { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "required",
    allowCredentials: creds.map((c) => ({
      id: c.credential_id,
      transports: c.transports,
    })),
  });

  await supabaseAdmin.from("webauthn_challenges").delete().eq("email", email);
  await supabaseAdmin.from("webauthn_challenges").insert({ email, challenge: options.challenge });

  return new Response(JSON.stringify(options), { headers: { "Content-Type": "application/json" } });
});
