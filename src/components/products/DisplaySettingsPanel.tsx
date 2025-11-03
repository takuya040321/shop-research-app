"use client"

/**
 * 表示設定パネルコンポーネント
 * ページサイズと列の表示/非表示を制御
 */

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { SettingsIcon, ChevronDownIcon, ChevronUpIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { loadSettings, updateDisplaySettings, updateSortSettings } from "@/lib/settings"
import { toast } from "sonner"
import { COLUMN_DEFINITIONS, getSortableColumns } from "@/lib/columnDefinitions"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200]

// ソート可能な列の定義
const SORTABLE_COLUMNS = [
  { id: "none", label: "なし" },
  ...getSortableColumns()
]

interface DisplaySettingsPanelProps {
  onSettingsChange?: () => void
}

export function DisplaySettingsPanel({ onSettingsChange }: DisplaySettingsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSortExpanded, setIsSortExpanded] = useState(false)
  const settings = loadSettings()
  const [pageSize, setPageSize] = useState(settings.display.pageSize)
  const [visibleColumns, setVisibleColumns] = useState(settings.display.visibleColumns)
  const [sortOrder, setSortOrder] = useState(settings.sort.sortOrder)

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

  const handleSortChange = (priority: number, field: "column" | "direction", value: string) => {
    const newSortOrder = [...sortOrder]

    // 優先度が範囲外の場合は新しい要素を追加
    while (newSortOrder.length <= priority) {
      newSortOrder.push({ column: "none", direction: "asc" as const })
    }

    if (field === "column") {
      if (value === "none") {
        // "なし"が選択された場合、この優先度以降を削除
        newSortOrder.splice(priority)
      } else {
        newSortOrder[priority] = {
          column: value,
          direction: newSortOrder[priority]?.direction || "asc"
        }
      }
    } else {
      newSortOrder[priority] = {
        column: newSortOrder[priority]?.column || "name",
        direction: value as "asc" | "desc"
      }
    }

    // "none"でない要素のみをフィルタ
    const filtered = newSortOrder.filter(item => item.column !== "none")

    setSortOrder(filtered)
    const success = updateSortSettings({ sortOrder: filtered })
    if (success) {
      toast.success("並び順を設定しました")
      onSettingsChange?.()
    } else {
      toast.error("設定の保存に失敗しました")
    }
  }

  const handleResetSort = () => {
    const defaultSort = [{ column: "name", direction: "asc" as const }]
    setSortOrder(defaultSort)
    const success = updateSortSettings({ sortOrder: defaultSort })
    if (success) {
      toast.success("並び順をリセットしました")
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSortExpanded(!isSortExpanded)}
            className="flex items-center gap-2"
          >
            並び順設定
            {isSortExpanded ? (
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

      {/* 並び順設定パネル */}
      {isSortExpanded && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">並び順を設定（最大3段階）</span>
            <Button variant="ghost" size="sm" onClick={handleResetSort}>
              リセット
            </Button>
          </div>

          <div className="space-y-3">
            {[0, 1, 2].map((priority) => {
              const currentSort = sortOrder[priority] || { column: "none", direction: "asc" }
              const priorityLabels = ["第一優先", "第二優先", "第三優先"]

              return (
                <div key={priority} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-20">
                    {priorityLabels[priority]}:
                  </span>

                  <Select
                    value={currentSort.column}
                    onValueChange={(value) => handleSortChange(priority, "column", value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORTABLE_COLUMNS.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {currentSort.column !== "none" && (
                    <Select
                      value={currentSort.direction}
                      onValueChange={(value) => handleSortChange(priority, "direction", value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">
                          <div className="flex items-center gap-2">
                            <ArrowUpIcon className="w-4 h-4" />
                            昇順
                          </div>
                        </SelectItem>
                        <SelectItem value="desc">
                          <div className="flex items-center gap-2">
                            <ArrowDownIcon className="w-4 h-4" />
                            降順
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
