/**
 * 商品データ取得・計算ユーティリティ
 */

import { supabase } from "./supabase"
import type { Product, Asin, ShopDiscount, ProductUpdate, AsinUpdate } from "@/types/database"

// 拡張された商品型（ASIN情報と利益計算を含む）
export interface ExtendedProduct extends Omit<Product, "asin"> {
  asin?: Asin | null
  profit_amount?: number
  profit_rate?: number
  roi?: number
  effective_price?: number
}

/**
 * 商品一覧を取得（ASIN情報と利益計算付き）- 最適化版
 */
export async function getProductsWithAsinAndProfits(): Promise<ExtendedProduct[]> {
  try {
    // 商品データを取得
    const { data: productData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })

    if (productsError) throw productsError
    if (!productData) return []

    const products = productData as Product[]

    // ASINコードを収集（products.asinから）
    const asinCodes = new Set<string>()
    products.forEach(p => {
      if (p.asin) asinCodes.add(p.asin)
    })

    // ASINデータを一括取得
    const { data: asinData } = await supabase
      .from("asins")
      .select("*")
      .in("asin", Array.from(asinCodes))

    // ASINコード -> Asin データのマップを作成
    const asinCodeToDataMap = new Map<string, Asin>()
    asinData?.forEach(asin => {
      asinCodeToDataMap.set(asin.asin, asin as Asin)
    })

    // ショップ割引情報を一括取得
    const shopNames = [...new Set(products.map(p => p.shop_name).filter((name): name is string => name !== null && name !== undefined))]
    const { data: discounts } = await supabase
      .from("shop_discounts")
      .select("*")
      .in("shop_name", shopNames) as { data: ShopDiscount[] | null }

    // ショップ割引のマップを作成
    const discountMap = new Map<string, ShopDiscount>()
    discounts?.forEach(discount => {
      discountMap.set(discount.shop_name, discount)
    })

    // 商品データを変換
    const extendedProducts: ExtendedProduct[] = products.map((product) => {
      // asinを除外してExtendedProductを作成
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { asin: _, ...productWithoutAsin } = product
      const extendedProduct: ExtendedProduct = { ...productWithoutAsin, asin: null }

      // products.asinからASIN情報を取得
      if (product.asin) {
        const asinInfo = asinCodeToDataMap.get(product.asin)
        if (asinInfo) {
          extendedProduct.asin = asinInfo
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
export async function getProductAsinInfo(productId: string): Promise<Asin | null> {
  try {
    // 商品のasinを取得
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("asin")
      .eq("id", productId)
      .single()

    if (productError || !productData?.asin) return null

    // ASINコードからASIN情報を取得
    const { data: asinData, error: asinError } = await supabase
      .from("asins")
      .select("*")
      .eq("asin", productData.asin)
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
/**
 * 商品名から数量を抽出する
 * @param productName - 商品名
 * @param amazonName - Amazon商品名（オプション）
 * @returns 抽出された数量（補正不要の場合は1）
 */
function extractQuantityFromProductName(
  productName: string,
  amazonName?: string | null
): number {
  if (!productName) return 1

  // 数量パターン: 全角・半角数字 + 単位
  const quantityPatterns = [
    /([0-9０-９]+)\s*(?:個|本|枚|袋|箱|缶|つ)/,
    /([0-9０-９]+)\s*(?:セット|set|SET)/,
  ]

  let quantity = 1

  for (const pattern of quantityPatterns) {
    const match = productName.match(pattern)
    if (match && match[1]) {
      // 全角数字を半角に変換
      const numStr = match[1].replace(/[０-９]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xfee0)
      })
      const parsedQuantity = parseInt(numStr, 10)

      // 有効な数量（2以上、100未満）のみ使用
      if (parsedQuantity >= 2 && parsedQuantity < 100) {
        quantity = parsedQuantity
        break
      }
    }
  }

  // 数量が1の場合は補正不要
  if (quantity === 1) return 1

  // Amazon商品名に同じ数量が含まれているかチェック
  if (amazonName) {
    // Amazon商品名から数量を抽出
    for (const pattern of quantityPatterns) {
      const match = amazonName.match(pattern)
      if (match && match[1]) {
        const numStr = match[1].replace(/[０-９]/g, (s) => {
          return String.fromCharCode(s.charCodeAt(0) - 0xfee0)
        })
        const amazonQuantity = parseInt(numStr, 10)

        // 同じ数量が含まれている場合は補正不要
        if (amazonQuantity === quantity) {
          return 1
        }
      }
    }
  }

  return quantity
}

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

    // ASIN情報がない場合は利益計算不可（数量補正もスキップ）
    if (!asin || !asin.amazon_price) {
      return {
        amount: 0,
        rate: 0,
        roi: 0,
        effectivePrice: Math.round(effectivePrice)
      }
    }

    // 数量補正を適用（商品名からの数量抽出）
    // ※ASINが設定されている場合のみ適用
    const quantity = extractQuantityFromProductName(
      product.name,
      asin.amazon_name
    )
    if (quantity > 1) {
      effectivePrice = effectivePrice / quantity
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
  asin: Asin | null
): Promise<{
  amount: number
  rate: number
  roi: number
  effectivePrice: number
}> {
  try {
    // 割引設定を取得
    const discount = await getShopDiscount(product.shop_name || "")

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

    // 数量補正を適用（商品名からの数量抽出）
    const quantity = extractQuantityFromProductName(
      product.name,
      asin?.amazon_name
    )
    if (quantity > 1) {
      effectivePrice = effectivePrice / quantity
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
async function getShopDiscount(shopName: string): Promise<ShopDiscount | null> {
  if (!shopName) return null

  try {
    const { data, error } = await supabase
      .from("shop_discounts")
      .select("*")
      .eq("shop_name", shopName)
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
  updates: ProductUpdate
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("products")
      .update(updates as never)
      .eq("id", productId)

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
  updates: AsinUpdate
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("asins")
      .update(updates as never)
      .eq("id", asinId)

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
export async function deleteProduct(productId: string): Promise<boolean> {
  try {
    // 商品を削除
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)

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
export async function copyProduct(productId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/products/copy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || "商品のコピーに失敗しました")
    }

    return result.success
  } catch (error) {
    console.error("商品コピーエラー:", error instanceof Error ? error.message : String(error))
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

/**
 * お気に入り商品一覧を取得（ASIN情報と利益計算付き）
 */
export async function getFavoriteProducts(): Promise<ExtendedProduct[]> {
  try {
    // お気に入り商品のみを取得
    const { data: productData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_favorite", true)
      .order("created_at", { ascending: false })

    if (productsError) throw productsError
    if (!productData) return []

    const products = productData as Product[]

    // ASINコードを収集
    const asinCodes = new Set<string>()
    products.forEach(p => {
      if (p.asin) asinCodes.add(p.asin)
    })

    // ASINデータを一括取得
    const { data: asinData } = await supabase
      .from("asins")
      .select("*")
      .in("asin", Array.from(asinCodes))

    // ASINコード -> Asin データのマップを作成
    const asinCodeToDataMap = new Map<string, Asin>()
    asinData?.forEach(asin => {
      asinCodeToDataMap.set(asin.asin, asin as Asin)
    })

    // ショップ割引情報を一括取得
    const shopNames = [...new Set(products.map(p => p.shop_name).filter((name): name is string => name !== null && name !== undefined))]
    const { data: discounts } = await supabase
      .from("shop_discounts")
      .select("*")
      .in("shop_name", shopNames) as { data: ShopDiscount[] | null }

    // ショップ割引のマップを作成
    const discountMap = new Map<string, ShopDiscount>()
    discounts?.forEach(discount => {
      discountMap.set(discount.shop_name, discount)
    })

    // 商品データを変換
    const extendedProducts: ExtendedProduct[] = products.map((product) => {
      // asinを除外してExtendedProductを作成
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { asin: _, ...productWithoutAsin } = product
      const extendedProduct: ExtendedProduct = { ...productWithoutAsin, asin: null }

      // products.asinからASIN情報を取得
      if (product.asin) {
        const asinInfo = asinCodeToDataMap.get(product.asin)
        if (asinInfo) {
          extendedProduct.asin = asinInfo
        }
      }

      // 利益計算を実行
      const profitInfo = calculateProfitOptimized(product, extendedProduct.asin ?? null, discountMap)
      extendedProduct.profit_amount = profitInfo.amount
      extendedProduct.profit_rate = profitInfo.rate
      extendedProduct.roi = profitInfo.roi
      extendedProduct.effective_price = profitInfo.effectivePrice

      return extendedProduct
    })

    return extendedProducts
  } catch (error) {
    console.error("お気に入り商品取得エラー:", error)
    throw error
  }
}