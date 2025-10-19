/**
 * VT Cosmetics公式サイト スクレイパー
 */

import { Page } from "puppeteer"
import * as cheerio from "cheerio"
import { BaseScraper, ScraperResult, ScraperOptions } from "../scraper"
import { deduplicateAfterScraping } from "../deduplication"

// VT Cosmetics商品データ型
export interface VTProduct {
  name: string
  price: number | null
  salePrice: number | null
  imageUrl: string | null
  productUrl: string
  description?: string
}

// スクレイピング設定
const VT_COSMETICS_CONFIG = {
  baseUrl: "https://vtcosmetics.jp",
  categoryUrls: [
    "/category/cica/51/",
    "/category/pro-cica/203/",
    "/category/cica-vital/100/",
    "/category/cica-reti-a/102/",
    "/category/cica-natural/114/",
    "/category/cica-collagen/208/",
    "/category/reedle-s/199/",
    "/category/pdrn/254/",
    "/category/az-care/286/"
  ],
  selectors: {
    productItems: "li",
    productLink: "a[href*='/product/detail.html']",
    productName: "span, strong",
    productPrice: "span",
    productImage: "img",
    nextPage: "a[href*='page=']"
  },
  timeout: 30000,
  maxRetries: 3
}

export class VTCosmeticsScraper extends BaseScraper {
  constructor(suppressProxyLog: boolean = false) {
    super(suppressProxyLog)
  }

  /**
   * 商品詳細ページから価格情報を取得
   */
  async scrapeProductDetails(productUrl: string, page: Page): Promise<{price: number | null, salePrice: number | null}> {
    try {
      await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 15000 })

      const html = await page.content()
      const $ = cheerio.load(html)

      let price: number | null = null
      let salePrice: number | null = null

      // 元価格を取得 (span_product_price_text)
      const originalPriceEl = $('#span_product_price_text, span[id="span_product_price_text"], strong[id="span_product_price_text"]')
      if (originalPriceEl.length > 0) {
        const priceText = originalPriceEl.text().trim()
        price = this.parsePrice(priceText)
      }

      // セール価格を取得 (span_product_price_sale)
      const salePriceEl = $('#span_product_price_sale')
      if (salePriceEl.length > 0) {
        const salePriceText = salePriceEl.text().trim()
        salePrice = this.parsePrice(salePriceText)
      }

      // JavaScriptの変数からも価格を取得を試行
      if (!price || !salePrice) {
        const scriptContent = $('script').text()

        // product_price変数
        const priceMatch = scriptContent.match(/product_price\s*=\s*['"]?(\d+)['"]?/)
        if (priceMatch && priceMatch[1] && !price) {
          price = parseInt(priceMatch[1], 10)
        }

        // product_sale_price変数
        const salePriceMatch = scriptContent.match(/product_sale_price\s*=\s*(\d+)/)
        if (salePriceMatch && salePriceMatch[1] && !salePrice) {
          salePrice = parseInt(salePriceMatch[1], 10)
        }
      }

      // セール価格が設定されている場合は、価格とセール価格を入れ替える
      if (salePrice && salePrice > 0 && price && salePrice < price) {
        // salePrice が price より小さい場合は正しいセール価格
        return { price, salePrice }
      } else if (salePrice && salePrice > 0) {
        // salePrice の方が大きい場合は、priceがセール価格の可能性
        return { price: salePrice, salePrice: price }
      }

      return { price, salePrice: null }
    } catch (error) {
      console.warn(`商品詳細ページの取得でエラー (${productUrl}):`, error)
      return { price: null, salePrice: null }
    }
  }

