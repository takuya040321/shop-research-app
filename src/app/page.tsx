"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Package,
  Database,
  Search,
  DollarSign,
  Percent,
} from "lucide-react"
import { getDashboardSummary, getShopStats } from "@/lib/dashboard"
import { formatPrice, formatPercentage } from "@/lib/products"

const TEST_USER_ID = "test-user-id"

export default function Home() {
  // ダッシュボードサマリーデータ取得
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboardSummary", TEST_USER_ID],
    queryFn: () => getDashboardSummary(TEST_USER_ID),
  })

  // ショップ統計データ取得
  const { data: shopStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ["shopStats", TEST_USER_ID],
    queryFn: () => getShopStats(TEST_USER_ID),
  })

  const loading = summaryLoading || statsLoading

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
