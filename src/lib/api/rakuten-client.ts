/**
 * 楽天市場APIクライアント
 */

// 楽天API設定型
export interface RakutenAPIConfig {
  applicationId: string
  affiliateId?: string | undefined
}

// 楽天商品検索パラメータ
export interface RakutenSearchParams {
  keyword?: string
  shopCode?: string
  genreId?: string
  hits?: number
  page?: number
  sort?: string
}

// 楽天商品データ型
export interface RakutenProduct {
  itemCode: string
  itemName: string
  itemPrice: number
  itemUrl: string
  imageUrl: string
  shopName: string
  shopCode: string
  catchcopy?: string | undefined
  itemCaption?: string | undefined
  genreId?: string | undefined
}

// 楽天APIレスポンス型
interface RakutenAPIResponse {
  Items?: Array<{
    Item?: {
      itemCode?: string
      itemName?: string
      itemPrice?: number
      itemUrl?: string
      mediumImageUrls?: Array<{ imageUrl?: string }>
      shopName?: string
      shopCode?: string
      catchcopy?: string
      itemCaption?: string
      genreId?: string
    }
  }>
  count?: number
  page?: number
  first?: number
  last?: number
  hits?: number
  carrier?: number
  pageCount?: number
}

export class RakutenAPIClient {
  private config: RakutenAPIConfig
  private baseUrl = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706"

  constructor(config: RakutenAPIConfig) {
    this.config = config
  }

  /**
   * 商品検索
   */
  async searchItems(params: RakutenSearchParams): Promise<{
    products: RakutenProduct[]
    totalCount: number
    page: number
    pageCount: number
  }> {
    try {
      // APIパラメータ構築
      const searchParams = new URLSearchParams({
        applicationId: this.config.applicationId,
        format: "json",
        hits: String(params.hits || 30),
        page: String(params.page || 1),
      })

      if (params.keyword) {
        searchParams.append("keyword", params.keyword)
      }

      if (params.shopCode) {
        searchParams.append("shopCode", params.shopCode)
      }

      if (params.genreId) {
        searchParams.append("genreId", params.genreId)
      }

      if (params.sort) {
        searchParams.append("sort", params.sort)
      }

      if (this.config.affiliateId) {
        searchParams.append("affiliateId", this.config.affiliateId)
      }

      const url = `${this.baseUrl}?${searchParams.toString()}`

      // デバッグログ追加
      console.log("楽天APIリクエストURL:", url)
      console.log("楽天APIパラメータ:", {
        applicationId: this.config.applicationId,
        applicationIdLength: this.config.applicationId.length,
        keyword: params.keyword,
        shopCode: params.shopCode,
        genreId: params.genreId,
      })

      // API呼び出し(リトライ付き)
      const response = await this.fetchWithRetry(url, 3)

      if (!response.ok) {
        // エラーレスポンスの詳細を取得
        let errorDetail = ""
        try {
          const errorData = await response.json()
          errorDetail = JSON.stringify(errorData)
        } catch {
          errorDetail = await response.text()
        }
        
        console.error("楽天APIエラーレスポンス:", errorDetail)
        throw new Error(`楽天API呼び出しエラー: ${response.status} ${response.statusText} - ${errorDetail}`)
      }

      const data: RakutenAPIResponse = await response.json()

      // レスポンスパース
      const products = this.parseProducts(data)

      return {
        products,
        totalCount: data.count || 0,
        page: data.page || 1,
        pageCount: data.pageCount || 1
      }

    } catch (error) {
      console.error("楽天API検索エラー:", error)
      throw new Error(
        error instanceof Error
          ? `楽天API検索失敗: ${error.message}`
          : "楽天API検索失敗"
      )
    }
  }

  /**
   * リトライ付きFetch
   */
  private async fetchWithRetry(url: string, maxRetries: number): Promise<Response> {
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        // レート制限対応：1秒あたり1リクエスト
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000) // 10秒タイムアウト
        })

        return response

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`楽天API呼び出し失敗 (試行 ${i + 1}/${maxRetries}):`, error)
      }
    }

    throw lastError || new Error("楽天API呼び出しに失敗しました")
  }

  /**
   * 楽天APIレスポンスをパース
   */
  private parseProducts(data: RakutenAPIResponse): RakutenProduct[] {
    if (!data.Items || !Array.isArray(data.Items)) {
      return []
    }

    const products: RakutenProduct[] = []

    for (const item of data.Items) {
      if (!item.Item) continue

      const rakutenItem = item.Item

      // 必須フィールドチェック
      if (!rakutenItem.itemName || !rakutenItem.itemPrice || !rakutenItem.itemUrl) {
        continue
      }

      const product: RakutenProduct = {
        itemCode: rakutenItem.itemCode || "",
        itemName: rakutenItem.itemName,
        itemPrice: rakutenItem.itemPrice,
        itemUrl: rakutenItem.itemUrl,
        imageUrl: rakutenItem.mediumImageUrls?.[0]?.imageUrl || "",
        shopName: rakutenItem.shopName || "",
        shopCode: rakutenItem.shopCode || "",
        catchcopy: rakutenItem.catchcopy,
        itemCaption: rakutenItem.itemCaption,
        genreId: rakutenItem.genreId
      }

      products.push(product)
    }

    return products
  }

  /**
   * 設定の検証
   */
  static validateConfig(config: RakutenAPIConfig): boolean {
    return Boolean(config.applicationId && config.applicationId.trim().length > 0)
  }
}

/**
 * 楽天APIクライアントのインスタンスを取得
 */
export function getRakutenClient(): RakutenAPIClient {
  const applicationId = process.env.RAKUTEN_APPLICATION_ID
  const affiliateId = process.env.RAKUTEN_AFFILIATE_ID

  if (!applicationId) {
    throw new Error("RAKUTEN_APPLICATION_IDが設定されていません")
  }

  return new RakutenAPIClient({
    applicationId,
    affiliateId
  })
}
