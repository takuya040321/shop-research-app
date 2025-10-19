/**
 * 共通スクレイピングライブラリ
 * プロキシ統合とエラーハンドリングを提供
 */

import puppeteer, { Browser, Page, LaunchOptions } from "puppeteer"
import { determineProxySettings, logProxyStatus, type ProxySettings } from "./proxy"
import { supabaseServer } from "./supabase-server"
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
   * - スクレイピングされなかった既存商品: DELETE（物理削除）
   * - 重複商品: 処理終了後に削除（カテゴリー横断で同じ商品が登録されるのを防ぐ）
   *
   * 商品の一致判定: source_url AND name の両方で判定
   * - 理由1: セール等で商品名が変わる可能性がある
   * - 理由2: 同じURLで単品/セット商品が両方存在する可能性がある
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
    deletedCount: number
    skippedCount: number
    duplicatesRemovedCount: number
    errors: string[]
  }> {
    let insertedCount = 0
    let updatedCount = 0
    let deletedCount = 0
    let skippedCount = 0
    let duplicatesRemovedCount = 0
    const errors: string[] = []

    try {
      // 1. 既存商品を全取得
      // スクレイピング処理ではプロキシ対応のサーバークライアントを使用
      const db = supabaseServer
      const { data: existingProducts, error: fetchError } = await db
        .from("products")
        .select("id, name, price, sale_price, image_url, source_url, original_product_id")
        .eq("shop_type", shopType)
        .eq("shop_name", shopName)
        .returns<Pick<Product, "id" | "name" | "price" | "sale_price" | "image_url" | "source_url" | "original_product_id">[]>()

      if (fetchError) {
        errors.push(`既存商品の取得でエラー: ${fetchError.message}`)
        return { insertedCount, updatedCount, deletedCount, skippedCount, duplicatesRemovedCount, errors }
      }

      // 2. 既存商品のマップを作成（source_url + name で一意に識別）
      const existingProductsMap = new Map<string, typeof existingProducts[0]>()
      existingProducts?.forEach(product => {
        const key = `${product.source_url || ""}|||${product.name}`
        existingProductsMap.set(key, product)
      })

      // 3. スクレイピングされた商品のキーセット
      const scrapedProductKeys = new Set(
        scrapedProducts.map(p => `${p.productUrl || ""}|||${p.name}`)
      )

      // 4. 商品を分類
      const toInsert: ProductInsert[] = []
      const toUpdate: Array<{ id: string; data: ProductUpdate }> = []

      for (const product of scrapedProducts) {
        // source_url + name で既存商品を検索
        const key = `${product.productUrl || ""}|||${product.name}`
        const existing = existingProductsMap.get(key)

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
          // 既存商品：price, sale_price, image_url のいずれかが変更された場合のみ更新
          // source_url は一致判定に使用するため、比較対象から除外
          const priceChanged = existing.price !== product.price
          const salePriceChanged = existing.sale_price !== (product.salePrice || null)
          const imageChanged = existing.image_url !== (product.imageUrl || null)

          if (priceChanged || salePriceChanged || imageChanged) {
            toUpdate.push({
              id: existing.id,
              data: {
                price: product.price,
                sale_price: product.salePrice || null,
                image_url: product.imageUrl || null
              }
            })
          } else {
            skippedCount++
          }
        }
      }

      // 5. スクレイピングされなかった商品を物理削除対象として収集
      // source_url + name の組み合わせで判定
      // コピー商品（original_product_id が null でない）は削除対象外
      const toDelete: string[] = []
      existingProducts?.forEach(existing => {
        // コピー商品はスキップ
        if (existing.original_product_id) {
          return
        }

        const key = `${existing.source_url || ""}|||${existing.name}`
        if (!scrapedProductKeys.has(key)) {
          toDelete.push(existing.id)
        }
      })

      // 6. バッチ処理で保存
      // 新規商品の挿入
      if (toInsert.length > 0) {
        const { error: insertError } = await db
          .from("products")
          .insert(toInsert as never)

        if (insertError) {
          errors.push(`新規商品の挿入でエラー: ${insertError.message}`)
        } else {
          insertedCount = toInsert.length
        }
      }

      // 既存商品の更新
      if (toUpdate.length > 0) {
        for (const update of toUpdate) {
          const { error: updateError } = await db
            .from("products")
            .update(update.data as never)
            .eq("id", update.id)

          if (updateError) {
            errors.push(`商品更新でエラー (ID: ${update.id}): ${updateError.message}`)
          } else {
            updatedCount++
          }
        }
      }

      // 販売終了商品を物理削除
      if (toDelete.length > 0) {
        const { error: deleteError } = await db
          .from("products")
          .delete()
          .in("id", toDelete)

        if (deleteError) {
          errors.push(`商品削除でエラー: ${deleteError.message}`)
        } else {
          deletedCount = toDelete.length

          // 削除されたオリジナル商品を参照しているコピー商品も削除
          const { data: copiedProducts, error: copiedFetchError } = await db
            .from("products")
            .select("id")
            .in("original_product_id", toDelete)

          if (copiedFetchError) {
            errors.push(`コピー商品の取得でエラー: ${copiedFetchError.message}`)
          } else if (copiedProducts && copiedProducts.length > 0) {
            const copiedProductIds = copiedProducts.map(p => p.id)
            const { error: copiedDeleteError } = await db
              .from("products")
              .delete()
              .in("id", copiedProductIds)

            if (copiedDeleteError) {
              errors.push(`コピー商品削除でエラー: ${copiedDeleteError.message}`)
            } else {
              deletedCount += copiedProducts.length
            }
          }
        }
      }

      // 7. 重複商品の削除
      // カテゴリー横断で同じ商品（source_url + name が同じ）が複数登録されている場合、
      // 最新のもの以外を削除
      // コピー商品（original_product_id が null でない）は削除対象外
      const { data: allProductsAfterUpdate, error: duplicateCheckError } = await db
        .from("products")
        .select("id, name, source_url, created_at, original_product_id")
        .eq("shop_type", shopType)
        .eq("shop_name", shopName)
        .order("created_at", { ascending: false })

      if (duplicateCheckError) {
        errors.push(`重複チェックでエラー: ${duplicateCheckError.message}`)
      } else if (allProductsAfterUpdate) {
        // source_url + name でグループ化して重複を検出
        const seenKeys = new Set<string>()
        const duplicateIds: string[] = []

        allProductsAfterUpdate.forEach(product => {
          // コピー商品はスキップ
          if (product.original_product_id) {
            return
          }

          const key = `${product.source_url || ""}|||${product.name}`

          if (seenKeys.has(key)) {
            // すでに見たキー = 重複商品（古い方）
            duplicateIds.push(product.id)
          } else {
            seenKeys.add(key)
          }
        })

        // 重複商品を削除
        if (duplicateIds.length > 0) {
          const { error: duplicateDeleteError } = await db
            .from("products")
            .delete()
            .in("id", duplicateIds)

          if (duplicateDeleteError) {
            errors.push(`重複商品削除でエラー: ${duplicateDeleteError.message}`)
          } else {
            duplicatesRemovedCount = duplicateIds.length
          }
        }
      }

      // 8. 結果サマリーをログ出力
      console.log("===== スクレイピング結果サマリー =====")
      console.log(`ショップ: ${shopType} - ${shopName}`)
      console.log(`新規追加: ${insertedCount}件`)
      console.log(`更新: ${updatedCount}件`)
      console.log(`削除（販売終了）: ${deletedCount}件`)
      console.log(`スキップ（変更なし）: ${skippedCount}件`)
      console.log(`重複削除: ${duplicatesRemovedCount}件`)
      console.log(`合計処理数: ${insertedCount + updatedCount + deletedCount + skippedCount}件`)
      console.log("=====================================")

      return { insertedCount, updatedCount, deletedCount, skippedCount, duplicatesRemovedCount, errors }
    } catch (error) {
      errors.push(`商品保存処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
      return { insertedCount, updatedCount, deletedCount, skippedCount, duplicatesRemovedCount, errors }
    }
  }
}