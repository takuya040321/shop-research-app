/**
 * Yahoo商品検索API
 */

import { NextRequest, NextResponse } from "next/server"
import { getYahooClient, YahooProduct } from "@/lib/api/yahoo-client"
import { supabaseServer as supabase } from "@/lib/supabase-server"
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

    // 商品検索
    console.log("Yahoo APIに商品検索リクエストを送信...")
    const result = await client.searchItems({
      query,
      seller_id: sellerId,
      category_id: categoryId,
      brand_id: brandId,
      hits: hits || 30,
      offset: offset || 1
    })

    console.log(`Yahoo APIから${result.products.length}件の商品を取得しました`)
    console.log("取得した商品の最初の3件:", result.products.slice(0, 3).map(p => ({
      name: p.name,
      price: p.price,
      storeName: p.storeName
    })))

    // データベースに保存
    console.log(`データベースに保存を開始 (shopName: ${shopName})`)
    const saveResult = await saveProductsToDatabase(
      result.products,
      shopName || "Yahoo!ショッピング"
    )

    console.log("保存結果:", saveResult)
    console.log("========================")

    return NextResponse.json({
      success: true,
      message: "Yahoo商品検索が完了しました",
      data: {
        totalCount: result.totalCount,
        offset: result.offset,
        productsCount: result.products.length,
        savedCount: saveResult.savedCount,
        skippedCount: saveResult.skippedCount,
        products: result.products
      }
    })

  } catch (error) {
    console.error("=== Yahoo商品検索APIでエラー ===")
    console.error("エラー詳細:", error)
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
  console.log("--- saveProductsToDatabase 開始 ---")
  console.log(`保存対象商品数: ${products.length}`)
  console.log(`shopName: ${shopName}`)

  let savedCount = 0
  let skippedCount = 0
  const errors: string[] = []

  // 重複チェック
  const productNames = products.map(p => p.name)
  console.log("重複チェック中...")

  const { data: existingProducts, error: fetchError } = await supabase
    .from("products")
    .select("id, name, shop_type, shop_name")
    .eq("shop_type", "yahoo")
    .eq("shop_name", shopName)
    .in("name", productNames)
    .returns<Pick<Product, "id" | "name" | "shop_type" | "shop_name">[]>()

  if (fetchError) {
    console.error("既存商品の取得でエラー:", fetchError)
    errors.push(`既存商品の取得でエラー: ${fetchError.message}`)
    return { savedCount, skippedCount, errors }
  }

  console.log(`既存商品数: ${existingProducts?.length || 0}`)

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

  console.log(`新規商品数: ${newProducts.length}, スキップ数: ${skippedCount}`)

  if (newProducts.length === 0) {
    console.log("新規商品がないため保存をスキップ")
    console.log("-----------------------------------")
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
    is_hidden: false,
    memo: product.description || "Yahoo!ショッピングから取得"
  }))

  console.log("データベースに挿入中...")
  console.log("挿入する商品の最初の2件:", productsToInsert.slice(0, 2).map(p => ({
    name: p.name,
    shop_name: p.shop_name,
    price: p.price
  })))

  try {
    const { data: insertedData, error } = await supabase
      .from("products")
      .insert(productsToInsert as never)
      .select()

    if (error) {
      console.error("バッチ保存でエラー:", error)
      errors.push(`バッチ保存でエラー: ${error.message}`)
    } else {
      savedCount = productsToInsert.length
      console.log(`${savedCount}件の商品をデータベースに保存しました`)
      console.log("挿入されたデータ:", insertedData?.slice(0, 2))
    }
  } catch (error) {
    console.error("バッチ保存処理でエラー:", error)
    errors.push(`バッチ保存処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
  }

  console.log("-----------------------------------")
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
