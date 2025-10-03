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
    productList: "ul.display_matrix#goods",
    productItems: "li",
    goodsSet: ".goods_set",
    productLink: ".img_box a, .txt_box .name a",
    productName: ".txt_box .name a",
    productPrice: ".price_box .price2 strong",
    productImage: ".img_box img",
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
    let currentUrl = categoryUrl

    while (true) {
      console.log(`スクレイピング中: ${currentUrl}`)

      await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })

      // 商品リストが読み込まれるまで待機（より長いタイムアウトを設定）
      try {
        await page.waitForSelector(DHC_CONFIG.selectors.productList, { timeout: 20000 })
        // 商品画像の遅延読み込みを待つため、少し待機
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.log(`ページ ${pageNum} で商品リストが見つかりませんでした:`, error)
        break
      }

      // HTMLを取得してCheerioで解析
      const html = await page.content()
      const $ = cheerio.load(html)

      let pageProducts = 0

      // メイン商品リストから商品要素を取得
      const productElements = $(`${DHC_CONFIG.selectors.productList} ${DHC_CONFIG.selectors.productItems}`).toArray()

      for (const element of productElements) {
        try {
          const $product = $(element)
          const $goodsSet = $product.find(DHC_CONFIG.selectors.goodsSet)

          // .goods_setがない場合はスキップ
          if ($goodsSet.length === 0) continue

          // 商品名を取得
          const $nameLink = $goodsSet.find(DHC_CONFIG.selectors.productName)
          const name = $nameLink.text().trim()
          if (!name) continue

          // 商品詳細ページURLを取得
          let productUrl = $nameLink.attr('href')
          if (productUrl && productUrl.startsWith('/')) {
            productUrl = `${DHC_CONFIG.baseUrl}${productUrl}`
          } else if (productUrl && !productUrl.startsWith('http')) {
            productUrl = `${DHC_CONFIG.baseUrl}/${productUrl}`
          }

          if (!productUrl) continue

          // 一覧ページから価格を抽出
          let price: number | null = null
          let salePrice: number | null = null
          let description: string | null = null

          // 価格抽出（.price_box .price2 strongから）
          const $priceEl = $goodsSet.find(DHC_CONFIG.selectors.productPrice)
          if ($priceEl.length > 0) {
            const priceText = $priceEl.text().trim()
            price = this.parsePrice(priceText)
          }

          // 通常価格（割引前）も取得
          const $price1El = $goodsSet.find('.price_box .price1')
          if ($price1El.length > 0) {
            const price1Text = $price1El.text().trim()
            const regularPrice = this.parsePrice(price1Text)
            // price1がある場合、それが通常価格でpriceがセール価格
            if (regularPrice && price) {
              salePrice = price
              price = regularPrice
            }
          }

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

          // 商品画像URLを取得（data-src属性を優先）
          const $imgEl = $goodsSet.find(DHC_CONFIG.selectors.productImage)
          let imageUrl = $imgEl.attr('data-src') || $imgEl.attr('src')
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

      // 商品が0件の場合は次ページなし
      if (pageProducts === 0) {
        console.log(`ページ ${pageNum} で商品が見つからないため終了`)
        break
      }

      // 次のページリンクがあるかチェック
      // DHCサイトは #p-2,s-60,c-40,l-matrix,ca- のようなハッシュ形式のページネーションを使用
      const nextPageLink = $('a.page-link.next').first()

      if (nextPageLink.length === 0) {
        console.log(`ページ ${pageNum} が最終ページです`)
        break
      }

      // 次ページのhref属性からハッシュを取得
      const nextHref = nextPageLink.attr('href')
      if (!nextHref) {
        console.log(`次ページのリンクが見つかりません`)
        break
      }

      // ベースURLとハッシュを結合
      const baseUrl = categoryUrl.split('#')[0]
      currentUrl = `${baseUrl}${nextHref}`
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
    let page: Page | null = null

    try {
      // ブラウザを起動（既に起動済みの場合はスキップ）
      await this.launch({ ...options, timeout: DHC_CONFIG.timeout })

      page = await this.createPage({ ...options, timeout: DHC_CONFIG.timeout })
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

      return {
        success: true,
        data: allProducts,
        proxyUsed: this.getProxySettings().enabled,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        proxyUsed: this.getProxySettings().enabled,
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
