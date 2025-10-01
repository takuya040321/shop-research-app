"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import {
  getAllDiscounts,
  createDiscount,
  deleteDiscount,
  toggleDiscountEnabled
} from "@/lib/discounts"
import { validateDiscountValue } from "@/types/discount"
import type { DiscountSetting, DiscountType } from "@/types/discount"
import { showSuccess, showError } from "@/lib/toast"

const TEST_USER_ID = "test-user-id"

interface NewDiscount {
  shopName: string
  discountType: DiscountType
  discountValue: string
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [newDiscount, setNewDiscount] = useState<NewDiscount>({
    shopName: "",
    discountType: "percentage",
    discountValue: ""
  })

  useEffect(() => {
    loadDiscounts()
  }, [])

  const loadDiscounts = async () => {
    try {
      setLoading(true)
      const data = await getAllDiscounts(TEST_USER_ID)
      setDiscounts(data)
    } catch (error) {
      console.error("割引設定読み込みエラー:", error)
      showError("割引設定の読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    const value = parseFloat(newDiscount.discountValue)

    if (!newDiscount.shopName) {
      showError("ショップ名を入力してください")
      return
    }

    if (isNaN(value) || !validateDiscountValue(newDiscount.discountType, value)) {
      showError("正しい割引値を入力してください")
      return
    }

    const result = await createDiscount(TEST_USER_ID, {
      shopName: newDiscount.shopName,
      discountType: newDiscount.discountType,
      discountValue: value
    })

    if (result) {
      showSuccess("割引設定を追加しました")
      setNewDiscount({ shopName: "", discountType: "percentage", discountValue: "" })
      loadDiscounts()
    } else {
      showError("割引設定の追加に失敗しました")
    }
  }

  const handleDelete = async (shopName: string) => {
    if (!confirm(`${shopName}の割引設定を削除しますか？`)) {
      return
    }

    const result = await deleteDiscount(TEST_USER_ID, shopName)

    if (result) {
      showSuccess("割引設定を削除しました")
      loadDiscounts()
    } else {
      showError("割引設定の削除に失敗しました")
    }
  }

  const handleToggle = async (shopName: string, isEnabled: boolean) => {
    const result = await toggleDiscountEnabled(TEST_USER_ID, shopName, isEnabled)

    if (result) {
      showSuccess(`割引設定を${isEnabled ? "有効" : "無効"}にしました`)
      loadDiscounts()
    } else {
      showError("割引設定の切り替えに失敗しました")
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">割引設定</h1>
          <p className="text-muted-foreground">
            ショップごとの割引設定を管理します
          </p>
        </div>

        {/* 新規追加フォーム */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">新しい割引設定を追加</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">ショップ名</Label>
              <Input
                id="shopName"
                placeholder="例: VT公式"
                value={newDiscount.shopName}
                onChange={(e) => setNewDiscount({ ...newDiscount, shopName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountType">割引タイプ</Label>
              <Select
                value={newDiscount.discountType}
                onValueChange={(value) =>
                  setNewDiscount({ ...newDiscount, discountType: value as DiscountType })
                }
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
                割引値 {newDiscount.discountType === "percentage" ? "(%)" : "(円)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                max={newDiscount.discountType === "percentage" ? "100" : undefined}
                placeholder={newDiscount.discountType === "percentage" ? "例: 10" : "例: 500"}
                value={newDiscount.discountValue}
                onChange={(e) => setNewDiscount({ ...newDiscount, discountValue: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAdd} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                追加
              </Button>
            </div>
          </div>
        </div>

        {/* 割引設定一覧 */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-4">割引設定一覧</h3>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">読み込み中...</p>
          ) : discounts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              割引設定がありません
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ショップ名</TableHead>
                  <TableHead>割引タイプ</TableHead>
                  <TableHead>割引値</TableHead>
                  <TableHead>有効/無効</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell className="font-medium">{discount.shopName}</TableCell>
                    <TableCell>
                      {discount.discountType === "percentage" ? "パーセンテージ" : "固定額"}
                    </TableCell>
                    <TableCell>
                      {discount.discountValue}
                      {discount.discountType === "percentage" ? "%" : "円"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={discount.isEnabled}
                        onCheckedChange={(checked) => handleToggle(discount.shopName, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(discount.shopName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
