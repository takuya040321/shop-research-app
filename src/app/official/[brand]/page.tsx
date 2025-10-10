"use client"

/**
 * ブランド別公式サイト商品一覧ページ（動的ルーティング）
 */

import { useParams, notFound } from "next/navigation"
import { MainLayout } from "@/components/layout/MainLayout"
import { ProductTable } from "@/components/products/ProductTable"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import {
  RefreshCwIcon,
  GlobeIcon
} from "lucide-react"
import { getBrandConfig, isValidBrand } from "@/lib/brand-config"
import { useOfficialBrandPage } from "@/hooks/official/useOfficialBrandPage"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Card } from "@/components/ui/Card"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { DiscountType } from "@/types/discount"
import type { Database } from "@/types/database"

export default function BrandPage() {
  const params = useParams()
  const brandId = params.brand as string

  // 無効なブランドIDの場合は404を表示
  if (!isValidBrand(brandId)) {
    notFound()
  }

  const brandConfig = getBrandConfig(brandId)
  if (!brandConfig) {
    notFound()
  }

  // カスタムフックから全てのロジックを取得
  const {
    isRefreshing,
    handleRefresh
  } = useOfficialBrandPage({
    brandConfig
  })

  // ブランド別割引設定の状態管理
  const [discountType, setDiscountType] = useState<DiscountType>("percentage")
  const [discountValue, setDiscountValue] = useState<string>("0")
  const [isDiscountEnabled, setIsDiscountEnabled] = useState(false)
  const [isSavingDiscount, setIsSavingDiscount] = useState(false)

  // 既存の割引設定を読み込み
  useEffect(() => {
    const loadDiscount = async () => {
      const { data } = await supabase
        .from("shop_discounts")
        .select()
        .eq("shop_name", brandConfig.shopName)
        .single<Database["public"]["Tables"]["shop_discounts"]["Row"]>()

      if (data) {
        setDiscountType(data.discount_type as "percentage" | "fixed")
        setDiscountValue(String(data.discount_value))
        setIsDiscountEnabled(data.is_enabled ?? false)
      }
    }

    loadDiscount()
  }, [brandConfig.shopName])

  // 割引設定を保存
  const handleSaveDiscount = async () => {
    setIsSavingDiscount(true)

    try {
      const { data: existing } = await supabase
        .from("shop_discounts")
        .select()
        .eq("shop_name", brandConfig.shopName)
        .single<Database["public"]["Tables"]["shop_discounts"]["Row"]>()

      const updateData = {
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        is_enabled: isDiscountEnabled
      }

      const insertData = {
        shop_name: brandConfig.shopName,
        ...updateData
      }

      if (existing) {
        await supabase
          .from("shop_discounts")
          .update(updateData as never)
          .eq("shop_name", brandConfig.shopName)
      } else {
        await supabase
          .from("shop_discounts")
          .insert(insertData as never)
      }
    } finally {
      setIsSavingDiscount(false)
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GlobeIcon className={`w-6 h-6 ${brandConfig.color}`} />
                <h1 className="text-2xl font-bold text-gray-900">{brandConfig.displayName}</h1>
                <Badge variant="outline" className={`${brandConfig.color} ${brandConfig.borderColor}`}>
                  公式サイト
                </Badge>
              </div>
              <p className="text-gray-600">
                {brandConfig.description}
              </p>
            </div>
          </div>


          {/* アクションボタン */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || !brandConfig.hasScrapingAPI}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "実行中..." : "スクレイピング"}
            </Button>
          </div>

          {/* 割引設定カード */}
          <Card className="p-4 mb-6">
            <h3 className="font-semibold mb-4">ブランド別割引設定</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">割引タイプ</Label>
                <Select
                  value={discountType}
                  onValueChange={(value) => setDiscountType(value as DiscountType)}
                >
                  <SelectTrigger id="discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">パーセンテージ (%)</SelectItem>
                    <SelectItem value="fixed">固定額 (円)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  割引値 {discountType === "percentage" ? "(%)" : "(円)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="0"
                  max={discountType === "percentage" ? "100" : undefined}
                  placeholder={discountType === "percentage" ? "例: 10" : "例: 500"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountEnabled">有効化</Label>
                <div className="flex items-center h-10">
                  <input
                    id="discountEnabled"
                    type="checkbox"
                    checked={isDiscountEnabled}
                    onChange={(e) => setIsDiscountEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="ml-2 text-sm">{isDiscountEnabled ? "有効" : "無効"}</span>
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleSaveDiscount}
                  disabled={isSavingDiscount}
                  className="w-full"
                >
                  {isSavingDiscount ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* 商品テーブル */}
        <ProductTable
          className="w-full"
          shopFilter={brandConfig.shopName}
        />
      </div>
    </MainLayout>
  )
}