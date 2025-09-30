"use client"

/**
 * ブランド別公式サイト商品一覧ページ（動的ルーティング）
 */

import { useState } from "react"
import { useParams, notFound } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ProductTable } from "@/components/products/product-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RefreshCwIcon,
  DownloadIcon,
  SettingsIcon,
  GlobeIcon
} from "lucide-react"
import { getBrandConfig, isValidBrand } from "@/lib/brand-config"

export default function BrandPage() {
  const params = useParams()
  const brandId = params.brand as string

  // 無効なブランドIDの場合は404を表示
  if (!isValidBrand(brandId)) {
    notFound()
  }

  const brandConfig = getBrandConfig(brandId)
  if (!brandConfig) {
    notFound()
  }

  // TODO: 実際の認証システム実装後に置き換え
  const userId = "d5efb4ac-4592-4359-bb62-b56b4321723e"

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!brandConfig.hasScrapingAPI) {
      alert(`${brandConfig.displayName}スクレイピング機能は未実装です`)
      return
    }

    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/scraping/${brandConfig.name}`, {
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

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GlobeIcon className={`w-6 h-6 ${brandConfig.color}`} />
                <h1 className="text-2xl font-bold text-gray-900">{brandConfig.displayName}</h1>
                <Badge variant="outline" className={`${brandConfig.color} ${brandConfig.borderColor}`}>
                  公式サイト
                </Badge>
              </div>
              <p className="text-gray-600">
                {brandConfig.description}
              </p>
            </div>
          </div>


          {/* アクションボタン */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || !brandConfig.hasScrapingAPI}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "実行中..." : "スクレイピング"}
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              エクスポート
            </Button>

            <Button
              variant="outline"
              onClick={handleSettings}
              className="flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              設定
            </Button>
          </div>
        </div>

        {/* 商品テーブル */}
        <ProductTable
          userId={userId}
          className="w-full"
          shopFilter={brandConfig.shopName}
        />
      </div>
    </MainLayout>
  )
}