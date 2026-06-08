import { supabase } from "@/integrations/supabase/client";

const ENDPOINT = "https://nzideivdechbxhepmlvz.supabase.co/functions/v1/send-email";

export interface SendEmailParams {
  email: string | string[];
  first_name: string;
  subject: string;
  html?: string;
  message?: string;
}

export interface SendEmailResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    if (!params.email) return { success: false, error: "No recipient email" };

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        to: params.email,
        first_name: params.first_name ?? "",
        subject: params.subject,
        message: params.message || params.html || "",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `HTTP ${res.status}: ${text || res.statusText}` };
    }

    const data = await res.json().catch(() => null);
    return { success: true, data };

  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
