/**
 * DHC公式サイト スクレイパー
 */

import { Page } from "puppeteer"
import * as cheerio from "cheerio"
import { BaseScraper, ScraperResult, ScraperOptions } from "../scraper"
import { supabase } from "../supabase"
import type { ProductInsert, Product } from "@/types/database"
import { randomUUID } from "crypto"
import { deduplicateAfterScraping } from "../deduplication"

// DHC商品データ型
export interface DHCProduct {
  name: string
  price: number | null
  salePrice: number | null
  imageUrl: string | null
  productUrl: string
  description?: string | undefined
}

// スクレイピング設定
const DHC_CONFIG = {
  baseUrl: "https://www.dhc.co.jp",
  categoryUrls: [
    "https://www.dhc.co.jp/goods/cagoods.jsp?cCode=10115000",
    "https://www.dhc.co.jp/goods/cagoods.jsp?cCode=10118000",
    "https://www.dhc.co.jp/goods/cagoods.jsp?cCode=10164000",
    "https://www.dhc.co.jp/goods/cagoods.jsp?cCode=10116000",
    "https://www.dhc.co.jp/goods/cagoods.jsp?cCode=11801000",
    "https://www.dhc.co.jp/goods/cagoods.jsp?cCode=10155000",
    "https://www.dhc.co.jp/goods/cagoods.jsp?cCode=10163000",
    "https://www.dhc.co.jp/goods/cagoods.jsp?cCode=11622002",
  ],
  selectors: {
    productItems: ".item, .product, li",
    productLink: "a[href*='goodsdetail.jsp']",
    productName: ".name, .title, h3, h4",
    productPrice: ".price, .cost",
    productImage: "img",
    nextPage: "a[href*='page=']"
  },
  timeout: 30000,
  maxRetries: 3
}

export class DHCScraper extends BaseScraper {
  private readonly userId: string

  constructor(userId: string) {
    super()
    this.userId = userId
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
        '#price', '.product-price'
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
        '.discount-price'
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
        '[class*="description"]'
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
  async scrapeCategoryPage(categoryUrl: string, page: Page): Promise<DHCProduct[]> {
    const products: DHCProduct[] = []
    let pageNum = 1

    while (true) {
      const url = pageNum === 1 ? categoryUrl : `${categoryUrl}&page=${pageNum}`
      console.log(`スクレイピング中: ${url}`)

      await page.goto(url, { waitUntil: 'networkidle2' })

      // 商品リストが読み込まれるまで待機
      try {
        await page.waitForSelector('li, .item, .product', { timeout: 10000 })
      } catch {
        console.log(`ページ ${pageNum} で商品が見つかりませんでした`)
        break
      }

      // HTMLを取得してCheerioで解析
      const html = await page.content()
      const $ = cheerio.load(html)

      let pageProducts = 0

      // 各商品要素を解析
      const productElements = $('li, .item, .product').toArray()
      for (const element of productElements) {
        try {
          const $product = $(element)

          // 商品リンクがあるかチェック
          const $link = $product.find("a[href*='goodsdetail.jsp']")
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
            productUrl = `${DHC_CONFIG.baseUrl}${productUrl}`
          } else if (productUrl && !productUrl.startsWith('http')) {
            productUrl = `${DHC_CONFIG.baseUrl}/${productUrl}`
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
            console.log(`詳細ページから価格を取得: ${name}`)
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
            imageUrl = `${DHC_CONFIG.baseUrl}${imageUrl}`
          }

          const product: DHCProduct = {
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
  async scrapeProducts(options: ScraperOptions = {}): Promise<ScraperResult<DHCProduct[]>> {
    return await this.scrape(
      DHC_CONFIG.baseUrl,
      async (page: Page) => {
        const allProducts: DHCProduct[] = []

        // 各カテゴリをスクレイピング
        for (const categoryPath of DHC_CONFIG.categoryUrls) {
          const categoryUrl = categoryPath.startsWith('http')
            ? categoryPath
            : `${DHC_CONFIG.baseUrl}${categoryPath}`

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
        timeout: DHC_CONFIG.timeout
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
  async saveProductsToDatabase(products: DHCProduct[]): Promise<{
    savedCount: number
    skippedCount: number
    errors: string[]
  }> {
    let savedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // バッチでの重複チェック
    const productNames = products.map(p => p.name)

    const { data: existingProducts } = await supabase
      .from("products")
      .select("id, name, shop_type, shop_name")
      .eq("user_id", this.userId)
      .eq("shop_type", "official")
      .eq("shop_name", "DHC")
      .in("name", productNames)
      .returns<Pick<Product, "id" | "name" | "shop_type" | "shop_name">[]>()

    // 既存商品の重複キーセットを作成
    const existingProductKeys = new Set<string>()
    existingProducts?.forEach(product => {
      const key = `${product.shop_type}-${product.shop_name}-${product.name}`
      existingProductKeys.add(key)
    })

    // 新規商品のみを抽出
    const newProducts = products.filter(product => {
      const productKey = `official-DHC-${product.name}`

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
      shop_name: "DHC",
      name: product.name,
      price: product.price,
      sale_price: product.salePrice,
      image_url: product.imageUrl,
      source_url: product.productUrl,
      is_hidden: false,
      memo: product.description || "DHCスクレイピングで取得"
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
   * DHCスクレイピングの完全実行
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
      console.log("DHCスクレイピングを開始します...")

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
      console.error("DHCスクレイピングでエラーが発生しました:", error)
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
