/**
 * ダッシュボードデータ集計ユーティリティ
 */

import { supabase } from "./supabase"

// サマリーデータ型
export interface DashboardSummary {
  totalProducts: number
  productsWithAsin: number
  asinLinkRate: number
  averageProfitRate: number
  totalProfitAmount: number
}

// ショップ別統計型
export interface ShopStats {
  shopType: string
  shopName: string
  productCount: number
  asinLinkRate: number
  averageProfitRate: number
}

/**
 * ダッシュボードサマリーデータを取得
 */
export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  try {
    // 全商品数を取得
    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // ASIN紐付け済み商品数を取得
    const { data: productsWithAsin } = await supabase
      .from("product_asins")
      .select("product_id")
      .eq("user_id", userId)

    const uniqueProductsWithAsin = new Set(
      (productsWithAsin as { product_id: string }[] | null)?.map(pa => pa.product_id) || []
    ).size

    // ASIN紐付け率
    const asinLinkRate = totalProducts && totalProducts > 0
      ? (uniqueProductsWithAsin / totalProducts) * 100
      : 0

    // 商品とASINのデータを取得して利益計算
    const { data: products } = await supabase
      .from("products")
      .select(`
        *,
        product_asins!inner (
          asin_id,
          asins (*)
        )
      `)
      .eq("user_id", userId)

    let totalProfitAmount = 0
    let totalProfitRate = 0
    let profitCount = 0

    if (products) {
      for (const product of products) {
        const productData = product as {
          sale_price: number | null
          price: number | null
          product_asins?: Array<{
            asins: {
              amazon_price: number | null
              fee_rate: number | null
              fba_fee: number | null
            } | null
          }>
        }

        const asinData = productData.product_asins?.[0]?.asins
        if (!asinData) continue

        const purchasePrice = productData.sale_price || productData.price || 0
        const amazonPrice = asinData.amazon_price || 0
        const feeRate = asinData.fee_rate || 0
        const fbaFee = asinData.fba_fee || 0

        if (amazonPrice > 0 && purchasePrice > 0) {
          const salesFee = amazonPrice * (feeRate / 100)
          const profitAmount = amazonPrice - purchasePrice - salesFee - fbaFee
          const profitRate = (profitAmount / purchasePrice) * 100

          totalProfitAmount += profitAmount
          totalProfitRate += profitRate
          profitCount++
        }
      }
    }

    const averageProfitRate = profitCount > 0 ? totalProfitRate / profitCount : 0

    return {
      totalProducts: totalProducts || 0,
      productsWithAsin: uniqueProductsWithAsin,
      asinLinkRate: Math.round(asinLinkRate * 10) / 10,
      averageProfitRate: Math.round(averageProfitRate * 10) / 10,
      totalProfitAmount: Math.round(totalProfitAmount)
    }
  } catch (error) {
    console.error("ダッシュボードサマリー取得エラー:", error)
    return {
      totalProducts: 0,
      productsWithAsin: 0,
      asinLinkRate: 0,
      averageProfitRate: 0,
      totalProfitAmount: 0
    }
  }
}

/**
 * ショップ別統計を取得
 */
export async function getShopStats(userId: string): Promise<ShopStats[]> {
  try {
    // 全商品を取得
    const { data: products } = await supabase
      .from("products")
      .select(`
        id,
        shop_type,
        shop_name,
        price,
        sale_price,
        product_asins!inner (
          asin_id,
          asins (
            amazon_price,
            fee_rate,
            fba_fee
          )
        )
      `)
      .eq("user_id", userId)

    if (!products) return []

    // ショップごとに集計
    const shopMap = new Map<string, {
      shopType: string
      shopName: string
      totalCount: number
      asinCount: number
      profitRateSum: number
      profitCount: number
    }>()

    for (const product of products) {
      const productData = product as {
        shop_type: string
        shop_name: string
        sale_price: number | null
        price: number | null
        product_asins?: Array<{
          asins: {
            amazon_price: number | null
            fee_rate: number | null
            fba_fee: number | null
          } | null
        }>
      }

      const key = `${productData.shop_type}-${productData.shop_name}`

      if (!shopMap.has(key)) {
        shopMap.set(key, {
          shopType: productData.shop_type,
          shopName: productData.shop_name,
          totalCount: 0,
          asinCount: 0,
          profitRateSum: 0,
          profitCount: 0
        })
      }

      const stats = shopMap.get(key)
      if (!stats) continue

      stats.totalCount++

      const asinData = productData.product_asins?.[0]?.asins
      if (asinData) {
        stats.asinCount++

        const purchasePrice = productData.sale_price || productData.price || 0
        const amazonPrice = asinData.amazon_price || 0
        const feeRate = asinData.fee_rate || 0
        const fbaFee = asinData.fba_fee || 0

        if (amazonPrice > 0 && purchasePrice > 0) {
          const salesFee = amazonPrice * (feeRate / 100)
          const profitAmount = amazonPrice - purchasePrice - salesFee - fbaFee
          const profitRate = (profitAmount / purchasePrice) * 100

          stats.profitRateSum += profitRate
          stats.profitCount++
        }
      }
    }

    // 配列に変換
    return Array.from(shopMap.values()).map(stats => ({
      shopType: stats.shopType,
      shopName: stats.shopName,
      productCount: stats.totalCount,
      asinLinkRate: stats.totalCount > 0
        ? Math.round((stats.asinCount / stats.totalCount) * 1000) / 10
        : 0,
      averageProfitRate: stats.profitCount > 0
        ? Math.round((stats.profitRateSum / stats.profitCount) * 10) / 10
        : 0
    }))
  } catch (error) {
    console.error("ショップ統計取得エラー:", error)
    return []
  }
}
