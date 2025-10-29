/**
 * 商品テーブル用カスタムフック
 * ページネーション、ソート、フィルタリング、編集機能を提供
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { toast } from "sonner"
import type { ExtendedProduct } from "@/lib/products"
import type { ProductFilters } from "@/components/products/ProductSearch"
import {
  getProductsWithAsinAndProfits,
  updateProduct,
  updateAsin,
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
  initialFavoriteFilter?: "all" | "favorite_only" | "non_favorite_only" | undefined
}

interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  separator?: boolean
  onClick: () => void
}

export function useProductTable({
  shopFilter,
  pageSize = 50,
  initialFavoriteFilter,
}: UseProductTableOptions) {
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
    asinStatus: "all",
    favoriteStatus: "all",
    saleStatus: "all"
  })

  // UI関連のref
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // 個別商品を状態で直接更新（全体リロード不要）
  const updateProductInState = useCallback((productId: string, updates: Partial<ExtendedProduct>) => {
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, ...updates } : p
    ))
  }, [])

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

    // 非表示商品を除外
    filtered = filtered.filter(product => !product.is_hidden)

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

    if (filters.favoriteStatus === "favorite_only") {
      filtered = filtered.filter(product => product.is_favorite)
    } else if (filters.favoriteStatus === "non_favorite_only") {
      filtered = filtered.filter(product => !product.is_favorite)
    }

    if (filters.saleStatus === "on_sale") {
      filtered = filtered.filter(product => product.sale_price !== null && product.sale_price > 0)
    } else if (filters.saleStatus === "regular_price") {
      filtered = filtered.filter(product => !product.sale_price || product.sale_price === 0)
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

  // 初期フィルター設定
  useEffect(() => {
    if (initialFavoriteFilter) {
      setFilters(prev => ({
        ...prev,
        favoriteStatus: initialFavoriteFilter
      }))
    }
  }, [initialFavoriteFilter])

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

  // 利益計算ヘルパー関数
  const calculateProfit = useCallback((
    product: ExtendedProduct,
    asin: Asin | null,
    updatedPrice?: number,
    updatedSalePrice?: number
  ) => {
    try {
      // 価格を決定
      const basePrice = updatedSalePrice !== undefined
        ? updatedSalePrice
        : updatedPrice !== undefined
        ? updatedPrice
        : product.sale_price || product.price || 0

      // ASIN情報がない、またはAmazon価格がない場合は利益計算不可
      if (!asin || !asin.amazon_price) {
        return {
          profit_amount: 0,
          profit_rate: 0,
          roi: 0
        }
      }

      const amazonPrice = asin.amazon_price
      const feeRate = asin.fee_rate || 0
      const fbaFee = asin.fba_fee || 0

      // 手数料計算
      const commissionFee = amazonPrice * (feeRate / 100)
      const totalCost = basePrice + fbaFee + commissionFee

      // 利益計算
      const profitAmount = amazonPrice - totalCost
      const profitRate = totalCost > 0 ? (profitAmount / totalCost) * 100 : 0
      const roi = basePrice > 0 ? (profitAmount / basePrice) * 100 : 0

      return {
        profit_amount: Math.round(profitAmount),
        profit_rate: Math.round(profitRate * 100) / 100,
        roi: Math.round(roi * 100) / 100
      }
    } catch (error) {
      console.error("利益計算エラー:", error)
      return {
        profit_amount: 0,
        profit_rate: 0,
        roi: 0
      }
    }
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

        // ASIN削除の処理
        if (asinField === "asin" && !value) {
          const { error: productUpdateError } = await supabase
            .from("products")
            .update({ asin: null } as never)
            .eq("id", productId)

          if (productUpdateError) {
            throw new Error("ASIN削除に失敗しました")
          }

          success = true
          // 行レベル更新: ASINをnullに設定し、利益計算をリセット
          updateProductInState(productId, {
            asin: null,
            profit_amount: 0,
            profit_rate: 0,
            roi: 0
          })
        }
        // ASIN新規登録・変更の処理
        else if (asinField === "asin" && value) {
          // 既存ASINをチェック
          const { data: existingAsin } = await supabase
            .from("asins")
            .select()
            .eq("asin", value)
            .single<Asin>()

          let asinData: Asin | null = existingAsin

          if (!existingAsin) {
            // 新規ASIN作成
            const { data: newAsin, error: createAsinError } = await supabase
              .from("asins")
              .insert({
                asin: value,
                fee_rate: 15,
                fba_fee: 0,
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
            asinData = newAsin
          }

          // products.asinを更新
          const { error: productUpdateError } = await supabase
            .from("products")
            .update({ asin: value } as never)
            .eq("id", productId)

          if (productUpdateError) {
            throw new Error("商品ASIN更新に失敗しました")
          }

          success = true
          // 行レベル更新: ASIN変更後の利益計算
          const profitInfo = calculateProfit(product, asinData)
          updateProductInState(productId, {
            asin: asinData,
            ...profitInfo
          })

          // ASIN登録成功のトースト通知
          if (profitInfo.profit_amount > 0) {
            toast.success(`ASIN登録成功 - 利益率: ${profitInfo.profit_rate}%, ROI: ${profitInfo.roi}%`)
          } else {
            toast.info("ASIN登録成功 - Amazon価格が設定されていないため利益計算ができません")
          }
        }
        // ASIN情報の更新（Amazon価格、手数料率など）
        else if (product.asin) {
          const updates: Record<string, unknown> = {}

          if (["amazon_price", "monthly_sales", "fee_rate", "fba_fee", "complaint_count"].includes(asinField)) {
            updates[asinField] = value ? parseFloat(value) : null
          } else if (["has_amazon", "has_official", "is_dangerous", "is_per_carry_ng"].includes(asinField)) {
            updates[asinField] = value === "true"
          } else {
            updates[asinField] = value || null
          }

          success = await updateAsin(product.asin.id, updates)

          if (success) {
            const updatedAsin = { ...product.asin, ...updates } as Asin

            // 利益計算に影響する場合は再計算
            if (["amazon_price", "fee_rate", "fba_fee"].includes(asinField)) {
              const profitInfo = calculateProfit(product, updatedAsin)
              updateProductInState(productId, {
                asin: updatedAsin,
                ...profitInfo
              })
            } else {
              // 利益計算に影響しない場合は、ASIN情報のみ更新
              updateProductInState(productId, { asin: updatedAsin })
            }
          }
        }
      } else {
        // 商品情報の更新（価格など）
        const updates: Record<string, unknown> = {}

        if (["price", "sale_price"].includes(field)) {
          updates[field] = value ? parseFloat(value) : null
        } else {
          updates[field] = value || null
        }

        success = await updateProduct(productId, updates)

        if (success) {
          // 価格更新の場合は利益を再計算
          if (["price", "sale_price"].includes(field)) {
            const profitInfo = calculateProfit(
              product,
              product.asin ?? null,
              field === "price" ? (value ? parseFloat(value) : 0) : undefined,
              field === "sale_price" ? (value ? parseFloat(value) : 0) : undefined
            )
            updateProductInState(productId, {
              ...updates as Partial<ExtendedProduct>,
              ...profitInfo
            })
          } else {
            // 利益計算に影響しない場合は、該当フィールドのみ更新
            updateProductInState(productId, updates as Partial<ExtendedProduct>)
          }
        }
      }

      if (success) {
        setEditingCell(null)
      } else {
        setError("更新に失敗しました")
      }
    } catch (err) {
      console.error("編集保存エラー:", err)
      setError("更新中にエラーが発生しました")
    }
  }, [editingCell, products, updateProductInState, calculateProfit])

  const handleCopyProduct = useCallback(async (product: ExtendedProduct) => {
    try {
      const response = await fetch("/api/products/copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "商品のコピーに失敗しました")
      }

      // 行レベル更新: 新しい商品を状態に追加（全体リロード不要）
      if (result.data?.copiedProduct) {
        const newProduct: ExtendedProduct = {
          ...result.data.copiedProduct,
          asin: null,
          profit_amount: 0,
          profit_rate: 0,
          roi: 0
        }

        setProducts(prev => [...prev, newProduct])
        setError(null)
        toast.success("商品をコピーしました")
      } else {
        // フォールバック: データが返ってこなかった場合のみリロード
        await loadProducts()
        setError(null)
        toast.success("商品をコピーしました")
      }
    } catch (err) {
      console.error("商品コピーエラー:", err instanceof Error ? err.message : String(err))
      setError("商品のコピー中にエラーが発生しました")
      toast.error("商品のコピーに失敗しました")
    }
  }, [loadProducts])

  const handleDeleteProduct = useCallback(async (product: ExtendedProduct) => {
    // toastで削除確認を表示
    toast.error(`「${product.name}」を削除しますか？`, {
      description: "この操作は取り消せません",
      action: {
        label: "削除",
        onClick: async () => {
          try {
            const success = await deleteProduct(product.id)
            if (success) {
              // 行レベル更新: 削除された商品をstateから除外（全体リロード不要）
              setProducts(prev => prev.filter(p => p.id !== product.id))

              // 選択状態からも削除
              const newSelection = new Set(selectedProducts)
              newSelection.delete(product.id)
              setSelectedProducts(newSelection)

              setError(null)
              toast.success("商品を削除しました")
            } else {
              setError("商品の削除に失敗しました")
              toast.error("商品の削除に失敗しました")
            }
          } catch (err) {
            console.error("商品削除エラー:", err)
            setError("商品の削除中にエラーが発生しました")
            toast.error("商品の削除に失敗しました")
          }
        }
      },
      cancel: {
        label: "キャンセル",
        onClick: () => {}
      }
    })
  }, [selectedProducts])

  const getSortIcon = useCallback((field: string) => {
    if (sortField !== field) return null
    return sortDirection
  }, [sortField, sortDirection])

  // お気に入りトグルハンドラー
  const handleToggleFavorite = useCallback(async (product: ExtendedProduct) => {
    const newFavoriteStatus = !product.is_favorite
    try {
      const success = await updateProduct(product.id, {
        is_favorite: newFavoriteStatus
      })
      if (success) {
        updateProductInState(product.id, { is_favorite: newFavoriteStatus })
        toast.success(newFavoriteStatus ? "お気に入りに追加しました" : "お気に入りを解除しました")
      } else {
        toast.error("更新に失敗しました")
      }
    } catch (err) {
      console.error("お気に入り更新エラー:", err)
      toast.error("更新中にエラーが発生しました")
    }
  }, [updateProductInState])

  // Shift+ホイールで横スクロール
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault()
        container.scrollLeft += e.deltaY
      }
    }

    container.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      container.removeEventListener("wheel", handleWheel)
    }
  }, [])

  // 右クリックメニューの項目生成
  const getContextMenuItems = useCallback((
    product: ExtendedProduct,
    copyIcon: React.ReactNode,
    trashIcon: React.ReactNode
  ): ContextMenuItem[] => {
    return [
      {
        label: "商品をコピー",
        icon: copyIcon,
        onClick: () => handleCopyProduct(product)
      },
      {
        separator: true,
        label: "",
        onClick: () => {}
      },
      {
        label: "商品を削除",
        icon: trashIcon,
        onClick: () => handleDeleteProduct(product)
      }
    ]
  }, [handleCopyProduct, handleDeleteProduct])

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
    scrollContainerRef,

    // Actions
    setFilters,
    setEditingCell,
    loadProducts,
    updateProductInState,
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
    handleToggleFavorite,
    getContextMenuItems,
  }
}
