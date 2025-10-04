/**
 * DHCスクレイピング API
 */

import { NextResponse } from "next/server"
import { DHCScraper } from "@/lib/scrapers/dhc-scraper"

// POST /api/scrape/dhc
export async function POST() {
  try {
    console.log("DHCスクレイピングを開始します...")

    // スクレイパーインスタンスを作成
    const scraper = new DHCScraper()

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
      message: "DHCスクレイピングが完了しました",
      data: {
        totalProducts: result.totalProducts,
        savedProducts: result.savedProducts,
        skippedProducts: result.skippedProducts,
        proxyUsed: result.proxyUsed
      }
    })

  } catch (error) {
    console.error("DHCスクレイピングAPIでエラーが発生しました:", error)
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

// GET /api/scrape/dhc - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "DHCスクレイピング APIは正常に動作しています",
    endpoint: "/api/scrape/dhc",
    methods: ["POST"],
    description: "DHC公式サイトから商品データをスクレイピングします"
  })
}
