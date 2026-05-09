import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  id: string;
  receive_enabled: boolean;
  wallet_address: string;
  wallet_crypto: string;
  cot_enabled: boolean;
  tax_enabled: boolean;
  itc_enabled: boolean;
  imf_enabled: boolean;
}

export const useAppSettings = () => {
  return useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("app_settings")
        .select("*")
        .eq("id", "global")
        .maybeSingle();
      if (error) throw error;
      return (data as AppSettings) || {
        id: "global",
        receive_enabled: true,
        wallet_address: "",
        wallet_crypto: "BTC",
        cot_enabled: true,
        tax_enabled: false,
        itc_enabled: false,
        imf_enabled: false,
      };
    },
    staleTime: 30_000,
  });
};
