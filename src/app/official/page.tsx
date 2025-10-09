"use client"

/**
 * 公式サイト商品一覧ページ
 */

import { MainLayout } from "@/components/layout/MainLayout"
import { ProductTable } from "@/components/products/ProductTable"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { RefreshCwIcon } from "lucide-react"
import { useOfficialPage } from "@/hooks/official/useOfficialPage"

export default function OfficialPage() {
  const { isRefreshing, handleRefresh } = useOfficialPage()

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

          {/* スクレイピング実行 */}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 mb-6"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "スクレイピング実行中..." : "スクレイピング実行"}
          </Button>
        </div>

        {/* 商品テーブル */}
        <ProductTable className="w-full" />
      </div>
    </MainLayout>
  )
}