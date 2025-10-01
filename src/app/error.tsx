"use client"

/**
 * グローバルエラーバウンダリ
 * アプリケーション全体の予期しないエラーをキャッチ
 */

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをコンソールに出力
    console.error("アプリケーションエラー:", error)

    // エラーログをローカルストレージに保存
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        digest: error.digest,
      }

      const logs = JSON.parse(localStorage.getItem("error_logs") || "[]")
      logs.push(errorLog)

      // 最新100件のみ保持
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }

      localStorage.setItem("error_logs", JSON.stringify(logs))
    } catch (e) {
      console.error("エラーログ保存失敗:", e)
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">エラーが発生しました</h1>
          <p className="text-muted-foreground">
            予期しないエラーが発生しました。ページを再読み込みしてください。
          </p>
        </div>

        <div className="rounded-lg border bg-muted p-4 text-left">
          <p className="text-sm font-mono text-muted-foreground break-all">
            {error.message}
          </p>
        </div>

        <div className="space-y-2">
          <Button onClick={reset} className="w-full">
            ページを再読み込み
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/")}
          >
            ホームに戻る
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          問題が解決しない場合は、ブラウザのコンソールを確認してください。
        </p>
      </div>
    </div>
  )
}
