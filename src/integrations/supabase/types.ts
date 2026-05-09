export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string
          balance: number
          created_at: string
          currency: string
          frozen: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          balance?: number
          created_at?: string
          currency?: string
          frozen?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          balance?: number
          created_at?: string
          currency?: string
          frozen?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          id: string
          ip_address: string | null
          payload: Json
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          payload?: Json
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          payload?: Json
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          cot_enabled: boolean
          created_at: string
          id: string
          imf_enabled: boolean
          itc_enabled: boolean
          receive_enabled: boolean
          tax_enabled: boolean
          updated_at: string
          wallet_address: string
          wallet_crypto: string
        }
        Insert: {
          cot_enabled?: boolean
          created_at?: string
          id?: string
          imf_enabled?: boolean
          itc_enabled?: boolean
          receive_enabled?: boolean
          tax_enabled?: boolean
          updated_at?: string
          wallet_address?: string
          wallet_crypto?: string
        }
        Update: {
          cot_enabled?: boolean
          created_at?: string
          id?: string
          imf_enabled?: boolean
          itc_enabled?: boolean
          receive_enabled?: boolean
          tax_enabled?: boolean
          updated_at?: string
          wallet_address?: string
          wallet_crypto?: string
        }
        Relationships: []
      }
      auth_codes: {
        Row: {
          code: string
          code_type: string
          created_at: string
          expires_at: string | null
          id: string
          loan_id: string | null
          note: string | null
          transaction_id: string | null
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          code_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          loan_id?: string | null
          note?: string | null
          transaction_id?: string | null
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          code_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          loan_id?: string | null
          note?: string | null
          transaction_id?: string | null
          used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_codes_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_codes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      beneficiaries: {
        Row: {
          account_number: string
          bank_name: string | null
          country: string | null
          created_at: string
          currency: string | null
          id: string
          name: string
          swift_code: string | null
          user_id: string
        }
        Insert: {
          account_number: string
          bank_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          name: string
          swift_code?: string | null
          user_id: string
        }
        Update: {
          account_number?: string
          bank_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          name?: string
          swift_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          atm_enabled: boolean
          brand: string
          card_number: string
          card_type: string
          cardholder_name: string
          created_at: string
          cvv: string
          expires_at: string
          frozen: boolean
          id: string
          monthly_limit: number
          online_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          atm_enabled?: boolean
          brand?: string
          card_number: string
          card_type?: string
          cardholder_name: string
          created_at?: string
          cvv: string
          expires_at: string
          frozen?: boolean
          id?: string
          monthly_limit?: number
          online_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          atm_enabled?: boolean
          brand?: string
          card_number?: string
          card_type?: string
          cardholder_name?: string
          created_at?: string
          cvv?: string
          expires_at?: string
          frozen?: boolean
          id?: string
          monthly_limit?: number
          online_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          amount: number
          created_at: string
          crypto: string
          id: string
          proof_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          crypto: string
          id?: string
          proof_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          crypto?: string
          id?: string
          proof_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      fx_rates: {
        Row: {
          base_currency: string
          id: string
          quote_currency: string
          rate: number
          updated_at: string
        }
        Insert: {
          base_currency?: string
          id?: string
          quote_currency: string
          rate: number
          updated_at?: string
        }
        Update: {
          base_currency?: string
          id?: string
          quote_currency?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      id_verifications: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          approved_at: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          document_country: string | null
          document_expires: string | null
          document_number: string | null
          document_state: string | null
          document_type: string | null
          id: string
          id_back_path: string | null
          id_front_path: string | null
          legal_first_name: string | null
          legal_last_name: string | null
          legal_middle_name: string | null
          phone: string | null
          postal_code: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewer_notes: string | null
          selfie_path: string | null
          ssn_last4: string | null
          state_region: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          approved_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          document_country?: string | null
          document_expires?: string | null
          document_number?: string | null
          document_state?: string | null
          document_type?: string | null
          id?: string
          id_back_path?: string | null
          id_front_path?: string | null
          legal_first_name?: string | null
          legal_last_name?: string | null
          legal_middle_name?: string | null
          phone?: string | null
          postal_code?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          selfie_path?: string | null
          ssn_last4?: string | null
          state_region?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          approved_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          document_country?: string | null
          document_expires?: string | null
          document_number?: string | null
          document_state?: string | null
          document_type?: string | null
          id?: string
          id_back_path?: string | null
          id_front_path?: string | null
          legal_first_name?: string | null
          legal_last_name?: string | null
          legal_middle_name?: string | null
          phone?: string | null
          postal_code?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_notes?: string | null
          selfie_path?: string | null
          ssn_last4?: string | null
          state_region?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          amount: number
          approved_at: string | null
          created_at: string
          currency: string
          disbursed_at: string | null
          id: string
          interest_rate: number
          purpose: string | null
          rejection_reason: string | null
          status: string
          term_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          disbursed_at?: string | null
          id?: string
          interest_rate?: number
          purpose?: string | null
          rejection_reason?: string | null
          status?: string
          term_months: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          created_at?: string
          currency?: string
          disbursed_at?: string | null
          id?: string
          interest_rate?: number
          purpose?: string | null
          rejection_reason?: string | null
          status?: string
          term_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          pin_hash: string | null
          postal_code: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          account_type?: string | null
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          pin_hash?: string | null
          postal_code?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_type?: string | null
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          pin_hash?: string | null
          postal_code?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          last_message_at: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          last_message_at?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          converted_amount: number | null
          converted_currency: string | null
          created_at: string
          currency: string
          description: string | null
          fx_rate: number | null
          id: string
          metadata: Json | null
          recipient_account: string | null
          recipient_bank: string | null
          recipient_country: string | null
          recipient_name: string | null
          reference: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          converted_amount?: number | null
          converted_currency?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fx_rate?: number | null
          id?: string
          metadata?: Json | null
          recipient_account?: string | null
          recipient_bank?: string | null
          recipient_country?: string | null
          recipient_name?: string | null
          reference?: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          converted_amount?: number | null
          converted_currency?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          fx_rate?: number | null
          id?: string
          metadata?: Json | null
          recipient_account?: string | null
          recipient_bank?: string | null
          recipient_country?: string | null
          recipient_name?: string | null
          reference?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_email_by_username: { Args: { _username: string }; Returns: string }
      get_pin_hash: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_pin_hash: {
        Args: { _hash: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
