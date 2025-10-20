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
  asinStatus: "all" | "with_asin" | "without_asin"
  favoriteStatus: "all" | "favorite_only" | "non_favorite_only"
  saleStatus: "all" | "on_sale" | "regular_price"
}

export function useProductSearch() {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  // 検索テキストの変更
  const handleSearchChange = (
    filters: ProductFilters,
    onFiltersChange: (filters: ProductFilters) => void,
    value: string
  ) => {
    onFiltersChange({
      ...filters,
      searchText: value
    })
  }

  // フィルター値の変更
  const handleFilterChange = (
    filters: ProductFilters,
    onFiltersChange: (filters: ProductFilters) => void,
    key: keyof ProductFilters,
    value: string | number | boolean | null
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  // フィルターのクリア
  const clearFilters = (onFiltersChange: (filters: ProductFilters) => void) => {
    onFiltersChange({
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
  }

  // アクティブなフィルター数をカウント
  const getActiveFilterCount = (filters: ProductFilters): number => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === "searchText" && value) return count + 1
      if (key === "asinStatus" && value !== "all") return count + 1
      if (key === "favoriteStatus" && value !== "all") return count + 1
      if (key === "saleStatus" && value !== "all") return count + 1
      if (typeof value === "number" && value !== null) return count + 1
      return count
    }, 0)
  }

  return {
    // State
    isFilterExpanded,
    setIsFilterExpanded,

    // Actions
    handleSearchChange,
    handleFilterChange,
    clearFilters,
    getActiveFilterCount
  }
}
