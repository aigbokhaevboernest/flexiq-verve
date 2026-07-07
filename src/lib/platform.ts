export function isIOS(): boolean {
  const ua = navigator.userAgent;
  // Covers iPhone/iPad/iPod, and iPadOS 13+ which reports as "Mac" with touch support.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

export type BiometricLabel = "Face ID" | "fingerprint" | "biometric login";

export function getBiometricLabel(): BiometricLabel {
  if (isIOS()) return "Face ID";
  if (isAndroid()) return "fingerprint";
  return "biometric login";
}
