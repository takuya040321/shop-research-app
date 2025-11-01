/**
 * innisfree公式サイト スクレイパー
 */

import { Page } from "puppeteer"
import * as cheerio from "cheerio"
import { BaseScraper, ScraperResult, ScraperOptions } from "../scraper"

// innisfree商品データ型
export interface InnisfreeProduct {
  name: string
  price: number | null
  salePrice: number | null
  imageUrl: string | null
  productUrl: string
  description?: string | undefined
}

// スクレイピング設定
const INNISFREE_CONFIG = {
  baseUrl: "https://www.innisfree.jp/",
  categoryUrls: [
    "/ja/product/list?categoryCode=0001", // スキンケア
    "/ja/product/list?categoryCode=0002", // メイクアップ
    "/ja/product/list?categoryCode=0003", // ボディケア
    "/ja/product/list?categoryCode=0004", // ヘアケア
    "/ja/product/list?categoryCode=0005", // サンケア
  ],
  selectors: {
    productItems: ".product-item, .item, li",
    productLink: "a[href*='/product/']",
    productName: ".name, .title, h3, h4",
    productPrice: ".price, .cost",
    productImage: "img",
    nextPage: "a[href*='page=']"
  },
  timeout: 30000,
  maxRetries: 3
}

export class InnisfreeScraper extends BaseScraper {
  constructor(suppressProxyLog: boolean = false) {
    super(suppressProxyLog)
  }

  /**
   * 商品詳細ページから価格情報を取得
   */
  async scrapeProductDetails(productUrl: string, page: Page): Promise<{price: number | null, salePrice: number | null, description: string | null}> {
    try {
      await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 15000 })

      const html = await page.content()
      const $ = cheerio.load(html)

      let price: number | null = null
      let salePrice: number | null = null
      let description: string | null = null

      // 価格取得（複数のセレクタを試行）
      const priceSelectors = [
        '.price', '.cost', '.regular-price', '[class*="price"]',
        '#price', '.product-price', '.prd-price'
      ]

      for (const selector of priceSelectors) {
        if (!price) {
          const priceEl = $(selector).first()
          if (priceEl.length > 0) {
            const priceText = priceEl.text().trim()
            price = this.parsePrice(priceText)
          }
        }
      }

      // セール価格取得
      const salePriceSelectors = [
        '.sale-price', '.special-price', '[class*="sale"]',
        '.discount-price', '.prd-sale-price'
      ]

      for (const selector of salePriceSelectors) {
        if (!salePrice) {
          const salePriceEl = $(selector).first()
          if (salePriceEl.length > 0) {
            const salePriceText = salePriceEl.text().trim()
            salePrice = this.parsePrice(salePriceText)
          }
        }
      }

      // 商品説明取得
      const descriptionSelectors = [
        '.description', '.product-description', '.detail',
        '[class*="description"]', '.prd-desc'
      ]

      for (const selector of descriptionSelectors) {
        if (!description) {
          const descEl = $(selector).first()
          if (descEl.length > 0) {
            description = descEl.text().trim().substring(0, 500) // 最大500文字
          }
        }
      }

