"use client"

/**
 * 商品検索・フィルターコンポーネント
 */

import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "lucide-react"
import { useProductSearch, type ProductFilters } from "@/hooks/products/useProductSearch"

export type { ProductFilters }

interface ProductSearchProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  totalCount: number
  filteredCount: number
}

export function ProductSearch({ filters, onFiltersChange }: ProductSearchProps) {
  // カスタムフックから全てのロジックを取得
  const {
    isFilterExpanded,
    setIsFilterExpanded,
    handleSearchChange,
    handleFilterChange,
    clearFilters,
    getActiveFilterCount
  } = useProductSearch()

  const activeFilterCount = getActiveFilterCount(filters)

  return (
    <Card className="p-4 mb-4">
      {/* 検索バーと結果表示 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="商品名、ASIN、Amazon商品名で検索..."
            value={filters.searchText}
            onChange={(e) => handleSearchChange(filters, onFiltersChange, e.target.value)}
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
            onClick={() => clearFilters(onFiltersChange)}
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
                  onChange={(e) => handleFilterChange(filters, onFiltersChange, "minPrice", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高価格"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleFilterChange(filters, onFiltersChange, "maxPrice", e.target.value ? parseFloat(e.target.value) : null)}
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
                  onChange={(e) => handleFilterChange(filters, onFiltersChange, "minProfitRate", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高"
                  value={filters.maxProfitRate || ""}
                  onChange={(e) => handleFilterChange(filters, onFiltersChange, "maxProfitRate", e.target.value ? parseFloat(e.target.value) : null)}
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
                  onChange={(e) => handleFilterChange(filters, onFiltersChange, "minROI", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高"
                  value={filters.maxROI || ""}
                  onChange={(e) => handleFilterChange(filters, onFiltersChange, "maxROI", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* ASIN設定状況 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">ASIN設定</div>
              <Select
                value={filters.asinStatus}
                onValueChange={(value) => handleFilterChange(filters, onFiltersChange, "asinStatus", value as typeof filters.asinStatus)}
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

            {/* お気に入り */}
            <div className="space-y-2">
              <div className="text-sm font-medium">お気に入り</div>
              <Select
                value={filters.favoriteStatus}
                onValueChange={(value) => handleFilterChange(filters, onFiltersChange, "favoriteStatus", value as typeof filters.favoriteStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="favorite_only">お気に入りのみ</SelectItem>
                  <SelectItem value="non_favorite_only">お気に入り以外</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* セール状況 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">セール状況</div>
              <Select
                value={filters.saleStatus}
                onValueChange={(value) => handleFilterChange(filters, onFiltersChange, "saleStatus", value as typeof filters.saleStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="on_sale">セール中のみ</SelectItem>
                  <SelectItem value="regular_price">通常価格のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}