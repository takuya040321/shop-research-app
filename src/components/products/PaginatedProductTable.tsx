"use client"

/**
 * ページネーション商品テーブルコンポーネント
 * 大量データのパフォーマンス最適化のためページネーションを実装
 */

import { useCallback } from "react"
import Image from "next/image"
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
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon
} from "lucide-react"

import type { ExtendedProduct } from "@/lib/products"
import {
  formatPrice,
  formatPercentage
} from "@/lib/products"
import { ProductSearch } from "./ProductSearch"
import { useProductTable } from "@/hooks/products/useProductTable"

interface PaginatedProductTableProps {
  className?: string
  shopFilter?: string
  pageSize?: number
}

export function PaginatedProductTable({ className, shopFilter, pageSize = 50 }: PaginatedProductTableProps) {
  // カスタムフックから全てのロジックを取得
  const {
    products: currentPageProducts,
    allProducts: filteredAndSortedProducts,
    totalProductsCount,
    loading,
    error,
    editingCell,
    selectedProducts,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    filters,
    setFilters,
    setEditingCell,
    loadProducts,
    handleSelectProduct,
    handleSort,
    goToFirstPage,
    goToPreviousPage,
    goToNextPage,
    goToLastPage,
    toggleSelectAll,
    startEditing,
    cancelEditing,
    saveEdit,
    handleCopyProduct,
    handleDeleteProduct,
    getSortIcon
  } = useProductTable({ shopFilter, pageSize })

  // ソートアイコンを描画するヘルパー
  const renderSortIcon = useCallback((field: string) => {
    const direction = getSortIcon(field)
    if (!direction) return null

    if (direction === "asc") {
      return <ChevronUpIcon className="w-4 h-4 ml-1" />
    } else if (direction === "desc") {
      return <ChevronDownIcon className="w-4 h-4 ml-1" />
    }
    return null
  }, [getSortIcon])

  // 編集可能なセルを描画
  const renderEditableCell = useCallback((
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
  }, [editingCell, setEditingCell, startEditing, saveEdit, cancelEditing])

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
          <Button onClick={loadProducts} variant="outline">
            再試行
          </Button>
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
        totalCount={totalProductsCount}
        filteredCount={filteredAndSortedProducts.length}
      />

      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">商品一覧（ページネーション）</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedProducts.size > 0 && `${selectedProducts.size}件選択中 / `}
                {startIndex + 1}-{endIndex}件 / 全{filteredAndSortedProducts.length}件
              </span>
              <Button onClick={loadProducts} variant="outline" size="sm">
                更新
              </Button>
            </div>
          </div>
        </div>

        {/* パフォーマンス情報 */}
        {totalProductsCount > 0 && (
          <div className="p-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-700">
            <strong>パフォーマンス情報:</strong>
            全{totalProductsCount}件中{filteredAndSortedProducts.length}件を表示。
            ページサイズ: {pageSize}件/ページ。
            現在のページ: {currentPage}/{totalPages}
          </div>
        )}

        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={
                      currentPageProducts.length > 0 &&
                      currentPageProducts.every(p => selectedProducts.has(p.id))
                    }
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>

                {/* 商品基本情報 */}
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-32"
                  onClick={() => handleSort("image_url")}
                >
                  <div className="flex items-center">
                    画像
                    {renderSortIcon("image_url")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 min-w-[200px]"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    商品名
                    {renderSortIcon("name")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-32"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center">
                    価格
                    {renderSortIcon("price")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-24"
                  onClick={() => handleSort("effective_price")}
                >
                  <div className="flex items-center">
                    仕入価格
                    {renderSortIcon("effective_price")}
                  </div>
                </TableHead>

                {/* ASIN情報 */}
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-24"
                  onClick={() => handleSort("asin_asin")}
                >
                  <div className="flex items-center">
                    ASIN
                    {renderSortIcon("asin_asin")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 min-w-[150px]"
                  onClick={() => handleSort("asin_amazon_name")}
                >
                  <div className="flex items-center">
                    Amazon商品名
                    {renderSortIcon("asin_amazon_name")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-24"
                  onClick={() => handleSort("asin_amazon_price")}
                >
                  <div className="flex items-center">
                    Amazon価格
                    {renderSortIcon("asin_amazon_price")}
                  </div>
                </TableHead>

                {/* 利益計算 */}
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-24"
                  onClick={() => handleSort("profit_amount")}
                >
                  <div className="flex items-center">
                    利益額
                    {renderSortIcon("profit_amount")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-20"
                  onClick={() => handleSort("profit_rate")}
                >
                  <div className="flex items-center">
                    利益率
                    {renderSortIcon("profit_rate")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-20"
                  onClick={() => handleSort("roi")}
                >
                  <div className="flex items-center">
                    ROI
                    {renderSortIcon("roi")}
                  </div>
                </TableHead>

                <TableHead className="w-20">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentPageProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-gray-50 h-24"
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="rounded"
                    />
                  </TableCell>

                  {/* 画像 */}
                  <TableCell className="py-1">
                    {product.image_url ? (
                      <div className="relative flex items-center justify-center">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={80}
                          height={80}
                          className="rounded object-cover transition-none"
                        />
                        <div className="w-10 h-10 absolute z-10 hover:bg-transparent group">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={80}
                            height={80}
                            className="rounded object-cover transition-none opacity-0 hover:opacity-100 hover:scale-[5] hover:z-50 hover:shadow-2xl hover:origin-center hover:absolute hover:left-1/2 hover:top-1/2 hover:-translate-x-1/2 hover:-translate-y-1/2"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-[80px] h-[80px] bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">画像なし</span>
                      </div>
                    )}
                  </TableCell>

                  {/* 商品名 */}
                  <TableCell>
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
                  <TableCell>
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
                  <TableCell>
                    <span className="text-sm font-medium text-green-600">
                      {formatPrice(product.effective_price)}
                    </span>
                  </TableCell>

                  {/* ASIN */}
                  <TableCell>
                    {product.asin ?
                      renderEditableCell(product, "asin_asin", product.asin.asin, "text") :
                      renderEditableCell(product, "asin_asin", "", "text")
                    }
                  </TableCell>

                  {/* Amazon商品名 */}
                  <TableCell>
                    {product.asin ?
                      renderEditableCell(product, "asin_amazon_name", product.asin.amazon_name, "text") :
                      <span className="text-sm text-gray-400">-</span>
                    }
                  </TableCell>

                  {/* Amazon価格 */}
                  <TableCell>
                    {product.asin ?
                      renderEditableCell(product, "asin_amazon_price", product.asin.amazon_price, "number") :
                      <span className="text-sm text-gray-400">-</span>
                    }
                  </TableCell>

                  {/* 利益額 */}
                  <TableCell>
                    <span className={`text-sm font-medium ${
                      (product.profit_amount || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatPrice(product.profit_amount)}
                    </span>
                  </TableCell>

                  {/* 利益率 */}
                  <TableCell>
                    <span className={`text-sm font-medium ${
                      (product.profit_rate || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatPercentage(product.profit_rate)}
                    </span>
                  </TableCell>

                  {/* ROI */}
                  <TableCell>
                    <span className={`text-sm font-medium ${
                      (product.roi || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatPercentage(product.roi)}
                    </span>
                  </TableCell>

                  {/* 操作 */}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyProduct(product)}
                        className="h-6 w-6 p-0"
                      >
                        <CopyIcon className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product)}
                        className="h-6 w-6 p-0"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-600">
              ページ {currentPage} / {totalPages}
              （{startIndex + 1}-{endIndex}件 / 全{filteredAndSortedProducts.length}件）
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeftIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </Button>
              <span className="text-sm px-2">
                {currentPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRightIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {filteredAndSortedProducts.length === 0 && totalProductsCount > 0 && (
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
    </div>
  )
}