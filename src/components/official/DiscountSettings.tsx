"use client"

/**
 * 割引設定UIコンポーネント
 */

import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { useDiscountSettings } from "@/hooks/official/useDiscountSettings"
import type { DiscountType } from "@/types/discount"

interface DiscountSettingsProps {
  shopName: string
}

export function DiscountSettings({ shopName }: DiscountSettingsProps) {
  const {
    discountType,
    discountValue,
    isDiscountEnabled,
    isSaving,
    isLoading,
    setDiscountType,
    setDiscountValue,
    setIsDiscountEnabled,
    saveDiscount
  } = useDiscountSettings({ shopName })

  const handleSave = async () => {
    const result = await saveDiscount()
    if (result.success) {
      // 成功時の処理（トーストなどに置き換え可能）
      alert("割引設定を保存しました")
    } else {
      alert("割引設定の保存に失敗しました")
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4 mb-6">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </Card>
    )
  }

  return (
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
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
