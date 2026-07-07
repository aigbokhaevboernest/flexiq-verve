import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callFn(name: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data;
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

export async function hasBiometricCredential(email: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_webauthn_credential", { _email: email });
  return !!data;
}

/** Enrolls this device's Face ID / fingerprint for the given email. */
export async function registerBiometric(email: string): Promise<void> {
  const options = await callFn("webauthn-register-options", { email });
  const attestationResponse = await startRegistration({ optionsJSON: options });
  await callFn("webauthn-register-verify", { email, attestationResponse });
}

/** Verifies biometrics and returns a real Supabase session. */
export async function loginWithBiometric(email: string): Promise<{ access_token: string; refresh_token: string }> {
  const options = await callFn("webauthn-login-options", { email });
  const assertionResponse = await startAuthentication({ optionsJSON: options });
  return callFn("webauthn-login-verify", { email, assertionResponse });
}
