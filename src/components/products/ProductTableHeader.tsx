/**
 * 商品テーブルヘッダーコンポーネント
 * ソート機能付き
 */

import { TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { ChevronUpIcon, ChevronDownIcon, StarIcon } from "lucide-react"

type SortDirection = "asc" | "desc" | null

interface ProductTableHeaderProps {
  onSort: (field: string) => void
  getSortIcon: (field: string) => SortDirection
}

export function ProductTableHeader({ onSort, getSortIcon }: ProductTableHeaderProps) {
  // ソートアイコンをレンダリング
  const renderSortIcon = (field: string) => {
    const direction = getSortIcon(field)
    if (!direction) return null

    if (direction === "asc") {
      return <ChevronUpIcon className="w-4 h-4 ml-1" />
    } else if (direction === "desc") {
      return <ChevronDownIcon className="w-4 h-4 ml-1" />
    }
    return null
  }

  return (
    <TableHeader>
      <TableRow>
        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-12 text-xs text-center"
          onClick={() => onSort("is_favorite")}
        >
          <div className="flex items-center justify-center">
            <StarIcon className="w-4 h-4" />
            {renderSortIcon("is_favorite")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
          onClick={() => onSort("image_url")}
        >
          <div className="flex items-center justify-center">
            画像
            {renderSortIcon("image_url")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 min-w-[200px] text-xs text-center"
          onClick={() => onSort("name")}
        >
          <div className="flex items-center justify-center">
            商品名
            {renderSortIcon("name")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-32 text-xs text-center"
          onClick={() => onSort("price")}
        >
          <div className="flex items-center justify-center">
            価格
            {renderSortIcon("price")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
          onClick={() => onSort("effective_price")}
        >
          <div className="flex items-center justify-center">
            仕入価格
            {renderSortIcon("effective_price")}
          </div>
        </TableHead>

        {/* ASIN情報 */}
        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
          onClick={() => onSort("asin_asin")}
        >
          <div className="flex items-center justify-center">
            ASIN
            {renderSortIcon("asin_asin")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 min-w-[250px] text-xs text-center"
          onClick={() => onSort("asin_amazon_name")}
        >
          <div className="flex items-center justify-center">
            Amazon商品名
            {renderSortIcon("asin_amazon_name")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
          onClick={() => onSort("asin_amazon_price")}
        >
          <div className="flex items-center justify-center">
            Amazon価格
            {renderSortIcon("asin_amazon_price")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
          onClick={() => onSort("asin_monthly_sales")}
        >
          <div className="flex items-center justify-center">
            月間売上
            {renderSortIcon("asin_monthly_sales")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
          onClick={() => onSort("asin_fee_rate")}
        >
          <div className="flex items-center justify-center">
            手数料率
            {renderSortIcon("asin_fee_rate")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
          onClick={() => onSort("asin_fba_fee")}
        >
          <div className="flex items-center justify-center">
            FBA料
            {renderSortIcon("asin_fba_fee")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
          onClick={() => onSort("asin_jan_code")}
        >
          <div className="flex items-center justify-center">
            JANコード
            {renderSortIcon("asin_jan_code")}
          </div>
        </TableHead>

        {/* 利益計算 */}
        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-24 text-xs text-center"
          onClick={() => onSort("profit_amount")}
        >
          <div className="flex items-center justify-center">
            利益額
            {renderSortIcon("profit_amount")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
          onClick={() => onSort("profit_rate")}
        >
          <div className="flex items-center justify-center">
            利益率
            {renderSortIcon("profit_rate")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-20 text-xs text-center"
          onClick={() => onSort("roi")}
        >
          <div className="flex items-center justify-center">
            ROI
            {renderSortIcon("roi")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
          onClick={() => onSort("is_hidden")}
        >
          <div className="flex items-center justify-center">
            非表示
            {renderSortIcon("is_hidden")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
          onClick={() => onSort("asin_has_amazon")}
        >
          <div className="flex items-center justify-center">
            Amazon有
            {renderSortIcon("asin_has_amazon")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
          onClick={() => onSort("asin_has_official")}
        >
          <div className="flex items-center justify-center">
            公式有
            {renderSortIcon("asin_has_official")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
          onClick={() => onSort("asin_complaint_count")}
        >
          <div className="flex items-center justify-center">
            クレーム数
            {renderSortIcon("asin_complaint_count")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
          onClick={() => onSort("asin_is_dangerous")}
        >
          <div className="flex items-center justify-center">
            危険品
            {renderSortIcon("asin_is_dangerous")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 w-16 text-xs text-center"
          onClick={() => onSort("asin_is_per_carry_ng")}
        >
          <div className="flex items-center justify-center">
            パーキャリNG
            {renderSortIcon("asin_is_per_carry_ng")}
          </div>
        </TableHead>

        <TableHead
          className="cursor-pointer hover:bg-gray-50 min-w-[120px] text-xs text-center"
          onClick={() => onSort("asin_memo")}
        >
          <div className="flex items-center justify-center">
            ASINメモ
            {renderSortIcon("asin_memo")}
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}
