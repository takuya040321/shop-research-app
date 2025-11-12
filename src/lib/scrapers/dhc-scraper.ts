/**
 * DHC公式サイト スクレイパー
 */

import { Page } from "puppeteer"
import * as cheerio from "cheerio"
import { BaseScraper, ScraperResult, ScraperOptions } from "../scraper"

// DHC商品データ型
export interface DHCProduct {
  name: string
  price: number | null
  salePrice: number | null
  imageUrl: string | null
  productUrl: string
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
    nextPage: "a[href*='page=']",
  },
  timeout: 30000,
  maxRetries: 3,
}

export class DHCScraper extends BaseScraper {
  constructor(suppressProxyLog: boolean = false) {
    super(suppressProxyLog)
  }

  /**
   * 商品詳細ページから価格情報を取得
   */
  async scrapeProductDetails(
    productUrl: string,
    page: Page
  ): Promise<{
    price: number | null
    salePrice: number | null
  }> {
    try {
      await page.goto(productUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      })

      const html = await page.content()
      const $ = cheerio.load(html)

      let price: number | null = null
      let salePrice: number | null = null

      // DHC特有の構造：「通常購入」セクションの価格を取得
      // <div class="cart_set_box"> 内の <div class="cart_set_title active">通常購入</div> の下の価格
      const $cartSetBox = $(".cart_set_box")

      if ($cartSetBox.length > 0) {
        // 「通常購入」の価格ボックスを探す
        const $regularPurchase = $cartSetBox.find(".cart_set_title.active:contains('通常購入')").parent()

        if ($regularPurchase.length > 0) {
          // 通常価格を取得
          const $priceBox = $regularPurchase.find(".price_box .price2 strong")
          if ($priceBox.length > 0) {
            const priceText = $priceBox.text().trim()
            price = this.parsePrice(priceText)
          }

          // キャンペーン価格があるかチェック
          const $campaignTitle = $regularPurchase.find(".cart_set_title:contains('キャンペーン価格')")
          if ($campaignTitle.length > 0) {
            // キャンペーン価格を取得
            const $campaignPriceBox = $campaignTitle.parent().find(".price_box .price2 strong")
            if ($campaignPriceBox.length > 0) {
              const campaignPriceText = $campaignPriceBox.text().trim()
              salePrice = this.parsePrice(campaignPriceText)
            }
          }
        }
      }

      // 上記の方法で価格が取得できなかった場合は、汎用セレクターで試行
      if (!price) {
        const priceSelectors = [
          ".price_box .price2 strong",
          ".spec_price .price2 strong",
          '[class*="price"]',
        ]
        for (const selector of priceSelectors) {
          if (!price) {
            // 「合わせて買いたい」セクションを除外
            const $priceEl = $(selector).not(".together_box *").first()
            if ($priceEl.length > 0) {
              const priceText = $priceEl.text().trim()
              price = this.parsePrice(priceText)
              break
            }
          }
        }
      }

      return { price, salePrice }
    } catch (error) {
      console.warn(`商品詳細ページの取得でエラー (${productUrl}):`, error)
      return { price: null, salePrice: null }
    }
  }

  /**
   * 指定されたカテゴリページをスクレイピング
   */
  async scrapeCategoryPage(
    categoryUrl: string,
    page: Page
  ): Promise<DHCProduct[]> {
    const products: DHCProduct[] = []
    let pageNum = 1
    let currentUrl = categoryUrl

    while (true) {
      await page.goto(currentUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      })

      // 商品リストが読み込まれるまで待機（より長いタイムアウトを設定）
      try {
        await page.waitForSelector(DHC_CONFIG.selectors.productList, {
          timeout: 20000,
        })
        // 商品画像の遅延読み込みを待つため、少し待機
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch {
        break
      }

      // HTMLを取得してCheerioで解析
      const html = await page.content()
      const $ = cheerio.load(html)

      let pageProducts = 0

      // メイン商品リストから商品要素を取得
      const productElements = $(
        `${DHC_CONFIG.selectors.productList} ${DHC_CONFIG.selectors.productItems}`
      ).toArray()

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
          let productUrl = $nameLink.attr("href")
          if (productUrl && productUrl.startsWith("/")) {
            productUrl = `${DHC_CONFIG.baseUrl}${productUrl}`
          } else if (productUrl && !productUrl.startsWith("http")) {
            productUrl = `${DHC_CONFIG.baseUrl}/${productUrl}`
          }

          if (!productUrl) continue

          // 一覧ページから価格を抽出
          let price: number | null = null
          let salePrice: number | null = null

          // 価格抽出（.price_box .price2 strongから）
          const $priceEl = $goodsSet.find(DHC_CONFIG.selectors.productPrice)
          if ($priceEl.length > 0) {
            const priceText = $priceEl.text().trim()
            price = this.parsePrice(priceText)
          }

          // 通常価格（割引前）も取得
          const $price1El = $goodsSet.find(".price_box .price1")
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
            const details = await this.scrapeProductDetails(productUrl, page)
            price = details.price
            salePrice = details.salePrice

            // 詳細ページアクセス後の短い待機（負荷軽減）
            await new Promise(resolve => setTimeout(resolve, 300))
          }

          // 商品画像URLを取得（data-src属性を優先）
          const $imgEl = $goodsSet.find(DHC_CONFIG.selectors.productImage)
          let imageUrl = $imgEl.attr("data-src") || $imgEl.attr("src")
          if (imageUrl && imageUrl.startsWith("//")) {
            imageUrl = `https:${imageUrl}`
          } else if (imageUrl && imageUrl.startsWith("/")) {
            imageUrl = `${DHC_CONFIG.baseUrl}${imageUrl}`
          }

          const product: DHCProduct = {
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

      // 商品が0件の場合は次ページなし
      if (pageProducts === 0) {
        break
      }

      // 次のページリンクがあるかチェック
      // DHCサイトは #p-2,s-60,c-40,l-matrix,ca- のようなハッシュ形式のページネーションを使用
      const nextPageLink = $("a.page-link.next").first()

      if (nextPageLink.length === 0) {
        break
      }

      // 次ページのhref属性からハッシュを取得
      const nextHref = nextPageLink.attr("href")
      if (!nextHref) {
        break
      }

      // ベースURLとハッシュを結合
      const baseUrl = categoryUrl.split("#")[0]
      currentUrl = `${baseUrl}${nextHref}`
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
  async scrapeProducts(
    options: ScraperOptions = {}
  ): Promise<ScraperResult<DHCProduct[]>> {
    let page: Page | null = null

    try {
      // ブラウザを起動（既に起動済みの場合はスキップ）
      await this.launch({ ...options, timeout: DHC_CONFIG.timeout })

      page = await this.createPage({ ...options, timeout: DHC_CONFIG.timeout })
      const allProducts: DHCProduct[] = []
      const categoryErrors: string[] = []

      // 各カテゴリをスクレイピング
      for (const categoryPath of DHC_CONFIG.categoryUrls) {
        const categoryUrl = categoryPath.startsWith("http")
          ? categoryPath
          : `${DHC_CONFIG.baseUrl}${categoryPath}`

        try {
          console.log(`カテゴリをスクレイピング中: ${categoryPath}`)
          const categoryProducts = await this.scrapeCategoryPage(
            categoryUrl,
            page
          )

          console.log(`カテゴリ ${categoryPath}: ${categoryProducts.length}件の商品を取得`)

          allProducts.push(...categoryProducts)

          // カテゴリ間の待機（レート制限対策）
          await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(
            `カテゴリ ${categoryPath} のスクレイピングでエラー:`,
            error
          )
          categoryErrors.push(`${categoryPath}: ${errorMessage}`)
        }
      }

      // 全カテゴリがエラーの場合は失敗として扱う
      if (categoryErrors.length === DHC_CONFIG.categoryUrls.length) {
        console.error("全てのカテゴリでスクレイピングに失敗しました")
        return {
          success: false,
          error: `全カテゴリでエラー: ${categoryErrors.join(", ")}`,
          proxyUsed: this.getProxySettings().enabled,
        }
      }

      console.log(`合計 ${allProducts.length}件の商品を取得しました（${categoryErrors.length}/${DHC_CONFIG.categoryUrls.length}カテゴリでエラー）`)

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
    const priceStr = match[1].replace(/,/g, "")
    const price = parseInt(priceStr, 10)

    return isNaN(price) ? null : price
  }

  /**
   * スクレイピングした商品をデータベースに保存
   * BaseScraperの汎用メソッドを使用
   */
  async saveProductsToDatabase(products: DHCProduct[]): Promise<{
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
        productUrl: p.productUrl,
      })),
      "official",
      "DHC"
    )

    // 結果を従来の形式に変換して返す
    return {
      savedCount: result.insertedCount + result.updatedCount,
      skippedCount: result.skippedCount,
      duplicatesRemovedCount: result.duplicatesRemovedCount,
      errors: result.errors,
    }
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
          proxyUsed: scrapingResult.proxyUsed,
        }
      }

      const products = scrapingResult.data
      console.log(`合計 ${products.length}件の商品データを取得しました`)

      // 商品が0件の場合はエラーとして扱う（データ削除を防ぐ）
      if (products.length === 0) {
        console.error("スクレイピングで商品が1件も取得できませんでした。データベースへの保存をスキップします。")
        return {
          success: false,
          totalProducts: 0,
          savedProducts: 0,
          skippedProducts: 0,
          errors: ["商品が1件も取得できませんでした"],
          proxyUsed: scrapingResult.proxyUsed,
        }
      }

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
        proxyUsed: scrapingResult.proxyUsed,
      }
    } catch (error) {
      console.error("DHCスクレイピングでエラーが発生しました:", error)
      return {
        success: false,
        totalProducts: 0,
        savedProducts: 0,
        skippedProducts: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        proxyUsed: this.getProxySettings().enabled,
      }
    } finally {
      // リソースのクリーンアップ
      await this.close()
    }
  }
}
