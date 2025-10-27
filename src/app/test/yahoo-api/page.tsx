"use client"

/**
 * Yahoo!ショッピングAPI接続テストページ
 */

import { useState } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { toast } from "sonner"
import { Loader2, Search, ExternalLink } from "lucide-react"

interface YahooProduct {
  code: string
  name: string
  price: number
  url: string
  imageUrl: string
  storeName: string
  storeId: string
  description?: string
  brandName?: string
}

interface APITestResult {
  products: YahooProduct[]
  totalCount: number
  offset: number
  returnedCount: number
}

export default function YahooAPITestPage() {
  // フォーム状態
  const [appId, setAppId] = useState("")
  const [affiliateId, setAffiliateId] = useState("")
  const [query, setQuery] = useState("")
  const [sellerId, setSellerId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [brandName, setBrandName] = useState("")
  const [hits, setHits] = useState("30")
  const [offset, setOffset] = useState("1")
  const [sort, setSort] = useState("")

  // 結果状態
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<APITestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // API呼び出し
  const handleSearch = async () => {
    if (!appId.trim()) {
      toast.error("App IDを入力してください")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/test/yahoo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          appId: appId.trim(),
          affiliateId: affiliateId.trim() || undefined,
          query: query.trim() || undefined,
          sellerId: sellerId.trim() || undefined,
          categoryId: categoryId.trim() || undefined,
          brandName: brandName.trim() || undefined,
          hits: parseInt(hits) || 30,
          offset: parseInt(offset) || 1,
          sort: sort.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "API呼び出しに失敗しました")
      }

      setResult(data.data)
      toast.success(`${data.data.returnedCount}件の商品を取得しました`)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "不明なエラーが発生しました"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // フォームクリア
  const handleClear = () => {
    setQuery("")
    setSellerId("")
    setCategoryId("")
    setBrandName("")
    setHits("30")
    setOffset("1")
    setSort("")
    setResult(null)
    setError(null)
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Yahoo!ショッピングAPI接続テスト</h1>
          <p className="text-muted-foreground mt-2">
            APIパラメータを入力して商品検索をテストします
          </p>
        </div>

        {/* APIパラメータ入力フォーム */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">APIパラメータ</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* App ID（必須） */}
            <div className="space-y-2">
              <Label htmlFor="appId">App ID *</Label>
              <Input
                id="appId"
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Yahoo App ID"
                required
              />
            </div>

            {/* Affiliate ID（オプション） */}
            <div className="space-y-2">
              <Label htmlFor="affiliateId">Affiliate ID</Label>
              <Input
                id="affiliateId"
                type="text"
                value={affiliateId}
                onChange={(e) => setAffiliateId(e.target.value)}
                placeholder="アフィリエイトID（オプション）"
              />
            </div>

            {/* 検索キーワード */}
            <div className="space-y-2">
              <Label htmlFor="query">検索キーワード</Label>
              <Input
                id="query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例: 化粧品"
              />
            </div>

            {/* ブランド名フィルター */}
            <div className="space-y-2">
              <Label htmlFor="brandName">ブランド名</Label>
              <Input
                id="brandName"
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="例: DHC"
              />
            </div>

            {/* ストアID */}
            <div className="space-y-2">
              <Label htmlFor="sellerId">ストアID</Label>
              <Input
                id="sellerId"
                type="text"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                placeholder="例: lohaco"
              />
            </div>

            {/* カテゴリID */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">カテゴリID</Label>
              <Input
                id="categoryId"
                type="text"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                placeholder="カテゴリID"
              />
            </div>

            {/* 取得件数 */}
            <div className="space-y-2">
              <Label htmlFor="hits">取得件数</Label>
              <Input
                id="hits"
                type="number"
                value={hits}
                onChange={(e) => setHits(e.target.value)}
                placeholder="30"
                min="1"
                max="100"
              />
            </div>

            {/* オフセット */}
            <div className="space-y-2">
              <Label htmlFor="offset">オフセット</Label>
              <Input
                id="offset"
                type="number"
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>

            {/* ソート */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sort">ソート順</Label>
              <Input
                id="sort"
                type="text"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                placeholder="+price（価格昇順）, -price（価格降順）など"
              />
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSearch}
              disabled={loading || !appId.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  検索中...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  商品検索
                </>
              )}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={loading}
            >
              クリア
            </Button>
          </div>
        </Card>

        {/* エラー表示 */}
        {error && (
          <Card className="p-4 border-red-500 bg-red-50">
            <p className="text-red-600 font-medium">エラー</p>
            <p className="text-red-800 text-sm mt-1">{error}</p>
          </Card>
        )}

        {/* 検索結果サマリー */}
        {result && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-blue-900 font-medium">検索結果</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
              <div>
                <span className="text-blue-700">取得件数:</span>
                <span className="ml-2 font-semibold">{result.returnedCount}件</span>
              </div>
              <div>
                <span className="text-blue-700">総件数:</span>
                <span className="ml-2 font-semibold">{result.totalCount.toLocaleString()}件</span>
              </div>
              <div>
                <span className="text-blue-700">オフセット:</span>
                <span className="ml-2 font-semibold">{result.offset}</span>
              </div>
            </div>
          </Card>
        )}

        {/* 商品一覧 */}
        {result && result.products.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">商品一覧</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.products.map((product) => (
                <Card key={product.code} className="p-4 hover:shadow-lg transition-shadow">
                  {/* 商品画像 */}
                  {product.imageUrl && (
                    <div className="mb-3">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-contain rounded"
                      />
                    </div>
                  )}

                  {/* 商品名 */}
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                    {product.name}
                  </h3>

                  {/* ブランド名 */}
                  {product.brandName && (
                    <p className="text-xs text-blue-600 mb-1">
                      ブランド: {product.brandName}
                    </p>
                  )}

                  {/* 価格 */}
                  <p className="text-lg font-bold text-red-600 mb-2">
                    ¥{product.price.toLocaleString()}
                  </p>

                  {/* ストア情報 */}
                  <p className="text-xs text-gray-600 mb-3">
                    {product.storeName}
                  </p>

                  {/* 商品コード */}
                  <p className="text-xs text-gray-500 mb-3">
                    商品コード: {product.code}
                  </p>

                  {/* 商品ページリンク */}
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    商品ページを開く
                  </a>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 結果が0件の場合 */}
        {result && result.products.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-600">検索結果が見つかりませんでした</p>
            <p className="text-sm text-gray-500 mt-2">
              検索条件を変更してお試しください
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
