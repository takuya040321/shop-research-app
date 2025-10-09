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
  shopFilter?: string | undefined
  pageSize?: number | undefined
}

export function useProductTable({ shopFilter, pageSize = 50 }: UseProductTableOptions) {
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
      const data = await getProductsWithAsinAndProfits()
      setProducts(data)
      setCurrentPage(1)
    } catch (err) {
      console.error("商品データ読み込みエラー:", err)
      setError("商品データの読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }, [])

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
      const minPrice = filters.minPrice
      filtered = filtered.filter(product =>
        (product.sale_price || product.price || 0) >= minPrice
      )
    }
    if (filters.maxPrice !== null) {
      const maxPrice = filters.maxPrice
      filtered = filtered.filter(product =>
        (product.sale_price || product.price || 0) <= maxPrice
      )
    }

    if (filters.minProfitRate !== null) {
      const minProfitRate = filters.minProfitRate
      filtered = filtered.filter(product =>
        (product.profit_rate || 0) >= minProfitRate
      )
    }
    if (filters.maxProfitRate !== null) {
      const maxProfitRate = filters.maxProfitRate
      filtered = filtered.filter(product =>
        (product.profit_rate || 0) <= maxProfitRate
      )
    }

    if (filters.minROI !== null) {
      const minROI = filters.minROI
      filtered = filtered.filter(product =>
        (product.roi || 0) >= minROI
      )
    }
    if (filters.maxROI !== null) {
      const maxROI = filters.maxROI
      filtered = filtered.filter(product =>
        (product.roi || 0) <= maxROI
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
      let updatedAsin: Asin | null = null

      if (field.startsWith("asin_")) {
        const asinField = field.replace("asin_", "")

        if (!product.asin && asinField === "asin" && value) {
          // 既存ASINをチェック
          const { data: existingAsin } = await supabase
            .from("asins")
            .select()
            .eq("asin", value)
            .single<Asin>()

          let asinToLink: Asin

          if (existingAsin) {
            // 既存ASINを使用
            asinToLink = existingAsin
          } else {
            // 新規ASIN作成
            const { data: newAsin, error: createAsinError } = await supabase
              .from("asins")
              .insert({
                asin: value,
                fee_rate: 15,  // デフォルト値を明示的に指定
                fba_fee: 0,    // デフォルト値を明示的に指定
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

            asinToLink = newAsin
          }

          // 商品のsource_urlを取得してASINを紐付け
          if (!product.source_url) {
            throw new Error("商品URLが設定されていないため、ASIN紐付けできません")
          }

          const { error: linkError } = await supabase
            .from("product_asins")
            .insert({
              source_url: product.source_url,
              asin: value
            } as never)

          if (linkError) {
            throw new Error("商品-ASIN紐付けに失敗しました")
          }

          updatedAsin = asinToLink
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

          success = await updateAsin(product.asin.id, updates)

          // 更新成功時にローカルのASINオブジェクトを更新
          if (success) {
            updatedAsin = {
              ...product.asin,
              ...updates
            } as Asin
          }
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

        success = await updateProduct(productId, updates)

        // 更新成功時にローカルのproductsステートを部分更新
        if (success) {
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === productId
                ? { ...p, ...updates }
                : p
            )
          )
        }
      }

      if (success) {
        // ASIN関連フィールドの場合は、ASINオブジェクトを更新
        if (field.startsWith("asin_") && updatedAsin) {
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === productId
                ? { ...p, asin: updatedAsin }
                : p
            )
          )
        }

        setEditingCell(null)
      } else {
        setError("更新に失敗しました")
      }
    } catch (err) {
      console.error("編集保存エラー:", err)
      setError("更新中にエラーが発生しました")
    }
  }, [editingCell, products])

  const handleCopyProduct = useCallback(async (product: ExtendedProduct) => {
    try {
      const success = await copyProduct(product.id)

      if (success) {
        await loadProducts()
        setError(null)
      } else {
        setError("商品のコピーに失敗しました")
      }
    } catch (err) {
      console.error("商品コピーエラー:", err instanceof Error ? err.message : String(err))
      setError("商品のコピー中にエラーが発生しました")
    }
  }, [loadProducts])

  const handleDeleteProduct = useCallback(async (product: ExtendedProduct) => {
    if (!confirm(`「${product.name}」を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      const success = await deleteProduct(product.id)
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
  }, [loadProducts, selectedProducts])

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
