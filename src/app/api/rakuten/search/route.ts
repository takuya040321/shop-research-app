/**
 * 楽天商品検索API
 */

import { NextRequest, NextResponse } from "next/server"
import { getRakutenClient, RakutenProduct } from "@/lib/api/rakuten-client"
import { supabase } from "@/lib/supabase"
import type { ProductInsert, Product } from "@/types/database"
import { randomUUID } from "crypto"

// POST /api/rakuten/search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, shopCode, genreId, shopName, hits, page } = body

    console.log("楽天商品検索を開始します...", { keyword, shopCode, genreId })

    // 楽天APIクライアント取得
    const client = getRakutenClient()

    // 商品検索
    const result = await client.searchItems({
      keyword,
      shopCode,
      genreId,
      hits: hits || 30,
      page: page || 1
    })

    console.log(`${result.products.length}件の商品を取得しました`)

    // データベースに保存
    const saveResult = await saveProductsToDatabase(
      result.products,
      shopName || "楽天市場"
    )

    return NextResponse.json({
      success: true,
      message: "楽天商品検索が完了しました",
      data: {
        totalCount: result.totalCount,
        page: result.page,
        pageCount: result.pageCount,
        productsCount: result.products.length,
        savedCount: saveResult.savedCount,
        skippedCount: saveResult.skippedCount,
        products: result.products
      }
    })

  } catch (error) {
    console.error("楽天商品検索APIでエラーが発生しました:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "楽天商品検索に失敗しました"
      },
      { status: 500 }
    )
  }
}

/**
 * 楽天商品をデータベースに保存
 */
async function saveProductsToDatabase(
  products: RakutenProduct[],
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
  const productNames = products.map(p => p.itemName)

  const { data: existingProducts } = await supabase
    .from("products")
    .select("id, name, shop_type, shop_name")
    .eq("shop_type", "rakuten")
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
    const productKey = `rakuten-${shopName}-${product.itemName}`

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
    shop_type: "rakuten",
    shop_name: shopName,
    name: product.itemName,
    price: product.itemPrice,
    sale_price: null,
    image_url: product.imageUrl,
    source_url: product.itemUrl,
    is_hidden: false,
    memo: product.catchcopy || product.itemCaption || "楽天市場から取得"
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

// GET /api/rakuten/search - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "楽天商品検索APIは正常に動作しています",
    endpoint: "/api/rakuten/search",
    methods: ["POST"],
    description: "楽天市場から商品データを検索・取得します",
    parameters: {
      keyword: "検索キーワード",
      shopCode: "ショップコード",
      genreId: "ジャンルID",
      shopName: "ショップ表示名",
      hits: "取得件数（デフォルト: 30）",
      page: "ページ番号（デフォルト: 1）"
    }
  })
}
