/**
 * innisfreeスクレイピング API
 */

import { NextResponse } from "next/server"
import { InnisfreeScraper } from "@/lib/scrapers/innisfree-scraper"

// POST /api/scrape/innisfree
export async function POST() {
  try {
    console.log("=== innisfreeスクレイピングAPI ===")

    // スクレイパーインスタンスを作成
    const scraper = new InnisfreeScraper()

    // スクレイピング実行（プロキシ設定は自動的に適用される）
    const result = await scraper.executeFullScraping()

    if (!result.success) {
      console.error("=== innisfreeスクレイピング失敗 ===")
      console.error("エラー発生時刻:", new Date().toISOString())
      console.error("エラー一覧:", result.errors)
      console.error("プロキシ使用:", result.proxyUsed)
      console.error("================================")
      
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

    // 結果サマリーを表示
    console.log(`[innisfreeスクレイピング] 取得: ${result.totalProducts}件 | 保存: ${result.savedProducts}件 | 更新: 0件 | スキップ: ${result.skippedProducts}件 | 削除: 0件`)

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
    console.error("=== innisfreeスクレイピングAPIでエラー ===")
    console.error("エラー発生時刻:", new Date().toISOString())
    console.error("エラータイプ:", error?.constructor?.name || typeof error)
    console.error("エラー詳細:", error)
    
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message)
      console.error("スタックトレース:", error.stack)
    }
    console.error("================================")
    
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
    description: "innisfree公式サイトから商品データをスクレイピングします"
  })
}
