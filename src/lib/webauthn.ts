// Thin wrapper around the browser's WebAuthn API for platform
// authenticators (Touch ID, Face ID, Windows Hello, Android fingerprint).
//
// Demo-grade note: a real production setup verifies the signed
// assertion on the server using the stored public key (e.g. with
// @simplewebauthn/server). This version stores the credential ID and
// trusts the browser's own success/failure result on login — the
// browser + OS still do the actual biometric check, but there's no
// server-side cryptographic proof. Good enough for a demo, not for
// production auth.

function bufferToBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) return false;
  return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
}

/**
 * Registers a new fingerprint/Face ID/Windows Hello credential for
 * this email. Returns the credential ID to store (base64url string).
 */
export async function registerBiometric(email: string): Promise<string> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Nimbus Demo" },
      user: {
        id: userId,
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("No credential returned.");
  return bufferToBase64url(credential.rawId);
}

/**
 * Prompts the platform authenticator to verify the user against the
 * given stored credential ID. Resolves if verification succeeded,
 * throws otherwise.
 */
export async function verifyBiometric(storedCredentialId: string): Promise<void> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [
        {
          id: base64urlToBuffer(storedCredentialId),
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60000,
    },
  });

  if (!assertion) throw new Error("Verification failed.");
}
