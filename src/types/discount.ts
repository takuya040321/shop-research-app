/**
 * 割引設定の型定義
 */

import { z } from "zod"

// 割引タイプ
export type DiscountType = "percentage" | "fixed"

// 割引設定
export interface DiscountSetting {
  id: string
  userId: string
  shopName: string
  discountType: DiscountType
  discountValue: number
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

// 割引設定作成用
export interface DiscountSettingCreate {
  shopName: string
  discountType: DiscountType
  discountValue: number
  isEnabled?: boolean
}

// 割引設定更新用
export interface DiscountSettingUpdate {
  discountType?: DiscountType
  discountValue?: number
  isEnabled?: boolean
}

// バリデーションスキーマ
export const discountSettingSchema = z.object({
  shopName: z.string().min(1, "ショップ名を入力してください"),
  discountType: z.enum(["percentage", "fixed"], {
    errorMap: () => ({ message: "割引タイプを選択してください" })
  }),
  discountValue: z.number()
    .min(0, "割引値は0以上である必要があります")
    .refine((val) => val >= 0, {
      message: "割引値は0以上である必要があります"
    }),
  isEnabled: z.boolean().optional()
})

export const discountSettingUpdateSchema = z.object({
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().min(0).optional(),
  isEnabled: z.boolean().optional()
})

// バリデーション関数
export function validateDiscountValue(type: DiscountType, value: number): boolean {
  if (value < 0) return false
  if (type === "percentage" && value > 100) return false
  return true
}

// 割引計算
export function calculateDiscount(
  price: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (discountType === "percentage") {
    return price * (discountValue / 100)
  }
  return discountValue
}

// 割引適用後の価格計算
export function applyDiscount(
  price: number,
  discountType: DiscountType,
  discountValue: number
): number {
  const discount = calculateDiscount(price, discountType, discountValue)
  return Math.max(0, price - discount)
}
