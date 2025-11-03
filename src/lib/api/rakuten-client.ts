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

      // API呼び出し(リトライ付き)
      const response = await this.fetchWithRetry(url, 3)

      if (!response.ok) {
        console.error("=== 楽天API HTTPエラー ===")
        console.error("HTTPステータス:", response.status, response.statusText)
        console.error("リクエストURL:", url)
        console.error("リクエストパラメータ:", params)
        
        let responseBody = ""
        try {
          const errorData = await response.json()
          responseBody = JSON.stringify(errorData, null, 2)
          console.error("エラーレスポンス:", errorData)
        } catch {
          try {
            responseBody = await response.text()
            console.error("レスポンスボディ:", responseBody)
          } catch (e) {
            console.error("レスポンスボディの読み取りに失敗:", e)
          }
        }
        console.error("================================")
        
        throw new Error(`楽天API呼び出しエラー: ${response.status} ${response.statusText}`)
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
      console.error("=== 楽天API検索エラー ===")
      console.error("エラー発生時刻:", new Date().toISOString())
      console.error("リクエストパラメータ:", params)
      console.error("エラータイプ:", error?.constructor?.name || typeof error)
      console.error("エラー詳細:", error)
      
      if (error instanceof Error) {
        console.error("エラーメッセージ:", error.message)
        console.error("スタックトレース:", error.stack)
      }
      console.error("================================")
      
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
        
        console.error("=== 楽天API呼び出し失敗（リトライ中） ===")
        console.error("試行回数:", `${i + 1}/${maxRetries}`)
        console.error("エラー発生時刻:", new Date().toISOString())
        console.error("リクエストURL:", url)
        console.error("エラータイプ:", error?.constructor?.name || typeof error)
        console.error("エラー詳細:", error)
        
        if (error instanceof Error) {
          console.error("エラーメッセージ:", error.message)
          
          // タイムアウトエラーの判定
          if (error.name === "TimeoutError" || error.message.includes("timeout")) {
            console.error("⚠️ タイムアウトエラー: APIリクエストが10秒以内に完了しませんでした")
          }
          
          // ネットワークエラーの判定
          if (error.message.includes("fetch") || error.message.includes("network")) {
            console.error("⚠️ ネットワークエラー: インターネット接続を確認してください")
          }
        }
        
        if (i < maxRetries - 1) {
          console.error(`リトライします... (${i + 2}/${maxRetries})`)
        } else {
          console.error("すべてのリトライが失敗しました")
        }
        console.error("=============================================")
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
