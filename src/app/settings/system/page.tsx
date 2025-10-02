"use client"

/**
 * システム情報・運用機能ページ
 */

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Download,
  Upload,
  Database,
  HardDrive,
  Info,
  Package,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getDashboardSummary, getShopStats } from "@/lib/dashboard"
import {
  exportProductsToCSV,
  exportAsinsToCSV,
  exportErrorLogsToCSV,
  exportSettingsToJSON,
  exportStatisticsToCSV,
  importSettingsFromJSON,
} from "@/lib/export"
import { getProductsWithAsinAndProfits } from "@/lib/products"
import { showSuccess, showError } from "@/lib/toast"
import { saveSettings } from "@/lib/settings"

const TEST_USER_ID = "test-user-id"

export default function SystemPage() {
  const [storageSize, setStorageSize] = useState(0)

  // システム統計データ取得
  const { data: summary } = useQuery({
    queryKey: ["dashboardSummary", TEST_USER_ID],
    queryFn: () => getDashboardSummary(TEST_USER_ID),
  })

  const { data: shopStats = [] } = useQuery({
    queryKey: ["shopStats", TEST_USER_ID],
    queryFn: () => getShopStats(TEST_USER_ID),
  })

  // ASIN総数取得
  const { data: asinCount = 0 } = useQuery({
    queryKey: ["asinCount", TEST_USER_ID],
    queryFn: async () => {
      const { count } = await supabase
        .from("asins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", TEST_USER_ID)
      return count || 0
    },
  })

  useEffect(() => {
    calculateStorageSize()
  }, [])

  const calculateStorageSize = () => {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ""
        total += key.length + value.length
      }
    }
    setStorageSize(total)
  }

  const handleExportProducts = async () => {
    try {
      const products = await getProductsWithAsinAndProfits(TEST_USER_ID)
      exportProductsToCSV(products, `products_${new Date().toISOString().split("T")[0]}.csv`)
      showSuccess(`${products.length}件の商品データをエクスポートしました`)
    } catch (error) {
      console.error("商品エクスポートエラー:", error)
      showError("商品データのエクスポートに失敗しました")
    }
  }

  const handleExportAsins = async () => {
    try {
      const { data: asins } = await supabase
        .from("asins")
        .select("*")
        .eq("user_id", TEST_USER_ID)

      if (asins) {
        exportAsinsToCSV(asins, `asins_${new Date().toISOString().split("T")[0]}.csv`)
        showSuccess(`${asins.length}件のASINデータをエクスポートしました`)
      }
    } catch (error) {
      console.error("ASINエクスポートエラー:", error)
      showError("ASINデータのエクスポートに失敗しました")
    }
  }

  const handleExportStatistics = () => {
    if (summary) {
      exportStatisticsToCSV(
        summary,
        shopStats,
        `statistics_${new Date().toISOString().split("T")[0]}.csv`
      )
      showSuccess("統計データをエクスポートしました")
    }
  }

  const handleExportErrorLogs = () => {
    exportErrorLogsToCSV(`error_logs_${new Date().toISOString().split("T")[0]}.csv`)
    showSuccess("エラーログをエクスポートしました")
  }

  const handleExportSettings = () => {
    exportSettingsToJSON(`settings_${new Date().toISOString().split("T")[0]}.json`)
    showSuccess("設定データをエクスポートしました")
  }

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const settings = await importSettingsFromJSON(file)
      saveSettings(settings as any)
      showSuccess("設定データをインポートしました。ページを再読み込みしてください。")
    } catch (error) {
      console.error("設定インポートエラー:", error)
      showError("設定データのインポートに失敗しました")
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`
  }

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
