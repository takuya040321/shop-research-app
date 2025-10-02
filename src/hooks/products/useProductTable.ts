/**
 * 商品テーブル用カスタムフック
 * ページネーション、ソート、フィルタリング、編集機能を提供
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import type { ExtendedProduct } from "@/lib/products"
import type { ProductFilters } from "@/components/products/ProductSearch"
import {
  getProductsWithAsinAndProfits,
  updateProduct,
  updateAsin,
  copyProduct,
  deleteProduct,
} from "@/lib/products"
import { supabase } from "@/lib/supabase"
import type { Asin } from "@/types/database"
import { loadSettings } from "@/lib/settings"

type SortDirection = "asc" | "desc" | null

interface EditingCell {
  productId: string
  field: string
  value: string
}

interface UseProductTableOptions {
  userId: string
  shopFilter?: string | undefined
  pageSize?: number | undefined
}

export function useProductTable({ userId, shopFilter, pageSize = 50 }: UseProductTableOptions) {
  const settings = loadSettings()

  const [products, setProducts] = useState<ExtendedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string | null>(settings.sort.defaultSortColumn)
  const [sortDirection, setSortDirection] = useState<SortDirection>(settings.sort.defaultSortDirection)
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
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.time('商品データ読み込み（ページネーション）')
      const data = await getProductsWithAsinAndProfits(userId)
      console.timeEnd('商品データ読み込み（ページネーション）')
      console.log(`${data.length}件の商品データを読み込みました（ページネーション対応）`)
      setProducts(data)
      setCurrentPage(1)
    } catch (err) {
      console.error("商品データ読み込みエラー:", err)
      setError("商品データの読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // フィルタリング・ソート
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products

    if (shopFilter) {
      filtered = filtered.filter(product => product.shop_name === shopFilter)
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.asin?.asin.toLowerCase().includes(searchLower) ||
        product.asin?.amazon_name?.toLowerCase().includes(searchLower)
      )
    }

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

    if (filters.asinStatus === "with_asin") {
      filtered = filtered.filter(product => product.asin)
    } else if (filters.asinStatus === "without_asin") {
      filtered = filtered.filter(product => !product.asin)
    }

    if (!sortField || !sortDirection) return filtered

    return [...filtered].sort((a, b) => {
      let aValue: unknown = a[sortField as keyof ExtendedProduct]
      let bValue: unknown = b[sortField as keyof ExtendedProduct]

      if (sortField.startsWith("asin_")) {
        const asinField = sortField.replace("asin_", "")
        aValue = a.asin?.[asinField as keyof typeof a.asin]
        bValue = b.asin?.[asinField as keyof typeof b.asin]
      }

      if (aValue == null) aValue = ""
      if (bValue == null) bValue = ""

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortDirection === "asc") {
        return aStr.localeCompare(bStr, "ja")
      } else {
        return bStr.localeCompare(aStr, "ja")
      }
    })
  }, [products, filters, shopFilter, sortField, sortDirection])

  // ページネーション
  const totalPages = Math.ceil(filteredAndSortedProducts.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredAndSortedProducts.length)
  const currentPageProducts = filteredAndSortedProducts.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, shopFilter])

  // ハンドラー
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
    setCurrentPage(1)
  }, [sortField, sortDirection])

  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

  const toggleSelectAll = useCallback(() => {
    const currentPageProductIds = currentPageProducts.map(p => p.id)
    const allCurrentPageSelected = currentPageProductIds.every(id => selectedProducts.has(id))

    const newSelection = new Set(selectedProducts)
    if (allCurrentPageSelected) {
      currentPageProductIds.forEach(id => newSelection.delete(id))
    } else {
      currentPageProductIds.forEach(id => newSelection.add(id))
    }
    setSelectedProducts(newSelection)
  }, [selectedProducts, currentPageProducts])

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

      if (field.startsWith("asin_")) {
        const asinField = field.replace("asin_", "")

        if (!product.asin && asinField === "asin" && value) {
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
          const updates: Record<string, unknown> = {}

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
        await loadProducts()
      } else {
        setError("更新に失敗しました")
      }
    } catch (err) {
      console.error("編集保存エラー:", err)
      setError("更新中にエラーが発生しました")
    }
  }, [editingCell, products, userId, loadProducts])

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

  const getSortIcon = useCallback((field: string) => {
    if (sortField !== field) return null
    return sortDirection
  }, [sortField, sortDirection])

  return {
    // State
    products: currentPageProducts,
    allProducts: filteredAndSortedProducts,
    totalProductsCount: products.length,
    loading,
    error,
    sortField,
    sortDirection,
    editingCell,
    selectedProducts,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    filters,

    // Actions
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
    getSortIcon,
  }
}
