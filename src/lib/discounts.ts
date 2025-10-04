/**
 * 割引設定ユーティリティ
 */

import { supabase } from "./supabase"
import type { DiscountSetting, DiscountSettingCreate, DiscountSettingUpdate } from "@/types/discount"
import type { ShopDiscount } from "@/types/database"

/**
 * 全ての割引設定を取得
 */
export async function getAllDiscounts(): Promise<DiscountSetting[]> {
  try {
    const { data, error } = await supabase
      .from("shop_discounts")
      .select("*")
      .order("shop_name", { ascending: true })

    if (error) {
      console.error("割引設定取得エラー:", error)
      return []
    }

    return (data as ShopDiscount[]).map(mapToDiscountSetting)
  } catch (error) {
    console.error("割引設定取得エラー:", error)
    return []
  }
}

/**
 * ショップ名で割引設定を取得
 */
export async function getDiscountByShop(
  shopName: string
): Promise<DiscountSetting | null> {
  try {
    const { data, error } = await supabase
      .from("shop_discounts")
      .select("*")
      .eq("shop_name", shopName)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // データが見つからない場合はnullを返す
        return null
      }
      console.error("割引設定取得エラー:", error)
      return null
    }

    return mapToDiscountSetting(data as ShopDiscount)
  } catch (error) {
    console.error("割引設定取得エラー:", error)
    return null
  }
}

/**
 * 割引設定を作成
 */
export async function createDiscount(
  discount: DiscountSettingCreate
): Promise<DiscountSetting | null> {
  try {
    const { data, error } = await supabase
      .from("shop_discounts")
      .insert({
        shop_name: discount.shopName,
        discount_type: discount.discountType,
        discount_value: discount.discountValue,
        is_enabled: discount.isEnabled ?? true
      } as never)
      .select()
      .single()

    if (error) {
      console.error("割引設定作成エラー:", error)
      return null
    }

    return mapToDiscountSetting(data as ShopDiscount)
  } catch (error) {
    console.error("割引設定作成エラー:", error)
    return null
  }
}

/**
 * 割引設定を更新
 */
export async function updateDiscount(
  shopName: string,
  updates: DiscountSettingUpdate
): Promise<DiscountSetting | null> {
  try {
    const updateData: {
      discount_type?: "percentage" | "fixed"
      discount_value?: number
      is_enabled?: boolean
    } = {}

    if (updates.discountType !== undefined) {
      updateData.discount_type = updates.discountType
    }
    if (updates.discountValue !== undefined) {
      updateData.discount_value = updates.discountValue
    }
    if (updates.isEnabled !== undefined) {
      updateData.is_enabled = updates.isEnabled
    }

    const { data, error } = await supabase
      .from("shop_discounts")
      .update(updateData as never)
      .eq("shop_name", shopName)
      .select()
      .single()

    if (error) {
      console.error("割引設定更新エラー:", error)
      return null
    }

    return mapToDiscountSetting(data as ShopDiscount)
  } catch (error) {
    console.error("割引設定更新エラー:", error)
    return null
  }
}

/**
 * 割引設定を削除
 */
export async function deleteDiscount(shopName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("shop_discounts")
      .delete()
      .eq("shop_name", shopName)

    if (error) {
      console.error("割引設定削除エラー:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("割引設定削除エラー:", error)
    return false
  }
}

/**
 * 割引設定を有効/無効に切り替え
 */
export async function toggleDiscountEnabled(
  shopName: string,
  isEnabled: boolean
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("shop_discounts")
      .update({ is_enabled: isEnabled } as never)
      .eq("shop_name", shopName)

    if (error) {
      console.error("割引設定切り替えエラー:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("割引設定切り替えエラー:", error)
    return false
  }
}

/**
 * データベース型をアプリケーション型にマッピング
 */
function mapToDiscountSetting(data: ShopDiscount): DiscountSetting {
  return {
    id: data.id,
    shopName: data.shop_name,
    discountType: data.discount_type,
    discountValue: data.discount_value,
    isEnabled: data.is_enabled,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}
