/**
 * Yahoo商品検索API
 */

import { NextRequest, NextResponse } from "next/server"
import { getYahooClient, YahooProduct } from "@/lib/api/yahoo-client"
import { Proxy } from "@/lib/singletons"
import type { ProductInsert, Product } from "@/types/database"
import { randomUUID } from "crypto"

// POST /api/yahoo/search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, sellerId, categoryId, brandId, shopName, hits, offset } = body

    console.log("=== Yahoo商品検索API ===")
    console.log("リクエストパラメータ:", { query, sellerId, categoryId, brandId, shopName, hits, offset })

    // Yahoo APIクライアント取得
    const client = getYahooClient()

    const requestedHits = hits || 30
    const maxHitsPerRequest = 20 // Yahoo APIの1回あたりの最大取得件数
    let allProducts: YahooProduct[] = []
    let currentOffset = offset || 1
    let totalCount = 0

    // 必要な回数だけAPIリクエストを繰り返す
    while (allProducts.length < requestedHits) {
      const remainingHits = requestedHits - allProducts.length
      const currentHits = Math.min(remainingHits, maxHitsPerRequest)

      try {
        const result = await client.searchItems({
          query,
          seller_id: sellerId,
          category_id: categoryId,
          brand_id: brandId,
          hits: currentHits,
          offset: currentOffset
        })

        // 商品を追加（必要な分だけ）
        const productsToAdd = result.products.slice(0, remainingHits)
        allProducts = allProducts.concat(productsToAdd)
        totalCount = result.totalCount

        // 取得できた件数が要求より少ない場合は終了
        if (result.products.length < currentHits) {
          break
        }

        // 必要な件数を取得した場合は終了
        if (allProducts.length >= requestedHits) {
          break
        }

        // 次のオフセット
        currentOffset += result.products.length

        // すべての商品を取得した場合は終了
        if (allProducts.length >= totalCount) {
          break
        }
      } catch (apiError) {
        console.error("=== Yahoo API呼び出しエラー ===")
        console.error("エラー発生時刻:", new Date().toISOString())
        console.error("リクエストパラメータ:", {
          query,
          seller_id: sellerId,
          category_id: categoryId,
          brand_id: brandId,
          hits: currentHits,
          offset: currentOffset
        })
        console.error("エラー詳細:", apiError)
        if (apiError instanceof Error) {
          console.error("エラーメッセージ:", apiError.message)
          console.error("スタックトレース:", apiError.stack)
        }
        console.error("================================")
        throw apiError
      }
    }

    // データベースに保存
    const saveResult = await saveProductsToDatabase(
      allProducts,
      shopName || "Yahoo!ショッピング"
    )

    // エラーがあれば警告表示
    if (saveResult.errors.length > 0) {
      console.warn("=== データベース保存時にエラーが発生 ===")
      saveResult.errors.forEach((err, index) => {
        console.warn(`エラー ${index + 1}:`, err)
      })
      console.warn("=========================================")
    }

    // 結果サマリーを表示
    console.log(`[Yahoo検索] 取得: ${allProducts.length}件 | 保存: ${saveResult.savedCount}件 | 更新: 0件 | スキップ: ${saveResult.skippedCount}件 | 削除: 0件`)

    return NextResponse.json({
      success: true,
      message: "Yahoo商品検索が完了しました",
      data: {
        totalCount,
        offset: offset || 1,
        productsCount: allProducts.length,
        savedCount: saveResult.savedCount,
        skippedCount: saveResult.skippedCount,
        products: allProducts
      }
    })

  } catch (error) {
    console.error("=== Yahoo商品検索APIでエラー ===")
    console.error("エラー発生時刻:", new Date().toISOString())
    console.error("エラータイプ:", error?.constructor?.name || typeof error)
    console.error("エラー詳細:", error)
    
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message)
      console.error("スタックトレース:", error.stack)
    }
    
    // リクエストボディの再表示（デバッグ用）
    try {
      const body = await request.json()
      console.error("リクエストパラメータ（再確認）:", body)
    } catch {
      console.error("リクエストボディの解析に失敗")
    }
    
    console.error("================================")
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Yahoo商品検索に失敗しました"
      },
      { status: 500 }
    )
  }
}

/**
 * Yahoo商品をデータベースに保存
 */
