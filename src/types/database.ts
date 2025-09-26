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

// データベーススキーマ型定義
export interface Database {
  public: {
    Tables: {
      shop_categories: {
        Row: {
          id: string
          user_id: string
          type: "official" | "rakuten" | "yahoo"
          name: string
          display_name: string
          parent_type: string | null
          hierarchy_level: number
          sort_order: number
          is_enabled: boolean
          config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: "official" | "rakuten" | "yahoo"
          name: string
          display_name: string
          parent_type?: string | null
          hierarchy_level?: number
          sort_order?: number
          is_enabled?: boolean
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: "official" | "rakuten" | "yahoo"
          name?: string
          display_name?: string
          parent_type?: string | null
          hierarchy_level?: number
          sort_order?: number
          is_enabled?: boolean
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          shop_category_id: string | null
          shop_type: "official" | "rakuten" | "yahoo" | null
          shop_name: string | null
          name: string
          price: number | null
          sale_price: number | null
          image_url: string | null
          source_url: string | null
          is_hidden: boolean
          memo: string | null
          original_product_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shop_category_id?: string | null
          shop_type?: "official" | "rakuten" | "yahoo" | null
          shop_name?: string | null
          name: string
          price?: number | null
          sale_price?: number | null
          image_url?: string | null
          source_url?: string | null
          is_hidden?: boolean
          memo?: string | null
          original_product_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shop_category_id?: string | null
          shop_type?: "official" | "rakuten" | "yahoo" | null
          shop_name?: string | null
          name?: string
          price?: number | null
          sale_price?: number | null
          image_url?: string | null
          source_url?: string | null
          is_hidden?: boolean
          memo?: string | null
          original_product_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      asins: {
        Row: {
          id: string
          user_id: string
          asin: string
          amazon_name: string | null
          amazon_price: number | null
          monthly_sales: number | null
          fee_rate: number | null
          fba_fee: number | null
          jan_code: string | null
          has_amazon: boolean
          has_official: boolean
          complaint_count: number
          is_dangerous: boolean
          is_per_carry_ng: boolean
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          asin: string
          amazon_name?: string | null
          amazon_price?: number | null
          monthly_sales?: number | null
          fee_rate?: number | null
          fba_fee?: number | null
          jan_code?: string | null
          has_amazon?: boolean
          has_official?: boolean
          complaint_count?: number
          is_dangerous?: boolean
          is_per_carry_ng?: boolean
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          asin?: string
          amazon_name?: string | null
          amazon_price?: number | null
          monthly_sales?: number | null
          fee_rate?: number | null
          fba_fee?: number | null
          jan_code?: string | null
          has_amazon?: boolean
          has_official?: boolean
          complaint_count?: number
          is_dangerous?: boolean
          is_per_carry_ng?: boolean
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_asins: {
        Row: {
          id: string
          user_id: string
          product_id: string
          asin_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          asin_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          asin_id?: string
          created_at?: string
        }
      }
      shop_discounts: {
        Row: {
          id: string
          user_id: string
          shop_name: string
          discount_type: "percentage" | "fixed"
          discount_value: number
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shop_name: string
          discount_type: "percentage" | "fixed"
          discount_value: number
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shop_name?: string
          discount_type?: "percentage" | "fixed"
          discount_value?: number
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      api_settings: {
        Row: {
          id: string
          user_id: string
          provider: "rakuten" | "yahoo"
          settings: Json
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: "rakuten" | "yahoo"
          settings: Json
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: "rakuten" | "yahoo"
          settings?: Json
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
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

// 使いやすい型エイリアス
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]

// 具体的な型エイリアス
export type ShopCategory = Tables<"shop_categories">
export type Product = Tables<"products">
export type Asin = Tables<"asins">
export type ProductAsin = Tables<"product_asins">
export type ShopDiscount = Tables<"shop_discounts">
export type ApiSetting = Tables<"api_settings">

export type ShopCategoryInsert = TablesInsert<"shop_categories">
export type ProductInsert = TablesInsert<"products">
export type AsinInsert = TablesInsert<"asins">
export type ProductAsinInsert = TablesInsert<"product_asins">
export type ShopDiscountInsert = TablesInsert<"shop_discounts">
export type ApiSettingInsert = TablesInsert<"api_settings">

export type ShopCategoryUpdate = TablesUpdate<"shop_categories">
export type ProductUpdate = TablesUpdate<"products">
export type AsinUpdate = TablesUpdate<"asins">
export type ProductAsinUpdate = TablesUpdate<"product_asins">
export type ShopDiscountUpdate = TablesUpdate<"shop_discounts">
export type ApiSettingUpdate = TablesUpdate<"api_settings">