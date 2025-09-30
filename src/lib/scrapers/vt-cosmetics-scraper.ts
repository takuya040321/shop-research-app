/**
 * VT Cosmetics公式サイト スクレイパー
 */

import { Page } from "puppeteer"
import * as cheerio from "cheerio"
import { BaseScraper, ScraperResult, ScraperOptions } from "../scraper"
import { supabase } from "../supabase"
import type { ProductInsert, Product } from "@/types/database"
import { randomUUID } from "crypto"
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
  private readonly userId: string

  constructor(userId: string) {
    super()
    this.userId = userId
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
      console.log(`スクレイピング中: ${url}`)

      await page.goto(url, { waitUntil: 'networkidle2' })

      // 商品リストが読み込まれるまで待機
      try {
        await page.waitForSelector('li', { timeout: 10000 })
      } catch {
        console.log(`ページ ${pageNum} で商品が見つかりませんでした`)
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
            console.log(`詳細ページから価格を取得: ${name}`)
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

      console.log(`ページ ${pageNum}: ${pageProducts}件の商品を取得`)

      // 次のページがあるかチェック
      const hasNextPage = $("a[href*='page=']").length > 0 && pageProducts > 0
      if (!hasNextPage) {
        break
      }

      pageNum++

      // 安全のため最大10ページまで
      if (pageNum > 10) {
        console.log("最大ページ数に達しました")
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

            // 商品をバッチ保存（パフォーマンス向上）
            if (categoryProducts.length > 0) {
              const saveResult = await this.saveProductsToDatabase(categoryProducts)
              console.log(`カテゴリ ${categoryPath}: ${categoryProducts.length}件取得、${saveResult.savedCount}件保存、${saveResult.skippedCount}件スキップ`)

              if (saveResult.errors.length > 0) {
                console.warn(`カテゴリ ${categoryPath} で保存エラー:`, saveResult.errors)
              }
            }

            allProducts.push(...categoryProducts)

            // カテゴリ間の短い待機
            await new Promise(resolve => setTimeout(resolve, 800))
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
   */
  async saveProductsToDatabase(products: VTProduct[]): Promise<{
    savedCount: number
    skippedCount: number
    errors: string[]
  }> {
    let savedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // バッチでの重複チェック（ASIN考慮版）
    const productNames = products.map(p => p.name)

    // シンプルな重複チェック：VTスクレイピングではASINは通常設定されないため
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id, name, shop_type, shop_name")
      .eq("user_id", this.userId)
      .eq("shop_type", "official")
      .eq("shop_name", "VT Cosmetics")
      .in("name", productNames)
      .returns<Pick<Product, "id" | "name" | "shop_type" | "shop_name">[]>()

    // 既存商品の重複キーセットを作成（シンプル版）
    const existingProductKeys = new Set<string>()
    existingProducts?.forEach(product => {
      // VTスクレイピングではASINは設定されないため、シンプルなキーを使用
      const key = `${product.shop_type}-${product.shop_name}-${product.name}`
      existingProductKeys.add(key)
    })

    // 新規商品のみを抽出
    const newProducts = products.filter(product => {
      // VTスクレイピングではシンプルなキーで重複チェック
      const productKey = `official-VT Cosmetics-${product.name}`

      if (existingProductKeys.has(productKey)) {
        skippedCount++
        return false
      }
      return true
    })

    if (newProducts.length === 0) {
      return { savedCount, skippedCount, errors }
    }

    // バッチ挿入（パフォーマンス向上）
    const productsToInsert: ProductInsert[] = newProducts.map(product => ({
      id: randomUUID(),
      user_id: this.userId,
      shop_type: "official",
      shop_name: "VT Cosmetics",
      name: product.name,
      price: product.price,
      sale_price: product.salePrice,
      image_url: product.imageUrl,
      source_url: product.productUrl,
      is_hidden: false,
      memo: "VT Cosmeticsスクレイピングで取得"
    }))

    try {
      const { error } = await supabase
        .from("products")
        .insert(productsToInsert as never)

      if (error) {
        errors.push(`バッチ保存でエラー: ${error.message}`)
      } else {
        savedCount = productsToInsert.length
      }
    } catch (error) {
      errors.push(`バッチ保存処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
    }

    return { savedCount, skippedCount, errors }
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

      // 商品は既にカテゴリごとに保存済み
      console.log("すべてのカテゴリの商品保存が完了しました")

      // 重複削除を実行
      await deduplicateAfterScraping(this.userId)

      return {
        success: true,
        totalProducts: products.length,
        savedProducts: products.length, // カテゴリごとに保存済み
        skippedProducts: 0,
        errors: [],
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