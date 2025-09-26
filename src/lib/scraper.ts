/**
 * 共通スクレイピングライブラリ
 * プロキシ統合とエラーハンドリングを提供
 */

import puppeteer, { Browser, Page, LaunchOptions } from "puppeteer"
import { determineProxySettings, generateProxyUrl, logProxyStatus, type ProxySettings } from "./proxy"

export interface ScraperOptions {
  headless?: boolean
  timeout?: number
  userAgent?: string
}

export interface ScraperResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  proxyUsed: boolean
}

export class BaseScraper {
  private browser: Browser | null = null
  private proxySettings: ProxySettings

  constructor() {
    // プロキシ設定の事前判定（必須）
    this.proxySettings = determineProxySettings()
    logProxyStatus(this.proxySettings)
  }

  /**
   * ブラウザを起動
   */
  async launch(options: ScraperOptions = {}): Promise<void> {
    try {
      const launchOptions: LaunchOptions = {
        headless: options.headless ?? true,
        defaultViewport: { width: 1920, height: 1080 },
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      }

      // プロキシ設定の適用
      if (this.proxySettings.enabled && this.proxySettings.config) {
        const proxyUrl = generateProxyUrl(this.proxySettings.config)
        launchOptions.args?.push(`--proxy-server=${proxyUrl}`)

        // 認証が必要な場合のプロキシ認証設定
        if (this.proxySettings.config.username && this.proxySettings.config.password) {
          launchOptions.args?.push(
            `--proxy-auth=${this.proxySettings.config.username}:${this.proxySettings.config.password}`
          )
        }
      }

      this.browser = await puppeteer.launch(launchOptions)
    } catch (error) {
      throw new Error(`ブラウザの起動に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 新しいページを作成
   */
  async createPage(options: ScraperOptions = {}): Promise<Page> {
    if (!this.browser) {
      throw new Error("ブラウザが起動されていません。先にlaunch()を実行してください。")
    }

    try {
      const page = await this.browser.newPage()

      // ユーザーエージェントの設定
      if (options.userAgent) {
        await page.setUserAgent(options.userAgent)
      } else {
        // デフォルトのランダムユーザーエージェント
        const defaultUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        await page.setUserAgent(defaultUserAgent)
      }

      // タイムアウト設定
      const timeout = options.timeout ?? 30000
      page.setDefaultTimeout(timeout)
      page.setDefaultNavigationTimeout(timeout)

      // プロキシ認証の設定（Basic認証）
      if (this.proxySettings.enabled && this.proxySettings.config?.username && this.proxySettings.config?.password) {
        await page.authenticate({
          username: this.proxySettings.config.username,
          password: this.proxySettings.config.password,
        })
      }

      return page
    } catch (error) {
      throw new Error(`ページの作成に失敗しました: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * ページにアクセス
   */
  async navigateToPage(page: Page, url: string): Promise<void> {
    try {
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })
    } catch (error) {
      throw new Error(`ページへのアクセスに失敗しました (${url}): ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * スクレイピング実行のラッパー
   */
  async scrape<T>(
    url: string,
    scrapeFunction: (page: Page) => Promise<T>,
    options: ScraperOptions = {}
  ): Promise<ScraperResult<T>> {
    let page: Page | null = null

    try {
      // ブラウザが起動していない場合は起動
      if (!this.browser) {
        await this.launch(options)
      }

      page = await this.createPage(options)
      await this.navigateToPage(page, url)

      // スクレイピング実行
      const data = await scrapeFunction(page)

      return {
        success: true,
        data,
        proxyUsed: this.proxySettings.enabled,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        proxyUsed: this.proxySettings.enabled,
      }
    } finally {
      // ページのクリーンアップ
      if (page) {
        try {
          await page.close()
        } catch (error) {
          console.warn("ページのクローズに失敗しました:", error)
        }
      }
    }
  }

  /**
   * ブラウザを終了
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close()
        this.browser = null
      } catch (error) {
        console.warn("ブラウザのクローズに失敗しました:", error)
      }
    }
  }

  /**
   * プロキシ設定の取得
   */
  getProxySettings(): ProxySettings {
    return this.proxySettings
  }
}