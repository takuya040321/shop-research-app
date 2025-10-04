/**
 * システム情報・運用機能用カスタムフック
 * データエクスポート/インポート、統計情報取得を提供
 */

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
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

export function useSystem() {
  const [storageSize, setStorageSize] = useState(0)

  // システム統計データ取得
  const { data: summary } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => getDashboardSummary(),
  })

  const { data: shopStats = [] } = useQuery({
    queryKey: ["shopStats"],
    queryFn: () => getShopStats(),
  })

  // ASIN総数取得
  const { data: asinCount = 0 } = useQuery({
    queryKey: ["asinCount"],
    queryFn: async () => {
      const { count } = await supabase
        .from("asins")
        .select("*", { count: "exact", head: true })
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
      const products = await getProductsWithAsinAndProfits()
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return {
    // State
    summary,
    shopStats,
    asinCount,
    storageSize,

    // Actions
    handleExportProducts,
    handleExportAsins,
    handleExportStatistics,
    handleExportErrorLogs,
    handleExportSettings,
    handleImportSettings,
    formatBytes
  }
}