  /**
   * 指定されたカテゴリページをスクレイピング
   */
  async scrapeCategoryPage(categoryUrl: string, page: Page): Promise<VTProduct[]> {
    const products: VTProduct[] = []
    let pageNum = 1

    while (true) {
      const url = pageNum === 1 ? categoryUrl : `${categoryUrl}?page=${pageNum}`

      await page.goto(url, { waitUntil: 'networkidle2' })

      // 商品リストが読み込まれるまで待機
      try {
        await page.waitForSelector('li', { timeout: 10000 })
      } catch {
        break
      }

      // HTMLを取得してCheerioで解析
      const html = await page.content()
      const $ = cheerio.load(html)

      let pageProducts = 0

      // 各商品要素を解析
      const productElements = $('li').toArray()
      for (const element of productElements) {
        try {
          const $product = $(element)

          // 商品リンクがあるかチェック
          const $link = $product.find("a[href*='/product/detail.html']")
          if ($link.length === 0) continue

          // 商品名を取得（複数のセレクタを試す）
          let name = $link.find('span').first().text().trim()
          if (!name) {
            name = $link.find('strong').first().text().trim()
          }
          if (!name) continue

          // 商品詳細ページURLを取得
          let productUrl = $link.attr('href')
          if (productUrl && productUrl.startsWith('/')) {
            productUrl = `${VT_COSMETICS_CONFIG.baseUrl}${productUrl}`
          }

          if (!productUrl) continue

          // 最初に一覧ページから価格を抽出を試行（詳細ページアクセスを最小化）
          let price: number | null = null
          let salePrice: number | null = null

          // 一覧ページから価格を抽出
          // 方法1: ¥マークを含むテキストを探す
          $product.find('span, strong, div').each((_, priceEl) => {
            const priceText = $(priceEl).text().trim()
            if (priceText.includes('¥') && !price) {
              price = this.parsePrice(priceText)
            }
          })

          // 方法2: 価格を示すclass名を探す
          if (!price) {
            const priceSelectors = [
              '.price', '.item_price', '.product_price', '.prd_price',
              '[class*="price"]', '[class*="Price"]'
            ]

            for (const selector of priceSelectors) {
              if (!price) {
                const priceEl = $product.find(selector).first()
                if (priceEl.length > 0) {
                  const priceText = priceEl.text().trim()
                  price = this.parsePrice(priceText)
                }
              }
            }
          }

          // 方法3: 数字のみのテキストを探す（金額として妥当な範囲）
          if (!price) {
            $product.find('*').each((_, el) => {
              const text = $(el).text().trim()
              const numMatch = text.match(/^(\d{2,5})$/) // 2-5桁の数字
              if (numMatch && numMatch[1] && !price) {
                const num = parseInt(numMatch[1], 10)
                if (num >= 100 && num <= 50000) { // 妥当な価格範囲
                  price = num
                }
              }
            })
          }

          // 一覧ページから価格が取得できなかった場合のみ詳細ページにアクセス
          if (!price) {
            const priceInfo = await this.scrapeProductDetails(productUrl, page)
            price = priceInfo.price
            salePrice = priceInfo.salePrice

            // 詳細ページアクセス後の短い待機（負荷軽減）
            await new Promise(resolve => setTimeout(resolve, 300))
          }

          // 商品画像URLを取得
          let imageUrl = $product.find('img').attr('src')
          if (imageUrl && imageUrl.startsWith('//')) {
            imageUrl = `https:${imageUrl}`
          } else if (imageUrl && imageUrl.startsWith('/')) {
            imageUrl = `${VT_COSMETICS_CONFIG.baseUrl}${imageUrl}`
          }

          const product: VTProduct = {
            name,
            price,
            salePrice,
            imageUrl: imageUrl || null,
            productUrl,
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
  async scrapeProducts(options: ScraperOptions = {}): Promise<ScraperResult<VTProduct[]>> {
    return await this.scrape(
      VT_COSMETICS_CONFIG.baseUrl,
      async (page: Page) => {
        const allProducts: VTProduct[] = []

        // 各カテゴリをスクレイピング
        for (const categoryPath of VT_COSMETICS_CONFIG.categoryUrls) {
          const categoryUrl = `${VT_COSMETICS_CONFIG.baseUrl}${categoryPath}`

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
        timeout: VT_COSMETICS_CONFIG.timeout
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
  async saveProductsToDatabase(products: VTProduct[]): Promise<{
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
      "VT Cosmetics"
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
   * VT Cosmeticsスクレイピングの完全実行
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
      console.log("VT Cosmeticsスクレイピングを開始します...")

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

      // 重複削除を実行
      await deduplicateAfterScraping()

      return {
        success: true,
        totalProducts: products.length,
        savedProducts: saveResult.savedCount,
        skippedProducts: saveResult.skippedCount,
        errors: saveResult.errors,
        proxyUsed: scrapingResult.proxyUsed
      }
    } catch (error) {
      console.error("VT Cosmeticsスクレイピングでエラーが発生しました:", error)
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