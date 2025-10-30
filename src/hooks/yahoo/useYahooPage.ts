/**
 * Yahoo階層ページ用カスタムフック
 * 検索条件管理、商品検索、テーブル更新機能を提供
 */

import { useState } from "react"
import { toast } from "sonner"

interface UseYahooPageOptions {
  defaultQuery?: string
  defaultSellerId?: string
  defaultCategoryId?: string
  defaultBrandId?: string
  shopName: string
  isZozotown?: boolean
}

export function useYahooPage({
  defaultQuery = "",
  defaultSellerId = "",
  defaultCategoryId = "",
  defaultBrandId = "",
  shopName,
  isZozotown = false
}: UseYahooPageOptions) {
  const [query, setQuery] = useState(defaultQuery)
  const [sellerId, setSellerId] = useState(defaultSellerId)
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [brandId, setBrandId] = useState(defaultBrandId)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSearch = async () => {
    console.log("=== useYahooPage handleSearch ===")

    // ZOZOTOWNの場合はsellerIdを強制的に"zozo"に設定
    const effectiveSellerId = isZozotown ? "zozo" : (sellerId || undefined)

    console.log("検索パラメータ:", {
      query,
      sellerId,
      effectiveSellerId,
      categoryId,
      brandId,
      shopName,
      isZozotown
    })

    if (!query && !effectiveSellerId && !categoryId && !brandId) {
      toast.error("検索条件を入力してください", {
        description: "クエリ、ストアID、カテゴリID、ブランドIDのいずれかを入力してください"
      })
      return
    }

    setLoading(true)

    try {
      const requestBody = {
        query: query || undefined,
        sellerId: effectiveSellerId,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
        shopName,
        hits: 30,
        offset: 1
      }

      console.log("APIリクエスト送信:", requestBody)

      const response = await fetch("/api/yahoo/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })

      console.log("APIレスポンスステータス:", response.status)

      const data = await response.json()
      console.log("APIレスポンスデータ:", data)

      if (response.ok && data.success) {
        console.log("商品検索成功!")
        console.log(`保存: ${data.data.savedCount}件, スキップ: ${data.data.skippedCount}件`)

        toast.success("商品検索完了", {
          description: `${data.data.savedCount}件の商品を保存しました（${data.data.skippedCount}件スキップ）`
        })

        // 商品テーブルを再読み込み
        console.log("商品テーブルを再読み込み (refreshKey更新)")
        setRefreshKey(prev => prev + 1)
      } else {
        console.error("商品検索失敗:", data.message)
        toast.error("商品検索失敗", {
          description: data.message || "エラーが発生しました"
        })
      }
    } catch (error) {
      console.error("商品検索エラー:", error)
      toast.error("商品検索失敗", {
        description: "ネットワークエラーが発生しました"
      })
    } finally {
      setLoading(false)
      console.log("=================================")
    }
  }

  return {
    // State
    query,
    sellerId,
    categoryId,
    brandId,
    loading,
    refreshKey,

    // Actions
    setQuery,
    setSellerId,
    setCategoryId,
    setBrandId,
    handleSearch
  }
}
