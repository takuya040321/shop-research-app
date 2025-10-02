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
  shopName: string
}

export function useYahooPage({
  defaultQuery = "",
  defaultSellerId = "",
  defaultCategoryId = "",
  shopName
}: UseYahooPageOptions) {
  const [query, setQuery] = useState(defaultQuery)
  const [sellerId, setSellerId] = useState(defaultSellerId)
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSearch = async () => {
    if (!query && !sellerId && !categoryId) {
      toast.error("検索条件を入力してください", {
        description: "クエリ、ストアID、カテゴリIDのいずれかを入力してください"
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
          userId: "test-user-id", // 仮のユーザーID
          query: query || undefined,
          sellerId: sellerId || undefined,
          categoryId: categoryId || undefined,
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
    loading,
    refreshKey,

    // Actions
    setQuery,
    setSellerId,
    setCategoryId,
    handleSearch
  }
}
