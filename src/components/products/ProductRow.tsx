/**
 * 商品行コンポーネント
 * 1商品の行表示とインライン編集
 */

import { TableCell, TableRow } from "@/components/ui/Table"
import { Input } from "@/components/ui/Input"
import { StarIcon } from "lucide-react"
import { toast } from "sonner"
import type { ExtendedProduct } from "@/lib/products"
import { formatPrice, formatPercentage, updateAsin, updateProduct } from "@/lib/products"
import { ImagePreview } from "./ImagePreview"
import { EditableCell } from "./EditableCell"

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
  onUpdateProductInState
}: ProductRowProps) {
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

  return (
    <TableRow
      className={rowClassName}
      onContextMenu={(e) => onContextMenu(e, product)}
    >
      {/* お気に入り */}
      <TableCell className="w-12 text-center">
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

      {/* 画像 */}
      <TableCell className="py-2 w-20">
        <ImagePreview imageUrl={product.image_url} productName={product.name} />
      </TableCell>

      {/* 商品名 */}
      <TableCell className="min-w-[200px]">
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

      {/* 価格 */}
      <TableCell className="w-32">
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

      {/* 仕入価格 */}
      <TableCell className="w-24">
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

      {/* ASIN */}
      <TableCell className="w-24">
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

      {/* Amazon商品名 */}
      <TableCell className="min-w-[250px]">
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

      {/* Amazon価格 */}
      <TableCell className="w-24">
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

      {/* 月間売上 */}
      <TableCell className="w-20">
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

      {/* 手数料率 */}
      <TableCell className="w-20">
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

      {/* FBA料 */}
      <TableCell className="w-20">
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

      {/* JANコード */}
      <TableCell className="w-24">
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

      {/* 利益額 */}
      <TableCell className="w-24">
        <span className={`text-sm font-medium ${
          (product.profit_amount || 0) > 0 ? "text-green-600" : "text-red-600"
        }`}>
          {formatPrice(product.profit_amount)}
        </span>
      </TableCell>

      {/* 利益率 */}
      <TableCell className="w-20">
        <span className={`text-sm font-medium ${
          (product.profit_rate || 0) > 0 ? "text-green-600" : "text-red-600"
        }`}>
          {formatPercentage(product.profit_rate)}
        </span>
      </TableCell>

      {/* ROI */}
      <TableCell className="w-20">
        <span className={`text-sm font-medium ${
          (product.roi || 0) > 0 ? "text-green-600" : "text-red-600"
        }`}>
          {formatPercentage(product.roi)}
        </span>
      </TableCell>

      {/* 非表示フラグ */}
      <TableCell className="w-16">
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

      {/* Amazon有フラグ */}
      <TableCell className="w-16">
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

      {/* 公式有フラグ */}
      <TableCell className="w-16">
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

      {/* クレーム数 */}
      <TableCell className="w-16">
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

      {/* 危険品フラグ */}
      <TableCell className="w-16">
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

      {/* パーキャリNGフラグ */}
      <TableCell className="w-16">
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

      {/* ASINメモ */}
      <TableCell className="min-w-[120px]">
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
    </TableRow>
  )
}
