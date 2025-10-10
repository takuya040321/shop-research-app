/**
 * 割引設定管理用カスタムフック
 */

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { DiscountType } from "@/types/discount"
import type { Database } from "@/types/database"

interface UseDiscountSettingsOptions {
  shopName: string
}

export function useDiscountSettings({ shopName }: UseDiscountSettingsOptions) {
  const [discountType, setDiscountType] = useState<DiscountType>("percentage")
  const [discountValue, setDiscountValue] = useState<string>("0")
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 既存の割引設定を読み込み
  useEffect(() => {
    const loadDiscount = async () => {
      setIsLoading(true)
      try {
        const { data } = await supabase
          .from("shop_discounts")
          .select()
          .eq("shop_name", shopName)
          .maybeSingle<Database["public"]["Tables"]["shop_discounts"]["Row"]>()

        if (data) {
          setDiscountType(data.discount_type as "percentage" | "fixed")
          setDiscountValue(String(data.discount_value))
          setIsDiscountEnabled(data.is_enabled ?? false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDiscount()
  }, [shopName])

  // 割引設定を保存
  const saveDiscount = async () => {
    setIsSaving(true)

    try {
      const { data: existing } = await supabase
        .from("shop_discounts")
        .select()
        .eq("shop_name", shopName)
        .maybeSingle<Database["public"]["Tables"]["shop_discounts"]["Row"]>()

      const updateData = {
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        is_enabled: isDiscountEnabled
      }

      const insertData = {
        shop_name: shopName,
        ...updateData
      }

      if (existing) {
        await supabase
          .from("shop_discounts")
          .update(updateData as never)
          .eq("shop_name", shopName)
      } else {
        await supabase
          .from("shop_discounts")
          .insert(insertData as never)
      }

      return { success: true }
    } catch (error) {
      console.error("割引設定の保存に失敗:", error)
      return { success: false, error }
    } finally {
      setIsSaving(false)
    }
  }

  return {
    // State
    discountType,
    discountValue,
    isDiscountEnabled,
    isSaving,
    isLoading,

    // Actions
    setDiscountType,
    setDiscountValue,
    setIsDiscountEnabled,
    saveDiscount
  }
}
