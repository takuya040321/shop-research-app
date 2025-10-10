/**
 * データベース型定義
 * Supabaseスキーマに基づく型定義
 */

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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_settings: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          provider: string
          settings: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          provider: string
          settings: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          provider?: string
          settings?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      asins: {
        Row: {
          amazon_name: string | null
          amazon_price: number | null
          asin: string
          complaint_count: number | null
          created_at: string | null
          fba_fee: number
          fee_rate: number
          has_amazon: boolean | null
          has_official: boolean | null
          id: string
          image_url: string | null
          is_dangerous: boolean | null
          is_per_carry_ng: boolean | null
          jan_code: string | null
          memo: string | null
          monthly_sales: number | null
          product_url: string | null
          updated_at: string | null
        }
        Insert: {
          amazon_name?: string | null
          amazon_price?: number | null
          asin: string
          complaint_count?: number | null
          created_at?: string | null
          fba_fee?: number
          fee_rate?: number
          has_amazon?: boolean | null
          has_official?: boolean | null
          id?: string
          image_url?: string | null
          is_dangerous?: boolean | null
          is_per_carry_ng?: boolean | null
          jan_code?: string | null
          memo?: string | null
          monthly_sales?: number | null
          product_url?: string | null
          updated_at?: string | null
        }
        Update: {
          amazon_name?: string | null
          amazon_price?: number | null
          asin?: string
          complaint_count?: number | null
          created_at?: string | null
          fba_fee?: number
          fee_rate?: number
          has_amazon?: boolean | null
          has_official?: boolean | null
          id?: string
          image_url?: string | null
          is_dangerous?: boolean | null
          is_per_carry_ng?: boolean | null
          jan_code?: string | null
          memo?: string | null
          monthly_sales?: number | null
          product_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          asin: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_hidden: boolean | null
          memo: string | null
          name: string
          original_product_id: string | null
          price: number | null
          sale_price: number | null
          shop_name: string | null
          shop_type: string | null
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          asin?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean | null
          memo?: string | null
          name: string
          original_product_id?: string | null
          price?: number | null
          sale_price?: number | null
          shop_name?: string | null
          shop_type?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          asin?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean | null
          memo?: string | null
          name?: string
          original_product_id?: string | null
          price?: number | null
          sale_price?: number | null
          shop_name?: string | null
          shop_type?: string | null
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_original_product_id_fkey"
            columns: ["original_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      rakuten_shops: {
        Row: {
          created_at: string
          default_keyword: string | null
          display_name: string
          genre_id: string | null
          id: string
          is_active: boolean
          shop_code: string | null
          shop_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_keyword?: string | null
          display_name: string
          genre_id?: string | null
          id?: string
          is_active?: boolean
          shop_code?: string | null
          shop_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_keyword?: string | null
          display_name?: string
          genre_id?: string | null
          id?: string
          is_active?: boolean
          shop_code?: string | null
          shop_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_discounts: {
        Row: {
          created_at: string | null
          discount_type: string
          discount_value: number
          id: string
          is_enabled: boolean | null
          shop_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_enabled?: boolean | null
          shop_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_enabled?: boolean | null
          shop_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

// 共通型のエクスポート
export type Product = Tables<"products">
export type Asin = Tables<"asins">
export type ShopDiscount = Tables<"shop_discounts">
export type ApiSetting = Tables<"api_settings">

export type ProductInsert = TablesInsert<"products">
export type AsinInsert = TablesInsert<"asins">
export type ShopDiscountInsert = TablesInsert<"shop_discounts">
export type ApiSettingInsert = TablesInsert<"api_settings">

export type ProductUpdate = TablesUpdate<"products">
export type AsinUpdate = TablesUpdate<"asins">
export type ShopDiscountUpdate = TablesUpdate<"shop_discounts">
export type ApiSettingUpdate = TablesUpdate<"api_settings">
