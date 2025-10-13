"use client"

/**
 * Yahooショップ管理ページ
 * ショップの追加・編集・削除を行う
 */

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/MainLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { ShoppingCart, Plus, Edit, Trash2, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Database } from "@/types/database"
import { toast } from "sonner"

type YahooShop = Database["public"]["Tables"]["yahoo_shops"]["Row"]
type YahooShopInsert = Database["public"]["Tables"]["yahoo_shops"]["Insert"]

export default function YahooManagementPage() {
  const [shops, setShops] = useState<YahooShop[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<YahooShop | null>(null)

  // フォーム状態
  const [formData, setFormData] = useState<YahooShopInsert>({
    shop_id: "",
    display_name: "",
    parent_category: null,
    store_id: "",
    category_id: "",
    brand_id: "",
    default_keyword: "",
    is_active: true
  })

  // ショップ一覧を読み込み
  const loadShops = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("yahoo_shops")
      .select("*")
      .order("parent_category", { nullsFirst: false })
      .order("display_name")

    if (!error && data) {
      setShops(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadShops()
  }, [])

  // フォームを開く
  const openForm = (shop?: YahooShop) => {
    if (shop) {
      setEditingShop(shop)
      setFormData({
        shop_id: shop.shop_id,
        display_name: shop.display_name,
        parent_category: shop.parent_category,
        store_id: shop.store_id || "",
        category_id: shop.category_id || "",
        brand_id: shop.brand_id || "",
        default_keyword: shop.default_keyword || "",
        is_active: shop.is_active
      })
    } else {
      setEditingShop(null)
      setFormData({
        shop_id: "",
        display_name: "",
        parent_category: null,
        store_id: "",
        category_id: "",
        brand_id: "",
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

    setSaving(true)

    try {
      if (editingShop) {
        // 更新
        const updateData = {
          shop_id: formData.shop_id,
          display_name: formData.display_name,
          parent_category: formData.parent_category || null,
          store_id: formData.store_id || null,
          category_id: formData.category_id || null,
          brand_id: formData.brand_id || null,
          default_keyword: formData.default_keyword || null,
          is_active: formData.is_active ?? true
        }

        const { error } = await supabase
          .from("yahoo_shops")
          .update(updateData as never)
          .eq("id", editingShop.id)

        if (error) {
          toast.error(`更新に失敗しました: ${error.message}`)
          return
        }

        toast.success("ショップ情報を更新しました")
      } else {
        // 新規作成
        const { error: insertError } = await supabase
          .from("yahoo_shops")
          .insert(formData as never)

        if (insertError) {
          toast.error(`作成に失敗しました: ${insertError.message}`)
          return
        }

        toast.success("ショップを作成しました")
      }

      closeForm()
      loadShops()

      // サイドバー更新イベントを発行
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("yahoo:shop:updated"))
      }
    } finally {
      setSaving(false)
    }
  }

  // 削除処理
  const handleDelete = async (shop: YahooShop) => {
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
        .from("yahoo_shops")
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
        window.dispatchEvent(new CustomEvent("yahoo:shop:updated"))
      }
    } catch (error) {
      toast.error(`削除処理中にエラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`)
    }
  }

  // 親カテゴリのラベル取得
  const getParentCategoryLabel = (parentCategory: string | null) => {
    if (!parentCategory) return "直販"
    if (parentCategory === "lohaco") return "LOHACO"
    if (parentCategory === "zozotown") return "ZOZOTOWN"
    return parentCategory
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Yahooショップ管理</h1>
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
            Yahoo!ショッピングのショップ（ブランド）を登録・管理します
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
                      親カテゴリ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      ショップID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      ストアID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      カテゴリID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                      ブランドID
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
                        <div className="text-sm text-gray-500">{getParentCategoryLabel(shop.parent_category)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{shop.shop_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{shop.store_id || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{shop.category_id || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{shop.brand_id || "-"}</div>
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
                      placeholder="例: DHC"
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
                      placeholder="例: dhc, vt"
                      disabled={!!editingShop}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      URLパスに使用される一意の識別子（半角英数字推奨）
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="parent_category">親カテゴリ</Label>
                    <select
                      id="parent_category"
                      value={formData.parent_category || ""}
                      onChange={(e) => setFormData({ ...formData, parent_category: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">直販</option>
                      <option value="lohaco">LOHACO</option>
                      <option value="zozotown">ZOZOTOWN</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      このショップが属する親カテゴリ
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="store_id">ストアID（任意）</Label>
                    <Input
                      id="store_id"
                      value={formData.store_id || ""}
                      onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                      placeholder="Yahoo API用のストアID"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category_id">カテゴリID（任意）</Label>
                    <Input
                      id="category_id"
                      value={formData.category_id || ""}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      placeholder="Yahoo API用のカテゴリID"
                    />
                  </div>

                  {/* ZOZOTOWNの場合のみブランドID入力欄を表示 */}
                  {formData.parent_category === "zozotown" && (
                    <div>
                      <Label htmlFor="brand_id">ブランドID（ZOZOTOWN必須）</Label>
                      <Input
                        id="brand_id"
                        value={formData.brand_id || ""}
                        onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                        placeholder="例: 58655"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ZOZOTOWNのブランドID（商品検索時に使用）
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="default_keyword">keyword（任意）</Label>
                    <Input
                      id="default_keyword"
                      value={formData.default_keyword || ""}
                      onChange={(e) => setFormData({ ...formData, default_keyword: e.target.value })}
                      placeholder="例: DHC"
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
