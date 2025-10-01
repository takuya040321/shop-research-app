"use client"

/**
 * ページネーション商品テーブルコンポーネント
 * 大量データのパフォーマンス最適化のためページネーションを実装
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import type { Asin } from "@/types/database"
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
  getProductsWithAsinAndProfits,
  updateProduct,
  updateAsin,
  copyProduct,
  deleteProduct,
  formatPrice,
  formatPercentage
} from "@/lib/products"
import { supabase } from "@/lib/supabase"
import { ProductSearch, type ProductFilters } from "./product-search"

// ソート方向の型
type SortDirection = "asc" | "desc" | null

// 編集中のセル情報
interface EditingCell {
  productId: string
  field: string
  value: string
}

interface PaginatedProductTableProps {
  userId: string
  className?: string
  shopFilter?: string
  pageSize?: number
}

export function PaginatedProductTable({ userId, className, shopFilter, pageSize = 50 }: PaginatedProductTableProps) {
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<ProductFilters>({
    searchText: "",
    minPrice: null,
    maxPrice: null,
    minProfitRate: null,
    maxProfitRate: null,
    minROI: null,
    maxROI: null,
    asinStatus: "all"
  })

  // データ読み込み
  useEffect(() => {
    loadProducts()
  }, [userId, shopFilter])

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.time('商品データ読み込み（ページネーション）')
      const data = await getProductsWithAsinAndProfits(userId)
      console.timeEnd('商品データ読み込み（ページネーション）')
      console.log(`${data.length}件の商品データを読み込みました（ページネーション対応）`)
      setProducts(data)
      setCurrentPage(1) // データ更新時はページを最初に戻す
    } catch (err) {
      console.error("商品データ読み込みエラー:", err)
      setError("商品データの読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }, [userId])

  // フィルタリング・ソート機能
  const filteredAndSortedProducts = useMemo(() => {
    // 1. フィルタリング
    let filtered = products

    // shopFilterが指定されている場合
    if (shopFilter) {
      filtered = filtered.filter(product => product.shop_name === shopFilter)
    }

    // 検索テキストフィルター
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.asin?.asin.toLowerCase().includes(searchLower) ||
        product.asin?.amazon_name?.toLowerCase().includes(searchLower)
      )
    }

    // 価格フィルター
    if (filters.minPrice !== null) {
      filtered = filtered.filter(product =>
        (product.sale_price || product.price || 0) >= filters.minPrice!
      )
    }
    if (filters.maxPrice !== null) {
      filtered = filtered.filter(product =>
        (product.sale_price || product.price || 0) <= filters.maxPrice!
      )
    }

    // 利益率フィルター
    if (filters.minProfitRate !== null) {
      filtered = filtered.filter(product =>
        (product.profit_rate || 0) >= filters.minProfitRate!
      )
    }
    if (filters.maxProfitRate !== null) {
      filtered = filtered.filter(product =>
        (product.profit_rate || 0) <= filters.maxProfitRate!
      )
    }

    // ROIフィルター
    if (filters.minROI !== null) {
      filtered = filtered.filter(product =>
        (product.roi || 0) >= filters.minROI!
      )
    }
    if (filters.maxROI !== null) {
      filtered = filtered.filter(product =>
        (product.roi || 0) <= filters.maxROI!
      )
    }

    // ASIN設定状況フィルター
    if (filters.asinStatus === "with_asin") {
      filtered = filtered.filter(product => product.asin)
    } else if (filters.asinStatus === "without_asin") {
      filtered = filtered.filter(product => !product.asin)
    }

    // 2. ソート
    if (!sortField || !sortDirection) return filtered

    return [...filtered].sort((a, b) => {
      let aValue: unknown = a[sortField as keyof ExtendedProduct]
      let bValue: unknown = b[sortField as keyof ExtendedProduct]

      // ASIN関連のフィールドの場合
      if (sortField.startsWith("asin_")) {
        const asinField = sortField.replace("asin_", "")
        aValue = a.asin?.[asinField as keyof typeof a.asin]
        bValue = b.asin?.[asinField as keyof typeof b.asin]
      }

      // null/undefinedの処理
      if (aValue == null) aValue = ""
      if (bValue == null) bValue = ""

      // 数値の場合
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      // 文字列の場合
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr, "ja")
      } else {
        return bStr.localeCompare(aStr, "ja")
      }
    })
  }, [products, filters, shopFilter, sortField, sortDirection])

  // ページネーション計算
  const totalPages = Math.ceil(filteredAndSortedProducts.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredAndSortedProducts.length)
  const currentPageProducts = filteredAndSortedProducts.slice(startIndex, endIndex)

  // フィルター変更時にページを最初に戻す
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, shopFilter])

  // ハンドラー関数
  const handleSelectProduct = useCallback((productId: string) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
  }, [selectedProducts])

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
    setCurrentPage(1) // ソート変更時はページを最初に戻す
  }, [sortField, sortDirection])

  // ページネーション操作
  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

  // 全選択/解除（現在のページのみ）
  const toggleSelectAll = useCallback(() => {
    const currentPageProductIds = currentPageProducts.map(p => p.id)
    const allCurrentPageSelected = currentPageProductIds.every(id => selectedProducts.has(id))

    const newSelection = new Set(selectedProducts)
    if (allCurrentPageSelected) {
      // 現在のページをすべて選択解除
      currentPageProductIds.forEach(id => newSelection.delete(id))
    } else {
      // 現在のページをすべて選択
      currentPageProductIds.forEach(id => newSelection.add(id))
    }
    setSelectedProducts(newSelection)
  }, [selectedProducts, currentPageProducts])

  // 編集機能
  const startEditing = useCallback((productId: string, field: string, currentValue: unknown) => {
    setEditingCell({
      productId,
      field,
      value: String(currentValue || "")
    })
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingCell(null)
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editingCell) return

    try {
      const { productId, field, value } = editingCell
      const product = products.find(p => p.id === productId)
      if (!product) return

      let success = false

      // ASIN関連フィールドの場合
      if (field.startsWith("asin_")) {
        const asinField = field.replace("asin_", "")

        // ASINが存在しない場合は新規作成
        if (!product.asin && asinField === "asin" && value) {
          // 新規ASIN作成
          const { data: newAsin, error: createAsinError } = await supabase
            .from("asins")
            .insert({
              user_id: userId,
              asin: value,
              has_amazon: false,
              has_official: false,
              is_dangerous: false,
              is_per_carry_ng: false
            } as never)
            .select()
            .single<Asin>()

          if (createAsinError || !newAsin) {
            throw new Error("ASIN作成に失敗しました")
          }

          // 商品-ASIN紐付けを作成
          const { error: linkError } = await supabase
            .from("product_asins")
            .insert({
              user_id: userId,
              product_id: productId,
              asin_id: newAsin.id
            } as never)

          if (linkError) {
            throw new Error("商品-ASIN紐付けに失敗しました")
          }

          success = true
        } else if (product.asin) {
          // 既存ASIN更新
          const updates: Record<string, unknown> = {}

          // 数値フィールドの処理
          if (["amazon_price", "monthly_sales", "fee_rate", "fba_fee", "complaint_count"].includes(asinField)) {
            updates[asinField] = value ? parseFloat(value) : null
          } else if (["has_amazon", "has_official", "is_dangerous", "is_per_carry_ng"].includes(asinField)) {
            updates[asinField] = value === "true"
          } else {
            updates[asinField] = value || null
          }

          success = await updateAsin(product.asin.id, updates, userId)
        }
      } else {
        // 商品フィールドの場合
        const updates: Record<string, unknown> = {}

        if (["price", "sale_price"].includes(field)) {
          updates[field] = value ? parseFloat(value) : null
        } else if (field === "is_hidden") {
          updates[field] = value === "true"
        } else {
          updates[field] = value || null
        }

        success = await updateProduct(productId, updates, userId)
      }

      if (success) {
        setEditingCell(null)
        await loadProducts() // データを再読み込み
      } else {
        setError("更新に失敗しました")
      }
    } catch (err) {
      console.error("編集保存エラー:", err)
      setError("更新中にエラーが発生しました")
    }
  }, [editingCell, products, userId, loadProducts])

  // 商品操作
  const handleCopyProduct = useCallback(async (product: ExtendedProduct) => {
    try {
      const success = await copyProduct(product.id, userId)
      if (success) {
        await loadProducts()
        setError(null)
      } else {
        setError("商品のコピーに失敗しました")
      }
    } catch (err) {
      console.error("商品コピーエラー:", err)
      setError("商品のコピー中にエラーが発生しました")
    }
  }, [userId, loadProducts])

  const handleDeleteProduct = useCallback(async (product: ExtendedProduct) => {
    if (!confirm(`「${product.name}」を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      const success = await deleteProduct(product.id, userId)
      if (success) {
        await loadProducts()
        const newSelection = new Set(selectedProducts)
        newSelection.delete(product.id)
        setSelectedProducts(newSelection)
        setError(null)
      } else {
        setError("商品の削除に失敗しました")
      }
    } catch (err) {
      console.error("商品削除エラー:", err)
      setError("商品の削除中にエラーが発生しました")
    }
  }, [userId, loadProducts, selectedProducts])

  // ソートアイコンを表示するヘルパー
  const getSortIcon = useCallback((field: string) => {
    if (sortField !== field) return null

    if (sortDirection === "asc") {
      return <ChevronUpIcon className="w-4 h-4 ml-1" />
    } else if (sortDirection === "desc") {
      return <ChevronDownIcon className="w-4 h-4 ml-1" />
    }
    return null
  }, [sortField, sortDirection])

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
  }, [editingCell, startEditing, saveEdit, cancelEditing])

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
        totalCount={products.length}
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
        {products.length > 0 && (
          <div className="p-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-700">
            <strong>パフォーマンス情報:</strong>
            全{products.length}件中{filteredAndSortedProducts.length}件を表示。
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
                    {getSortIcon("image_url")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 min-w-[200px]"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    商品名
                    {getSortIcon("name")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-32"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center">
                    価格
                    {getSortIcon("price")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-24"
                  onClick={() => handleSort("effective_price")}
                >
                  <div className="flex items-center">
                    仕入価格
                    {getSortIcon("effective_price")}
                  </div>
                </TableHead>

                {/* ASIN情報 */}
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-24"
                  onClick={() => handleSort("asin_asin")}
                >
                  <div className="flex items-center">
                    ASIN
                    {getSortIcon("asin_asin")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 min-w-[150px]"
                  onClick={() => handleSort("asin_amazon_name")}
                >
                  <div className="flex items-center">
                    Amazon商品名
                    {getSortIcon("asin_amazon_name")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-24"
                  onClick={() => handleSort("asin_amazon_price")}
                >
                  <div className="flex items-center">
                    Amazon価格
                    {getSortIcon("asin_amazon_price")}
                  </div>
                </TableHead>

                {/* 利益計算 */}
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-24"
                  onClick={() => handleSort("profit_amount")}
                >
                  <div className="flex items-center">
                    利益額
                    {getSortIcon("profit_amount")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-20"
                  onClick={() => handleSort("profit_rate")}
                >
                  <div className="flex items-center">
                    利益率
                    {getSortIcon("profit_rate")}
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-gray-50 w-20"
                  onClick={() => handleSort("roi")}
                >
                  <div className="flex items-center">
                    ROI
                    {getSortIcon("roi")}
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

        {filteredAndSortedProducts.length === 0 && products.length > 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>条件に一致する商品がありません</p>
            <p className="text-sm mt-1">検索条件やフィルターを変更してください</p>
          </div>
        )}

        {products.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>商品データがありません</p>
            <p className="text-sm mt-1">スクレイピングを実行して商品を取得してください</p>
          </div>
        )}
      </Card>
    </div>
  )
}