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
  onClearEditedProducts: () => void
}

export function ProductSearch({ filters, onFiltersChange, onClearEditedProducts }: ProductSearchProps) {
  // カスタムフックから全てのロジックを取得
  const {
    isFilterExpanded,
    setIsFilterExpanded,
    tempFilters,
    handleSearchChange,
    handleTempFilterChange,
    applyFilters,
    toggleFilterPanel,
    clearFilters,
    getActiveFilterCount
  } = useProductSearch()

  const activeFilterCount = getActiveFilterCount(filters)

  // 表示用のフィルター（パネルが開いていれば一時フィルター、閉じていれば実際のフィルター）
  const displayFilters = isFilterExpanded && tempFilters ? tempFilters : filters

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
          onClick={() => toggleFilterPanel(filters, isFilterExpanded)}
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
      {isFilterExpanded && tempFilters && (
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 価格範囲 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">価格</div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最低価格"
                  value={displayFilters.minPrice || ""}
                  onChange={(e) => handleTempFilterChange("minPrice", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高価格"
                  value={displayFilters.maxPrice || ""}
                  onChange={(e) => handleTempFilterChange("maxPrice", e.target.value ? parseFloat(e.target.value) : null)}
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
                  value={displayFilters.minProfitRate || ""}
                  onChange={(e) => handleTempFilterChange("minProfitRate", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高"
                  value={displayFilters.maxProfitRate || ""}
                  onChange={(e) => handleTempFilterChange("maxProfitRate", e.target.value ? parseFloat(e.target.value) : null)}
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
                  value={displayFilters.minROI || ""}
                  onChange={(e) => handleTempFilterChange("minROI", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高"
                  value={displayFilters.maxROI || ""}
                  onChange={(e) => handleTempFilterChange("maxROI", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* 月間売上 - ステータス */}
            <div className="space-y-2">
              <div className="text-sm font-medium">月間売上</div>
              <Select
                value={displayFilters.monthlySalesStatus}
                onValueChange={(value) => handleTempFilterChange("monthlySalesStatus", value as typeof filters.monthlySalesStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="with_data">データあり</SelectItem>
                  <SelectItem value="without_data">データなし</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 月間売上 - 範囲 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">月間売上範囲</div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最低"
                  value={displayFilters.minMonthlySales || ""}
                  onChange={(e) => handleTempFilterChange("minMonthlySales", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
                <span className="text-gray-400">〜</span>
                <Input
                  type="number"
                  placeholder="最高"
                  value={displayFilters.maxMonthlySales || ""}
                  onChange={(e) => handleTempFilterChange("maxMonthlySales", e.target.value ? parseFloat(e.target.value) : null)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* ASIN設定状況 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">ASIN</div>
              <Select
                value={displayFilters.asinStatus}
                onValueChange={(value) => handleTempFilterChange("asinStatus", value as typeof filters.asinStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="with_asin">設定済み</SelectItem>
                  <SelectItem value="without_asin">未設定</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* お気に入り */}
            <div className="space-y-2">
              <div className="text-sm font-medium">お気に入り</div>
              <Select
                value={displayFilters.favoriteStatus}
                onValueChange={(value) => handleTempFilterChange("favoriteStatus", value as typeof filters.favoriteStatus)}
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
                value={displayFilters.saleStatus}
                onValueChange={(value) => handleTempFilterChange("saleStatus", value as typeof filters.saleStatus)}
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

            {/* 非表示 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">非表示</div>
              <Select
                value={displayFilters.hiddenStatus}
                onValueChange={(value) => handleTempFilterChange("hiddenStatus", value as typeof filters.hiddenStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="visible_only">表示中のみ</SelectItem>
                  <SelectItem value="hidden_only">非表示のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amazon有 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Amazon有</div>
              <Select
                value={displayFilters.amazonStatus}
                onValueChange={(value) => handleTempFilterChange("amazonStatus", value as typeof filters.amazonStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="available">ありのみ</SelectItem>
                  <SelectItem value="unavailable">なしのみ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 公式有 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">公式有</div>
              <Select
                value={displayFilters.officialStatus}
                onValueChange={(value) => handleTempFilterChange("officialStatus", value as typeof filters.officialStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="available">ありのみ</SelectItem>
                  <SelectItem value="unavailable">なしのみ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* クレーム数 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">クレーム数</div>
              <Select
                value={displayFilters.complaintStatus}
                onValueChange={(value) => handleTempFilterChange("complaintStatus", value as typeof filters.complaintStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="with_complaints">クレームあり</SelectItem>
                  <SelectItem value="without_complaints">クレームなし</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 危険品 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">危険品</div>
              <Select
                value={displayFilters.dangerousStatus}
                onValueChange={(value) => handleTempFilterChange("dangerousStatus", value as typeof filters.dangerousStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="dangerous">該当のみ</SelectItem>
                  <SelectItem value="safe">非該当のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* パーキャリNG */}
            <div className="space-y-2">
              <div className="text-sm font-medium">パーキャリNG</div>
              <Select
                value={displayFilters.perCarryStatus}
                onValueChange={(value) => handleTempFilterChange("perCarryStatus", value as typeof filters.perCarryStatus)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="ng">該当のみ</SelectItem>
                  <SelectItem value="ok">非該当のみ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 適用ボタン */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsFilterExpanded(false)
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={() => {
                applyFilters(onFiltersChange)
                onClearEditedProducts() // 編集済み商品の追跡をクリア
                setIsFilterExpanded(false)
              }}
            >
              適用
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
