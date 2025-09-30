"use client"

/**
 * ASIN管理ページ
 * ASINの一覧表示、編集、一括アップロード機能を提供
 */

import { Sidebar } from "@/components/layout/sidebar"
import { AsinBulkUpload } from "@/components/asins/asin-bulk-upload"

export default function AsinsPage() {
  // 仮のユーザーID（実際は認証から取得）
  const userId = "test-user-id"

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">ASIN管理</h1>
              <p className="text-muted-foreground mt-2">
                ASINの登録、編集、一括アップロードを行います
              </p>
            </div>
          </div>

          {/* ASIN一括アップロード */}
          <AsinBulkUpload userId={userId} />

          {/* TODO: ASINテーブル実装 */}
          <div className="bg-card rounded-lg border p-6">
            <p className="text-muted-foreground">
              ASINテーブルは今後実装予定です
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
