/**
 * 商品行コンポーネント
 * 1商品の行表示とインライン編集・列の表示/非表示対応
 */

"use client"

import { TableCell, TableRow } from "@/components/ui/Table"
import { Input } from "@/components/ui/Input"
import { StarIcon } from "lucide-react"
import { toast } from "sonner"
import type { ExtendedProduct } from "@/lib/products"
import { formatPrice, formatPercentage, updateAsin, updateProduct } from "@/lib/products"
import { ImagePreview } from "./ImagePreview"
import { EditableCell } from "./EditableCell"
import { loadSettings } from "@/lib/settings"

interface EditingCell {
  productId: string
  field: string
  value: string
}

interface ProductRowProps {
  product: ExtendedProduct
  editingCell: EditingCell | null
  onContextMenu: (event: React.MouseEvent, product: ExtendedProduct) => void
  onToggleFavorite: (product: ExtendedProduct) => void
  onStartEdit: (productId: string, field: string, value: unknown) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onEditingValueChange: (value: string) => void
  onUpdateProductInState: (productId: string, updates: Partial<ExtendedProduct>) => void
  orderedColumns: import("@/lib/columnDefinitions").ColumnDefinition[]
}

export function ProductRow({
  product,
  editingCell,
  onContextMenu,
  onToggleFavorite,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditingValueChange,
  onUpdateProductInState,
  orderedColumns
}: ProductRowProps) {
  const settings = loadSettings()
  const visibleColumns = settings.display.visibleColumns

  // 行の背景色を決定
  const isDangerous = product.asin?.is_dangerous || false
  const isPerCarryNG = product.asin?.is_per_carry_ng || false

  let rowClassName = "h-24 cursor-pointer"
  if (isDangerous) {
    rowClassName += " bg-red-50 hover:bg-red-100"
  } else if (isPerCarryNG) {
    rowClassName += " bg-yellow-50 hover:bg-yellow-100"
  } else {
    rowClassName += " hover:bg-gray-50"
  }

  // 各列のセルをレンダリング
  const renderCell = (columnId: string, width: string) => {
    switch (columnId) {
      case "favorite":
        return (
          <TableCell key={columnId} className={`${width} text-center`}>
            <button
              onClick={() => onToggleFavorite(product)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <StarIcon
                className={`w-5 h-5 ${
                  product.is_favorite
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-400"
                }`}
              />
            </button>
          </TableCell>
        )

      case "image":
        return (
          <TableCell key={columnId} className={`py-2 ${width}`}>
            <ImagePreview imageUrl={product.image_url} productName={product.name} />
          </TableCell>
        )

      case "name":
        return (
          <TableCell key={columnId} className={width}>
            {product.source_url ? (
              <a
                href={product.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-sm"
              >
                {product.name}
              </a>
            ) : (
              <span className="text-sm">{product.name}</span>
            )}
          </TableCell>
        )

      case "price":
        return (
          <TableCell key={columnId} className={width}>
            <div className="text-sm">
              {product.sale_price && product.price && product.sale_price !== product.price ? (
                <div>
                  <div className="line-through text-gray-500">
                    {formatPrice(product.price)}
                  </div>
                  <div className="text-red-600 font-medium">
                    {formatPrice(product.sale_price)}
                  </div>
                </div>
              ) : (
                <div className="font-medium">
                  {formatPrice(product.price || product.sale_price)}
                </div>
              )}
            </div>
          </TableCell>
        )

      case "purchase_price":
        return (
          <TableCell key={columnId} className={width}>
            {(() => {
              const basePrice = product.sale_price || product.price || 0
              const effectivePrice = product.effective_price || 0
              const hasDiscount = basePrice !== effectivePrice && effectivePrice < basePrice

              if (hasDiscount) {
                return (
                  <div>
                    <div className="line-through text-gray-500 text-xs">
                      {formatPrice(basePrice)}
                    </div>
                    <div className="text-green-600 font-medium text-sm">
                      {formatPrice(effectivePrice)}
                    </div>
                  </div>
                )
              }

              return (
                <span className="text-sm font-medium text-green-600">
                  {formatPrice(effectivePrice)}
                </span>
              )
            })()}
          </TableCell>
        )

      case "asin":
        return (
          <TableCell key={columnId} className={width}>
            <EditableCell
              productId={product.id}
              field="asin_asin"
              value={product.asin?.asin || ""}
              type="text"
              editingCell={editingCell}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSaveEdit={onSaveEdit}
              onEditingValueChange={onEditingValueChange}
            />
          </TableCell>
        )

      case "amazon_name":
        return (
          <TableCell key={columnId} className={width}>
            {product.asin?.asin ? (
              <a
                href={`https://www.amazon.co.jp/dp/${product.asin.asin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {product.asin.amazon_name || product.asin.asin}
              </a>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </TableCell>
        )

      case "amazon_price":
        return (
          <TableCell key={columnId} className={width}>
            {product.asin ? (
              <EditableCell
                productId={product.id}
                field="asin_amazon_price"
                value={product.asin.amazon_price}
                type="number"
                editingCell={editingCell}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onEditingValueChange={onEditingValueChange}
              />
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </TableCell>
        )

      case "monthly_sales":
        return (
          <TableCell key={columnId} className={width}>
            {product.asin ? (
              <EditableCell
                productId={product.id}
                field="asin_monthly_sales"
                value={product.asin.monthly_sales}
                type="number"
                editingCell={editingCell}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onEditingValueChange={onEditingValueChange}
              />
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </TableCell>
        )

      case "fee_rate":
        return (
          <TableCell key={columnId} className={width}>
            {product.asin ? (
              <EditableCell
                productId={product.id}
                field="asin_fee_rate"
                value={product.asin.fee_rate}
                type="number"
                editingCell={editingCell}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onEditingValueChange={onEditingValueChange}
              />
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </TableCell>
        )

      case "fba_fee":
        return (
          <TableCell key={columnId} className={width}>
            {product.asin ? (
              <EditableCell
                productId={product.id}
                field="asin_fba_fee"
                value={product.asin.fba_fee}
                type="number"
                editingCell={editingCell}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onEditingValueChange={onEditingValueChange}
              />
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </TableCell>
        )

      case "jan_code":
        return (
          <TableCell key={columnId} className={width}>
            {product.asin ? (
              <EditableCell
                productId={product.id}
                field="asin_jan_code"
                value={product.asin.jan_code}
                type="text"
                editingCell={editingCell}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onEditingValueChange={onEditingValueChange}
              />
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </TableCell>
        )

      case "profit_amount":
        return (
          <TableCell key={columnId} className={width}>
            <span className={`text-sm font-medium ${
              (product.profit_amount || 0) > 0 ? "text-green-600" : "text-red-600"
            }`}>
              {formatPrice(product.profit_amount)}
            </span>
          </TableCell>
        )

      case "profit_rate":
        return (
          <TableCell key={columnId} className={width}>
            <span className={`text-sm font-medium ${
              (product.profit_rate || 0) > 0 ? "text-green-600" : "text-red-600"
            }`}>
              {formatPercentage(product.profit_rate)}
            </span>
          </TableCell>
        )

      case "roi":
        return (
          <TableCell key={columnId} className={width}>
            <span className={`text-sm font-medium ${
              (product.roi || 0) > 0 ? "text-green-600" : "text-red-600"
            }`}>
              {formatPercentage(product.roi)}
            </span>
          </TableCell>
        )

      case "is_hidden":
        return (
          <TableCell key={columnId} className={width}>
            <input
              type="checkbox"
              checked={product.is_hidden || false}
              onChange={async (e) => {
                const newValue = e.target.checked
                try {
                  const success = await updateProduct(product.id, { is_hidden: newValue })
                  if (success) {
                    onUpdateProductInState(product.id, { is_hidden: newValue })
                    toast.success(newValue ? "商品を非表示にしました" : "商品を表示に戻しました")
                  } else {
                    toast.error("更新に失敗しました")
                  }
                } catch (err) {
                  console.error("非表示フラグ更新エラー:", err)
                  toast.error("更新中にエラーが発生しました")
                }
              }}
              className="rounded"
            />
          </TableCell>
        )

      case "has_amazon":
        return (
          <TableCell key={columnId} className={width}>
            <input
              type="checkbox"
              checked={product.asin?.has_amazon || false}
              disabled={!product.asin}
              onChange={async (e) => {
                if (!product.asin) return
                const newValue = e.target.checked
                try {
                  const success = await updateAsin(product.asin.id, { has_amazon: newValue })
                  if (success) {
                    onUpdateProductInState(product.id, {
                      asin: { ...product.asin, has_amazon: newValue }
                    })
                  } else {
                    toast.error("更新に失敗しました")
                  }
                } catch (err) {
                  console.error("Amazon有フラグ更新エラー:", err)
                  toast.error("更新中にエラーが発生しました")
                }
              }}
              className="rounded"
            />
          </TableCell>
        )

      case "has_official":
        return (
          <TableCell key={columnId} className={width}>
            <input
              type="checkbox"
              checked={product.asin?.has_official || false}
              disabled={!product.asin}
              onChange={async (e) => {
                if (!product.asin) return
                const newValue = e.target.checked
                try {
                  const success = await updateAsin(product.asin.id, { has_official: newValue })
                  if (success) {
                    onUpdateProductInState(product.id, {
                      asin: { ...product.asin, has_official: newValue }
                    })
                  } else {
                    toast.error("更新に失敗しました")
                  }
                } catch (err) {
                  console.error("公式有フラグ更新エラー:", err)
                  toast.error("更新中にエラーが発生しました")
                }
              }}
              className="rounded"
            />
          </TableCell>
        )

      case "complaint_count":
        return (
          <TableCell key={columnId} className={width}>
            {product.asin ? (
              <div className="flex items-center justify-center">
                <Input
                  type="number"
                  value={product.asin.complaint_count || 0}
                  onChange={async (e) => {
                    if (!product.asin) return
                    const newValue = e.target.value ? parseInt(e.target.value) : 0
                    try {
                      const success = await updateAsin(product.asin.id, { complaint_count: newValue })
                      if (success) {
                        onUpdateProductInState(product.id, {
                          asin: { ...product.asin, complaint_count: newValue }
                        })
                      } else {
                        toast.error("更新に失敗しました")
                      }
                    } catch (err) {
                      console.error("クレーム数更新エラー:", err)
                      toast.error("更新中にエラーが発生しました")
                    }
                  }}
                  className="w-16 h-8 text-center text-sm"
                  min="0"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </TableCell>
        )

      case "is_dangerous":
        return (
          <TableCell key={columnId} className={width}>
            <input
              type="checkbox"
              checked={product.asin?.is_dangerous || false}
              disabled={!product.asin}
              onChange={async (e) => {
                if (!product.asin) return
                const newValue = e.target.checked
                try {
                  const success = await updateAsin(product.asin.id, { is_dangerous: newValue })
                  if (success) {
                    onUpdateProductInState(product.id, {
                      asin: { ...product.asin, is_dangerous: newValue }
                    })
                  } else {
                    toast.error("更新に失敗しました")
                  }
                } catch (err) {
                  console.error("危険品フラグ更新エラー:", err)
                  toast.error("更新中にエラーが発生しました")
                }
              }}
              className="rounded"
            />
          </TableCell>
        )

      case "is_per_carry_ng":
        return (
          <TableCell key={columnId} className={width}>
            <input
              type="checkbox"
              checked={product.asin?.is_per_carry_ng || false}
              disabled={!product.asin}
              onChange={async (e) => {
                if (!product.asin) return
                const newValue = e.target.checked
                try {
                  const success = await updateAsin(product.asin.id, { is_per_carry_ng: newValue })
                  if (success) {
                    onUpdateProductInState(product.id, {
                      asin: { ...product.asin, is_per_carry_ng: newValue }
                    })
                  } else {
                    toast.error("更新に失敗しました")
                  }
                } catch (err) {
                  console.error("パーキャリNGフラグ更新エラー:", err)
                  toast.error("更新中にエラーが発生しました")
                }
              }}
              className="rounded"
            />
          </TableCell>
        )

      case "memo":
        return (
          <TableCell key={columnId} className={width}>
            {product.asin ? (
              <EditableCell
                productId={product.id}
                field="asin_memo"
                value={product.asin.memo}
                type="text"
                editingCell={editingCell}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onEditingValueChange={onEditingValueChange}
              />
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </TableCell>
        )

      default:
        return null
    }
  }

  return (
    <TableRow
      className={rowClassName}
      onContextMenu={(e) => onContextMenu(e, product)}
    >
      {orderedColumns.map((column) => {
        // 非表示設定の列はスキップ
        if (visibleColumns[column.id] === false) {
          return null
        }

        return renderCell(column.id, column.width || "")
      })}
    </TableRow>
  )
}
