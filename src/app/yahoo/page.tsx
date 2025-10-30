"use client"

/**
 * Yahoo!ショッピングトップページ
 * カテゴリ・ブランド一覧を表示
 */

import { useState } from "react"
import Link from "next/link"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ShoppingCart, ChevronRight, Plus } from "lucide-react"
import { AddShopDialog, type ShopData } from "@/components/yahoo/AddShopDialog"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

// Yahoo階層設定
const YAHOO_CATEGORIES = [
  {
    id: "lohaco",
    name: "LOHACO",
    description: "LOHACOストアの商品検索・管理",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    brands: [
      { id: "dhc", name: "DHC", path: "/yahoo/lohaco/dhc" },
      { id: "vt", name: "VT Cosmetics", path: "/yahoo/lohaco/vt" }
    ]
  },
  {
    id: "zozotown",
    name: "ZOZOTOWN",
    description: "ZOZOTOWNストアの商品検索・管理",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    brands: [
      { id: "dhc", name: "DHC", path: "/yahoo/zozotown/dhc" },
      { id: "vt", name: "VT Cosmetics", path: "/yahoo/zozotown/vt" }
    ]
  },
  {
    id: "direct",
    name: "Yahoo直販",
    description: "Yahoo!ショッピング直販商品の検索・管理",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    brands: [
      { id: "vt", name: "VT Cosmetics", path: "/yahoo/vt" }
    ]
  }
]

export default function YahooPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleAddShop = async (shopData: ShopData) => {
    console.log("=== Yahoo Page handleAddShop ===")
    console.log("受け取ったshopData:", shopData)

    try {
      // Supabaseにショップ設定を保存
      const insertData = {
        shop_id: shopData.shopId,
        display_name: shopData.displayName,
        parent_category: shopData.parentCategory,
        store_id: shopData.sellerId || null,
        category_id: shopData.categoryId || null,
        default_keyword: shopData.defaultQuery,
        is_active: true
      }

      console.log("データベースに保存するデータ:", insertData)

      const { data, error } = await supabase
        .from("yahoo_shops")
        .insert(insertData)
        .select()

      if (error) {
        console.error("Supabaseエラー:", error)
        toast.error("ショップ設定の追加に失敗しました", {
          description: error.message
        })
        return
      }

      console.log("保存成功:", data)

      toast.success("ショップ設定を追加しました", {
        description: `${shopData.displayName}の設定を追加しました`
      })

      // サイドバー更新イベントを発行
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("yahoo:shop:updated"))
      }

      console.log("トースト表示完了")
    } catch (error) {
      console.error("ショップ追加でエラーが発生:", error)
      toast.error("ショップ設定の追加に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー"
      })
    }
    console.log("================================")
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className="w-8 h-8 text-red-600" />
                <h1 className="text-3xl font-bold text-gray-900">Yahoo!ショッピング</h1>
              </div>
              <p className="text-gray-600">
                Yahoo!ショッピングの各カテゴリ・ブランド商品を検索・管理できます
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新規ショップ追加
            </Button>
          </div>
        </div>

        {/* カテゴリ一覧 */}
        <div className="space-y-6">
          {YAHOO_CATEGORIES.map((category) => (
            <Card key={category.id} className={`p-6 border-2 ${category.borderColor} ${category.bgColor}`}>
              <div className="mb-4">
                <h2 className={`text-2xl font-bold ${category.color} mb-2`}>
                  {category.name}
                </h2>
                <p className="text-gray-600 text-sm">
                  {category.description}
                </p>
              </div>

              {/* ブランド一覧 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.brands.map((brand) => (
                  <Link key={brand.id} href={brand.path}>
                    <Card className="p-4 bg-white hover:shadow-md transition-all hover:scale-105 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                          {brand.name}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* 使い方ガイド */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">使い方</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <span>カテゴリ（LOHACO、ZOZOTOWN、Yahoo直販）を選択</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <span>ブランドカードをクリックしてブランド専用ページへ移動</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <span>検索クエリ、ストアID、カテゴリIDを指定して商品を検索</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <span>検索結果から商品を選択して詳細情報を管理</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* 新規ショップ追加ダイアログ */}
      <AddShopDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAddShop}
      />
    </MainLayout>
  )
}
