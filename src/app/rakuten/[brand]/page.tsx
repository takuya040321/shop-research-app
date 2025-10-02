"use client"

/**
 * 楽天ブランドページ
 * 動的ルート: /rakuten/[brand]
 */

import { useParams } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { PaginatedProductTable } from "@/components/products/paginated-product-table"
import { useRakutenPage } from "@/hooks/rakuten/use-rakuten-page"

// ブランド設定
const BRAND_CONFIG: Record<string, {
  displayName: string
  shopCode?: string
  genreId?: string
  defaultKeyword?: string
}> = {
  muji: {
    displayName: "無印良品",
    defaultKeyword: "無印良品"
  },
  vt: {
    displayName: "VT Cosmetics",
    defaultKeyword: "VT Cosmetics"
  },
  innisfree: {
    displayName: "innisfree",
    defaultKeyword: "innisfree"
  }
}

export default function RakutenBrandPage() {
  const params = useParams()
  const brand = params.brand as string

  const brandConfig = BRAND_CONFIG[brand]

  // カスタムフックから全てのロジックを取得
  const {
    keyword,
    shopCode,
    genreId,
    loading,
    refreshKey,
    setKeyword,
    setShopCode,
    setGenreId,
    handleSearch
  } = useRakutenPage({
    defaultKeyword: brandConfig?.defaultKeyword,
    defaultShopCode: brandConfig?.shopCode,
    defaultGenreId: brandConfig?.genreId,
    shopName: brandConfig?.displayName || ""
  })

  if (!brandConfig) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-red-600">ブランドが見つかりません</h1>
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
            <h1 className="text-3xl font-bold">{brandConfig.displayName}</h1>
            <p className="text-muted-foreground mt-2">
              楽天市場から{brandConfig.displayName}の商品を検索・管理
            </p>
          </div>

          {/* 検索フォーム */}
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">商品検索</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">キーワード</label>
                  <Input
                    placeholder="検索キーワード"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ショップコード</label>
                  <Input
                    placeholder="ショップコード"
                    value={shopCode}
                    onChange={(e) => setShopCode(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ジャンルID</label>
                  <Input
                    placeholder="ジャンルID"
                    value={genreId}
                    onChange={(e) => setGenreId(e.target.value)}
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
              shopFilter={brandConfig.displayName}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
