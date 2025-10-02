"use client"

/**
 * Yahoo階層ページ
 * 動的ルート: /yahoo/[...slug]
 * 例: /yahoo/lohaco/dhc, /yahoo/zozotown/vt, /yahoo/vt
 */

import { useParams } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { PaginatedProductTable } from "@/components/products/paginated-product-table"
import { useYahooPage } from "@/hooks/yahoo/use-yahoo-page"

// Yahoo階層設定
const YAHOO_CONFIG: Record<string, {
  displayName: string
  sellerId?: string
  categoryId?: string
  defaultQuery?: string
}> = {
  // LOHACO
  "lohaco-dhc": {
    displayName: "LOHACO-DHC",
    defaultQuery: "DHC"
  },
  "lohaco-vt": {
    displayName: "LOHACO-VT",
    defaultQuery: "VT Cosmetics"
  },
  // ZOZOTOWN
  "zozotown-dhc": {
    displayName: "ZOZOTOWN-DHC",
    defaultQuery: "DHC"
  },
  "zozotown-vt": {
    displayName: "ZOZOTOWN-VT",
    defaultQuery: "VT Cosmetics"
  },
  // Yahoo直販
  "vt": {
    displayName: "Yahoo-VT",
    defaultQuery: "VT Cosmetics"
  }
}

export default function YahooHierarchyPage() {
  const params = useParams()
  const slug = params.slug as string[]

  // slugから設定キーを生成
  const configKey = slug.join("-")
  const config = YAHOO_CONFIG[configKey]

  // カスタムフックから全てのロジックを取得
  const {
    query,
    sellerId,
    categoryId,
    loading,
    refreshKey,
    setQuery,
    setSellerId,
    setCategoryId,
    handleSearch
  } = useYahooPage({
    defaultQuery: config?.defaultQuery,
    defaultSellerId: config?.sellerId,
    defaultCategoryId: config?.categoryId,
    shopName: config?.displayName || ""
  })

  if (!config) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-red-600">ページが見つかりません</h1>
            <p className="mt-2 text-muted-foreground">
              URL: /yahoo/{slug.join("/")}
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{config.displayName}</h1>
            <p className="text-muted-foreground mt-2">
              Yahoo!ショッピングから{config.displayName}の商品を検索・管理
            </p>
          </div>

          {/* 検索フォーム */}
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">商品検索</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">検索クエリ</label>
                  <Input
                    placeholder="検索クエリ"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ストアID</label>
                  <Input
                    placeholder="ストアID"
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">カテゴリID</label>
                  <Input
                    placeholder="カテゴリID"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full"
              >
                {loading ? "検索中..." : "商品を検索"}
              </Button>
            </div>
          </Card>

          {/* 商品一覧 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">商品一覧</h2>
            <PaginatedProductTable
              key={refreshKey}
              userId="test-user-id"
              shopFilter={config.displayName}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
