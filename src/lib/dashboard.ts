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
export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    // 全商品数を取得
    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    // ASIN紐付け済み商品のsource_url一覧を取得
    const { data: productAsinData } = await supabase
      .from("product_asins")
      .select("source_url")

    // 商品データを取得してsource_urlを持つ商品をカウント
    const { data: allProducts } = await supabase
      .from("products")
      .select("source_url")

    const productsWithSourceUrl = allProducts?.filter(p => p.source_url) || []
    const productAsinUrls = new Set(productAsinData?.map(pa => pa.source_url) || [])
    const uniqueProductsWithAsin = productsWithSourceUrl.filter(p =>
      productAsinUrls.has(p.source_url!)
    ).length

    // ASIN紐付け率
    const asinLinkRate = totalProducts && totalProducts > 0
      ? (uniqueProductsWithAsin / totalProducts) * 100
      : 0

    // 割引設定を取得
    const { data: discounts } = await supabase
      .from("shop_discounts")
      .select("*")
      .eq("is_enabled", true)

    const discountMap = new Map<string, { type: string; value: number }>()
    if (discounts) {
      for (const discount of discounts) {
        const d = discount as { shop_name: string; discount_type: string; discount_value: number }
        discountMap.set(d.shop_name, { type: d.discount_type, value: d.discount_value })
      }
    }

    // 商品データを取得
    const { data: products } = await supabase
      .from("products")
      .select("*")

    if (!products) {
      return {
        totalProducts: totalProducts || 0,
        productsWithAsin: uniqueProductsWithAsin,
        asinLinkRate: Math.round(asinLinkRate * 10) / 10,
        averageProfitRate: 0,
        totalProfitAmount: 0
      }
    }

    // source_url一覧を取得
    const sourceUrls = products.map(p => p.source_url).filter(Boolean) as string[]
    
    // product_asinsを一括取得
    const { data: productAsins } = await supabase
      .from("product_asins")
      .select("source_url, asin")
      .in("source_url", sourceUrls)

    // ASINコード一覧を取得
    const asinCodes = productAsins?.map(pa => pa.asin).filter(Boolean) || []
    
    // ASINデータを一括取得
    const { data: asins } = await supabase
      .from("asins")
      .select("*")
      .in("asin", asinCodes)

    // マップを作成
    const urlToAsinCode = new Map<string, string>()
    productAsins?.forEach(pa => {
      if (pa.source_url && pa.asin) {
        urlToAsinCode.set(pa.source_url, pa.asin)
      }
    })

    const asinCodeToData = new Map<string, { amazon_price: number | null; fee_rate: number | null; fba_fee: number | null }>()
    asins?.forEach(asin => {
      const a = asin as { asin: string; amazon_price: number | null; fee_rate: number | null; fba_fee: number | null }
      asinCodeToData.set(a.asin, {
        amazon_price: a.amazon_price,
        fee_rate: a.fee_rate,
        fba_fee: a.fba_fee
      })
    })

    // 利益計算
    let totalProfitAmount = 0
    let totalProfitRate = 0
    let profitCount = 0

    for (const product of products) {
      const productData = product as {
        source_url: string | null
        shop_name: string | null
        sale_price: number | null
        price: number | null
      }

      if (!productData.source_url) continue
      
      const asinCode = urlToAsinCode.get(productData.source_url)
      if (!asinCode) continue

      const asinData = asinCodeToData.get(asinCode)
      if (!asinData) continue

      // 実効価格を計算（割引適用後）
      let purchasePrice = productData.sale_price || productData.price || 0
      const discount = productData.shop_name ? discountMap.get(productData.shop_name) : null

      if (discount) {
        if (discount.type === "percentage") {
          purchasePrice = purchasePrice * (1 - discount.value / 100)
        } else {
          purchasePrice = purchasePrice - discount.value
        }
      }

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
export async function getShopStats(): Promise<ShopStats[]> {
  try {
    // 割引設定を取得
    const { data: discounts } = await supabase
      .from("shop_discounts")
      .select("*")
      .eq("is_enabled", true)

    const discountMap = new Map<string, { type: string; value: number }>()
    if (discounts) {
      for (const discount of discounts) {
        const d = discount as { shop_name: string; discount_type: string; discount_value: number }
        discountMap.set(d.shop_name, { type: d.discount_type, value: d.discount_value })
      }
    }

    // 全商品を取得
    const { data: products } = await supabase
      .from("products")
      .select("*")

    if (!products) return []

    // source_url一覧を取得
    const sourceUrls = products.map(p => p.source_url).filter(Boolean) as string[]
    
    // product_asinsを一括取得
    const { data: productAsins } = await supabase
      .from("product_asins")
      .select("source_url, asin")
      .in("source_url", sourceUrls)

    // ASINコード一覧を取得
    const asinCodes = productAsins?.map(pa => pa.asin).filter(Boolean) || []
    
    // ASINデータを一括取得
    const { data: asins } = await supabase
      .from("asins")
      .select("*")
      .in("asin", asinCodes)

    // マップを作成
    const urlToAsinCode = new Map<string, string>()
    productAsins?.forEach(pa => {
      if (pa.source_url && pa.asin) {
        urlToAsinCode.set(pa.source_url, pa.asin)
      }
    })

    const asinCodeToData = new Map<string, { amazon_price: number | null; fee_rate: number | null; fba_fee: number | null }>()
    asins?.forEach(asin => {
      const a = asin as { asin: string; amazon_price: number | null; fee_rate: number | null; fba_fee: number | null }
      asinCodeToData.set(a.asin, {
        amazon_price: a.amazon_price,
        fee_rate: a.fee_rate,
        fba_fee: a.fba_fee
      })
    })

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
        source_url: string | null
        sale_price: number | null
        price: number | null
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

      // ASIN情報を取得
      if (productData.source_url) {
        const asinCode = urlToAsinCode.get(productData.source_url)
        if (asinCode) {
          const asinData = asinCodeToData.get(asinCode)
          if (asinData) {
            stats.asinCount++

            // 実効価格を計算（割引適用後）
            let purchasePrice = productData.sale_price || productData.price || 0
            const discount = discountMap.get(productData.shop_name)

            if (discount) {
              if (discount.type === "percentage") {
                purchasePrice = purchasePrice * (1 - discount.value / 100)
              } else {
                purchasePrice = purchasePrice - discount.value
              }
            }

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
