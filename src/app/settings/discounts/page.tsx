"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import type { DiscountType } from "@/types/discount"
import { showSuccess, showError } from "@/lib/toast"

const TEST_USER_ID = "test-user-id"

interface NewDiscount {
  shopName: string
  discountType: DiscountType
  discountValue: string
}

export default function DiscountsPage() {
  const queryClient = useQueryClient()
  const [newDiscount, setNewDiscount] = useState<NewDiscount>({
    shopName: "",
    discountType: "percentage",
    discountValue: ""
  })

  // 割引設定一覧取得
  const { data: discounts = [], isLoading: loading } = useQuery({
    queryKey: ["discounts", TEST_USER_ID],
    queryFn: () => getAllDiscounts(TEST_USER_ID),
  })

  // 割引設定作成のミューテーション
  const createMutation = useMutation({
    mutationFn: (discount: { shopName: string; discountType: DiscountType; discountValue: number }) =>
      createDiscount(TEST_USER_ID, discount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts", TEST_USER_ID] })
      showSuccess("割引設定を追加しました")
      setNewDiscount({ shopName: "", discountType: "percentage", discountValue: "" })
    },
    onError: () => {
      showError("割引設定の追加に失敗しました")
    },
  })

  // 割引設定削除のミューテーション
  const deleteMutation = useMutation({
    mutationFn: (shopName: string) => deleteDiscount(TEST_USER_ID, shopName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts", TEST_USER_ID] })
      showSuccess("割引設定を削除しました")
    },
    onError: () => {
      showError("割引設定の削除に失敗しました")
    },
  })

  // 割引設定切り替えのミューテーション
  const toggleMutation = useMutation({
    mutationFn: ({ shopName, isEnabled }: { shopName: string; isEnabled: boolean }) =>
      toggleDiscountEnabled(TEST_USER_ID, shopName, isEnabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["discounts", TEST_USER_ID] })
      showSuccess(`割引設定を${variables.isEnabled ? "有効" : "無効"}にしました`)
    },
    onError: () => {
      showError("割引設定の切り替えに失敗しました")
    },
  })

  const handleAdd = () => {
    const value = parseFloat(newDiscount.discountValue)

    if (!newDiscount.shopName) {
      showError("ショップ名を入力してください")
      return
    }

    if (isNaN(value) || !validateDiscountValue(newDiscount.discountType, value)) {
      showError("正しい割引値を入力してください")
      return
    }

    createMutation.mutate({
      shopName: newDiscount.shopName,
      discountType: newDiscount.discountType,
      discountValue: value
    })
  }

  const handleDelete = (shopName: string) => {
    if (!confirm(`${shopName}の割引設定を削除しますか？`)) {
      return
    }

    deleteMutation.mutate(shopName)
  }

  const handleToggle = (shopName: string, isEnabled: boolean) => {
    toggleMutation.mutate({ shopName, isEnabled })
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
