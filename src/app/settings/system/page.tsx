"use client"

/**
 * システム情報・運用機能ページ
 */

import { MainLayout } from "@/components/layout/MainLayout"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import {
  Download,
  Upload,
  Database,
  HardDrive,
  Info,
  Package,
} from "lucide-react"
import { useSystem } from "@/hooks/system/useSystem"

export default function SystemPage() {
  // カスタムフックから全てのロジックを取得
  const {
    summary,
    asinCount,
    storageSize,
    handleExportProducts,
    handleExportAsins,
    handleExportStatistics,
    handleExportErrorLogs,
    handleExportSettings,
    handleImportSettings,
    formatBytes
  } = useSystem()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">システム情報・運用機能</h1>
          <p className="text-muted-foreground">
            システム情報の確認とデータエクスポート
          </p>
        </div>

        {/* システム統計 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">総商品数</p>
                <p className="text-2xl font-bold">{summary?.totalProducts || 0}</p>
              </div>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">総ASIN数</p>
                <p className="text-2xl font-bold">{asinCount}</p>
              </div>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ローカルストレージ
                </p>
                <p className="text-2xl font-bold">{formatBytes(storageSize)}</p>
              </div>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">バージョン</p>
                <p className="text-2xl font-bold">v1.0.0</p>
              </div>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* データエクスポート */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Download className="h-5 w-5" />
            データエクスポート
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button onClick={handleExportProducts} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              商品データ (CSV)
            </Button>
            <Button onClick={handleExportAsins} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              ASINデータ (CSV)
            </Button>
            <Button onClick={handleExportStatistics} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              統計データ (CSV)
            </Button>
            <Button onClick={handleExportErrorLogs} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              エラーログ (CSV)
            </Button>
            <Button onClick={handleExportSettings} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              設定データ (JSON)
            </Button>
          </div>
        </Card>

        {/* データインポート */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            データインポート
          </h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="import-settings" className="cursor-pointer">
                <Button variant="outline" className="w-full md:w-auto" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    設定データをインポート (JSON)
                  </span>
                </Button>
              </label>
              <input
                id="import-settings"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportSettings}
              />
            </div>
          </div>
        </Card>

        {/* データベース情報 */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            データベース情報
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">接続状態:</span>
              <span className="font-medium text-green-600">接続済み</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">データベース:</span>
              <span className="font-medium">Supabase PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">総商品数:</span>
              <span className="font-medium">{summary?.totalProducts || 0} 件</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">総ASIN数:</span>
              <span className="font-medium">{asinCount} 件</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ASIN紐付け率:</span>
              <span className="font-medium">{summary?.asinLinkRate || 0}%</span>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
