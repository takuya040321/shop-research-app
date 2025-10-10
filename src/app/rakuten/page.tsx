"use client"

/**
 * 楽天ショップ管理ページ
 * ショップの追加・編集・削除を行う
 */

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { ShoppingBag, Plus, Edit, Trash2, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"
import { toast } from "sonner"

type RakutenShop = Database["public"]["Tables"]["rakuten_shops"]["Row"]
type RakutenShopInsert = Database["public"]["Tables"]["rakuten_shops"]["Insert"]

export default function RakutenManagementPage() {
  const [shops, setShops] = useState<RakutenShop[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<RakutenShop | null>(null)

  // フォーム状態
  const [formData, setFormData] = useState<RakutenShopInsert>({
    shop_id: "",
    display_name: "",
    shop_code: "",
    genre_id: "",
    default_keyword: "",
    is_active: true
  })

  // ショップ一覧を読み込み
  const loadShops = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("rakuten_shops")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setShops(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadShops()
  }, [])

  // フォームを開く
  const openForm = (shop?: RakutenShop) => {
    if (shop) {
      setEditingShop(shop)
      setFormData({
        shop_id: shop.shop_id,
        display_name: shop.display_name,
        shop_code: shop.shop_code || "",
        genre_id: shop.genre_id || "",
        default_keyword: shop.default_keyword || "",
        is_active: shop.is_active
      })
    } else {
      setEditingShop(null)
      setFormData({
        shop_id: "",
        display_name: "",
        shop_code: "",
        genre_id: "",
        default_keyword: "",
        is_active: true
      })
    }
    setIsFormOpen(true)
  }

  // フォームを閉じる
  const closeForm = () => {
    setIsFormOpen(false)
    setEditingShop(null)
  }

  // 保存処理
  const handleSave = async () => {
    // 基本バリデーション
    if (!formData.shop_id || !formData.display_name) {
      toast.error("ショップIDと表示名は必須です")
      return
    }

    // 楽天API必須パラメータバリデーション（shopCodeとgenreIdのいずれかが必須）
    if (!formData.shop_code && !formData.genre_id) {
      toast.error("楽天API：shopCodeまたはgenreIdのいずれかは必須です")
      return
    }

    setSaving(true)

    try {
      if (editingShop) {
        // 更新
        const updateData = {
          shop_id: formData.shop_id,
          display_name: formData.display_name,
          shop_code: formData.shop_code || null,
          genre_id: formData.genre_id || null,
          default_keyword: formData.default_keyword || null,
          is_active: formData.is_active ?? true
        }

        const { error } = await supabase
          .from("rakuten_shops")
          .update(updateData as never)
          .eq("id", editingShop.id)

        if (error) {
          toast.error(`更新に失敗しました: ${error.message}`)
          return
        }

        toast.success("ショップ情報を更新しました")
      } else {
        // 新規作成（商品データも取得）
        const { error: insertError } = await supabase
          .from("rakuten_shops")
          .insert(formData as never)

        if (insertError) {
          toast.error(`作成に失敗しました: ${insertError.message}`)
          return
        }

        // 楽天APIから商品データを取得
        try {
          const requestBody: Record<string, unknown> = {
            shopCode: formData.shop_code,
            genreId: formData.genre_id,
            shopName: formData.display_name,
            hits: 30,
            page: 1
          }

          // キーワードが設定されている場合のみ追加
          if (formData.default_keyword) {
            requestBody.keyword = formData.default_keyword
          }

          const response = await fetch("/api/rakuten/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
          })

          const result = await response.json()

          if (result.success) {
            toast.success(`ショップを作成し、${result.data.savedCount}件の商品データを取得しました`)
          } else {
            toast.warning(`ショップは作成されましたが、商品データの取得に失敗しました`)
          }
        } catch {
          toast.warning("ショップは作成されましたが、商品データの取得に失敗しました")
        }
      }

      closeForm()
      loadShops()
      
      // サイドバー更新イベントを発行
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("rakuten:shop:updated"))
      }
    } finally {
      setSaving(false)
    }
  }

  // 削除処理
  const handleDelete = async (shop: RakutenShop) => {
    if (!confirm(`「${shop.display_name}」を削除しますか？\n関連する商品データもすべて削除されます。`)) {
      return
    }

    try {
      // 1. 関連商品を削除
      const { error: productsError } = await supabase
        .from("products")
        .delete()
        .eq("shop_name", shop.display_name)

      if (productsError) {
        toast.error(`商品データの削除に失敗しました: ${productsError.message}`)
        return
      }

      // 2. ショップを削除
      const { error: shopError } = await supabase
        .from("rakuten_shops")
        .delete()
        .eq("id", shop.id)

      if (shopError) {
        toast.error(`ショップの削除に失敗しました: ${shopError.message}`)
        return
      }

      toast.success(`「${shop.display_name}」とその商品データを削除しました`)
      loadShops()
      
      // サイドバー更新イベントを発行
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("rakuten:shop:updated"))
      }
    } catch (error) {
      toast.error(`削除処理中にエラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`)
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">楽天ショップ管理</h1>
            </div>
            <Button
              onClick={() => openForm()}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-green-400 px-6 py-2"
            >
              <Plus className="w-5 h-5" />
              新規追加
            </Button>
          </div>
          <p className="text-gray-600">
            楽天市場のショップ（ブランド）を登録・管理します
          </p>
        </div>

        {/* ショップ一覧テーブル */}
        {loading ? (
          <p className="text-gray-500">読み込み中...</p>
        ) : shops.length === 0 ? (
          <p className="text-gray-500">ショップが登録されていません</p>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      表示名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      ショップID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      shopCode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      genreId
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      keyword
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      状態
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {shops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{shop.display_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{shop.shop_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{shop.shop_code || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{shop.genre_id || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{shop.default_keyword || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          shop.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {shop.is_active ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openForm(shop)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            編集
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(shop)}
                            className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            削除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* フォームモーダル */}
        {isFormOpen && (
          <div
            className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4"
            onClick={closeForm}
          >
            <Card
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl border-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {editingShop ? "ショップを編集" : "ショップを追加"}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={closeForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="display_name">表示名（必須）</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="例: 無印良品"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      サイドバーやヘッダーに表示される名前
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="shop_id">ショップID（必須）</Label>
                    <Input
                      id="shop_id"
                      value={formData.shop_id}
                      onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                      placeholder="例: muji, vt"
                      disabled={!!editingShop}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URLパスに使用される一意の識別子（半角英数字推奨）
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="shop_code">楽天API：shopCode（shopCodeかgenreIdのいずれか必須）</Label>
                    <Input
                      id="shop_code"
                      value={formData.shop_code || ""}
                      onChange={(e) => setFormData({ ...formData, shop_code: e.target.value })}
                      placeholder="楽天API用のショップコード"
                    />
                  </div>

                  <div>
                    <Label htmlFor="genre_id">楽天API：genreId（shopCodeかgenreIdのいずれか必須）</Label>
                    <Input
                      id="genre_id"
                      value={formData.genre_id || ""}
                      onChange={(e) => setFormData({ ...formData, genre_id: e.target.value })}
                      placeholder="楽天API用のジャンルID"
                    />
                  </div>

                  <div>
                    <Label htmlFor="default_keyword">楽天API：keyword（任意）</Label>
                    <Input
                      id="default_keyword"
                      value={formData.default_keyword || ""}
                      onChange={(e) => setFormData({ ...formData, default_keyword: e.target.value })}
                      placeholder="例: 無印良品"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      商品検索時のデフォルトキーワード（ブランド名など）
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="is_active">有効にする</Label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        処理中...
                      </span>
                    ) : (
                      editingShop ? "更新" : "作成"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeForm}
                    disabled={saving}
                    className="flex-1 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
