"use client"

/**
 * 楽天ブランドページ
 * 動的ルート: /rakuten/[brand]
 * データベースから設定を読み込んで表示
 */

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/Button"
import { ProductTable } from "@/components/products/ProductTable"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"

type RakutenShop = Database["public"]["Tables"]["rakuten_shops"]["Row"]

export default function RakutenBrandPage() {
  const params = useParams()
  const router = useRouter()
  const brand = params.brand as string

  const [shopConfig, setShopConfig] = useState<RakutenShop | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null)

  // トースト表示関数
  const showToast = (message: string, type: "success" | "error" | "warning") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ショップ設定を読み込み
  useEffect(() => {
    const loadShopConfig = async () => {
      const { data, error } = await supabase
        .from("rakuten_shops")
        .select("*")
        .eq("shop_id", brand)
        .eq("is_active", true)
        .single()

      if (error || !data) {
        // ショップが見つからない場合は管理ページへリダイレクト
        router.push("/rakuten")
        return
      }

      setShopConfig(data)
      setLoading(false)
    }

    loadShopConfig()
  }, [brand, router])

  // 商品データ更新処理
  const handleUpdate = async () => {
    if (!shopConfig) return

    setUpdating(true)

    try {
      const requestBody: Record<string, unknown> = {
        shopCode: shopConfig.shop_code,
        genreId: shopConfig.genre_id,
        shopName: shopConfig.display_name,
        hits: 30,
        page: 1
      }

      // キーワードが設定されている場合のみ追加
      if (shopConfig.default_keyword) {
        requestBody.keyword = shopConfig.default_keyword
      }

      const response = await fetch("/api/rakuten/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (result.success) {
        const { savedCount, skippedCount } = result.data
        if (savedCount > 0) {
          showToast(
            `${savedCount}件の新規商品を追加しました${skippedCount > 0 ? `（重複: ${skippedCount}件）` : ""}`,
            "success"
          )
        } else if (skippedCount > 0) {
          showToast(`すべて重複商品でした（${skippedCount}件）`, "warning")
        } else {
          showToast("取得できる商品がありませんでした", "warning")
        }
        // テーブルをリフレッシュ
        setRefreshKey(prev => prev + 1)
      } else {
        showToast(`商品データの取得に失敗しました: ${result.message}`, "error")
      }
    } catch (error) {
      showToast("商品データの取得に失敗しました", "error")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!shopConfig) {
    return null
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {/* トースト通知 */}
          {toast && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
              <div
                className={`${
                  toast.type === "success"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : toast.type === "error"
                    ? "bg-gradient-to-r from-red-500 to-rose-600"
                    : "bg-gradient-to-r from-yellow-500 to-orange-600"
                } text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md animate-slide-in`}
              >
                <p className="flex-1 font-medium">{toast.message}</p>
                <button
                  onClick={() => setToast(null)}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ヘッダー */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h1 className="text-2xl font-bold text-gray-900">{shopConfig.display_name}</h1>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                    楽天市場
                  </span>
                </div>
                <p className="text-gray-600">
                  楽天市場から{shopConfig.display_name}の商品を検索・管理
                </p>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-3 mb-6">
              <Button
                onClick={handleUpdate}
                disabled={updating}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${updating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {updating ? "実行中..." : "商品データ更新"}
              </Button>
            </div>
          </div>

          {/* 商品一覧 */}
          <ProductTable
            key={refreshKey}
            className="w-full"
            shopFilter={shopConfig.display_name}
          />
        </div>
      </main>
    </div>
  )
}
