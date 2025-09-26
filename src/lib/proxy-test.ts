/**
 * プロキシ設定テスト用ユーティリティ
 * 開発環境でのプロキシ動作確認用
 */

import { BaseScraper } from "./scraper"
import { determineProxySettings, logProxyStatus } from "./proxy"

/**
 * プロキシ設定の動作確認
 */
export async function testProxySettings(): Promise<void> {
  console.log("=== プロキシ設定テスト開始 ===")

  // 1. プロキシ設定の判定テスト
  const proxySettings = determineProxySettings()
  logProxyStatus(proxySettings)

  // 2. 基本的なスクレイピングテスト
  const scraper = new BaseScraper()

  try {
    console.log("ブラウザを起動中...")
    await scraper.launch({ headless: true })

    console.log("テストページにアクセス中...")
    const result = await scraper.scrape(
      "https://httpbin.org/ip",
      async (page) => {
        const content = await page.content()
        console.log("取得したコンテンツ:", content.substring(0, 200))
        return { content }
      },
      { timeout: 10000 }
    )

    if (result.success) {
      console.log("✅ スクレイピングテスト成功")
      console.log("プロキシ使用状況:", result.proxyUsed ? "有効" : "無効")
    } else {
      console.log("❌ スクレイピングテスト失敗")
      console.log("エラー:", result.error)
    }
  } catch (error) {
    console.error("❌ テスト実行エラー:", error)
  } finally {
    await scraper.close()
  }

  console.log("=== プロキシ設定テスト完了 ===")
}

/**
 * 環境変数の設定状況を確認
 */
export function checkEnvironmentVariables(): void {
  console.log("=== 環境変数確認 ===")
  console.log("USE_PROXY:", process.env.USE_PROXY || "未設定")
  console.log("PROXY_HOST:", process.env.PROXY_HOST || "未設定")
  console.log("PROXY_PORT:", process.env.PROXY_PORT || "未設定")
  console.log("PROXY_USERNAME:", process.env.PROXY_USERNAME ? "設定済み" : "未設定")
  console.log("PROXY_PASSWORD:", process.env.PROXY_PASSWORD ? "設定済み" : "未設定")
  console.log("======================")
}

// 開発時にテスト実行が可能（Node.js環境でのみ）
if (typeof window === "undefined" && typeof process !== "undefined") {
  // サーバーサイド環境でのテスト実行フラグ
  const isTestMode = process.env.NODE_ENV === "development" && process.env.TEST_PROXY === "true"

  if (isTestMode) {
    checkEnvironmentVariables()
    testProxySettings().catch(console.error)
  }
}