async function saveProductsToDatabase(
  products: YahooProduct[],
  shopName: string
): Promise<{
  savedCount: number
  skippedCount: number
  errors: string[]
}> {
  let savedCount = 0
  let skippedCount = 0
  const errors: string[] = []

  // 重複チェック
  const supabase = Proxy.getSupabase()
  const productNames = products.map(p => p.name)

  const { data: existingProducts, error: fetchError} = await supabase
    .from("products")
    .select("id, name, shop_type, shop_name")
    .eq("shop_type", "yahoo")
    .eq("shop_name", shopName)
    .in("name", productNames)
    .returns<Pick<Product, "id" | "name" | "shop_type" | "shop_name">[]>()

  if (fetchError) {
    console.error("=== 既存商品の取得でエラー ===")
    console.error("エラー発生時刻:", new Date().toISOString())
    console.error("shopName:", shopName)
    console.error("商品名の数:", productNames.length)
    console.error("Supabaseエラーコード:", fetchError.code)
    console.error("Supabaseエラーメッセージ:", fetchError.message)
    console.error("Supabaseエラー詳細:", fetchError.details)
    console.error("Supabaseエラーヒント:", fetchError.hint)
    console.error("================================")
    errors.push(`既存商品の取得でエラー: ${fetchError.message}`)
    return { savedCount, skippedCount, errors }
  }

  // 既存商品の重複キーセット
  const existingProductKeys = new Set<string>()
  existingProducts?.forEach(product => {
    const key = `${product.shop_type}-${product.shop_name}-${product.name}`
    existingProductKeys.add(key)
  })

  // 新規商品のみ抽出
  const newProducts = products.filter(product => {
    const productKey = `yahoo-${shopName}-${product.name}`

    if (existingProductKeys.has(productKey)) {
      skippedCount++
      return false
    }
    return true
  })

  if (newProducts.length === 0) {
    return { savedCount, skippedCount, errors }
  }

  // バッチ挿入
  const productsToInsert: ProductInsert[] = newProducts.map(product => ({
    id: randomUUID(),
    shop_type: "yahoo",
    shop_name: shopName,
    name: product.name,
    price: product.price,
    sale_price: null,
    image_url: product.imageUrl,
    source_url: product.url,
    is_hidden: false
  }))

  try {
    const { error } = await supabase
      .from("products")
      .insert(productsToInsert as never)
      .select()

    if (error) {
      console.error("=== データベース保存エラー ===")
      console.error("エラー発生時刻:", new Date().toISOString())
      console.error("保存試行件数:", productsToInsert.length)
      console.error("shopName:", shopName)
      console.error("Supabaseエラーコード:", error.code)
      console.error("Supabaseエラーメッセージ:", error.message)
      console.error("Supabaseエラー詳細:", error.details)
      console.error("Supabaseエラーヒント:", error.hint)
      console.error("保存試行商品の例（最初の2件）:", productsToInsert.slice(0, 2).map(p => ({
        name: p.name,
        price: p.price,
        shop_name: p.shop_name
      })))
      console.error("================================")
      errors.push(`バッチ保存でエラー: ${error.message}`)
    } else {
      savedCount = productsToInsert.length
    }
  } catch (error) {
    console.error("=== データベース保存処理でエラー ===")
    console.error("エラー発生時刻:", new Date().toISOString())
    console.error("保存試行件数:", productsToInsert.length)
    console.error("shopName:", shopName)
    console.error("エラータイプ:", error?.constructor?.name || typeof error)
    console.error("エラー詳細:", error)
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message)
      console.error("スタックトレース:", error.stack)
    }
    console.error("保存試行商品の例（最初の2件）:", productsToInsert.slice(0, 2).map(p => ({
      name: p.name,
      price: p.price,
      shop_name: p.shop_name
    })))
    console.error("================================")
    errors.push(`バッチ保存処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
  }

  return { savedCount, skippedCount, errors }
}

// GET /api/yahoo/search - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Yahoo商品検索APIは正常に動作しています",
    endpoint: "/api/yahoo/search",
    methods: ["POST"],
    description: "Yahoo!ショッピングから商品データを検索・取得します",
    parameters: {
      query: "検索クエリ",
      sellerId: "ストアID",
      categoryId: "カテゴリID",
      brandId: "ブランドID",
      shopName: "ショップ表示名",
      hits: "取得件数（デフォルト: 30）",
      offset: "オフセット（デフォルト: 1）"
    }
  })
}
