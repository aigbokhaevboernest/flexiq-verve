import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RECAPTCHA_SECRET_KEY = Deno.env.get("RECAPTCHA_SECRET_KEY");
    if (!RECAPTCHA_SECRET_KEY) {
      return json({ error: "Server misconfigured: missing reCAPTCHA secret" }, 500);
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return json({ error: "Missing token" }, 400);
    }

    const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const result = await verifyRes.json();

    // v2 checkbox result shape: { success, challenge_ts, hostname, "error-codes"? }
    // (No "action" or "score" — those are v3-only fields. Do not check them
    // here, or every valid solve will be rejected.)
    if (!result.success) {
      return json({ success: false, error: "Verification failed", details: result["error-codes"] }, 200);
    }

    return json({ success: true }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
