import { NextRequest, NextResponse } from "next/server"
import { YahooAPIClient } from "@/lib/api/yahoo-client"

/**
 * Yahoo API接続テスト用エンドポイント
 */
export async function POST(request: NextRequest) {
  const debugLog: string[] = []

  try {
    debugLog.push("[STEP 1] リクエスト受信")

    const body = await request.json()
    debugLog.push(`[STEP 2] リクエストボディ解析成功: ${JSON.stringify(body)}`)

    const {
      query,
      sellerId,
      categoryId,
      brandId,
      brandName,
      hits = 30,
      offset = 1,
      sort
    } = body

    // 環境変数からApp IDを取得
    const appId = process.env.YAHOO_CLIENT_ID
    const affiliateId = process.env.YAHOO_AFFILIATE_ID

    debugLog.push(`[STEP 3] パラメータ抽出完了`)
    debugLog.push(`  - appId: ${appId ? "環境変数から取得" : "なし"}`)
    debugLog.push(`  - affiliateId: ${affiliateId || "なし"}`)
    debugLog.push(`  - query: ${query || "なし"}`)
    debugLog.push(`  - sellerId: ${sellerId || "なし"}`)
    debugLog.push(`  - categoryId: ${categoryId || "なし"}`)
    debugLog.push(`  - brandId: ${brandId || "なし"}`)
    debugLog.push(`  - brandName: ${brandName || "なし"}`)
    debugLog.push(`  - hits: ${hits}`)
    debugLog.push(`  - offset: ${offset}`)
    debugLog.push(`  - sort: ${sort || "なし"}`)

    // 必須パラメータチェック
    if (!appId) {
      debugLog.push("[ERROR] App IDが環境変数に設定されていません")
      console.log(debugLog.join("\n"))
      return NextResponse.json(
        {
          error: "App IDが環境変数に設定されていません（YAHOO_CLIENT_ID）",
          debug: debugLog
        },
        { status: 400 }
      )
    }

    debugLog.push("[STEP 4] Yahoo APIクライアント作成開始")
    // Yahoo APIクライアント作成
    const client = new YahooAPIClient({
      appId,
      affiliateId: affiliateId || undefined
    })
    debugLog.push("[STEP 5] Yahoo APIクライアント作成完了")

    // 検索クエリ構築（ブランド名でフィルタリング）
    let searchQuery = query || ""
    if (brandName) {
      searchQuery = searchQuery ? `${searchQuery} ${brandName}` : brandName
    }
    debugLog.push(`[STEP 6] 検索クエリ構築: "${searchQuery}"`)

    const searchParams = {
      query: searchQuery || undefined,
      seller_id: sellerId || undefined,
      category_id: categoryId || undefined,
      brand_id: brandId || undefined,
      hits,
      offset,
      sort: sort || undefined
    }
    debugLog.push(`[STEP 7] 検索パラメータ: ${JSON.stringify(searchParams)}`)

    debugLog.push("[STEP 8] Yahoo API呼び出し開始")
    // API呼び出し
    const result = await client.searchItems(searchParams)
    debugLog.push(`[STEP 9] Yahoo API呼び出し成功`)
    debugLog.push(`  - 取得商品数: ${result.products.length}`)
    debugLog.push(`  - 総件数: ${result.totalCount}`)
    debugLog.push(`  - オフセット: ${result.offset}`)

    // ブランド名でフィルタリング（API側のフィルタリングが不完全な場合に備えて）
    let products = result.products
    const beforeFilterCount = products.length

    if (brandName) {
      debugLog.push(`[STEP 10] ブランド名フィルタリング開始: "${brandName}"`)
      const brandLower = brandName.toLowerCase()
      products = products.filter(product => {
        const productBrand = product.brandName?.toLowerCase() || ""
        const productName = product.name.toLowerCase()
        const match = productBrand.includes(brandLower) || productName.includes(brandLower)
        if (!match) {
          debugLog.push(`  除外: ${product.name}`)
        }
        return match
      })
      debugLog.push(`[STEP 11] フィルタリング完了: ${beforeFilterCount}件 → ${products.length}件`)
    } else {
      debugLog.push("[STEP 10] ブランド名フィルタリングなし")
    }

    debugLog.push("[STEP 12] レスポンス返却")
    console.log(debugLog.join("\n"))

    return NextResponse.json({
      success: true,
      data: {
        products,
        totalCount: result.totalCount,
        offset: result.offset,
        returnedCount: products.length
      },
      debug: debugLog
    })

  } catch (error) {
    debugLog.push(`[ERROR] エラー発生: ${error instanceof Error ? error.message : String(error)}`)
    if (error instanceof Error && error.stack) {
      debugLog.push(`[ERROR STACK] ${error.stack}`)
    }

    console.error("Yahoo APIテストエラー:", error)
    console.log(debugLog.join("\n"))

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Yahoo API呼び出しに失敗しました",
        debug: debugLog
      },
      { status: 500 }
    )
  }
}
