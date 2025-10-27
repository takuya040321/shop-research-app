import { NextRequest, NextResponse } from "next/server"
import { YahooAPIClient } from "@/lib/api/yahoo-client"

/**
 * Yahoo API接続テスト用エンドポイント
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      appId,
      affiliateId,
      query,
      sellerId,
      categoryId,
      brandName,
      hits = 30,
      offset = 1,
      sort
    } = body

    // 必須パラメータチェック
    if (!appId) {
      return NextResponse.json(
        { error: "App IDは必須です" },
        { status: 400 }
      )
    }

    // Yahoo APIクライアント作成
    const client = new YahooAPIClient({
      appId,
      affiliateId: affiliateId || undefined
    })

    // 検索クエリ構築（ブランド名でフィルタリング）
    let searchQuery = query || ""
    if (brandName) {
      searchQuery = searchQuery ? `${searchQuery} ${brandName}` : brandName
    }

    // API呼び出し
    const result = await client.searchItems({
      query: searchQuery || undefined,
      seller_id: sellerId || undefined,
      category_id: categoryId || undefined,
      hits,
      offset,
      sort: sort || undefined
    })

    // ブランド名でフィルタリング（API側のフィルタリングが不完全な場合に備えて）
    let products = result.products
    if (brandName) {
      const brandLower = brandName.toLowerCase()
      products = products.filter(product => {
        const productBrand = product.brandName?.toLowerCase() || ""
        const productName = product.name.toLowerCase()
        return productBrand.includes(brandLower) || productName.includes(brandLower)
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        products,
        totalCount: result.totalCount,
        offset: result.offset,
        returnedCount: products.length
      }
    })

  } catch (error) {
    console.error("Yahoo APIテストエラー:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Yahoo API呼び出しに失敗しました"
      },
      { status: 500 }
    )
  }
}
