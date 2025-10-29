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
    // ZOZOTOWNの場合はsellerIdを強制的に"zozo"に設定
    const effectiveSellerId = isZozotown ? "zozo" : (sellerId || undefined)

    if (!query && !effectiveSellerId && !categoryId && !brandId) {
      toast.error("検索条件を入力してください", {
        description: "クエリ、ストアID、カテゴリID、ブランドIDのいずれかを入力してください"
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/yahoo/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: query || undefined,
          sellerId: effectiveSellerId,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          shopName,
          hits: 30,
          offset: 1
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("商品検索完了", {
          description: `${data.data.savedCount}件の商品を保存しました（${data.data.skippedCount}件スキップ）`
        })
        // 商品テーブルを再読み込み
        setRefreshKey(prev => prev + 1)
      } else {
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
