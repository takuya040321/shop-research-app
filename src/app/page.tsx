import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import {
  Package,
  Database,
  Search,
  TrendingUp,
  DollarSign,
} from "lucide-react"

export default function Home() {
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
                  登録商品数
                </p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ASIN数
                </p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  今月の利益予想
                </p>
                <p className="text-2xl font-bold">¥0</p>
              </div>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  成長率
                </p>
                <p className="text-2xl font-bold">+0%</p>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">商品リサーチ</h3>
            <p className="text-sm text-muted-foreground mb-4">
              公式サイト・楽天・Yahooで商品をリサーチ
            </p>
            <Button className="w-full">
              <Search className="h-4 w-4 mr-2" />
              リサーチ開始
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">商品管理</h3>
            <p className="text-sm text-muted-foreground mb-4">
              登録済み商品の管理・編集
            </p>
            <Button variant="outline" className="w-full">
              <Package className="h-4 w-4 mr-2" />
              商品一覧
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-2">ASIN管理</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Amazon ASINの管理・更新
            </p>
            <Button variant="outline" className="w-full">
              <Database className="h-4 w-4 mr-2" />
              ASIN一覧
            </Button>
          </div>
        </div>

        {/* 最近の活動 */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">最近の活動</h3>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              まだ活動履歴がありません
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
