/**
 * グローバル設定の型定義
 */

// 表示設定
export interface DisplaySettings {
  // デフォルト表示列
  defaultColumns: string[]
  // 列幅設定（カラム名 -> 幅）
  columnWidths: Record<string, number>
  // テーマ設定
  theme: "light" | "dark" | "system"
}

// ソート設定
export interface SortSettings {
  // 初期ソート列
  defaultSortColumn: string
  // ソート方向
  defaultSortDirection: "asc" | "desc"
}

// システム設定
export interface SystemSettings {
  // 通知設定
  enableNotifications: boolean
  // 自動更新間隔（分）
  autoRefreshInterval: number
}

// グローバル設定
export interface GlobalSettings {
  display: DisplaySettings
  sort: SortSettings
  system: SystemSettings
  // 最終更新日時
  lastUpdated: string
}

// デフォルト設定
export const DEFAULT_SETTINGS: GlobalSettings = {
  display: {
    defaultColumns: [
      "image",
      "name",
      "price",
      "purchase_price",
      "asin",
      "amazon_name",
      "amazon_price",
      "monthly_sales",
      "fee_rate",
      "fba_fee",
      "profit_amount",
      "profit_rate",
      "roi"
    ],
    columnWidths: {
      image: 96,
      name: 320,
      price: 128,
      purchase_price: 112,
      asin: 128,
      amazon_name: 320,
      amazon_price: 128,
      monthly_sales: 96,
      fee_rate: 96,
      fba_fee: 96,
      has_amazon: 80,
      has_official: 80,
      complaint_count: 96,
      is_dangerous: 80,
      is_per_carry_ng: 96,
      memo: 160,
      profit_amount: 112,
      profit_rate: 96,
      roi: 96
    },
    theme: "system"
  },
  sort: {
    defaultSortColumn: "name",
    defaultSortDirection: "asc"
  },
  system: {
    enableNotifications: true,
    autoRefreshInterval: 0 // 0 = 無効
  },
  lastUpdated: new Date().toISOString()
}

// 設定検証関数
export function validateSettings(settings: unknown): settings is GlobalSettings {
  if (typeof settings !== "object" || settings === null) {
    return false
  }

  const s = settings as Partial<GlobalSettings>

  return (
    typeof s.display === "object" &&
    typeof s.sort === "object" &&
    typeof s.system === "object" &&
    Array.isArray(s.display?.defaultColumns) &&
    typeof s.display?.columnWidths === "object" &&
    typeof s.sort?.defaultSortColumn === "string" &&
    (s.sort?.defaultSortDirection === "asc" || s.sort?.defaultSortDirection === "desc") &&
    typeof s.system?.enableNotifications === "boolean" &&
    typeof s.system?.autoRefreshInterval === "number"
  )
}
