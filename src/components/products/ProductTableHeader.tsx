/**
 * 商品テーブルヘッダーコンポーネント
 * ソート機能付き・列の表示/非表示対応
 */

"use client"

import { TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { ChevronUpIcon, ChevronDownIcon, StarIcon } from "lucide-react"
import { loadSettings } from "@/lib/settings"
import { COLUMN_DEFINITIONS } from "@/lib/columnDefinitions"

interface ProductTableHeaderProps {}

export function ProductTableHeader({}: ProductTableHeaderProps) {
  const settings = loadSettings()
  const visibleColumns = settings.display.visibleColumns
  const sortOrder = settings.sort.sortOrder

  // 現在のソート設定に基づいてソートアイコンをレンダリング
  const renderSortIcon = (columnId: string) => {
    // ASIN関連フィールドはasin_プレフィックスで検索
    const asinFields = [
      "asin", "amazon_name", "amazon_price", "monthly_sales",
      "fee_rate", "fba_fee", "jan_code", "has_amazon", "has_official",
      "complaint_count", "is_dangerous", "is_per_carry_ng", "memo"
    ]

    let searchField = columnId
    if (asinFields.includes(columnId)) {
      searchField = columnId === "asin" ? "asin" : columnId
    }

    // 仕入価格はeffective_priceでソート
    if (columnId === "purchase_price") {
      searchField = "purchase_price"
    }

    // お気に入りはis_favoriteでソート
    if (columnId === "favorite") {
      searchField = "is_favorite"
    }

    // ソート順設定から該当する列を検索
    const sortIndex = sortOrder.findIndex(s => s.column === searchField)
    if (sortIndex === -1) return null

    const sort = sortOrder[sortIndex]
    if (!sort) return null

    const priorityLabel = sortIndex === 0 ? "①" : sortIndex === 1 ? "②" : "③"

    return (
      <span className="flex items-center gap-1">
        {sort.direction === "asc" ? (
          <ChevronUpIcon className="w-4 h-4" />
        ) : (
          <ChevronDownIcon className="w-4 h-4" />
        )}
        <span className="text-xs font-bold">{priorityLabel}</span>
      </span>
    )
  }

  // 列ごとのカスタムレンダリング
  const renderColumnHeader = (columnId: string, label: string, width: string) => {
    // お気に入り列は特別なアイコン表示
    if (columnId === "favorite") {
      return (
        <TableHead
          key={columnId}
          className={`${width} text-xs text-center bg-gray-50`}
        >
          <div className="flex items-center justify-center gap-1">
            <StarIcon className="w-4 h-4" />
            {renderSortIcon(columnId)}
          </div>
        </TableHead>
      )
    }

    // 画像列
    if (columnId === "image") {
      return (
        <TableHead
          key={columnId}
          className={`${width} text-xs text-center bg-gray-50`}
        >
          <div className="flex items-center justify-center">
            {label}
          </div>
        </TableHead>
      )
    }

    // 通常の列
    return (
      <TableHead
        key={columnId}
        className={`${width} text-xs text-center bg-gray-50`}
      >
        <div className="flex items-center justify-center gap-1">
          {label}
          {renderSortIcon(columnId)}
        </div>
      </TableHead>
    )
  }

  return (
    <TableHeader>
      <TableRow>
        {COLUMN_DEFINITIONS.map((column) => {
          // 非表示設定の列はスキップ
          if (visibleColumns[column.id] === false) {
            return null
          }

          return renderColumnHeader(column.id, column.label, column.width || "")
        })}
      </TableRow>
    </TableHeader>
  )
}
