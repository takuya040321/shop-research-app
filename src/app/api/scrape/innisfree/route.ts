/**
 * innisfreeスクレイピング API
 */

import { NextRequest, NextResponse } from "next/server"
import { InnisfreeScraper } from "@/lib/scrapers/innisfree-scraper"

// POST /api/scrape/innisfree
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ユーザーIDが必要です" },
        { status: 400 }
      )
    }

    console.log("innisfreeスクレイピングを開始します...")

    // スクレイパーインスタンスを作成
    const scraper = new InnisfreeScraper(userId)

    // スクレイピング実行（プロキシ設定は自動的に適用される）
    const result = await scraper.executeFullScraping()

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "スクレイピングに失敗しました",
          errors: result.errors,
          proxyUsed: result.proxyUsed
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "innisfreeスクレイピングが完了しました",
      data: {
        totalProducts: result.totalProducts,
        savedProducts: result.savedProducts,
        skippedProducts: result.skippedProducts,
        proxyUsed: result.proxyUsed
      }
    })

  } catch (error) {
    console.error("innisfreeスクレイピングAPIでエラーが発生しました:", error)
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

// GET /api/scrape/innisfree - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "innisfreeスクレイピング APIは正常に動作しています",
    endpoint: "/api/scrape/innisfree",
    methods: ["POST"],
    description: "innisfree公式サイトから商品データをスクレイピングします",
    parameters: {
      userId: "ユーザーID"
    }
  })
}
