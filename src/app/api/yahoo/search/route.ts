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
    const { query, sellerId, categoryId, shopName, hits, offset } = body

    console.log("Yahoo商品検索を開始します...", { query, sellerId, categoryId })

    // Yahoo APIクライアント取得
    const client = getYahooClient()

    // 商品検索
    const result = await client.searchItems({
      query,
      seller_id: sellerId,
      category_id: categoryId,
      hits: hits || 30,
      offset: offset || 1
    })

    console.log(`${result.products.length}件の商品を取得しました`)

    // データベースに保存
    const saveResult = await saveProductsToDatabase(
      result.products,
      shopName || "Yahoo!ショッピング"
    )

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
    console.error("Yahoo商品検索APIでエラーが発生しました:", error)
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
  const productNames = products.map(p => p.name)

  const { data: existingProducts } = await supabase
    .from("products")
    .select("id, name, shop_type, shop_name")
    .eq("shop_type", "yahoo")
    .eq("shop_name", shopName)
    .in("name", productNames)
    .returns<Pick<Product, "id" | "name" | "shop_type" | "shop_name">[]>()

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
    is_hidden: false,
    memo: product.description || "Yahoo!ショッピングから取得"
  }))

  try {
    const { error } = await supabase
      .from("products")
      .insert(productsToInsert as never)

    if (error) {
      errors.push(`バッチ保存でエラー: ${error.message}`)
    } else {
      savedCount = productsToInsert.length
    }
  } catch (error) {
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
      shopName: "ショップ表示名",
      hits: "取得件数（デフォルト: 30）",
      offset: "オフセット（デフォルト: 1）"
    }
  })
}
