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
      products: {
        Row: {
          id: string
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
          asin: string
          amazon_name: string | null
          amazon_price: number | null  // 整数型
          monthly_sales: number | null  // 整数型
          fee_rate: number  // 整数型（NOT NULL、デフォルト15）
          fba_fee: number  // 整数型（NOT NULL、デフォルト0）
          jan_code: string | null
          image_url: string | null
          product_url: string | null
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
          asin: string
          amazon_name?: string | null
          amazon_price?: number | null  // 整数型
          monthly_sales?: number | null  // 整数型
          fee_rate?: number  // 整数型（デフォルト15）
          fba_fee?: number  // 整数型（デフォルト0）
          jan_code?: string | null
          image_url?: string | null
          product_url?: string | null
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
          asin?: string
          amazon_name?: string | null
          amazon_price?: number | null  // 整数型
          monthly_sales?: number | null  // 整数型
          fee_rate?: number  // 整数型
          fba_fee?: number  // 整数型
          jan_code?: string | null
          image_url?: string | null
          product_url?: string | null
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
          product_id: string
          asin_id: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          asin_id: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          asin_id?: string
          created_at?: string
        }
      }
      shop_discounts: {
        Row: {
          id: string
          shop_name: string
          discount_type: "percentage" | "fixed"
          discount_value: number
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_name: string
          discount_type: "percentage" | "fixed"
          discount_value: number
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
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
          provider: "rakuten" | "yahoo"
          settings: Json
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider: "rakuten" | "yahoo"
          settings: Json
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
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
export type Product = Tables<"products">
export type Asin = Tables<"asins">
export type ProductAsin = Tables<"product_asins">
export type ShopDiscount = Tables<"shop_discounts">
export type ApiSetting = Tables<"api_settings">

export type ProductInsert = TablesInsert<"products">
export type AsinInsert = TablesInsert<"asins">
export type ProductAsinInsert = TablesInsert<"product_asins">
export type ShopDiscountInsert = TablesInsert<"shop_discounts">
export type ApiSettingInsert = TablesInsert<"api_settings">

export type ProductUpdate = TablesUpdate<"products">
export type AsinUpdate = TablesUpdate<"asins">
export type ProductAsinUpdate = TablesUpdate<"product_asins">
export type ShopDiscountUpdate = TablesUpdate<"shop_discounts">
export type ApiSettingUpdate = TablesUpdate<"api_settings">