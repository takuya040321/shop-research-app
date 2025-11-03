/**
 * テーブル列定義の共通定義
 * ヘッダー、行、設定パネルで統一された列定義を使用
 */

export interface ColumnDefinition {
  id: string
  label: string
  sortable: boolean
  width?: string
}

/**
 * 全列定義
 */
export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { id: "favorite", label: "お気に入り", sortable: true, width: "w-12" },
  { id: "image", label: "画像", sortable: false, width: "w-24" },
  { id: "name", label: "商品名", sortable: true, width: "min-w-[200px]" },
  { id: "price", label: "価格", sortable: true, width: "w-32" },
  { id: "purchase_price", label: "仕入価格", sortable: true, width: "w-24" },
  { id: "asin", label: "ASIN", sortable: true, width: "w-24" },
  { id: "amazon_name", label: "Amazon商品名", sortable: true, width: "min-w-[250px]" },
  { id: "amazon_price", label: "Amazon価格", sortable: true, width: "w-24" },
  { id: "monthly_sales", label: "月間売上", sortable: true, width: "w-20" },
  { id: "fee_rate", label: "手数料率", sortable: true, width: "w-20" },
  { id: "fba_fee", label: "FBA料", sortable: true, width: "w-20" },
  { id: "jan_code", label: "JANコード", sortable: true, width: "w-24" },
  { id: "profit_amount", label: "利益額", sortable: true, width: "w-24" },
  { id: "profit_rate", label: "利益率", sortable: true, width: "w-20" },
  { id: "roi", label: "ROI", sortable: true, width: "w-20" },
  { id: "is_hidden", label: "非表示", sortable: true, width: "w-16" },
  { id: "has_amazon", label: "Amazon有", sortable: true, width: "w-16" },
  { id: "has_official", label: "公式有", sortable: true, width: "w-16" },
  { id: "complaint_count", label: "クレーム数", sortable: true, width: "w-16" },
  { id: "is_dangerous", label: "危険品", sortable: true, width: "w-16" },
  { id: "is_per_carry_ng", label: "パーキャリNG", sortable: true, width: "w-16" },
  { id: "memo", label: "ASINメモ", sortable: true, width: "min-w-[120px]" }
]

/**
 * ソート可能な列のみを取得
 */
export function getSortableColumns(): ColumnDefinition[] {
  return COLUMN_DEFINITIONS.filter(col => col.sortable)
}

/**
 * 列IDから列定義を取得
 */
export function getColumnById(id: string): ColumnDefinition | undefined {
  return COLUMN_DEFINITIONS.find(col => col.id === id)
}
