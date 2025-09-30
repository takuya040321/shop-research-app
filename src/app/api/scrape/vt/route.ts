/**
 * VT Cosmetics スクレイピング API
 */

import { NextRequest, NextResponse } from "next/server"
import { VTCosmeticsScraper } from "@/lib/scrapers/vt-cosmetics-scraper"

// POST /api/scrape/vt
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ユーザーIDが必要です" },
        { status: 400 }
      )
    }

    // VTスクレイパーを初期化
    const scraper = new VTCosmeticsScraper(userId)

    console.log("VT Cosmeticsスクレイピングを開始...")

    // スクレイピング実行
    const result = await scraper.executeFullScraping({
      headless: true
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "VT Cosmeticsスクレイピングが完了しました",
        data: {
          totalProducts: result.totalProducts,
          savedProducts: result.savedProducts,
          skippedProducts: result.skippedProducts,
          proxyUsed: result.proxyUsed,
          errors: result.errors
        }
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "VT Cosmeticsスクレイピングに失敗しました",
          errors: result.errors
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("VT Cosmeticsスクレイピング APIエラー:", error)

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

// GET /api/scrape/vt - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "VT Cosmetics スクレイピング APIは正常に動作しています",
    endpoint: "/api/scrape/vt",
    methods: ["POST"],
    description: "VT Cosmetics公式サイトから商品データをスクレイピングしてデータベースに保存します",
    parameters: {
      userId: "ユーザーID（必須）"
    },
    features: [
      "全カテゴリの商品を自動取得",
      "商品詳細ページから正確な価格情報を取得",
      "重複商品のスキップ",
      "プロキシ制御対応",
      "エラーハンドリング"
    ]
  })
}