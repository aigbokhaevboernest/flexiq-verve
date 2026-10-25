// src/lib/beneficiaries.ts
// Saves (or updates) a beneficiary for the logged-in user. Used by Local, Digital, FX and Wire.
// It never blocks or breaks a transfer: any error is ignored.
import { supabase } from "@/integrations/supabase/client";

export type BeneficiaryKind = "local" | "digital" | "fx" | "wire";

export interface BeneficiaryInput {
  name: string;
  /** Account number, IBAN or wallet handle: whatever identifies the recipient */
  account_number: string;
  routing_number?: string;
  bank_name?: string;
  swift_bic?: string;
  address?: string;
  zip_code?: string;
  country?: string;
  account_type?: string;
  /** Digital payments only, e.g. "PayPal" */
  platform?: string;
}

export async function saveBeneficiary(
  userId: string,
  kind: BeneficiaryKind,
  input: BeneficiaryInput
): Promise<void> {
  const name = input.name?.trim();
  const account = input.account_number?.trim();
  if (!userId || !name || !account) return;

  // Drop empty optional fields so they don't overwrite saved values with blanks
  const clean = Object.fromEntries(
    Object.entries({ ...input, name, account_number: account }).filter(
      ([, v]) => v !== undefined && v !== null && String(v).trim() !== ""
    )
  );

  try {
    await (supabase as any)
      .from("beneficiaries")
      .upsert({ user_id: userId, kind, ...clean }, { onConflict: "user_id,kind,account_number" });
  } catch {
    /* ignore: saving a beneficiary must never stop a transfer */
  }
}
