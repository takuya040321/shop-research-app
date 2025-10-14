"use client"

import Link from "next/link"
import { MainLayout } from "@/components/layout/MainLayout"
import { Button } from "@/components/ui/Button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import {
  Package,
  Database,
  Search,
  DollarSign,
  Percent,
  StarIcon,
} from "lucide-react"
import { formatPrice, formatPercentage } from "@/lib/products"
import { useDashboard } from "@/hooks/dashboard/useDashboard"

export default function Home() {
  // カスタムフックから全てのロジックを取得
  const { summary, shopStats, favoriteProducts, loading } = useDashboard()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground">
            化粧品転売リサーチツールへようこそ
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  総商品数
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : summary?.totalProducts.toLocaleString() || 0}
                </p>
              </div>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ASIN紐付け済み
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : summary?.productsWithAsin.toLocaleString() || 0}
                </p>
              </div>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  総利益額（予測）
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatPrice(summary?.totalProfitAmount || 0)}
                </p>
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  平均利益率
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatPercentage(summary?.averageProfitRate || 0)}
                </p>
              </div>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* ショップ別概要 */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">ショップ別概要</h3>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">読み込み中...</p>
          ) : shopStats.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              データがありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ショップ</TableHead>
                  <TableHead className="text-right">商品数</TableHead>
                  <TableHead className="text-right">ASIN紐付け率</TableHead>
                  <TableHead className="text-right">平均利益率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shopStats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{stat.shopName}</TableCell>
                    <TableCell className="text-right">
                      {stat.productCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(stat.asinLinkRate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(stat.averageProfitRate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* お気に入り一覧 */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <h3 className="font-semibold">お気に入り商品</h3>
          </div>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">読み込み中...</p>
          ) : favoriteProducts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              お気に入り商品がありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品名</TableHead>
                  <TableHead className="text-right">仕入価格</TableHead>
                  <TableHead className="text-right">Amazon価格</TableHead>
                  <TableHead className="text-right">利益額</TableHead>
                  <TableHead className="text-right">利益率</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {favoriteProducts.slice(0, 10).map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium max-w-[300px] truncate">
                      {product.source_url ? (
                        <a
                          href={product.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {product.name}
                        </a>
                      ) : (
                        product.name
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(product.effective_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(product.asin?.amazon_price)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      (product.profit_amount || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatPrice(product.profit_amount)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      (product.profit_rate || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatPercentage(product.profit_rate)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      (product.roi || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatPercentage(product.roi)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {favoriteProducts.length > 10 && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                さらに{favoriteProducts.length - 10}件のお気に入り商品があります
              </p>
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/official">
            <div className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold mb-2">公式サイト</h3>
              <p className="text-sm text-muted-foreground mb-4">
                VT、DHC、innisfreeの公式サイト商品
              </p>
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                商品を見る
              </Button>
            </div>
          </Link>

          <Link href="/rakuten/muji">
            <div className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold mb-2">楽天市場</h3>
              <p className="text-sm text-muted-foreground mb-4">
                楽天市場の商品をリサーチ
              </p>
              <Button variant="outline" className="w-full">
                <Package className="h-4 w-4 mr-2" />
                商品を見る
              </Button>
            </div>
          </Link>

          <Link href="/settings">
            <div className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold mb-2">設定</h3>
              <p className="text-sm text-muted-foreground mb-4">
                表示設定・ソート設定・通知設定
              </p>
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                設定を開く
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}
