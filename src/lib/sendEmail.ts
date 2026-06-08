
import { supabase } from "@/integrations/supabase/client";

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
   const { data, error } = await supabase.functions.invoke("send-email", {
     body: {
       to: params.email,
       first_name: params.first_name,
       subject: params.subject,
       message: params.message || params.html || "",
     },
   });

   if (error) {
     return { success: false, error: error.message };
   }

   return data as SendEmailResult;

 } catch (err) {
   return { success: false, error: (err as Error).message };
 }
}
