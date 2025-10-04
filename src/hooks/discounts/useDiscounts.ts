/**
 * 割引設定管理用カスタムフック
 * データ取得、作成、削除、切り替え機能を提供
 */

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAllDiscounts,
  createDiscount,
  deleteDiscount,
  toggleDiscountEnabled
} from "@/lib/discounts"
import { validateDiscountValue } from "@/types/discount"
import type { DiscountType } from "@/types/discount"
import { showSuccess, showError } from "@/lib/toast"

interface NewDiscount {
  shopName: string
  discountType: DiscountType
  discountValue: string
}

export function useDiscounts() {
  const queryClient = useQueryClient()
  const [newDiscount, setNewDiscount] = useState<NewDiscount>({
    shopName: "",
    discountType: "percentage",
    discountValue: ""
  })

  // 割引設定一覧取得
  const { data: discounts = [], isLoading: loading } = useQuery({
    queryKey: ["discounts"],
    queryFn: () => getAllDiscounts(),
  })

  // 割引設定作成のミューテーション
  const createMutation = useMutation({
    mutationFn: (discount: { shopName: string; discountType: DiscountType; discountValue: number }) =>
      createDiscount(discount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] })
      showSuccess("割引設定を追加しました")
      setNewDiscount({ shopName: "", discountType: "percentage", discountValue: "" })
    },
    onError: () => {
      showError("割引設定の追加に失敗しました")
    },
  })

  // 割引設定削除のミューテーション
  const deleteMutation = useMutation({
    mutationFn: (shopName: string) => deleteDiscount(shopName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] })
      showSuccess("割引設定を削除しました")
    },
    onError: () => {
      showError("割引設定の削除に失敗しました")
    },
  })

  // 割引設定切り替えのミューテーション
  const toggleMutation = useMutation({
    mutationFn: ({ shopName, isEnabled }: { shopName: string; isEnabled: boolean }) =>
      toggleDiscountEnabled(shopName, isEnabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] })
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

  return {
    // State
    discounts,
    loading,
    newDiscount,
    setNewDiscount,

    // Actions
    handleAdd,
    handleDelete,
    handleToggle
  }
}
