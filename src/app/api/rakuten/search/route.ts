/**
 * 楽天商品検索API
 */

import { NextRequest, NextResponse } from "next/server"
import { getRakutenClient, RakutenProduct } from "@/lib/api/rakuten-client"
import { supabaseServer as supabase } from "@/lib/supabase-server"
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

    const allProducts: RakutenProduct[] = []
    let currentPage = page || 1
    let totalCount = 0
    let pageCount = 0

    // 全ページを取得（上限なし）
    const hitsPerPage = hits || 30

    while (true) {
      // 商品検索
      const result = await client.searchItems({
        keyword,
        shopCode,
        genreId,
        hits: hitsPerPage,
        page: currentPage
      })

      if (currentPage === 1) {
        totalCount = result.totalCount
        pageCount = result.pageCount
        console.log(`総件数: ${totalCount}件、総ページ数: ${pageCount}`)
      }

      if (result.products.length === 0) {
        break
      }

      allProducts.push(...result.products)
      console.log(`ページ ${currentPage}: ${result.products.length}件取得（累計: ${allProducts.length}件）`)

      // 最終ページに達したら終了
      if (currentPage >= pageCount) {
        break
      }

      currentPage++

      // レート制限対策: 1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`合計 ${allProducts.length}件の商品を取得しました`)

    // データベースに保存
    const saveResult = await saveProductsToDatabase(
      allProducts,
      shopName || "楽天市場"
    )

    return NextResponse.json({
      success: true,
      message: "楽天商品検索が完了しました",
      data: {
        totalCount,
        pageCount,
        fetchedPages: currentPage,
        productsCount: allProducts.length,
        savedCount: saveResult.savedCount,
        skippedCount: saveResult.skippedCount,
        products: allProducts
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

  console.log("=== 重複チェック開始 ===")
  console.log("取得した商品数:", products.length)

  // デバッグ: 取得した商品のURL重複チェック
  const fetchedUrlSet = new Set(products.map(p => p.itemUrl))
  console.log("ユニークなURL数:", fetchedUrlSet.size)
  if (fetchedUrlSet.size !== products.length) {
    console.warn(`⚠️ 楽天APIから取得した商品に重複URLが ${products.length - fetchedUrlSet.size} 件含まれています`)
  }

  // 414エラー回避: URLを50件ずつに分割してクエリ
  const BATCH_SIZE = 50
  const existingProductsAll: Pick<Product, "id" | "price" | "source_url">[] = []

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    const batchUrls = batch.map(p => p.itemUrl)

    const { data: batchExisting, error: fetchError } = await supabase
      .from("products")
      .select("id, price, source_url")
      .in("source_url", batchUrls)
      .returns<Pick<Product, "id" | "price" | "source_url">[]>()

    if (fetchError) {
      console.error(`バッチ ${Math.floor(i / BATCH_SIZE) + 1} の取得でエラー:`, fetchError)
      errors.push(`既存商品の取得でエラー: ${fetchError.message}`)
    } else if (batchExisting) {
      console.log(`バッチ ${Math.floor(i / BATCH_SIZE) + 1}: ${batchExisting.length}件の既存商品を取得`)
      existingProductsAll.push(...batchExisting)
    }
  }

  console.log("バッチクエリで取得した既存商品数:", existingProductsAll.length)

  // 既存商品をMapで管理（URLをキーに）
  const existingProductMap = new Map<string, Pick<Product, "id" | "price" | "source_url">>()
  let nullUrlCount = 0
  
  existingProductsAll.forEach(product => {
    if (product.source_url) {
      existingProductMap.set(product.source_url, product)
    } else {
      nullUrlCount++
    }
  })

  console.log("Mapに登録された既存商品数:", existingProductMap.size)
  if (nullUrlCount > 0) {
    console.warn(`⚠️ source_urlがnullの既存商品: ${nullUrlCount}件`)
  }

  // 新規商品と価格更新が必要な商品を分類
  const newProducts: RakutenProduct[] = []
  const productsToUpdate: Array<{ id: string; price: number }> = []

  products.forEach(product => {
    const existing = existingProductMap.get(product.itemUrl)

    if (existing) {
      // 既存商品の場合、価格をチェック
      if (existing.price !== product.itemPrice) {
        // 価格が変動している場合は更新対象
        productsToUpdate.push({
          id: existing.id,
          price: product.itemPrice
        })
        console.log(`価格変動検出: ${product.itemName} (${existing.price} → ${product.itemPrice})`)
      } else {
        // 価格が同じ場合はスキップ
        skippedCount++
      }
    } else {
      // 新規商品
      newProducts.push(product)
    }
  })

  console.log("新規商品数:", newProducts.length)
  console.log("価格更新対象数:", productsToUpdate.length)
  console.log("スキップ数:", skippedCount)
  console.log("検証: 新規 + 価格更新 + スキップ = ", newProducts.length + productsToUpdate.length + skippedCount, "/ 取得数:", products.length)

  // 新規商品を挿入
  if (newProducts.length > 0) {
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
        console.error("バッチ保存でエラー:", error)
      } else {
        savedCount = productsToInsert.length
        console.log(`${savedCount}件の新規商品を保存しました`)
      }
    } catch (error) {
      errors.push(`バッチ保存処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
      console.error("バッチ保存処理でエラー:", error)
    }
  }

  // 価格更新
  if (productsToUpdate.length > 0) {
    try {
      for (const { id, price } of productsToUpdate) {
        const { error } = await supabase
          .from("products")
          .update({ price } as never)
          .eq("id", id)

        if (error) {
          errors.push(`価格更新でエラー (ID: ${id}): ${error.message}`)
        }
      }
      console.log(`${productsToUpdate.length}件の商品価格を更新しました`)
    } catch (error) {
      errors.push(`価格更新処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log("=== 重複チェック完了 ===")

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
