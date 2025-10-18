/**
 * 商品データの重複排除ユーティリティ
 */

import { supabase } from "./supabase"

/**
 * データベース内の重複商品を検出して削除
 * 同じ shop_type, shop_name, name の商品のうち、最新のものを残して古いものを削除
 */
export async function removeDuplicateProducts(): Promise<{
  success: boolean
  deletedCount: number
  errors: string[]
}> {
  try {
    const errors: string[] = []
    let deletedCount = 0

    // 全商品を取得（original_product_id も取得してコピー商品を識別）
    const { data: allProducts, error: fetchError } = await supabase
      .from("products")
      .select("id, shop_type, shop_name, name, created_at, original_product_id")
      .order("created_at", { ascending: false }) as {
        data: Array<{
          id: string
          shop_type: string
          shop_name: string
          name: string
          created_at: string
          original_product_id: string | null
        }> | null
        error: { message: string } | null
      }

    if (fetchError) {
      return {
        success: false,
        deletedCount: 0,
        errors: [`商品取得エラー: ${fetchError.message}`]
      }
    }

    if (!allProducts || allProducts.length === 0) {
      return { success: true, deletedCount: 0, errors: [] }
    }

    // 重複を検出（コピー商品は除外）
    const productMap = new Map<string, string>() // key -> 最新商品ID
    const duplicateIds: string[] = []
    let copiedProductsSkipped = 0

    for (const product of allProducts) {
      // コピー商品はスキップ
      if (product.original_product_id) {
        copiedProductsSkipped++
        continue
      }

      const key = `${product.shop_type}-${product.shop_name}-${product.name}`

      if (productMap.has(key)) {
        // 重複発見 - 古い方を削除対象に追加
        duplicateIds.push(product.id)
      } else {
        // 最新の商品を記録
        productMap.set(key, product.id)
      }
    }

    if (duplicateIds.length === 0) {
      return { success: true, deletedCount: 0, errors: [] }
    }

    // バッチで削除（最大1000件ずつ）
    const batchSize = 100
    for (let i = 0; i < duplicateIds.length; i += batchSize) {
      const batch = duplicateIds.slice(i, i + batchSize)

      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .in("id", batch)

      if (deleteError) {
        errors.push(`削除エラー (バッチ ${i / batchSize + 1}): ${deleteError.message}`)
      } else {
        deletedCount += batch.length
      }
    }

    return {
      success: errors.length === 0,
      deletedCount,
      errors
    }
  } catch (error) {
    console.error("重複削除処理エラー:", error)
    return {
      success: false,
      deletedCount: 0,
      errors: [`処理エラー: ${error instanceof Error ? error.message : String(error)}`]
    }
  }
}

/**
 * スクレイピング後に自動で重複削除を実行
 */
export async function deduplicateAfterScraping(): Promise<void> {
  console.log("重複商品の削除を開始...")
  const result = await removeDuplicateProducts()

  if (result.success) {
    console.log(`✓ ${result.deletedCount}件の重複商品を削除しました`)
  } else {
    console.error("重複削除でエラーが発生しました:", result.errors)
  }
}