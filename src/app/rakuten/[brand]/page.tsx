"use client"

/**
 * 楽天ブランドページ
 * 動的ルート: /rakuten/[brand]
 */

import { useParams } from "next/navigation"
import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { PaginatedProductTable } from "@/components/products/paginated-product-table"

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
  const [keyword, setKeyword] = useState(brandConfig?.defaultKeyword || "")
  const [shopCode, setShopCode] = useState(brandConfig?.shopCode || "")
  const [genreId, setGenreId] = useState(brandConfig?.genreId || "")
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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

  const handleSearch = async () => {
    if (!keyword && !shopCode && !genreId) {
      toast.error("検索条件を入力してください", {
        description: "キーワード、ショップコード、ジャンルIDのいずれかを入力してください"
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/rakuten/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: "test-user-id", // 仮のユーザーID
          keyword: keyword || undefined,
          shopCode: shopCode || undefined,
          genreId: genreId || undefined,
          shopName: brandConfig.displayName,
          hits: 30,
          page: 1
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("商品検索完了", {
          description: `${data.data.savedCount}件の商品を保存しました（${data.data.skippedCount}件スキップ）`
        })
        // 商品テーブルを再読み込み
        setRefreshKey(prev => prev + 1)
      } else {
        toast.error("商品検索失敗", {
          description: data.message || "エラーが発生しました"
        })
      }
    } catch (error) {
      console.error("商品検索エラー:", error)
      toast.error("商品検索失敗", {
        description: "ネットワークエラーが発生しました"
      })
    } finally {
      setLoading(false)
    }
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
