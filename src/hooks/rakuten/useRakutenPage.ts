/**
 * 楽天ページ用カスタムフック
 * 検索条件管理、商品検索、テーブル更新機能を提供
 */

import { useState } from "react"
import { toast } from "sonner"

interface UseRakutenPageOptions {
  defaultKeyword?: string
  defaultShopCode?: string
  defaultGenreId?: string
  shopName: string
}

export function useRakutenPage({
  defaultKeyword = "",
  defaultShopCode = "",
  defaultGenreId = "",
  shopName
}: UseRakutenPageOptions) {
  const [keyword, setKeyword] = useState(defaultKeyword)
  const [shopCode, setShopCode] = useState(defaultShopCode)
  const [genreId, setGenreId] = useState(defaultGenreId)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSearch = async () => {
    if (!keyword && !shopCode && !genreId) {
      toast.error("検索条件を入力してください", {
        description: "キーワード、ショップコード、ジャンルIDのいずれかを入力してください"
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/rakuten/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          keyword: keyword || undefined,
          shopCode: shopCode || undefined,
          genreId: genreId || undefined,
          shopName,
          hits: 30,
          page: 1
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
    keyword,
    shopCode,
    genreId,
    loading,
    refreshKey,

    // Actions
    setKeyword,
    setShopCode,
    setGenreId,
    handleSearch
  }
}