      return { price, salePrice, description }
    } catch (error) {
      console.warn(`商品詳細ページの取得でエラー (${productUrl}):`, error)
      return { price: null, salePrice: null, description: null }
    }
  }

  /**
   * 指定されたカテゴリページをスクレイピング
   */
  async scrapeCategoryPage(categoryUrl: string, page: Page): Promise<InnisfreeProduct[]> {
    const products: InnisfreeProduct[] = []
    let pageNum = 1

    while (true) {
      const url = pageNum === 1 ? categoryUrl : `${categoryUrl}&page=${pageNum}`

      await page.goto(url, { waitUntil: 'networkidle2' })

      // 商品リストが読み込まれるまで待機
      try {
        await page.waitForSelector('li, .item, .product-item', { timeout: 10000 })
      } catch {
        break
      }

      // HTMLを取得してCheerioで解析
      const html = await page.content()
      const $ = cheerio.load(html)

      let pageProducts = 0

      // 各商品要素を解析
      const productElements = $('li, .item, .product-item').toArray()
      for (const element of productElements) {
        try {
          const $product = $(element)

          // 商品リンクがあるかチェック
          const $link = $product.find("a[href*='/product/']")
          if ($link.length === 0) continue

          // 商品名を取得
          let name = $link.find('.name, .title, h3, h4').first().text().trim()
          if (!name) {
            name = $link.attr('title')?.trim() || ''
          }
          if (!name) continue

          // 商品詳細ページURLを取得
          let productUrl = $link.attr('href')
          if (productUrl && productUrl.startsWith('/')) {
            productUrl = `${INNISFREE_CONFIG.baseUrl}${productUrl}`
          } else if (productUrl && !productUrl.startsWith('http')) {
            productUrl = `${INNISFREE_CONFIG.baseUrl}/${productUrl}`
          }

          if (!productUrl) continue

          // 一覧ページから価格を抽出を試行
          let price: number | null = null
          let salePrice: number | null = null
          let description: string | null = null

          // 価格抽出
          $product.find('.price, .cost, [class*="price"]').each((_, priceEl) => {
            const priceText = $(priceEl).text().trim()
            if (priceText.includes('¥') || priceText.match(/\d/)) {
              if (!price) {
                price = this.parsePrice(priceText)
              }
            }
          })

          // 一覧ページから価格が取得できなかった場合は詳細ページにアクセス
          if (!price) {
            const details = await this.scrapeProductDetails(productUrl, page)
            price = details.price
            salePrice = details.salePrice
            description = details.description

            // 詳細ページアクセス後の短い待機（負荷軽減）
            await new Promise(resolve => setTimeout(resolve, 300))
          }

          // 商品画像URLを取得
          let imageUrl = $product.find('img').attr('src')
          if (imageUrl && imageUrl.startsWith('//')) {
            imageUrl = `https:${imageUrl}`
          } else if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = `${INNISFREE_CONFIG.baseUrl}${imageUrl}`
          }

          const product: InnisfreeProduct = {
            name,
            price,
            salePrice,
            imageUrl: imageUrl || null,
            productUrl,
            description: description || undefined
          }

          products.push(product)
          pageProducts++
        } catch (error) {
          console.warn("商品データの解析でエラーが発生しました:", error)
        }
      }

      // 次のページがあるかチェック
      const hasNextPage = $("a[href*='page=']").length > 0 && pageProducts > 0
      if (!hasNextPage) {
        break
      }

      pageNum++

      // 安全のため最大10ページまで
      if (pageNum > 10) {
        break
      }

      // ページ間の短い待機
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return products
  }

  /**
   * 全カテゴリの商品をスクレイピング
   */
  async scrapeProducts(options: ScraperOptions = {}): Promise<ScraperResult<InnisfreeProduct[]>> {
    return await this.scrape(
      INNISFREE_CONFIG.baseUrl,
      async (page: Page) => {
        const allProducts: InnisfreeProduct[] = []

        // 各カテゴリをスクレイピング
        for (const categoryPath of INNISFREE_CONFIG.categoryUrls) {
          const categoryUrl = categoryPath.startsWith('http')
            ? categoryPath
            : `${INNISFREE_CONFIG.baseUrl}${categoryPath}`

          try {
            console.log(`カテゴリをスクレイピング中: ${categoryPath}`)
            const categoryProducts = await this.scrapeCategoryPage(categoryUrl, page)

            console.log(`カテゴリ ${categoryPath}: ${categoryProducts.length}件の商品を取得`)

            allProducts.push(...categoryProducts)

            // カテゴリ間の待機（レート制限対策）
            await new Promise(resolve => setTimeout(resolve, 2000))
          } catch (error) {
            console.error(`カテゴリ ${categoryPath} のスクレイピングでエラー:`, error)
          }
        }

        console.log(`合計 ${allProducts.length}件の商品を取得しました`)
        return allProducts
      },
      {
        ...options,
        timeout: INNISFREE_CONFIG.timeout
      }
    )
  }

  /**
   * 価格文字列を数値に変換
   */
  private parsePrice(priceText: string): number | null {
    if (!priceText) return null

    // ¥マークと数字を含むパターンをマッチ
    const match = priceText.match(/¥?\s*([0-9,]+)/)
    if (!match || !match[1]) return null

    // カンマを削除して数値に変換
    const priceStr = match[1].replace(/,/g, '')
    const price = parseInt(priceStr, 10)

    return isNaN(price) ? null : price
  }

  /**
   * スクレイピングした商品をデータベースに保存
   * BaseScraperの汎用メソッドを使用
   */
  async saveProductsToDatabase(products: InnisfreeProduct[]): Promise<{
    savedCount: number
    skippedCount: number
    duplicatesRemovedCount: number
    errors: string[]
  }> {
    // BaseScraperの汎用メソッドを使用
    const result = await this.saveOrUpdateProducts(
      products.map(p => ({
        name: p.name,
        price: p.price,
        salePrice: p.salePrice || null,
        imageUrl: p.imageUrl,
        productUrl: p.productUrl
      })),
      "official",
      "innisfree"
    )

    // 結果を従来の形式に変換して返す
    return {
      savedCount: result.insertedCount + result.updatedCount,
      skippedCount: result.skippedCount,
      duplicatesRemovedCount: result.duplicatesRemovedCount,
      errors: result.errors
    }
  }

  /**
   * innisfreeスクレイピングの完全実行
   */
  async executeFullScraping(options: ScraperOptions = {}): Promise<{
    success: boolean
    totalProducts: number
    savedProducts: number
    skippedProducts: number
    errors: string[]
    proxyUsed: boolean
  }> {
    try {
      console.log("innisfreeスクレイピングを開始します...")

      // 商品データをスクレイピング
      const scrapingResult = await this.scrapeProducts(options)

      if (!scrapingResult.success || !scrapingResult.data) {
        return {
          success: false,
          totalProducts: 0,
          savedProducts: 0,
          skippedProducts: 0,
          errors: [scrapingResult.error || "スクレイピングに失敗しました"],
          proxyUsed: scrapingResult.proxyUsed
        }
      }

      const products = scrapingResult.data
      console.log(`合計 ${products.length}件の商品データを取得しました`)

      // 全カテゴリのスクレイピング完了後、商品を一括保存
      console.log("商品データをデータベースに保存中...")
      const saveResult = await this.saveProductsToDatabase(products)

      console.log(`保存完了: 新規${saveResult.savedCount}件 | スキップ${saveResult.skippedCount}件 | 重複削除${saveResult.duplicatesRemovedCount}件`)

      if (saveResult.errors.length > 0) {
        console.warn("保存エラー:", saveResult.errors)
      }

      return {
        success: true,
        totalProducts: products.length,
        savedProducts: saveResult.savedCount,
        skippedProducts: saveResult.skippedCount,
        errors: saveResult.errors,
        proxyUsed: scrapingResult.proxyUsed
      }
    } catch (error) {
      console.error("innisfreeスクレイピングでエラーが発生しました:", error)
      return {
        success: false,
        totalProducts: 0,
        savedProducts: 0,
        skippedProducts: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        proxyUsed: this.getProxySettings().enabled
      }
    } finally {
      // リソースのクリーンアップ
      await this.close()
    }
  }
}
