/**
 * お気に入り商品専用スクレイパー
 * 既存のスクレイパークラスを活用して各ブランドの商品を正確にスクレイピング
 */

import puppeteer, { type Browser, type Page } from "puppeteer"
import { supabaseServer as supabase } from "@/lib/supabase-server"
import type { Product } from "@/types/database"
import { VTCosmeticsScraper } from "./vt-cosmetics-scraper"
import { InnisfreeScraper } from "./innisfree-scraper"
import { DHCScraper } from "./dhc-scraper"

interface ScrapingResult {
  success: boolean
  productId: string
  productName: string
  error?: string
  updatedFields?: {
    price?: number | undefined
    sale_price?: number | undefined
    image_url?: string | undefined
  }
}

interface FavoriteScraperResult {
  success: boolean
  totalProducts: number
  successCount: number
  failureCount: number
  results: ScrapingResult[]
  proxyUsed: boolean
}

export class FavoriteScraper {
  private browser: Browser | null = null
  private useProxy: boolean = false
  private vtScraper: VTCosmeticsScraper
  private innisfreeScraper: InnisfreeScraper
  private dhcScraper: DHCScraper

  constructor() {
    // プロキシ設定を環境変数から取得
    this.useProxy = process.env.USE_PROXY === "true"

    // プロキシ状態をログ出力（1回のみ）
    if (this.useProxy) {
      console.log("プロキシ設定を使用します")
    } else {
      console.log("プロキシを使用しません")
    }

    // 各ブランド専用スクレイパーを初期化（プロキシログは抑制）
    this.vtScraper = new VTCosmeticsScraper(true)
    this.innisfreeScraper = new InnisfreeScraper(true)
    this.dhcScraper = new DHCScraper(true)
  }

