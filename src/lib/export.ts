/**
 * データエクスポートユーティリティ
 */

import Papa from "papaparse"
import type { ExtendedProduct } from "./products"
import type { Asin } from "@/types/database"
import { getErrorLogs } from "./error-logger"
import { loadSettings } from "./settings"

/**
 * 商品データをCSVエクスポート
 */
export function exportProductsToCSV(products: ExtendedProduct[], filename = "products.csv"): void {
  const data = products.map((product) => ({
    ID: product.id,
    ショップ種別: product.shop_type,
    ショップ名: product.shop_name,
    商品名: product.name,
    価格: product.price,
    セール価格: product.sale_price,
    購入価格: product.effective_price,
    ASIN: product.asin,
    Amazon商品名: product.amazon_name,
    Amazon価格: product.amazon_price,
    月間販売数: product.monthly_sales,
    手数料率: product.fee_rate,
    FBA手数料: product.fba_fee,
    利益額: product.profit_amount,
    利益率: product.profit_rate,
    ROI: product.roi,
    画像URL: product.image_url,
    商品URL: product.source_url,
    非表示: product.is_hidden ? "はい" : "いいえ",
    メモ: product.memo,
    作成日時: product.created_at,
    更新日時: product.updated_at,
  }))

  downloadCSV(data, filename)
}

/**
 * ASINデータをCSVエクスポート
 */
export function exportAsinsToCSV(asins: Asin[], filename = "asins.csv"): void {
  const data = asins.map((asin) => ({
    ID: asin.id,
    ASIN: asin.asin,
    Amazon商品名: asin.amazon_name,
    Amazon価格: asin.amazon_price,
    月間販売数: asin.monthly_sales,
    手数料率: asin.fee_rate,
    FBA手数料: asin.fba_fee,
    JANコード: asin.jan_code,
    Amazon出品: asin.has_amazon ? "あり" : "なし",
    公式サイト販売: asin.has_official ? "あり" : "なし",
    クレーム数: asin.complaint_count,
    危険物: asin.is_dangerous ? "はい" : "いいえ",
    輸送不可: asin.is_per_carry_ng ? "はい" : "いいえ",
    メモ: asin.memo,
    作成日時: asin.created_at,
    更新日時: asin.updated_at,
  }))

  downloadCSV(data, filename)
}

/**
 * エラーログをCSVエクスポート
 */
export function exportErrorLogsToCSV(filename = "error_logs.csv"): void {
  const logs = getErrorLogs()

  const data = logs.map((log) => ({
    ID: log.id,
    種類: log.type,
    カテゴリ: log.category,
    メッセージ: log.message,
    詳細: log.details || "",
    日時: log.timestamp,
  }))

  downloadCSV(data, filename)
}

/**
 * 設定データをJSONエクスポート
 */
export function exportSettingsToJSON(filename = "settings.json"): void {
  const settings = loadSettings()
  downloadJSON(settings, filename)
}

/**
 * 設定データをインポート
 */
export function importSettingsFromJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const settings = JSON.parse(content)
        resolve(settings)
      } catch {
        reject(new Error("設定ファイルの読み込みに失敗しました"))
      }
    }

    reader.onerror = () => {
      reject(new Error("ファイルの読み込みに失敗しました"))
    }

    reader.readAsText(file)
  })
}

/**
 * CSVデータをダウンロード
 */
function downloadCSV(data: unknown[], filename: string): void {
  const csv = Papa.unparse(data, {
    header: true,
  })

  // BOM付きUTF-8で保存（Excelで正しく開くため）
  const bom = "\uFEFF"
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, filename)
}

/**
 * JSONデータをダウンロード
 */
function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" })
  downloadBlob(blob, filename)
}

/**
 * Blobをダウンロード
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 統計データをエクスポート
 */
export function exportStatisticsToCSV(
  summary: {
    totalProducts: number
    productsWithAsin: number
    asinLinkRate: number
    averageProfitRate: number
    totalProfitAmount: number
  },
  shopStats: Array<{
    shopType: string
    shopName: string
    productCount: number
    asinLinkRate: number
    averageProfitRate: number
  }>,
  filename = "statistics.csv"
): void {
  const summaryData = [
    { 項目: "総商品数", 値: summary.totalProducts },
    { 項目: "ASIN紐付け済み商品数", 値: summary.productsWithAsin },
    { 項目: "ASIN紐付け率", 値: `${summary.asinLinkRate}%` },
    { 項目: "平均利益率", 値: `${summary.averageProfitRate}%` },
    { 項目: "総利益額", 値: `¥${summary.totalProfitAmount.toLocaleString()}` },
    { 項目: "", 値: "" }, // 空行
  ]

  const shopData = shopStats.map((stat) => ({
    項目: `${stat.shopName}`,
    値: `商品数: ${stat.productCount}, ASIN紐付け率: ${stat.asinLinkRate}%, 平均利益率: ${stat.averageProfitRate}%`,
  }))

  const data = [...summaryData, ...shopData]
  downloadCSV(data, filename)
}
