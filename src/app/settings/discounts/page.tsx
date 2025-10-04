"use client"

import { MainLayout } from "@/components/layout/MainLayout"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Plus, Trash2 } from "lucide-react"
import type { DiscountType } from "@/types/discount"
import { useDiscounts } from "@/hooks/discounts/useDiscounts"

export default function DiscountsPage() {
  // カスタムフックから全てのロジックを取得
  const {
    discounts,
    loading,
    newDiscount,
    setNewDiscount,
    handleAdd,
    handleDelete,
    handleToggle
  } = useDiscounts()

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
