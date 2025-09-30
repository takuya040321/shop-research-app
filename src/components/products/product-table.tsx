"use client"

/**
 * 商品テーブルコンポーネント
 * 商品情報とASIN情報を結合して表示し、インライン編集機能を提供
 */

import { useState, useEffect, useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  ExternalLinkIcon,
  EditIcon,
  SaveIcon,
  XIcon,
  CopyIcon,
  TrashIcon
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
import { ContextMenu, useContextMenu } from "@/components/ui/context-menu"
import { toast } from "sonner"

// ソート方向の型
type SortDirection = "asc" | "desc" | null

// 編集中のセル情報
interface EditingCell {
  productId: string
  field: string
  value: string
}

interface ProductTableProps {
  userId: string
  className?: string
  shopFilter?: string
}

export function ProductTable({ userId, className, shopFilter }: ProductTableProps) {
  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
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
  const [selectedProductForMenu, setSelectedProductForMenu] = useState<ExtendedProduct | null>(null)
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu()

  // データ読み込み
  useEffect(() => {
    loadProducts()
  }, [userId, shopFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getProductsWithAsinAndProfits(userId)
      setProducts(data)
    } catch (err) {
      console.error("商品データ読み込みエラー:", err)
      setError("商品データの読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }


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

  // ソートハンドラー
  const handleSort = (field: string) => {
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
  }

  // 編集開始
  const startEditing = (productId: string, field: string, currentValue: unknown) => {
    setEditingCell({
      productId,
      field,
      value: String(currentValue || "")
    })
  }

  // 編集キャンセル
  const cancelEditing = () => {
    setEditingCell(null)
  }

  // 編集保存
  const saveEdit = async () => {
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
            })
            .select()
            .single()

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
            })

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
  }

  // 全選択/解除
  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredAndSortedProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredAndSortedProducts.map(p => p.id)))
    }
  }

  // 個別選択切り替え
  const toggleSelectProduct = (productId: string) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
  }

  // 商品コピー
  const handleCopyProduct = async (product: ExtendedProduct) => {
    try {
      const success = await copyProduct(product.id, userId)
      if (success) {
        await loadProducts()
        toast.success("商品をコピーしました", {
          description: `「${product.name}」をコピーしました`,
        })
      } else {
        toast.error("コピーに失敗しました", {
          description: "商品のコピー中にエラーが発生しました",
        })
      }
    } catch (err) {
      console.error("商品コピーエラー:", err)
      toast.error("コピーに失敗しました", {
        description: "商品のコピー中にエラーが発生しました",
      })
    }
  }

  // 商品削除
  const handleDeleteProduct = async (product: ExtendedProduct) => {
    if (!confirm(`「${product.name}」を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      const success = await deleteProduct(product.id, userId)
      if (success) {
        await loadProducts() // データを再読み込み
        // 選択状態からも削除
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
  }

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
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null

    if (sortDirection === "asc") {
      return <ChevronUpIcon className="w-4 h-4 ml-1" />
    } else if (sortDirection === "desc") {
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
                  {getSortIcon("image_url")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 min-w-[200px] text-xs text-center"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center justify-center">
                  商品名
                  {getSortIcon("name")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-32 text-xs text-center"
                onClick={() => handleSort("price")}
              >
                <div className="flex items-center justify-center">
                  価格
                  {getSortIcon("price")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("effective_price")}
              >
                <div className="flex items-center justify-center">
                  仕入価格
                  {getSortIcon("effective_price")}
                </div>
              </TableHead>

              {/* ASIN情報 */}
              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("asin_asin")}
              >
                <div className="flex items-center justify-center">
                  ASIN
                  {getSortIcon("asin_asin")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 min-w-[150px] text-xs text-center"
                onClick={() => handleSort("asin_amazon_name")}
              >
                <div className="flex items-center justify-center">
                  Amazon商品名
                  {getSortIcon("asin_amazon_name")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("asin_amazon_price")}
              >
                <div className="flex items-center justify-center">
                  Amazon価格
                  {getSortIcon("asin_amazon_price")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("asin_monthly_sales")}
              >
                <div className="flex items-center justify-center">
                  月間売上
                  {getSortIcon("asin_monthly_sales")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("asin_fee_rate")}
              >
                <div className="flex items-center justify-center">
                  手数料率
                  {getSortIcon("asin_fee_rate")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("asin_fba_fee")}
              >
                <div className="flex items-center justify-center">
                  FBA料
                  {getSortIcon("asin_fba_fee")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("asin_jan_code")}
              >
                <div className="flex items-center justify-center">
                  JANコード
                  {getSortIcon("asin_jan_code")}
                </div>
              </TableHead>

              {/* 利益計算 */}
              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
                onClick={() => handleSort("profit_amount")}
              >
                <div className="flex items-center justify-center">
                  利益額
                  {getSortIcon("profit_amount")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("profit_rate")}
              >
                <div className="flex items-center justify-center">
                  利益率
                  {getSortIcon("profit_rate")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
                onClick={() => handleSort("roi")}
              >
                <div className="flex items-center justify-center">
                  ROI
                  {getSortIcon("roi")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("is_hidden")}
              >
                <div className="flex items-center justify-center">
                  非表示
                  {getSortIcon("is_hidden")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_has_amazon")}
              >
                <div className="flex items-center justify-center">
                  Amazon有
                  {getSortIcon("asin_has_amazon")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_has_official")}
              >
                <div className="flex items-center justify-center">
                  公式有
                  {getSortIcon("asin_has_official")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_complaint_count")}
              >
                <div className="flex items-center justify-center">
                  クレーム数
                  {getSortIcon("asin_complaint_count")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_is_dangerous")}
              >
                <div className="flex items-center justify-center">
                  危険品
                  {getSortIcon("asin_is_dangerous")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
                onClick={() => handleSort("asin_is_per_carry_ng")}
              >
                <div className="flex items-center justify-center">
                  パーキャリNG
                  {getSortIcon("asin_is_per_carry_ng")}
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer hover:bg-gray-50 min-w-[120px] text-xs text-center"
                onClick={() => handleSort("asin_memo")}
              >
                <div className="flex items-center justify-center">
                  ASINメモ
                  {getSortIcon("asin_memo")}
                </div>
              </TableHead>

            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredAndSortedProducts.map((product) => (
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
                          setError("更新に失敗しました")
                        }
                      } catch (err) {
                        console.error("非表示フラグ更新エラー:", err)
                        setError("更新中にエラーが発生しました")
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
                          setError("更新に失敗しました")
                        }
                      } catch (err) {
                        console.error("Amazon有フラグ更新エラー:", err)
                        setError("更新中にエラーが発生しました")
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
                          setError("更新に失敗しました")
                        }
                      } catch (err) {
                        console.error("公式有フラグ更新エラー:", err)
                        setError("更新中にエラーが発生しました")
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
                              setError("更新に失敗しました")
                            }
                          } catch (err) {
                            console.error("クレーム数更新エラー:", err)
                            setError("更新中にエラーが発生しました")
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
                          setError("更新に失敗しました")
                        }
                      } catch (err) {
                        console.error("危険品フラグ更新エラー:", err)
                        setError("更新中にエラーが発生しました")
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
                          setError("更新に失敗しました")
                        }
                      } catch (err) {
                        console.error("パーキャリNGフラグ更新エラー:", err)
                        setError("更新中にエラーが発生しました")
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