/**
 * お気に入り商品スクレイピング API
 */

import { NextResponse } from "next/server"
import { FavoriteScraper } from "@/lib/scrapers/favorite-scraper"

// POST /api/scrape/favorites
export async function POST() {
  try {
    console.log("お気に入り商品スクレイピングを開始します...")

    // スクレイパーインスタンスを作成
    const scraper = new FavoriteScraper()

    // スクレイピング実行
    const result = await scraper.scrapeFavoriteProducts()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "お気に入り商品のスクレイピングに失敗しました",
          data: {
            totalProducts: result.totalProducts,
            successCount: result.successCount,
            failureCount: result.failureCount,
            results: result.results,
            proxyUsed: result.proxyUsed
          }
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `お気に入り商品のスクレイピングが完了しました (成功: ${result.successCount}件, 失敗: ${result.failureCount}件)`,
      data: {
        totalProducts: result.totalProducts,
        successCount: result.successCount,
        failureCount: result.failureCount,
        results: result.results,
        proxyUsed: result.proxyUsed
      }
    })

  } catch (error) {
    console.error("お気に入り商品スクレイピングAPIでエラーが発生しました:", error)
    return NextResponse.json(
      {
        success: false,
        message: "内部サーバーエラーが発生しました",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// GET /api/scrape/favorites - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "お気に入り商品スクレイピング APIは正常に動作しています",
    endpoint: "/api/scrape/favorites",
    methods: ["POST"],
    description: "お気に入りに登録された商品のみを個別にスクレイピングして最新の価格情報を取得します",
    features: [
      "お気に入り商品のみを対象",
      "商品URLから個別スクレイピング",
      "価格・セール価格・画像URLを更新",
      "複数ショップ対応（VT、Innisfree、DHC）",
      "バッチ処理とエラーハンドリング",
      "プロキシ制御対応"
    ]
  })
}
