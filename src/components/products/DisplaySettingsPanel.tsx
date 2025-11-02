"use client"

/**
 * 表示設定パネルコンポーネント
 * ページサイズと列の表示/非表示を制御
 */

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { SettingsIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { loadSettings, updateDisplaySettings } from "@/lib/settings"
import { toast } from "sonner"

interface ColumnDefinition {
  id: string
  label: string
}

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  { id: "favorite", label: "お気に入り" },
  { id: "image", label: "画像" },
  { id: "name", label: "商品名" },
  { id: "price", label: "価格" },
  { id: "purchase_price", label: "仕入価格" },
  { id: "asin", label: "ASIN" },
  { id: "amazon_name", label: "Amazon商品名" },
  { id: "amazon_price", label: "Amazon価格" },
  { id: "monthly_sales", label: "月間売上" },
  { id: "fee_rate", label: "手数料率" },
  { id: "fba_fee", label: "FBA料" },
  { id: "jan_code", label: "JANコード" },
  { id: "profit_amount", label: "利益額" },
  { id: "profit_rate", label: "利益率" },
  { id: "roi", label: "ROI" },
  { id: "is_hidden", label: "非表示" },
  { id: "has_amazon", label: "Amazon有" },
  { id: "has_official", label: "公式有" },
  { id: "complaint_count", label: "クレーム数" },
  { id: "is_dangerous", label: "危険品" },
  { id: "is_per_carry_ng", label: "パーキャリNG" }
]

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200]

interface DisplaySettingsPanelProps {
  onSettingsChange?: () => void
}

export function DisplaySettingsPanel({ onSettingsChange }: DisplaySettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const settings = loadSettings()
  const [pageSize, setPageSize] = useState(settings.display.pageSize)
  const [visibleColumns, setVisibleColumns] = useState(settings.display.visibleColumns)

  const handlePageSizeChange = (value: string) => {
    const newSize = parseInt(value)
    setPageSize(newSize)
    const success = updateDisplaySettings({ pageSize: newSize })
    if (success) {
      toast.success(`表示件数を${newSize}件に変更しました`)
      onSettingsChange?.()
    } else {
      toast.error("設定の保存に失敗しました")
    }
  }

  const handleColumnToggle = (columnId: string) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnId]: !visibleColumns[columnId]
    }
    setVisibleColumns(newVisibleColumns)
    const success = updateDisplaySettings({ visibleColumns: newVisibleColumns })
    if (success) {
      const column = COLUMN_DEFINITIONS.find(c => c.id === columnId)
      const action = newVisibleColumns[columnId] ? "表示" : "非表示"
      toast.success(`${column?.label}列を${action}に設定しました`)
      onSettingsChange?.()
    } else {
      toast.error("設定の保存に失敗しました")
    }
  }

  const handleShowAll = () => {
    const allVisible = COLUMN_DEFINITIONS.reduce((acc, col) => {
      acc[col.id] = true
      return acc
    }, {} as Record<string, boolean>)
    setVisibleColumns(allVisible)
    const success = updateDisplaySettings({ visibleColumns: allVisible })
    if (success) {
      toast.success("すべての列を表示に設定しました")
      onSettingsChange?.()
    } else {
      toast.error("設定の保存に失敗しました")
    }
  }

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length

  return (
    <Card className="p-4 mb-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <SettingsIcon className="w-5 h-5 text-gray-600" />
          <span className="font-medium">表示設定</span>
          <span className="text-sm text-gray-500">
            ({visibleCount}/{COLUMN_DEFINITIONS.length}列表示)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">表示件数:</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(size => (
                <SelectItem key={size} value={String(size)}>
                  {size}件
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            列設定
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 列設定パネル */}
      {isExpanded && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">表示する列を選択</span>
            <Button variant="ghost" size="sm" onClick={handleShowAll}>
              すべて表示
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {COLUMN_DEFINITIONS.map(column => (
              <label
                key={column.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[column.id] ?? true}
                  onChange={() => handleColumnToggle(column.id)}
                  className="rounded"
                />
                <span className="text-sm">{column.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
