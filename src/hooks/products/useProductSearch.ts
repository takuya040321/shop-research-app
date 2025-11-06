/**
 * 商品検索用カスタムフック
 * フィルター管理、アクティブフィルター数計算機能を提供
 */

import { useState } from "react"

export interface ProductFilters {
  searchText: string
  minPrice: number | null
  maxPrice: number | null
  minProfitRate: number | null
  maxProfitRate: number | null
  minROI: number | null
  maxROI: number | null
  minMonthlySales: number | null
  maxMonthlySales: number | null
  monthlySalesStatus: "all" | "with_data" | "without_data"
  asinStatus: "all" | "with_asin" | "without_asin"
  favoriteStatus: "all" | "favorite_only" | "non_favorite_only"
  saleStatus: "all" | "on_sale" | "regular_price"
  hiddenStatus: "all" | "hidden_only" | "visible_only"
  amazonStatus: "all" | "available" | "unavailable"
  officialStatus: "all" | "available" | "unavailable"
  complaintStatus: "all" | "with_complaints" | "without_complaints"
  dangerousStatus: "all" | "dangerous" | "safe"
  perCarryStatus: "all" | "ng" | "ok"
}

export function useProductSearch() {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [tempFilters, setTempFilters] = useState<ProductFilters | null>(null)

  // 検索テキストの変更（即座に反映）
  const handleSearchChange = (
    filters: ProductFilters,
    onFiltersChange: (filters: ProductFilters) => void,
    value: string
  ) => {
    onFiltersChange({
      ...filters,
      searchText: value
    })
    // tempFiltersも更新
    if (tempFilters) {
      setTempFilters({
        ...tempFilters,
        searchText: value
      })
    }
  }

  // 一時フィルター値の変更（適用ボタンを押すまで反映されない）
  const handleTempFilterChange = (
    key: keyof ProductFilters,
    value: string | number | boolean | null
  ) => {
    setTempFilters(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [key]: value
      }
    })
  }

  // フィルター適用
  const applyFilters = (
    onFiltersChange: (filters: ProductFilters) => void
  ) => {
    if (tempFilters) {
      onFiltersChange(tempFilters)
    }
  }

  // フィルターパネルを開く際に一時フィルターを初期化
  const toggleFilterPanel = (
    currentFilters: ProductFilters,
    expanded: boolean
  ) => {
    if (!expanded) {
      // パネルを開く場合、現在のフィルターで一時フィルターを初期化
      setTempFilters(currentFilters)
    }
    setIsFilterExpanded(!expanded)
  }

  // フィルターのクリア
  const clearFilters = (onFiltersChange: (filters: ProductFilters) => void) => {
    const clearedFilters: ProductFilters = {
      searchText: "",
      minPrice: null,
      maxPrice: null,
      minProfitRate: null,
      maxProfitRate: null,
      minROI: null,
      maxROI: null,
      minMonthlySales: null,
      maxMonthlySales: null,
      monthlySalesStatus: "all",
      asinStatus: "all",
      favoriteStatus: "all",
      saleStatus: "all",
      hiddenStatus: "visible_only",
      amazonStatus: "all",
      officialStatus: "all",
      complaintStatus: "all",
      dangerousStatus: "all",
      perCarryStatus: "all"
    }
    onFiltersChange(clearedFilters)
    setTempFilters(clearedFilters)
  }

  // アクティブなフィルター数をカウント
  const getActiveFilterCount = (filters: ProductFilters): number => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === "searchText" && value) return count + 1
      if (key === "asinStatus" && value !== "all") return count + 1
      if (key === "favoriteStatus" && value !== "all") return count + 1
      if (key === "saleStatus" && value !== "all") return count + 1
      if (key === "hiddenStatus" && value !== "visible_only") return count + 1
      if (key === "monthlySalesStatus" && value !== "all") return count + 1
      if (key === "amazonStatus" && value !== "all") return count + 1
      if (key === "officialStatus" && value !== "all") return count + 1
      if (key === "complaintStatus" && value !== "all") return count + 1
      if (key === "dangerousStatus" && value !== "all") return count + 1
      if (key === "perCarryStatus" && value !== "all") return count + 1
      if (typeof value === "number" && value !== null) return count + 1
      return count
    }, 0)
  }

  return {
    // State
    isFilterExpanded,
    setIsFilterExpanded,
    tempFilters,

    // Actions
    handleSearchChange,
    handleTempFilterChange,
    applyFilters,
    toggleFilterPanel,
    clearFilters,
    getActiveFilterCount
  }
}
