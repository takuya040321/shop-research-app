/**
 * 楽天商品検索API
 */

import { NextRequest, NextResponse } from "next/server"
import { getRakutenClient, RakutenProduct } from "@/lib/api/rakuten-client"
import { Proxy } from "@/lib/singletons"
import type { ProductInsert, Product } from "@/types/database"
import { randomUUID } from "crypto"

// POST /api/rakuten/search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { keyword, shopCode, genreId, shopName, hits, page } = body

    console.log("=== 楽天商品検索API ===")
    console.log("リクエストパラメータ:", { keyword, shopCode, genreId, shopName, hits, page })

    // 楽天APIクライアント取得
    const client = getRakutenClient()

    const allProducts: RakutenProduct[] = []
    let currentPage = page || 1
    let totalCount = 0
    let pageCount = 0

    // 全ページを取得（上限なし）
    const hitsPerPage = hits || 30

    while (true) {
      try {
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
        }

        if (result.products.length === 0) {
          break
        }

        allProducts.push(...result.products)

        // 最終ページに達したら終了
        if (currentPage >= pageCount) {
          break
        }

        currentPage++

        // レート制限対策: 1秒待機
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (apiError) {
        console.error("=== 楽天API呼び出しエラー ===")
        console.error("エラー発生時刻:", new Date().toISOString())
        console.error("リクエストパラメータ:", {
          keyword,
          shopCode,
          genreId,
          hits: hitsPerPage,
          page: currentPage
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
      shopName || "楽天市場"
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
    console.log(`[楽天検索] 取得: ${allProducts.length}件 | 保存: ${saveResult.savedCount}件 | 更新: ${saveResult.updatedCount}件 | スキップ: ${saveResult.skippedCount}件 | 削除: 0件`)

    return NextResponse.json({
      success: true,
      message: "楽天商品検索が完了しました",
      data: {
        totalCount,
        pageCount,
        fetchedPages: currentPage,
        productsCount: allProducts.length,
        savedCount: saveResult.savedCount,
        updatedCount: saveResult.updatedCount,
        skippedCount: saveResult.skippedCount,
        products: allProducts
      }
    })

  } catch (error) {
    console.error("=== 楽天商品検索APIでエラー ===")
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
  updatedCount: number
  skippedCount: number
  errors: string[]
}> {
  let savedCount = 0
  let updatedCount = 0
  let skippedCount = 0
  const errors: string[] = []

  // デバッグ: 取得した商品のURL重複チェック
  const fetchedUrlSet = new Set(products.map(p => p.itemUrl))
  if (fetchedUrlSet.size !== products.length) {
    console.warn(`⚠️ 楽天APIから取得した商品に重複URLが ${products.length - fetchedUrlSet.size} 件含まれています`)
  }

  // 414エラー回避: URLを50件ずつに分割してクエリ
  const supabase = Proxy.getSupabase()
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
      console.error("=== 既存商品の取得でエラー ===")
      console.error("エラー発生時刻:", new Date().toISOString())
      console.error("バッチ番号:", Math.floor(i / BATCH_SIZE) + 1)
      console.error("バッチサイズ:", batch.length)
      console.error("Supabaseエラーコード:", fetchError.code)
      console.error("Supabaseエラーメッセージ:", fetchError.message)
      console.error("Supabaseエラー詳細:", fetchError.details)
      console.error("Supabaseエラーヒント:", fetchError.hint)
      console.error("================================")
      errors.push(`既存商品の取得でエラー (バッチ ${Math.floor(i / BATCH_SIZE) + 1}): ${fetchError.message}`)
    } else if (batchExisting) {
      existingProductsAll.push(...batchExisting)
    }
  }

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
      } else {
        // 価格が同じ場合はスキップ
        skippedCount++
      }
    } else {
      // 新規商品
      newProducts.push(product)
    }
  })

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
      is_hidden: false
    }))

    try {
      const { error } = await supabase
        .from("products")
        .insert(productsToInsert as never)

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
          console.error("=== 価格更新エラー ===")
          console.error("エラー発生時刻:", new Date().toISOString())
          console.error("商品ID:", id)
          console.error("新価格:", price)
          console.error("Supabaseエラーコード:", error.code)
          console.error("Supabaseエラーメッセージ:", error.message)
          console.error("Supabaseエラー詳細:", error.details)
          console.error("================================")
          errors.push(`価格更新でエラー (ID: ${id}): ${error.message}`)
        } else {
          updatedCount++
        }
      }
    } catch (error) {
      console.error("=== 価格更新処理でエラー ===")
      console.error("エラー発生時刻:", new Date().toISOString())
      console.error("更新試行件数:", productsToUpdate.length)
      console.error("エラータイプ:", error?.constructor?.name || typeof error)
      console.error("エラー詳細:", error)
      if (error instanceof Error) {
        console.error("エラーメッセージ:", error.message)
        console.error("スタックトレース:", error.stack)
      }
      console.error("================================")
      errors.push(`価格更新処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return { savedCount, updatedCount, skippedCount, errors }
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
