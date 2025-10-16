/**
 * 共通スクレイピングライブラリ
 * プロキシ統合とエラーハンドリングを提供
 */

import puppeteer, { Browser, Page, LaunchOptions } from "puppeteer"
import { determineProxySettings, generateProxyUrl, logProxyStatus, type ProxySettings } from "./proxy"
import { supabase } from "./supabase"
import type { ProductInsert, ProductUpdate, Product } from "@/types/database"
import { randomUUID } from "crypto"

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

  constructor(suppressProxyLog: boolean = false) {
    // プロキシ設定の事前判定（必須）
    this.proxySettings = determineProxySettings()

    // プロキシログを抑制しない場合のみ出力
    if (!suppressProxyLog) {
      logProxyStatus(this.proxySettings)
    }
  }

  /**
   * ブラウザを起動
   */
  async launch(options: ScraperOptions = {}): Promise<void> {
    // 既に起動済みの場合はスキップ
    if (this.browser) {
      return
    }

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
        // プロキシサーバーのみを指定（認証情報は含めない）
        const proxyServer = `http://${this.proxySettings.config.host}:${this.proxySettings.config.port}`
        launchOptions.args?.push(`--proxy-server=${proxyServer}`)
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

  /**
   * 商品データを保存・更新する汎用メソッド
   * - 新規商品: INSERT
   * - 価格変動がある既存商品: UPDATE
   * - スクレイピングされなかった既存商品: is_hidden = true
   */
  async saveOrUpdateProducts(
    scrapedProducts: Array<{
      name: string
      price: number | null
      salePrice?: number | null
      imageUrl?: string | null
      productUrl?: string | null
    }>,
    shopType: string,
    shopName: string
  ): Promise<{
    insertedCount: number
    updatedCount: number
    hiddenCount: number
    skippedCount: number
    errors: string[]
  }> {
    let insertedCount = 0
    let updatedCount = 0
    let hiddenCount = 0
    let skippedCount = 0
    const errors: string[] = []

    try {
      // 1. 既存商品を全取得
      const { data: existingProducts, error: fetchError } = await supabase
        .from("products")
        .select("id, name, price, sale_price, image_url, source_url, is_hidden")
        .eq("shop_type", shopType)
        .eq("shop_name", shopName)
        .returns<Pick<Product, "id" | "name" | "price" | "sale_price" | "image_url" | "source_url" | "is_hidden">[]>()

      if (fetchError) {
        errors.push(`既存商品の取得でエラー: ${fetchError.message}`)
        return { insertedCount, updatedCount, hiddenCount, skippedCount, errors }
      }

      // 2. 既存商品のマップを作成
      const existingProductsMap = new Map<string, typeof existingProducts[0]>()
      existingProducts?.forEach(product => {
        existingProductsMap.set(product.name, product)
      })

      // 3. スクレイピングされた商品名のセット
      const scrapedProductNames = new Set(scrapedProducts.map(p => p.name))

      // 4. 商品を分類
      const toInsert: ProductInsert[] = []
      const toUpdate: Array<{ id: string; data: ProductUpdate }> = []

      for (const product of scrapedProducts) {
        const existing = existingProductsMap.get(product.name)

        if (!existing) {
          // 新規商品
          toInsert.push({
            id: randomUUID(),
            shop_type: shopType,
            shop_name: shopName,
            name: product.name,
            price: product.price,
            sale_price: product.salePrice || null,
            image_url: product.imageUrl || null,
            source_url: product.productUrl || null,
            is_hidden: false
          })
        } else {
          // 既存商品：価格またはセール価格に変動がある場合のみ更新
          const priceChanged = existing.price !== product.price
          const salePriceChanged = existing.sale_price !== (product.salePrice || null)
          const imageChanged = existing.image_url !== (product.imageUrl || null)
          const urlChanged = existing.source_url !== (product.productUrl || null)

          if (priceChanged || salePriceChanged || imageChanged || urlChanged) {
            toUpdate.push({
              id: existing.id,
              data: {
                price: product.price,
                sale_price: product.salePrice || null,
                image_url: product.imageUrl || null,
                source_url: product.productUrl || null,
                is_hidden: false // 再度スクレイピングされたら表示に戻す
              }
            })
          } else {
            // 変更なしの場合でも、is_hiddenがtrueなら表示に戻す
            if (existing.is_hidden) {
              toUpdate.push({
                id: existing.id,
                data: { is_hidden: false }
              })
            } else {
              skippedCount++
            }
          }
        }
      }

      // 5. スクレイピングされなかった商品を非表示化
      const toHide: string[] = []
      existingProducts?.forEach(existing => {
        if (!scrapedProductNames.has(existing.name) && !existing.is_hidden) {
          toHide.push(existing.id)
        }
      })

      // 6. バッチ処理で保存
      // 新規商品の挿入
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("products")
          .insert(toInsert as never)

        if (insertError) {
          errors.push(`新規商品の挿入でエラー: ${insertError.message}`)
        } else {
          insertedCount = toInsert.length
          console.log(`${insertedCount}件の新規商品を挿入しました`)
        }
      }

      // 既存商品の更新
      if (toUpdate.length > 0) {
        for (const update of toUpdate) {
          const { error: updateError } = await supabase
            .from("products")
            .update(update.data as never)
            .eq("id", update.id)

          if (updateError) {
            errors.push(`商品更新でエラー (ID: ${update.id}): ${updateError.message}`)
          } else {
            updatedCount++
          }
        }
        console.log(`${updatedCount}件の商品を更新しました`)
      }

      // 販売終了商品を非表示化
      if (toHide.length > 0) {
        const { error: hideError } = await supabase
          .from("products")
          .update({ is_hidden: true } as never)
          .in("id", toHide)

        if (hideError) {
          errors.push(`商品非表示化でエラー: ${hideError.message}`)
        } else {
          hiddenCount = toHide.length
          console.log(`${hiddenCount}件の商品を非表示化しました（販売終了と判断）`)
        }
      }

      return { insertedCount, updatedCount, hiddenCount, skippedCount, errors }
    } catch (error) {
      errors.push(`商品保存処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
      return { insertedCount, updatedCount, hiddenCount, skippedCount, errors }
    }
  }
}