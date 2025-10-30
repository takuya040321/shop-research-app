/**
 * Yahoo!ショッピング新規ショップ追加ダイアログ
 */

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"

interface AddShopDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (shopData: ShopData) => void
}

export interface ShopData {
  shopId: string
  parentCategory: "lohaco" | "zozotown" | "direct"
  displayName: string
  defaultQuery: string
  sellerId: string | undefined
  categoryId: string | undefined
}

export function AddShopDialog({ open, onOpenChange, onSubmit }: AddShopDialogProps) {
  const [parentCategory, setParentCategory] = useState<"lohaco" | "zozotown" | "direct">("direct")
  const [displayName, setDisplayName] = useState("")
  const [defaultQuery, setDefaultQuery] = useState("")
  const [sellerId, setSellerId] = useState("")
  const [categoryId, setCategoryId] = useState("")

  // 親カテゴリが変更されたときの処理
  useEffect(() => {
    if (parentCategory === "zozotown") {
      setSellerId("zozo")
    } else if (sellerId === "zozo") {
      // ZOZOTOWNから他のカテゴリに変更した場合、storeIdをクリア
      setSellerId("")
    }
  }, [parentCategory, sellerId])

  const handleSubmit = () => {
    console.log("=== AddShopDialog handleSubmit ===")
    console.log("parentCategory:", parentCategory)
    console.log("displayName:", displayName)
    console.log("defaultQuery:", defaultQuery)
    console.log("sellerId:", sellerId)
    console.log("categoryId:", categoryId)

    // shop_idを生成（英数字小文字とハイフンのみ）
    const generateShopId = () => {
      const normalized = displayName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // スペースをハイフンに
        .replace(/[^a-z0-9-]/g, "") // 英数字とハイフン以外を削除

      // 親カテゴリのプレフィックスを追加
      if (parentCategory === "lohaco") {
        return `lohaco-${normalized}`
      } else if (parentCategory === "zozotown") {
        return `zozotown-${normalized}`
      }
      return normalized
    }

    const shopId = generateShopId()
    console.log("生成されたshopId:", shopId)

    const shopData: ShopData = {
      shopId,
      parentCategory,
      displayName: displayName.trim(),
      defaultQuery: defaultQuery.trim(),
      sellerId: sellerId.trim() || undefined,
      categoryId: categoryId.trim() || undefined,
    }

    console.log("shopData:", shopData)
    console.log("=================================")

    try {
      onSubmit(shopData)
      handleClose()
    } catch (error) {
      console.error("エラーが発生しました:", error)
    }
  }

  const handleClose = () => {
    setParentCategory("direct")
    setDisplayName("")
    setDefaultQuery("")
    setSellerId("")
    setCategoryId("")
    onOpenChange(false)
  }

  const isValid = displayName.trim() && defaultQuery.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>新規ショップ設定を追加</DialogTitle>
          <DialogDescription>
            Yahoo!ショッピングの検索設定を追加します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 親カテゴリ */}
          <div className="space-y-2">
            <Label htmlFor="parentCategory">親カテゴリ *</Label>
            <select
              id="parentCategory"
              value={parentCategory}
              onChange={(e) => setParentCategory(e.target.value as "lohaco" | "zozotown" | "direct")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="direct">Yahoo直販</option>
              <option value="lohaco">LOHACO</option>
              <option value="zozotown">ZOZOTOWN</option>
            </select>
            <p className="text-xs text-gray-500">
              {parentCategory === "lohaco" && "LOHACOストアの商品を検索します"}
              {parentCategory === "zozotown" && "ZOZOTOWNストアの商品を検索します（ストアID自動設定）"}
              {parentCategory === "direct" && "Yahoo!ショッピング直販の商品を検索します"}
            </p>
          </div>

          {/* 表示名 */}
          <div className="space-y-2">
            <Label htmlFor="displayName">表示名 *</Label>
            <Input
              id="displayName"
              placeholder="例: DHC, VT Cosmetics"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          {/* デフォルト検索クエリ */}
          <div className="space-y-2">
            <Label htmlFor="defaultQuery">デフォルト検索クエリ *</Label>
            <Input
              id="defaultQuery"
              placeholder="例: DHC"
              value={defaultQuery}
              onChange={(e) => setDefaultQuery(e.target.value)}
            />
          </div>

          {/* ストアID */}
          <div className="space-y-2">
            <Label htmlFor="sellerId">
              ストアID
              {parentCategory === "zozotown" && (
                <span className="ml-2 text-xs text-gray-500">(ZOZOTOWN固定)</span>
              )}
            </Label>
            <Input
              id="sellerId"
              placeholder="ストアID"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              disabled={parentCategory === "zozotown"}
              className={parentCategory === "zozotown" ? "bg-gray-100" : ""}
            />
          </div>

          {/* カテゴリID */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">カテゴリID</Label>
            <Input
              id="categoryId"
              placeholder="カテゴリID"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
