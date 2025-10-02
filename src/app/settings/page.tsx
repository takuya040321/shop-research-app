"use client"

/**
 * 設定ページ
 */

import { Sidebar } from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { useSettingsPage } from "@/hooks/settings/useSettingsPage"

export default function SettingsPage() {
  // カスタムフックから全てのロジックを取得
  const {
    settings,
    loading,
    setSettings,
    handleSave,
    handleReset
  } = useSettingsPage()

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <p>読み込み中...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">設定</h1>
            <p className="text-muted-foreground mt-2">
              システム全体の設定を管理します
            </p>
          </div>

          {/* 表示設定 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">表示設定</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>テーマ</Label>
                <Select
                  value={settings.display.theme}
                  onValueChange={(value: "light" | "dark" | "system") => {
                    setSettings({
                      ...settings,
                      display: {
                        ...settings.display,
                        theme: value
                      }
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">ライト</SelectItem>
                    <SelectItem value="dark">ダーク</SelectItem>
                    <SelectItem value="system">システム設定に従う</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* ソート設定 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">ソート設定</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>デフォルトソート列</Label>
                <Select
                  value={settings.sort.defaultSortColumn}
                  onValueChange={(value) => {
                    setSettings({
                      ...settings,
                      sort: {
                        ...settings.sort,
                        defaultSortColumn: value
                      }
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">商品名</SelectItem>
                    <SelectItem value="price">価格</SelectItem>
                    <SelectItem value="purchase_price">仕入価格</SelectItem>
                    <SelectItem value="amazon_price">Amazon価格</SelectItem>
                    <SelectItem value="monthly_sales">月販数</SelectItem>
                    <SelectItem value="profit_amount">利益額</SelectItem>
                    <SelectItem value="profit_rate">利益率</SelectItem>
                    <SelectItem value="roi">ROI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>デフォルトソート方向</Label>
                <Select
                  value={settings.sort.defaultSortDirection}
                  onValueChange={(value: "asc" | "desc") => {
                    setSettings({
                      ...settings,
                      sort: {
                        ...settings.sort,
                        defaultSortDirection: value
                      }
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">昇順</SelectItem>
                    <SelectItem value="desc">降順</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* システム設定 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">システム設定</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>通知を有効にする</Label>
                  <p className="text-sm text-muted-foreground">
                    操作完了時に通知を表示します
                  </p>
                </div>
                <Switch
                  checked={settings.system.enableNotifications}
                  onCheckedChange={(checked) => {
                    setSettings({
                      ...settings,
                      system: {
                        ...settings.system,
                        enableNotifications: checked
                      }
                    })
                  }}
                />
              </div>
            </div>
          </Card>

          {/* 保存・リセットボタン */}
          <div className="flex gap-4">
            <Button onClick={handleSave} className="flex-1">
              設定を保存
            </Button>
            <Button onClick={handleReset} variant="outline">
              デフォルトに戻す
            </Button>
          </div>

          {/* 最終更新日時 */}
          <p className="text-sm text-muted-foreground text-center">
            最終更新: {new Date(settings.lastUpdated).toLocaleString("ja-JP")}
          </p>
        </div>
      </main>
    </div>
  )
}
