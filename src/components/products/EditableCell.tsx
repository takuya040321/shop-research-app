/**
 * 編集可能なセルコンポーネント
 * インライン編集機能を提供
 */

import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { EditIcon, SaveIcon, XIcon } from "lucide-react"

interface EditingCell {
  productId: string
  field: string
  value: string
}

interface EditableCellProps {
  productId: string
  field: string
  value: unknown
  type?: "text" | "number" | "boolean"
  editingCell: EditingCell | null
  onStartEdit: (productId: string, field: string, value: unknown) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onEditingValueChange: (value: string) => void
}

export function EditableCell({
  productId,
  field,
  value,
  type = "text",
  editingCell,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditingValueChange
}: EditableCellProps) {
  const isEditing = editingCell?.productId === productId && editingCell?.field === field

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {type === "boolean" ? (
          <select
            value={editingCell.value}
            onChange={(e) => onEditingValueChange(e.target.value)}
            className="w-20 px-1 py-1 text-xs border rounded"
            autoFocus
          >
            <option value="true">はい</option>
            <option value="false">いいえ</option>
          </select>
        ) : (
          <Input
            type={type}
            value={editingCell.value}
            onChange={(e) => onEditingValueChange(e.target.value)}
            className="w-24 h-6 px-1 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit()
              if (e.key === "Escape") onCancelEdit()
            }}
          />
        )}
        <Button variant="ghost" size="sm" onClick={onSaveEdit} className="h-6 w-6 p-0">
          <SaveIcon className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancelEdit} className="h-6 w-6 p-0">
          <XIcon className="w-3 h-3" />
        </Button>
      </div>
    )
  }

  // フォーマット処理
  const formatValue = () => {
    if (type === "boolean") return value ? "はい" : "いいえ"
    if (!value && value !== 0) return "-"

    // Amazon価格とFBA料は¥表記
    if (field === "asin_amazon_price" || field === "asin_fba_fee") {
      return `¥${Number(value).toLocaleString()}`
    }

    // 手数料率は%表記
    if (field === "asin_fee_rate") {
      return `${value}%`
    }

    return String(value)
  }

  return (
    <div
      className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded group"
      onClick={() => onStartEdit(productId, field, value)}
    >
      <span className="text-sm">{formatValue()}</span>
      <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-50" />
    </div>
  )
}
