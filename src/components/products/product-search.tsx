"use client"

/**
 * 商品検索・フィルターコンポーネント
 */

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "lucide-react"

// フィルター条件の型定義
export interface ProductFilters {
  searchText: string
  minPrice: number | null
  maxPrice: number | null
  minProfitRate: number | null
  maxProfitRate: number | null
  minROI: number | null
  maxROI: number | null
  asinStatus: "all" | "with_asin" | "without_asin"
}

interface ProductSearchProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  totalCount: number
  filteredCount: number
}

export function ProductSearch({ filters, onFiltersChange, totalCount, filteredCount }: ProductSearchProps) {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  // 検索テキストの変更
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchText: value
    })
  }

  // フィルター値の変更
  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  // フィルターのクリア
  const clearFilters = () => {
    onFiltersChange({
      searchText: "",
      minPrice: null,
      maxPrice: null,
      minProfitRate: null,
      maxProfitRate: null,
      minROI: null,
      maxROI: null,
      asinStatus: "all"
    })
  }

  // アクティブなフィルター数をカウント
  const activeFilterCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === "searchText" && value) return count + 1
    if (key === "asinStatus" && value !== "all") return count + 1
    if (typeof value === "number" && value !== null) return count + 1
    return count
  }, 0)

  return (
    <Card className="p-4 mb-4">
      {/* 検索バーと結果表示 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="商品名、ASIN、Amazon商品名で検索..."
            value={filters.searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="flex items-center gap-2"
        >
          <FilterIcon className="w-4 h-4" />
          フィルター
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          {isFilterExpanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="flex items-center gap-2 text-gray-600"
          >
            <XIcon className="w-4 h-4" />
            クリア
          </Button>
        )}
      </div>


      {/* 詳細フィルター */}
      {isFilterExpanded && (
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 価格範囲 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">価格範囲</div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最低価格"
                  value={filters.minPrice || ""}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高価格"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* 利益率範囲 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">利益率（%）</div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最低"
                  value={filters.minProfitRate || ""}
                  onChange={(e) => handleFilterChange("minProfitRate", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高"
                  value={filters.maxProfitRate || ""}
                  onChange={(e) => handleFilterChange("maxProfitRate", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* ROI範囲 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">ROI（%）</div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最低"
                  value={filters.minROI || ""}
                  onChange={(e) => handleFilterChange("minROI", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高"
                  value={filters.maxROI || ""}
                  onChange={(e) => handleFilterChange("maxROI", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* ASIN設定状況 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">ASIN設定</div>
              <Select
                value={filters.asinStatus}
                onValueChange={(value) => handleFilterChange("asinStatus", value as typeof filters.asinStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="with_asin">ASIN設定済み</SelectItem>
                  <SelectItem value="without_asin">ASIN未設定</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}