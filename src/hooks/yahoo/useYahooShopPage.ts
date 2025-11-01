/**
 * Yahooショップページ用カスタムフック
 * 商品取得（API）機能を提供
 */

import { useState } from "react"
import type { Database } from "@/types/database"

type YahooShop = Database["public"]["Tables"]["yahoo_shops"]["Row"]

interface UseYahooShopPageOptions {
  shopConfig: YahooShop
  shopName: string
}

export function useYahooShopPage({
  shopConfig,
  shopName
}: UseYahooShopPageOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("/api/yahoo/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: shopConfig.default_keyword || undefined,
          sellerId: shopConfig.store_id || undefined,
          categoryId: shopConfig.category_id || undefined,
          brandId: shopConfig.brand_id || undefined,
          shopName,
          hits: 30,
          offset: 1
        })
      })

      const result = await response.json()

      if (result.success) {
        // テーブルを再読み込み
        window.location.reload()
      }

      return result
    } catch (error) {
      console.error("商品取得エラー:", error)
      return {
        success: false,
        message: "商品取得中にエラーが発生しました"
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    // State
    isRefreshing,

    // Actions
    handleRefresh
  }
}
