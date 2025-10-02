/**
 * 商品データ取得・計算ユーティリティ
 */

import { supabase } from "./supabase"
import type { Product, Asin, ShopDiscount, ProductUpdate, AsinUpdate } from "@/types/database"

// 拡張された商品型（ASIN情報と利益計算を含む）
export interface ExtendedProduct extends Product {
  asin?: Asin
  profit_amount?: number
  profit_rate?: number
  roi?: number
  effective_price?: number
}

/**
 * 商品一覧を取得（ASIN情報と利益計算付き）- 最適化版
 */
export async function getProductsWithAsinAndProfits(userId: string): Promise<ExtendedProduct[]> {
  try {
    // JOINを使って1回のクエリで全データを取得
    const { data: productData, error: productsError } = await supabase
      .from("products")
      .select(`
        *,
        product_asins!left (
          asin_id,
          asins!inner (
            id,
            user_id,
            asin,
            amazon_name,
            amazon_price,
            monthly_sales,
            fee_rate,
            fba_fee,
            jan_code,
            has_amazon,
            has_official,
            complaint_count,
            is_dangerous,
            is_per_carry_ng,
            memo,
            created_at,
            updated_at
          )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (productsError) throw productsError
    if (!productData) return []

    // 型アサーション
    const products = productData as unknown as (Product & { product_asins?: Array<{ asins?: Asin }> })[]

    // ショップ割引情報を一括取得
    const shopNames = [...new Set(products.map(p => p.shop_name).filter(Boolean))]
    const { data: discounts } = await supabase
      .from("shop_discounts")
      .select("*")
      .eq("user_id", userId)
      .in("shop_name", shopNames) as { data: ShopDiscount[] | null }

    // ショップ割引のマップを作成
    const discountMap = new Map<string, ShopDiscount>()
    discounts?.forEach(discount => {
      discountMap.set(discount.shop_name, discount)
    })

    // 商品データを変換
    const extendedProducts: ExtendedProduct[] = products.map((product) => {
      const extendedProduct: ExtendedProduct = { ...product }

      // ASIN情報を設定
      if (product.product_asins && product.product_asins.length > 0) {
        const firstAsin = product.product_asins[0]
        if (firstAsin?.asins) {
          extendedProduct.asin = firstAsin.asins
        }
      }

      // 利益計算を実行（最適化版）
      const profitInfo = calculateProfitOptimized(product, extendedProduct.asin ?? null, discountMap)
      extendedProduct.profit_amount = profitInfo.amount
      extendedProduct.profit_rate = profitInfo.rate
      extendedProduct.roi = profitInfo.roi
      extendedProduct.effective_price = profitInfo.effectivePrice

      return extendedProduct
    })

    return extendedProducts
  } catch (error) {
    console.error("商品一覧取得エラー:", error)
    throw error
  }
}

/**
 * 商品に紐付くASIN情報を取得
 */
export async function getProductAsinInfo(productId: string, userId: string): Promise<Asin | null> {
  try {
    const { data: productAsinData, error: productAsinError } = await supabase
      .from("product_asins")
      .select("asin_id")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .single()

    if (productAsinError || !productAsinData) return null

    const { data: asinData, error: asinError } = await supabase
      .from("asins")
      .select("*")
      .eq("id", (productAsinData as { asin_id: string }).asin_id)
      .eq("user_id", userId)
      .single()

    if (asinError || !asinData) return null

    return asinData as Asin
  } catch (error) {
    console.error("ASIN情報取得エラー:", error)
    return null
  }
}

/**
 * 利益計算（最適化版）- ショップ割引マップを使用
 */
function calculateProfitOptimized(
  product: Product,
  asin: Asin | null,
  discountMap: Map<string, ShopDiscount>
): {
  amount: number
  rate: number
  roi: number
  effectivePrice: number
} {
  try {
    // 割引設定を取得
    const discount = product.shop_name ? discountMap.get(product.shop_name) : null

    // 実効価格を計算（割引適用後）
    const basePrice = product.sale_price || product.price || 0
    let effectivePrice = basePrice

    if (discount && discount.is_enabled) {
      if (discount.discount_type === "percentage") {
        effectivePrice = basePrice * (1 - discount.discount_value / 100)
      } else {
        effectivePrice = basePrice - discount.discount_value
      }
    }

    // ASIN情報がない場合は利益計算不可
    if (!asin || !asin.amazon_price) {
      return {
        amount: 0,
        rate: 0,
        roi: 0,
        effectivePrice: Math.round(effectivePrice)
      }
    }

    // Amazon関連費用を計算
    const amazonPrice = asin.amazon_price
    const feeRate = asin.fee_rate || 0
    const fbaFee = asin.fba_fee || 0

    // 手数料計算
    const commissionFee = amazonPrice * (feeRate / 100)
    const totalCost = effectivePrice + fbaFee + commissionFee

    // 利益計算
    const profitAmount = amazonPrice - totalCost
    const profitRate = totalCost > 0 ? (profitAmount / totalCost) * 100 : 0
    const roi = effectivePrice > 0 ? (profitAmount / effectivePrice) * 100 : 0

    return {
      amount: Math.round(profitAmount),
      rate: Math.round(profitRate * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      effectivePrice: Math.round(effectivePrice)
    }
  } catch (error) {
    console.error("利益計算エラー:", error)
    return {
      amount: 0,
      rate: 0,
      roi: 0,
      effectivePrice: product.sale_price || product.price || 0
    }
  }
}

/**
 * 利益計算（レガシー版）- 既存の更新機能との互換性のため残す
 */
export async function calculateProfit(
  product: Product,
  asin: Asin | null,
  userId: string
): Promise<{
  amount: number
  rate: number
  roi: number
  effectivePrice: number
}> {
  try {
    // 割引設定を取得
    const discount = await getShopDiscount(product.shop_name || "", userId)

    // 実効価格を計算（割引適用後）
    const basePrice = product.sale_price || product.price || 0
    let effectivePrice = basePrice

    if (discount && discount.is_enabled) {
      if (discount.discount_type === "percentage") {
        effectivePrice = basePrice * (1 - discount.discount_value / 100)
      } else {
        effectivePrice = basePrice - discount.discount_value
      }
    }

    // ASIN情報がない場合は利益計算不可
    if (!asin || !asin.amazon_price) {
      return {
        amount: 0,
        rate: 0,
        roi: 0,
        effectivePrice
      }
    }

    // Amazon関連費用を計算
    const amazonPrice = asin.amazon_price
    const feeRate = asin.fee_rate || 0
    const fbaFee = asin.fba_fee || 0

    // 手数料計算
    const commissionFee = amazonPrice * (feeRate / 100)
    const totalCost = effectivePrice + fbaFee + commissionFee

    // 利益計算
    const profitAmount = amazonPrice - totalCost
    const profitRate = totalCost > 0 ? (profitAmount / totalCost) * 100 : 0
    const roi = effectivePrice > 0 ? (profitAmount / effectivePrice) * 100 : 0

    return {
      amount: Math.round(profitAmount),
      rate: Math.round(profitRate * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      effectivePrice: Math.round(effectivePrice)
    }
  } catch (error) {
    console.error("利益計算エラー:", error)
    return {
      amount: 0,
      rate: 0,
      roi: 0,
      effectivePrice: product.sale_price || product.price || 0
    }
  }
}

/**
 * ショップ割引設定を取得
 */
async function getShopDiscount(shopName: string, userId: string): Promise<ShopDiscount | null> {
  if (!shopName) return null

  try {
    const { data, error } = await supabase
      .from("shop_discounts")
      .select("*")
      .eq("shop_name", shopName)
      .eq("user_id", userId)
      .single()

    if (error) return null
    return data
  } catch (error) {
    console.error("ショップ割引設定取得エラー:", error)
    return null
  }
}

/**
 * 商品情報を更新
 */
export async function updateProduct(
  productId: string,
  updates: ProductUpdate,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("products")
      .update(updates as never)
      .eq("id", productId)
      .eq("user_id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("商品更新エラー:", error)
    return false
  }
}

/**
 * ASIN情報を更新
 */
export async function updateAsin(
  asinId: string,
  updates: AsinUpdate,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("asins")
      .update(updates as never)
      .eq("id", asinId)
      .eq("user_id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("ASIN更新エラー:", error)
    return false
  }
}

/**
 * 商品を削除
 */
export async function deleteProduct(productId: string, userId: string): Promise<boolean> {
  try {
    // 関連するproduct_asinも削除
    await supabase
      .from("product_asins")
      .delete()
      .eq("product_id", productId)
      .eq("user_id", userId)

    // 商品を削除
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("user_id", userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error("商品削除エラー:", error)
    return false
  }
}

/**
 * 商品をコピー
 */
export async function copyProduct(productId: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/products/copy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        userId
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "商品のコピーに失敗しました")
    }

    return result.success
  } catch (error) {
    console.error("商品コピーエラー:", error)
    return false
  }
}

/**
 * 価格をフォーマット
 */
export function formatPrice(price: number | null | undefined): string {
  if (!price) return "¥0"
  return `¥${price.toLocaleString()}`
}

/**
 * パーセンテージをフォーマット
 */
export function formatPercentage(value: number | null | undefined): string {
  if (!value) return "0%"
  return `${value}%`
}