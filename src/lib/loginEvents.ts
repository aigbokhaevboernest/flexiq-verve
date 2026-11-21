import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/lib/sendEmail";

const DEVICE_KEY = "flexiq_device_id";

// Logins from these countries are skipped entirely — not recorded, no email.
const SKIP_COUNTRY_CODES = ["NG"];
const SKIP_COUNTRY_NAMES = ["nigeria"];

// Stable per-browser ID. Clearing site data makes the browser look like a new device.
const getDeviceId = (): string => {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
};

const parseUserAgent = (ua: string) => {
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\//.test(ua) ? "Opera" :
    /Firefox\//.test(ua) ? "Firefox" :
    /(Chrome|CriOS)\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" : "Unknown";

  const os =
    /Windows/.test(ua) ? "Windows" :
    /(iPhone|iPad|iPod)/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" : "Unknown";

  return { browser, os };
};

const getGeo = async () => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = await res.json();
    return {
      ip: (j.ip as string) ?? null,
      city: (j.city as string) ?? null,
      region: (j.region as string) ?? null,
      country: (j.country_name as string) ?? null,
      countryCode: (j.country_code as string) ?? (j.country as string) ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
};

const isSkippedCountry = (
  geo: { country: string | null; countryCode: string | null } | null
): boolean => {
  if (!geo) return false;
  const code = (geo.countryCode ?? "").trim().toUpperCase();
  const name = (geo.country ?? "").trim().toLowerCase();
  return SKIP_COUNTRY_CODES.includes(code) || SKIP_COUNTRY_NAMES.includes(name);
};

/**
 * Call right after a successful sign-in. Never throws and never blocks login.
 * Records the login; if it is from a new device and/or new location, it also
 * emails the user automatically (the admin sees it in History either way).
 * Logins from Nigeria are skipped entirely: nothing is recorded, no email sent.
 */
export const recordLoginEvent = async () => {
  try {
    const ua = navigator.userAgent;
    const { browser, os } = parseUserAgent(ua);
    const geo = await getGeo();

    // Nigeria: skip recording and emailing altogether
    if (isSkippedCountry(geo)) return;

    const { data, error } = await (supabase as any).rpc("record_login_event", {
      _device_id: getDeviceId(),
      _ip: geo?.ip ?? null,
      _city: geo?.city ?? null,
      _region: geo?.region ?? null,
      _country: geo?.country ?? null,
      _user_agent: ua,
      _browser: browser,
      _os: os,
    });

    if (error) {
      console.error("Login event failed:", error.message);
      return;
    }
    if (!data?.id || !(data.new_device || data.new_location)) return;

    // Flagged: email the user automatically
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user?.email) return;

    const place = [geo?.city, geo?.region, geo?.country].filter(Boolean).join(", ") || "Unknown location";

    const res = await sendEmail({
      email: user.email,
      first_name: (user.user_metadata as any)?.first_name ?? "",
      subject: "New Login to Your Account — Flexiq Verve",
      message:
`We noticed a new sign-in to your Flexiq Verve account.<br/><br/>
<strong>Time:</strong> ${new Date().toLocaleString()}<br/>
<strong>Device:</strong> ${browser} on ${os}<br/>
<strong>Location:</strong> ${place}<br/>
<strong>IP address:</strong> ${geo?.ip || "Unknown"}<br/><br/>
If this was you, no action is needed. If you do not recognize this activity, please contact <a href="mailto:support@flexiqverve.com" style="color:#2563eb;">support@flexiqverve.com</a> immediately or use the Live Chat on your dashboard, and change your password.`,
    });

    if (res?.success) {
      await (supabase as any).rpc("mark_login_email_sent", { _id: data.id });
    }
  } catch (e) {
    console.error("Login event failed:", e);
  }
};
