/**
 * 商品テーブルヘッダーコンポーネント
 * ソート機能付き・列の表示/非表示対応・ドラッグ&ドロップによる列順序変更
 */

"use client"

import React from "react"
import { TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { ChevronUpIcon, ChevronDownIcon, StarIcon, GripVerticalIcon } from "lucide-react"
import { loadSettings } from "@/lib/settings"
import { type ColumnDefinition } from "@/lib/columnDefinitions"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface ProductTableHeaderProps {
  orderedColumns: ColumnDefinition[]
}

// ドラッグ可能な列ヘッダー
interface SortableHeaderProps {
  column: ColumnDefinition
  renderContent: () => React.ReactElement
}

function SortableHeader({ column, renderContent }: SortableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${column.width || ""} text-xs text-center bg-gray-50 relative`}
    >
      <div className="flex items-center justify-center gap-1">
        <GripVerticalIcon className="w-4 h-4 text-gray-400" />
        {renderContent()}
      </div>
    </TableHead>
  )
}

export function ProductTableHeader({ orderedColumns }: ProductTableHeaderProps) {
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

  // 列ごとのカスタムレンダリング（内容のみ）
  const renderColumnContent = (column: ColumnDefinition) => {
    // お気に入り列は特別なアイコン表示
    if (column.id === "favorite") {
      return (
        <>
          <StarIcon className="w-4 h-4" />
          {renderSortIcon(column.id)}
        </>
      )
    }

    // 画像列
    if (column.id === "image") {
      return <>{column.label}</>
    }

    // 通常の列
    return (
      <>
        {column.label}
        {renderSortIcon(column.id)}
      </>
    )
  }

  return (
    <TableHeader>
      <TableRow>
        {orderedColumns.map((column) => {
          // 非表示設定の列はスキップ
          if (visibleColumns[column.id] === false) {
            return null
          }

          return (
            <SortableHeader
              key={column.id}
              column={column}
              renderContent={() => renderColumnContent(column)}
            />
          )
        })}
      </TableRow>
    </TableHeader>
  )
}
