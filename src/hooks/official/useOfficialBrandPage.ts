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
      alert(`${brandConfig.displayName}スクレイピング機能は未実装です`)
      return
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
        alert(`スクレイピング完了!\n取得: ${result.data.totalProducts}件\n保存: ${result.data.savedProducts}件\nスキップ: ${result.data.skippedProducts}件`)
        // テーブルを再読み込み
        window.location.reload()
      } else {
        alert(`スクレイピングに失敗しました: ${result.message}`)
      }
    } catch (error) {
      console.error("スクレイピングエラー:", error)
      alert("スクレイピング中にエラーが発生しました")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = () => {
    // TODO: データエクスポート機能実装
    console.log("エクスポート機能（未実装）")
  }

  const handleSettings = () => {
    // TODO: 設定画面実装
    console.log("設定画面（未実装）")
  }

  return {
    // State
    isRefreshing,

    // Actions
    handleRefresh,
    handleExport,
    handleSettings
  }
}
