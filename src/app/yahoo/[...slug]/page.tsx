"use client"

/**
 * Yahoo階層ページ
 * 動的ルート: /yahoo/[...slug]
 * 例: /yahoo/lohaco/dhc, /yahoo/zozotown/vt, /yahoo/vt
 *
 * データベース（yahoo_shops）から動的に設定を読み込みます
 */

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { MainLayout } from "@/components/layout/MainLayout"
import { ProductTable } from "@/components/products/ProductTable"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { RefreshCwIcon, ShoppingBagIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useYahooShopPage } from "@/hooks/yahoo/useYahooShopPage"
import { DiscountSettings } from "@/components/official/DiscountSettings"
import type { Database } from "@/types/database"

type YahooShop = Database["public"]["Tables"]["yahoo_shops"]["Row"]

export default function YahooHierarchyPage() {
  const params = useParams()
  const slug = params.slug as string[]

  const [shopConfig, setShopConfig] = useState<YahooShop | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // データベースからショップ設定を読み込み
  useEffect(() => {
    const loadShopConfig = async () => {
      setLoading(true)
      setNotFound(false)

      try {
        // slugからshop_idとparent_categoryを抽出
        let parentCategory: string | null = null
        let shopId: string | undefined

        if (slug.length === 2) {
          // /yahoo/[parent]/[shop_id] の形式
          parentCategory = slug[0] || null
          shopId = slug[1]
        } else if (slug.length === 1) {
          // /yahoo/[shop_id] の形式（直販）
          shopId = slug[0]
        } else {
          setNotFound(true)
          setLoading(false)
          return
        }

        // shop_idが取得できなかった場合
        if (!shopId) {
          setNotFound(true)
          setLoading(false)
          return
        }

        // データベースから該当するショップを検索
        const { data, error } = await supabase
          .from("yahoo_shops")
          .select("*")
          .eq("shop_id", shopId)
          .eq("is_active", true)
          .maybeSingle()

        if (error) {
          console.error("ショップ設定の読み込みエラー:", error)
          setNotFound(true)
        } else if (!data) {
          console.error("ショップが見つかりません:", shopId)
          setNotFound(true)
        } else {
          // parent_categoryが一致するか確認
          if (data.parent_category !== parentCategory) {
            console.error("parent_categoryが一致しません:", {
              expected: parentCategory,
              actual: data.parent_category
            })
            setNotFound(true)
          } else {
            setShopConfig(data)
          }
        }
      } catch (error) {
        console.error("予期しないエラー:", error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadShopConfig()
  }, [slug])

  // shopNameの生成（親カテゴリを考慮）
  const generateShopName = () => {
    if (!shopConfig) {
      return ""
    }

    let shopName = ""
    if (shopConfig.parent_category) {
      shopName = `${shopConfig.parent_category}/${shopConfig.display_name}`
    } else {
      shopName = shopConfig.display_name
    }

    return shopName
  }

  // カスタムフックから全てのロジックを取得
  const {
    isRefreshing,
    handleRefresh
  } = useYahooShopPage({
    shopConfig: shopConfig || ({} as YahooShop),
    shopName: generateShopName()
  })

  const onRefresh = async () => {
    const result = await handleRefresh()

    if (result.success) {
      toast.success(`商品取得完了! 取得: ${result.data?.productsCount || 0}件 / 保存: ${result.data?.savedCount || 0}件 / スキップ: ${result.data?.skippedCount || 0}件`)
    } else {
      toast.error(`エラー: ${result.message || "商品取得に失敗しました"}`)
    }
  }

  // ローディング中
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </MainLayout>
    )
  }

  // ページが見つからない
  if (notFound || !shopConfig) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold text-red-600">ページが見つかりません</h1>
          <p className="mt-2 text-muted-foreground">
            URL: /yahoo/{slug.join("/")}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Yahooショップ設定でこのショップが登録されているか確認してください。
          </p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBagIcon className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900">{shopConfig.display_name}</h1>
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  Yahoo!ショッピング
                </Badge>
              </div>
              <p className="text-gray-600">
                Yahoo!ショッピングから{shopConfig.display_name}の商品を取得・管理
              </p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center gap-3 mb-6">
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "実行中..." : "商品取得（API）"}
            </Button>
          </div>

          {/* 割引設定 */}
          <DiscountSettings shopName={generateShopName()} />
        </div>

        {/* 商品テーブル */}
        <ProductTable
          className="w-full"
          shopFilter={generateShopName()}
        />
      </div>
    </MainLayout>
  )
}