  /**
   * お気に入り商品をスクレイピング
   */
  async scrapeFavoriteProducts(): Promise<FavoriteScraperResult> {
    const results: ScrapingResult[] = []
    let successCount = 0
    let failureCount = 0

    try {
      // お気に入り商品を取得（source_urlが存在するもののみ）
      const { data: favoriteProducts, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_favorite", true)
        .not("source_url", "is", null)
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(`お気に入り商品の取得に失敗: ${error.message}`)
      }

      if (!favoriteProducts || favoriteProducts.length === 0) {
        console.log("スクレイピング対象のお気に入り商品が見つかりませんでした")
        return {
          success: true,
          totalProducts: 0,
          successCount: 0,
          failureCount: 0,
          results: [],
          proxyUsed: this.useProxy
        }
      }

      const products = favoriteProducts as Product[]
      console.log(`${products.length}件のお気に入り商品をスクレイピング開始...`)

      // ブラウザを起動
      await this.launchBrowser()

      if (!this.browser) {
        throw new Error("ブラウザの起動に失敗しました")
      }

      // ページを作成（全商品で共通のページを使用）
      const page = await this.browser.newPage()

      // プロキシ認証を設定（認証情報がある場合）
      if (this.useProxy) {
        const proxyUsername = process.env.PROXY_USERNAME
        const proxyPassword = process.env.PROXY_PASSWORD
        if (proxyUsername && proxyPassword) {
          await page.authenticate({
            username: proxyUsername,
            password: proxyPassword
          })
        }
      }

      // 各商品を個別にスクレイピング
      for (const product of products) {
        try {
          console.log(`\n[${product.name}] スクレイピング開始...`)

          const result = await this.scrapeProduct(product, page)
          results.push(result)

          if (result.success) {
            successCount++
            console.log(`[${product.name}] ✓ 成功`)
          } else {
            failureCount++
            console.log(`[${product.name}] ✗ 失敗: ${result.error}`)
          }

          // サーバー負荷軽減のため待機
          await this.delay(2000)

        } catch (error) {
          failureCount++
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`[${product.name}] エラー:`, errorMessage)

          results.push({
            success: false,
            productId: product.id,
            productName: product.name,
            error: errorMessage
          })
        }
      }

      await page.close()

      return {
        success: true,
        totalProducts: products.length,
        successCount,
        failureCount,
        results,
        proxyUsed: this.useProxy
      }

    } catch (error) {
      console.error("お気に入り商品スクレイピングエラー:", error)
      throw error
    } finally {
      await this.closeBrowser()
    }
  }

  /**
   * 個別商品をスクレイピング
   */
  private async scrapeProduct(product: Product, page: Page): Promise<ScrapingResult> {
    if (!product.source_url) {
      return {
        success: false,
        productId: product.id,
        productName: product.name,
        error: "商品URLが存在しません"
      }
    }

    try {
      // URLからショップタイプを判定
      const shopType = this.detectShopType(product.source_url)

      if (!shopType) {
        return {
          success: false,
          productId: product.id,
          productName: product.name,
          error: "対応していないショップURLです"
        }
      }

      // ショップタイプに応じて既存スクレイパーの詳細取得メソッドを使用
      const scrapedData = await this.scrapeByShopType(product.source_url, shopType, page)

      if (!scrapedData || (!scrapedData.price && !scrapedData.salePrice)) {
        return {
          success: false,
          productId: product.id,
          productName: product.name,
          error: "商品データの取得に失敗しました"
        }
      }

      // データベースを更新
      const updates: Record<string, number | string | null> = {}

      // 定価を更新
      if (scrapedData.price !== undefined && scrapedData.price !== null) {
        updates.price = scrapedData.price
      }

      // セール価格を更新（セールがない場合は明示的にnullにして既存のセール価格をクリア）
      updates.sale_price = (scrapedData.salePrice !== undefined && scrapedData.salePrice !== null)
        ? scrapedData.salePrice
        : null

      // 更新内容をログ出力
      console.log(`[DB更新] 商品ID: ${product.id}, 更新内容:`, JSON.stringify(updates))

      if (Object.keys(updates).length === 0) {
        console.warn(`[DB更新] 更新データが空のためスキップ`)
        return {
          success: false,
          productId: product.id,
          productName: product.name,
          error: "価格データが取得できませんでした"
        }
      }

      const { error: updateError } = await supabase
        .from("products")
        .update(updates as never)
        .eq("id", product.id)

      if (updateError) {
        throw new Error(`データベース更新エラー: ${updateError.message}`)
      }

      console.log(`[DB更新] 成功 - 商品: ${product.name}`)

      return {
        success: true,
        productId: product.id,
        productName: product.name,
        updatedFields: {
          price: scrapedData.price || undefined,
          sale_price: scrapedData.salePrice || undefined,
          image_url: undefined
        }
      }

    } catch (error) {
      return {
        success: false,
        productId: product.id,
        productName: product.name,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * URLからショップタイプを検出
   */
  private detectShopType(url: string): string | null {
    if (url.includes("vtcosmetics.jp")) return "vt"
    if (url.includes("innisfree.com")) return "innisfree"
    if (url.includes("dhc.co.jp")) return "dhc"
    return null
  }

  /**
   * ショップタイプ別にスクレイピング（既存スクレイパーの詳細取得メソッドを活用）
   */
  private async scrapeByShopType(
    url: string,
    shopType: string,
    page: Page
  ): Promise<{ price: number | null; salePrice: number | null } | null> {
    try {
      switch (shopType) {
        case "vt":
          return await this.vtScraper.scrapeProductDetails(url, page)
        case "innisfree": {
          const result = await this.innisfreeScraper.scrapeProductDetails(url, page)
          return { price: result.price, salePrice: result.salePrice }
        }
        case "dhc": {
          const result = await this.dhcScraper.scrapeProductDetails(url, page)
          return { price: result.price, salePrice: result.salePrice }
        }
        default:
          return null
      }
    } catch (error) {
      console.error(`スクレイピングエラー (${shopType}):`, error)
      return null
    }
  }

  /**
   * ブラウザを起動
   */
  private async launchBrowser(): Promise<void> {
    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }

    // プロキシ設定（BaseScraperと同じ環境変数を使用）
    if (this.useProxy) {
      const proxyHost = process.env.PROXY_HOST
      const proxyPort = process.env.PROXY_PORT
      const proxyUsername = process.env.PROXY_USERNAME
      const proxyPassword = process.env.PROXY_PASSWORD

      if (proxyHost && proxyPort) {
        // プロキシサーバーのみを指定（認証情報は含めない）
        const proxyServer = `http://${proxyHost}:${proxyPort}`
        launchOptions.args = launchOptions.args || []
        launchOptions.args.push(`--proxy-server=${proxyServer}`)
        console.log(`プロキシ設定を適用: ${proxyHost}:${proxyPort}`)

        this.browser = await puppeteer.launch(launchOptions)

        // プロキシ認証を設定（認証情報がある場合）
        if (proxyUsername && proxyPassword) {
          const page = await this.browser.newPage()
          await page.authenticate({
            username: proxyUsername,
            password: proxyPassword
          })
          await page.close()
          console.log("プロキシ認証を設定しました")
        }

        return
      } else {
        console.warn("USE_PROXY=trueですが、PROXY_HOSTまたはPROXY_PORTが設定されていません。プロキシなしで起動します。")
      }
    }

    this.browser = await puppeteer.launch(launchOptions)
  }

  /**
   * ブラウザを閉じる
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * 待機
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
