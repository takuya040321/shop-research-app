"use client"

/**
 * 商品テーブルコンポーネント
 * 商品情報とASIN情報を結合して表示し、インライン編集機能を提供
 */

import { useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  CopyIcon,
  TrashIcon
} from "lucide-react"

import type { ExtendedProduct } from "@/lib/products"
import { formatPrice, formatPercentage, updateProduct, updateAsin } from "@/lib/products"
import { ProductSearch } from "./ProductSearch"
import { ContextMenu, useContextMenu } from "@/components/ui/ContextMenu"
import { useProductTable } from "@/hooks/products/useProductTable"

interface ProductTableProps {
  userId: string
  className?: string
  shopFilter?: string
}

export function ProductTable({ userId, className, shopFilter }: ProductTableProps) {
  const [selectedProductForMenu, setSelectedProductForMenu] = useState<ExtendedProduct | null>(null)
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu()

  // カスタムフックから全てのロジックを取得（ページネーション無しで全件表示）
  const {
    allProducts,
    totalProductsCount,
    loading,
    error,
    editingCell,
    filters,
    setFilters,
    setEditingCell,
    loadProducts,
    handleSort,
    startEditing,
    cancelEditing,
    saveEdit,
    handleCopyProduct,
    handleDeleteProduct,
    getSortIcon,
  } = useProductTable({
    userId,
    shopFilter,
    pageSize: 9999 // 全件表示するため大きな値を設定
  })

  // 右クリックメニューの項目
  const getContextMenuItems = (product: ExtendedProduct) => {
    return [
      {
        label: "商品をコピー",
        icon: <CopyIcon className="w-4 h-4" />,
        onClick: () => handleCopyProduct(product)
      },
      {
        separator: true,
        label: "",
        onClick: () => {}
      },
      {
        label: "商品を削除",
        icon: <TrashIcon className="w-4 h-4" />,
        onClick: () => handleDeleteProduct(product)
      }
    ]
  }

  // 右クリックハンドラー
  const handleRowRightClick = (event: React.MouseEvent, product: ExtendedProduct) => {
    setSelectedProductForMenu(product)
    showContextMenu(event)
  }

  // ソートアイコンを表示するヘルパー
  const renderSortIcon = (field: string) => {
    const direction = getSortIcon(field)
    if (!direction) return null

    if (direction === "asc") {
      return <ChevronUpIcon className="w-4 h-4 ml-1" />
    } else if (direction === "desc") {
      return <ChevronDownIcon className="w-4 h-4 ml-1" />
    }
    return null
  }

  // 編集可能なセルを描画
  const renderEditableCell = (
    product: ExtendedProduct,
    field: string,
    value: unknown,
    type: "text" | "number" | "boolean" = "text"
  ) => {
    const isEditing = editingCell?.productId === product.id && editingCell?.field === field

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          {type === "boolean" ? (
            <select
              value={editingCell.value}
              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
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
              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
              className="w-24 h-6 px-1 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit()
                if (e.key === "Escape") cancelEditing()
              }}
            />
          )}
          <Button variant="ghost" size="sm" onClick={saveEdit} className="h-6 w-6 p-0">
            <SaveIcon className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={cancelEditing} className="h-6 w-6 p-0">
            <XIcon className="w-3 h-3" />
          </Button>
        </div>
      )
    }

    return (
      <div
        className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-1 py-1 rounded group"
        onClick={() => startEditing(product.id, field, value)}
      >
        <span className="text-sm">
          {type === "boolean" ? (value ? "はい" : "いいえ") : String(value || "-")}
        </span>
        <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-50" />
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">商品データを読み込んでいます...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* 検索・フィルター */}
      <ProductSearch
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={allProducts.length}
        filteredCount={allProducts.length}
      />

      <Card>
      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("image_url")}
              >
                <div className="flex items-center justify-center">
                  画像
                  {renderSortIcon("image_url")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 min-w-[200px] text-xs text-center"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center justify-center">
                  商品名
                  {renderSortIcon("name")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-32 text-xs text-center"
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center justify-center">
                  価格
                  {renderSortIcon("price")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("effective_price")}
              >
                <div className="flex items-center justify-center">
                  仕入価格
                  {renderSortIcon("effective_price")}
                </div>
              </TableHead>

              {/* ASIN情報 */}
              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("asin_asin")}
              >
                <div className="flex items-center justify-center">
                  ASIN
                  {renderSortIcon("asin_asin")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 min-w-[150px] text-xs text-center"
                onClick={() => handleSort("asin_amazon_name")}
              >
                <div className="flex items-center justify-center">
                  Amazon商品名
                  {renderSortIcon("asin_amazon_name")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("asin_amazon_price")}
              >
                <div className="flex items-center justify-center">
                  Amazon価格
                  {renderSortIcon("asin_amazon_price")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("asin_monthly_sales")}
              >
                <div className="flex items-center justify-center">
                  月間売上
                  {renderSortIcon("asin_monthly_sales")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("asin_fee_rate")}
              >
                <div className="flex items-center justify-center">
                  手数料率
                  {renderSortIcon("asin_fee_rate")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("asin_fba_fee")}
              >
                <div className="flex items-center justify-center">
                  FBA料
                  {renderSortIcon("asin_fba_fee")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("asin_jan_code")}
              >
                <div className="flex items-center justify-center">
                  JANコード
                  {renderSortIcon("asin_jan_code")}
                </div>
              </TableHead>

              {/* 利益計算 */}
              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("profit_amount")}
              >
                <div className="flex items-center justify-center">
                  利益額
                  {renderSortIcon("profit_amount")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("profit_rate")}
              >
                <div className="flex items-center justify-center">
                  利益率
                  {renderSortIcon("profit_rate")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("roi")}
              >
                <div className="flex items-center justify-center">
                  ROI
                  {renderSortIcon("roi")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("is_hidden")}
              >
                <div className="flex items-center justify-center">
                  非表示
                  {renderSortIcon("is_hidden")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_has_amazon")}
              >
                <div className="flex items-center justify-center">
                  Amazon有
                  {renderSortIcon("asin_has_amazon")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_has_official")}
              >
                <div className="flex items-center justify-center">
                  公式有
                  {renderSortIcon("asin_has_official")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_complaint_count")}
              >
                <div className="flex items-center justify-center">
                  クレーム数
                  {renderSortIcon("asin_complaint_count")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_is_dangerous")}
              >
                <div className="flex items-center justify-center">
                  危険品
                  {renderSortIcon("asin_is_dangerous")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_is_per_carry_ng")}
              >
                <div className="flex items-center justify-center">
                  パーキャリNG
                  {renderSortIcon("asin_is_per_carry_ng")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 min-w-[120px] text-xs text-center"
                onClick={() => handleSort("asin_memo")}
              >
                <div className="flex items-center justify-center">
                  ASINメモ
                  {renderSortIcon("asin_memo")}
                </div>
              </TableHead>

            </TableRow>
          </TableHeader>

          <TableBody>
            {allProducts.map((product) => (
              <TableRow
                key={product.id}
                className="hover:bg-gray-50 h-24 cursor-pointer"
                onContextMenu={(e) => handleRowRightClick(e, product)}
              >
                {/* 画像 */}
                <TableCell className="py-2 w-20">
                  {product.image_url ? (
                    <div className="relative w-16 h-16 group">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="rounded object-cover"
                        style={{ width: '64px', height: '64px' }}
                      />
                      {/* ホバー時の拡大表示 */}
                      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none" style={{ zIndex: 9999 }}>
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={384}
                          height={384}
                          className="rounded object-cover shadow-2xl"
                          style={{ width: '384px', height: '384px' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">画像なし</span>
                    </div>
                  )}
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
                  <span className="text-sm font-medium text-green-600">
                    {formatPrice(product.effective_price)}
                  </span>
                </TableCell>

                {/* ASIN */}
                <TableCell className="w-24">
                  {product.asin ?
                    renderEditableCell(product, "asin_asin", product.asin.asin, "text") :
                    renderEditableCell(product, "asin_asin", "", "text")
                  }
                </TableCell>

                {/* Amazon商品名 */}
                <TableCell className="min-w-[150px]">
                  {product.asin ?
                    renderEditableCell(product, "asin_amazon_name", product.asin.amazon_name, "text") :
                    <span className="text-sm text-gray-400">-</span>
                  }
                </TableCell>

                {/* Amazon価格 */}
                <TableCell className="w-24">
                  {product.asin ?
                    renderEditableCell(product, "asin_amazon_price", product.asin.amazon_price, "number") :
                    <span className="text-sm text-gray-400">-</span>
                  }
                </TableCell>

                {/* 月間売上 */}
                <TableCell className="w-20">
                  {product.asin ?
                    renderEditableCell(product, "asin_monthly_sales", product.asin.monthly_sales, "number") :
                    <span className="text-sm text-gray-400">-</span>
                  }
                </TableCell>

                {/* 手数料率 */}
                <TableCell className="w-20">
                  {product.asin ?
                    renderEditableCell(product, "asin_fee_rate", product.asin.fee_rate, "number") :
                    <span className="text-sm text-gray-400">-</span>
                  }
                </TableCell>

                {/* FBA料 */}
                <TableCell className="w-20">
                  {product.asin ?
                    renderEditableCell(product, "asin_fba_fee", product.asin.fba_fee, "number") :
                    <span className="text-sm text-gray-400">-</span>
                  }
                </TableCell>

                {/* JANコード */}
                <TableCell className="w-24">
                  {product.asin ?
                    renderEditableCell(product, "asin_jan_code", product.asin.jan_code, "text") :
                    <span className="text-sm text-gray-400">-</span>
                  }
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
                      try {
                        const success = await updateProduct(product.id, { is_hidden: e.target.checked }, userId)
                        if (success) {
                          await loadProducts()
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
                      try {
                        const success = await updateAsin(product.asin.id, { has_amazon: e.target.checked }, userId)
                        if (success) {
                          await loadProducts()
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
                      try {
                        const success = await updateAsin(product.asin.id, { has_official: e.target.checked }, userId)
                        if (success) {
                          await loadProducts()
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
                          try {
                            const value = e.target.value ? parseInt(e.target.value) : 0
                            const success = await updateAsin(product.asin!.id, { complaint_count: value }, userId)
                            if (success) {
                              await loadProducts()
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
                      try {
                        const success = await updateAsin(product.asin.id, { is_dangerous: e.target.checked }, userId)
                        if (success) {
                          await loadProducts()
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
                      try {
                        const success = await updateAsin(product.asin.id, { is_per_carry_ng: e.target.checked }, userId)
                        if (success) {
                          await loadProducts()
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
                  {product.asin ?
                    renderEditableCell(product, "asin_memo", product.asin.memo, "text") :
                    <span className="text-sm text-gray-400">-</span>
                  }
                </TableCell>

              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

        {allProducts.length === 0 && totalProductsCount > 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>条件に一致する商品がありません</p>
            <p className="text-sm mt-1">検索条件やフィルターを変更してください</p>
          </div>
        )}

        {totalProductsCount === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>商品データがありません</p>
            <p className="text-sm mt-1">スクレイピングを実行して商品を取得してください</p>
          </div>
        )}
      </Card>

      {/* 右クリックコンテキストメニュー */}
      {selectedProductForMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          visible={contextMenu.visible}
          items={getContextMenuItems(selectedProductForMenu)}
          onClose={hideContextMenu}
        />
      )}
    </div>
  )
}