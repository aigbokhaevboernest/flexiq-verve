import { supabase } from "@/integrations/supabase/client";

const DEVICE_KEY = "flexiq_device_id";

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
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
};

/** Call right after a successful sign-in. Never throws and never blocks login. */
export const recordLoginEvent = async () => {
  try {
    const ua = navigator.userAgent;
    const { browser, os } = parseUserAgent(ua);
    const geo = await getGeo();

    await (supabase as any).rpc("record_login_event", {
      _device_id: getDeviceId(),
      _ip: geo?.ip ?? null,
      _city: geo?.city ?? null,
      _region: geo?.region ?? null,
      _country: geo?.country ?? null,
      _user_agent: ua,
      _browser: browser,
      _os: os,
    });
  } catch (e) {
    console.error("Login event failed:", e);
  }
};
