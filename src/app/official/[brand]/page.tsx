"use client"

/**
 * ブランド別公式サイト商品一覧ページ（動的ルーティング）
 */

import { useParams, notFound } from "next/navigation"
import { toast } from "sonner"
import { MainLayout } from "@/components/layout/MainLayout"
import { ProductTable } from "@/components/products/ProductTable"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  RefreshCwIcon,
  GlobeIcon
} from "lucide-react"
import { getBrandConfig, isValidBrand } from "@/lib/brand-config"
import { useOfficialBrandPage } from "@/hooks/official/useOfficialBrandPage"
import { DiscountSettings } from "@/components/official/DiscountSettings"

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
    handleRefresh
  } = useOfficialBrandPage({
    brandConfig
  })

  const onRefresh = async () => {
    const result = await handleRefresh()

    if (result.success) {
      toast.success(`スクレイピング完了! 取得: ${result.data?.totalProducts || 0}件 / 保存: ${result.data?.savedProducts || 0}件 / スキップ: ${result.data?.skippedProducts || 0}件`)
    } else {
      toast.error(`エラー: ${result.message || "スクレイピングに失敗しました"}`)
    }
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
              onClick={onRefresh}
              disabled={isRefreshing || !brandConfig.hasScrapingAPI}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "実行中..." : "スクレイピング"}
            </Button>
          </div>

          {/* 割引設定 */}
          <DiscountSettings shopName={brandConfig.shopName} />
        </div>

        {/* 商品テーブル */}
        <ProductTable
          className="w-full"
          shopFilter={brandConfig.shopName}
        />
      </div>
    </MainLayout>
  )
}
