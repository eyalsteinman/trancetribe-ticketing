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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_offers: {
        Row: {
          admin_id: string
          created_at: string
          discount_amount: number | null
          discounted_price: number | null
          expires_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          offer_type: Database["public"]["Enums"]["offer_type"]
          original_price: number | null
          party_id: string | null
          production_id: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          discount_amount?: number | null
          discounted_price?: number | null
          expires_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          offer_type: Database["public"]["Enums"]["offer_type"]
          original_price?: number | null
          party_id?: string | null
          production_id?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          discount_amount?: number | null
          discounted_price?: number | null
          expires_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          offer_type?: Database["public"]["Enums"]["offer_type"]
          original_price?: number | null
          party_id?: string | null
          production_id?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_offers_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_offers_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_passwords: {
        Row: {
          admin_email: string
          allowed_tiles: string[] | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_used: boolean | null
          unique_password: string
        }
        Insert: {
          admin_email: string
          allowed_tiles?: string[] | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          unique_password: string
        }
        Update: {
          admin_email?: string
          allowed_tiles?: string[] | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_used?: boolean | null
          unique_password?: string
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          admin_level: Database["public"]["Enums"]["admin_level"]
          allowed_tiles: string[]
          created_at: string
          created_by: string | null
          id: string
          is_super_admin: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_level?: Database["public"]["Enums"]["admin_level"]
          allowed_tiles?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          is_super_admin?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_level?: Database["public"]["Enums"]["admin_level"]
          allowed_tiles?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          is_super_admin?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_tile_state: {
        Row: {
          admin_id: string
          created_at: string
          last_opened_at: string
          tile: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          last_opened_at?: string
          tile: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          last_opened_at?: string
          tile?: string
          updated_at?: string
        }
        Relationships: []
      }
      bar_tab_transactions: {
        Row: {
          amount_spent: number
          bar_tab_id: string
          created_at: string
          created_by: string | null
          id: string
          quantity: number
          transaction_type: string
          user_bar_tab_id: string
        }
        Insert: {
          amount_spent?: number
          bar_tab_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          quantity?: number
          transaction_type?: string
          user_bar_tab_id: string
        }
        Update: {
          amount_spent?: number
          bar_tab_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          quantity?: number
          transaction_type?: string
          user_bar_tab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bar_tab_transactions_bar_tab"
            columns: ["bar_tab_id"]
            isOneToOne: false
            referencedRelation: "bar_tabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bar_tab_transactions_user_bar_tab"
            columns: ["user_bar_tab_id"]
            isOneToOne: false
            referencedRelation: "user_bar_tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_tabs: {
        Row: {
          created_at: string
          created_by: string
          discounted_price: number
          id: string
          is_active: boolean
          item_name: string
          production_id: string
          regular_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          discounted_price?: number
          id?: string
          is_active?: boolean
          item_name: string
          production_id: string
          regular_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          discounted_price?: number
          id?: string
          is_active?: boolean
          item_name?: string
          production_id?: string
          regular_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bar_tabs_production"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_info: {
        Row: {
          address: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          created_by: string
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          created_by: string
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string
          id?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_display_name: string
          friend_first_name: string | null
          friend_last_name: string | null
          friend_personal_code: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_display_name: string
          friend_first_name?: string | null
          friend_last_name?: string | null
          friend_personal_code: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_display_name?: string
          friend_first_name?: string | null
          friend_last_name?: string | null
          friend_personal_code?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_scores: {
        Row: {
          admin_id: string
          created_at: string
          game_type: string
          id: string
          nickname: string
          score: number
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          game_type: string
          id?: string
          nickname: string
          score?: number
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          game_type?: string
          id?: string
          nickname?: string
          score?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          created_by: string
          deleted_by_recipient: boolean
          id: string
          is_read: boolean
          production_id: string | null
          recipient_id: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          deleted_by_recipient?: boolean
          id?: string
          is_read?: boolean
          production_id?: string | null
          recipient_id?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          deleted_by_recipient?: boolean
          id?: string
          is_read?: boolean
          production_id?: string | null
          recipient_id?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_acceptances: {
        Row: {
          accepted_at: string
          id: string
          metadata: Json | null
          offer_id: string
          payment_id: string | null
          qr_code_id: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          metadata?: Json | null
          offer_id: string
          payment_id?: string | null
          qr_code_id?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          metadata?: Json | null
          offer_id?: string
          payment_id?: string | null
          qr_code_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_acceptances_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "admin_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_acceptances_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_acceptances_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          created_at: string
          created_by: string
          date: string
          description: string | null
          end_time: string | null
          id: string
          is_active: boolean
          is_free: boolean
          max_tickets_per_user: number | null
          name: string
          obligatory_socials: string[] | null
          optional_socials: string[] | null
          photo_url: string | null
          price: number | null
          production_id: string | null
          required_socials: string[]
          start_time: string | null
          ticket_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          max_tickets_per_user?: number | null
          name: string
          obligatory_socials?: string[] | null
          optional_socials?: string[] | null
          photo_url?: string | null
          price?: number | null
          production_id?: string | null
          required_socials?: string[]
          start_time?: string | null
          ticket_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean
          is_free?: boolean
          max_tickets_per_user?: number | null
          name?: string
          obligatory_socials?: string[] | null
          optional_socials?: string[] | null
          photo_url?: string | null
          price?: number | null
          production_id?: string | null
          required_socials?: string[]
          start_time?: string | null
          ticket_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parties_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          party_id: string
          quantity: number
          status: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          party_id: string
          quantity?: number
          status: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          party_id?: string
          quantity?: number
          status?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      production_followers: {
        Row: {
          created_at: string
          id: string
          production_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          production_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          production_id?: string
          user_id?: string
        }
        Relationships: []
      }
      productions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          insurance_description: string | null
          insurance_enabled: boolean
          insurance_price: number | null
          logo_url: string | null
          name: string
          updated_at: string
          vip_description: string | null
          vip_price: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          insurance_description?: string | null
          insurance_enabled?: boolean
          insurance_price?: number | null
          logo_url?: string | null
          name: string
          updated_at?: string
          vip_description?: string | null
          vip_price?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          insurance_description?: string | null
          insurance_enabled?: boolean
          insurance_price?: number | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          vip_description?: string | null
          vip_price?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          nickname: string | null
          personal_code: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          nickname?: string | null
          personal_code?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          nickname?: string | null
          personal_code?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_approved: boolean
          code: string
          created_at: string
          id: string
          is_approved: boolean
          is_scanned: boolean
          party_id: string
          scanned_at: string | null
          scanned_by: string | null
          ticket_type_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_approved?: boolean
          code: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_scanned?: boolean
          party_id: string
          scanned_at?: string | null
          scanned_by?: string | null
          ticket_type_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_approved?: boolean
          code?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_scanned?: boolean
          party_id?: string
          scanned_at?: string | null
          scanned_by?: string | null
          ticket_type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          id: string
          label: string
          party_id: string
          price: number
          quantity: number
          sold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          party_id: string
          price?: number
          quantity?: number
          sold?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          party_id?: string
          price?: number
          quantity?: number
          sold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_types_party"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          tribe_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role: string
          tribe_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          tribe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribe_members_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          tribe_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          tribe_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          tribe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribe_messages_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      tribes: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_bar_tabs: {
        Row: {
          barcode: string
          created_at: string
          id: string
          production_id: string
          remaining_amount: number
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode: string
          created_at?: string
          id?: string
          production_id: string
          remaining_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string
          created_at?: string
          id?: string
          production_id?: string
          remaining_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_bar_tabs_production"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
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
      user_socials: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          platform: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: string
          platform: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          platform?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_old_offers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_personal_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_tribe_owner: {
        Args: { _tribe_id: string; _user_id: string }
        Returns: boolean
      }
      lookup_friend_by_personal_code: {
        Args: { _personal_code: string }
        Returns: {
          display_name: string
          first_name: string
          last_name: string
          personal_code: string
          user_id: string
        }[]
      }
      user_tribe_ids: {
        Args: { _user_id: string }
        Returns: {
          tribe_id: string
        }[]
      }
    }
    Enums: {
      admin_level: "level1" | "level2" | "level3"
      app_role: "admin" | "user"
      offer_status: "pending" | "accepted" | "rejected" | "expired"
      offer_type:
        | "free_ticket"
        | "discount_ticket"
        | "vip_offer"
        | "bartab_offer"
        | "insurance_offer"
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
      admin_level: ["level1", "level2", "level3"],
      app_role: ["admin", "user"],
      offer_status: ["pending", "accepted", "rejected", "expired"],
      offer_type: [
        "free_ticket",
        "discount_ticket",
        "vip_offer",
        "bartab_offer",
        "insurance_offer",
      ],
    },
  },
} as const
