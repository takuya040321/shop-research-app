/**
 * ブランド別公式サイトページ用カスタムフック
 * スクレイピング実行、エクスポート、設定管理機能を提供
 */

import { useState } from "react"

interface BrandConfig {
  name: string
  displayName: string
  hasScrapingAPI: boolean
}

interface UseOfficialBrandPageOptions {
  brandConfig: BrandConfig
}

export function useOfficialBrandPage({
  brandConfig
}: UseOfficialBrandPageOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!brandConfig.hasScrapingAPI) {
      return {
        success: false,
        message: `${brandConfig.displayName}スクレイピング機能は未実装です`
      }
    }

    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/scrape/${brandConfig.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          headless: true,
          timeout: 30000
        })
      })

      const result = await response.json()

      if (result.success) {
        // テーブルを再読み込み
        window.location.reload()
      }
      
      return result
    } catch (error) {
      console.error("スクレイピングエラー:", error)
      return {
        success: false,
        message: "スクレイピング中にエラーが発生しました"
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
