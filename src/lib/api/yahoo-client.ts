/**
 * Yahoo!ショッピングAPIクライアント
 */

// Yahoo API設定型
export interface YahooAPIConfig {
  appId: string
  affiliateId?: string | undefined
}

// Yahoo商品検索パラメータ
export interface YahooSearchParams {
  query?: string
  seller_id?: string
  category_id?: string
  brand_id?: string
  hits?: number
  offset?: number
  sort?: string
}

// Yahoo商品データ型
export interface YahooProduct {
  code: string
  name: string
  price: number
  url: string
  imageUrl: string
  storeName: string
  storeId: string
  description?: string | undefined
  brandName?: string | undefined
}

// Yahoo APIレスポンス型
interface YahooAPIResponse {
  hits?: Array<{
    code?: string
    name?: string
    price?: number
    url?: string
    image?: {
      small?: string
      medium?: string
    }
    store?: {
      name?: string
      id?: string
    }
    description?: string
    brand?: {
      name?: string
    }
  }>
  totalResultsAvailable?: number
  totalResultsReturned?: number
  firstResultPosition?: number
}

export class YahooAPIClient {
  private config: YahooAPIConfig
  private baseUrl = "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch"

  constructor(config: YahooAPIConfig) {
    this.config = config
  }

  /**
   * 商品検索
   */
  async searchItems(params: YahooSearchParams): Promise<{
    products: YahooProduct[]
    totalCount: number
    offset: number
  }> {
    try {
      // APIパラメータ構築
      const searchParams = new URLSearchParams({
        appid: this.config.appId,
        hits: String(params.hits || 30),
        offset: String(params.offset || 1),
      })

      if (params.query) {
        searchParams.append("query", params.query)
      }

      if (params.seller_id) {
        searchParams.append("seller_id", params.seller_id)
      }

      if (params.category_id) {
        searchParams.append("category_id", params.category_id)
      }

      if (params.brand_id) {
        searchParams.append("brand_id", params.brand_id)
      }

      if (params.sort) {
        searchParams.append("sort", params.sort)
      }

      if (this.config.affiliateId) {
        searchParams.append("affiliate_id", this.config.affiliateId)
      }

      const url = `${this.baseUrl}?${searchParams.toString()}`

      // API呼び出し（リトライ付き）
      const response = await this.fetchWithRetry(url, 3)

      if (!response.ok) {
        throw new Error(`Yahoo API呼び出しエラー: ${response.status} ${response.statusText}`)
      }

      const data: YahooAPIResponse = await response.json()

      // レスポンスパース
      const products = this.parseProducts(data)

      return {
        products,
        totalCount: data.totalResultsAvailable || 0,
        offset: data.firstResultPosition || 1
      }

    } catch (error) {
      console.error("Yahoo API検索エラー:", error)
      throw new Error(
        error instanceof Error
          ? `Yahoo API検索失敗: ${error.message}`
          : "Yahoo API検索失敗"
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
        // レート制限対応（推奨：1秒あたり10リクエスト = 100ms間隔）
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // プロキシを使用せずにfetchを実行（外部APIへの直接接続）
        const originalHttpProxy = process.env.HTTP_PROXY
        const originalHttpsProxy = process.env.HTTPS_PROXY

        try {
          delete process.env.HTTP_PROXY
          delete process.env.HTTPS_PROXY

          const response = await fetch(url, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(10000) // 10秒タイムアウト
          })

          return response
        } finally {
          // 環境変数を復元
          if (originalHttpProxy) process.env.HTTP_PROXY = originalHttpProxy
          if (originalHttpsProxy) process.env.HTTPS_PROXY = originalHttpsProxy
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`Yahoo API呼び出し失敗 (試行 ${i + 1}/${maxRetries}):`, error)
      }
    }

    throw lastError || new Error("Yahoo API呼び出しに失敗しました")
  }

  /**
   * Yahoo APIレスポンスをパース
   */
  private parseProducts(data: YahooAPIResponse): YahooProduct[] {
    if (!data.hits || !Array.isArray(data.hits)) {
      return []
    }

    const products: YahooProduct[] = []

    for (const item of data.hits) {
      // 必須フィールドチェック
      if (!item.name || !item.price || !item.url || !item.code) {
        continue
      }

      const product: YahooProduct = {
        code: item.code,
        name: item.name,
        price: item.price,
        url: item.url,
        imageUrl: item.image?.medium || item.image?.small || "",
        storeName: item.store?.name || "",
        storeId: item.store?.id || "",
        description: item.description || undefined,
        brandName: item.brand?.name || undefined
      }

      products.push(product)
    }

    return products
  }

  /**
   * 設定の検証
   */
  static validateConfig(config: YahooAPIConfig): boolean {
    return Boolean(config.appId && config.appId.trim().length > 0)
  }
}

/**
 * Yahoo APIクライアントのインスタンスを取得
 */
export function getYahooClient(): YahooAPIClient {
  const appId = process.env.YAHOO_CLIENT_ID
  const affiliateId = process.env.YAHOO_AFFILIATE_ID

  if (!appId) {
    throw new Error("YAHOO_CLIENT_IDが設定されていません")
  }

  return new YahooAPIClient({
    appId,
    affiliateId
  })
}
