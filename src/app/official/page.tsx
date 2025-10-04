"use client"

/**
 * 公式サイト商品一覧ページ
 */

import { MainLayout } from "@/components/layout/MainLayout"
import { ProductTable } from "@/components/products/ProductTable"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import {
  RefreshCwIcon,
  DownloadIcon,
  SettingsIcon
} from "lucide-react"
import { useOfficialPage } from "@/hooks/official/useOfficialPage"

export default function OfficialPage() {
  // カスタムフックから全てのロジックを取得
  const {
    isRefreshing,
    handleRefresh,
    handleExport,
    handleSettings
  } = useOfficialPage()

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">公式サイト</h1>
            <p className="text-gray-600 mt-1">
              公式サイトから取得した商品の管理・編集
            </p>
          </div>
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            公式サイト
          </Badge>
        </div>

        {/* ショップ一覧とスクレイピング */}
        <Card className="p-4 mb-6">
          <h2 className="font-semibold mb-3">対応ショップ・スクレイピング</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <h3 className="font-medium">VT Cosmetics</h3>
                  <p className="text-sm text-gray-600">韓国コスメブランド</p>
                </div>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full flex items-center gap-2"
                size="sm"
              >
                <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "実行中..." : "スクレイピング"}
              </Button>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <h3 className="font-medium">DHC</h3>
                  <p className="text-sm text-gray-600">健康食品・化粧品</p>
                </div>
              </div>
              <Button
                disabled
                variant="outline"
                className="w-full flex items-center gap-2"
                size="sm"
              >
                <RefreshCwIcon className="w-4 h-4" />
                スクレイピング
              </Button>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <h3 className="font-medium">innisfree</h3>
                  <p className="text-sm text-gray-600">自然派コスメブランド</p>
                </div>
              </div>
              <Button
                disabled
                variant="outline"
                className="w-full flex items-center gap-2"
                size="sm"
              >
                <RefreshCwIcon className="w-4 h-4" />
                スクレイピング
              </Button>
            </div>
          </div>
        </Card>

        {/* 全体アクションボタン */}
        <div className="flex items-center gap-3 mb-6">
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
        className="w-full"
      />
      </div>
    </MainLayout>
  )
}