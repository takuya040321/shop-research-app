"use client"

/**
 * ブランド別公式サイト商品一覧ページ（動的ルーティング）
 */

import { useParams, notFound } from "next/navigation"
import { MainLayout } from "@/components/layout/MainLayout"
import { ProductTable } from "@/components/products/ProductTable"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  RefreshCwIcon,
  DownloadIcon,
  SettingsIcon,
  GlobeIcon
} from "lucide-react"
import { getBrandConfig, isValidBrand } from "@/lib/brand-config"
import { useOfficialBrandPage } from "@/hooks/official/useOfficialBrandPage"

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

  // カスタムフックから全てのロジックを取得
  const {
    isRefreshing,
    userId,
    handleRefresh,
    handleExport,
    handleSettings
  } = useOfficialBrandPage({
    userId: "d5efb4ac-4592-4359-bb62-b56b4321723e", // TODO: 実際の認証システム実装後に置き換え
    brandConfig
  })

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