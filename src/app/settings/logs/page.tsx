"use client"

/**
 * エラーログ表示ページ
 */

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, AlertTriangle, Info, Trash2 } from "lucide-react"
import {
  getErrorLogs,
  clearErrorLogs,
  type ErrorLog,
} from "@/lib/error-logger"
import { showSuccess } from "@/lib/toast"

export default function LogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [filterType, setFilterType] = useState<"all" | ErrorLog["type"]>("all")

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = () => {
    const allLogs = getErrorLogs()
    setLogs(allLogs.reverse()) // 新しい順に表示
  }

  const filteredLogs =
    filterType === "all" ? logs : logs.filter((log) => log.type === filterType)

  const handleClear = () => {
    if (!confirm("すべてのログを削除しますか？")) {
      return
    }

    clearErrorLogs()
    setLogs([])
    showSuccess("ログをクリアしました")
  }

  const getTypeIcon = (type: ErrorLog["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getTypeLabel = (type: ErrorLog["type"]) => {
    switch (type) {
      case "error":
        return "エラー"
      case "warning":
        return "警告"
      case "info":
        return "情報"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">エラーログ</h1>
            <p className="text-muted-foreground">
              アプリケーションのエラーログを表示します
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            ログをクリア
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">フィルター:</span>
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as typeof filterType)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="error">エラーのみ</SelectItem>
                <SelectItem value="warning">警告のみ</SelectItem>
                <SelectItem value="info">情報のみ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredLogs.length} 件のログ
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              ログがありません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">種類</TableHead>
                  <TableHead className="w-[180px]">日時</TableHead>
                  <TableHead className="w-[120px]">カテゴリ</TableHead>
                  <TableHead>メッセージ</TableHead>
                  <TableHead>詳細</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(log.type)}
                        <span className="text-sm">{getTypeLabel(log.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.category}
                    </TableCell>
                    <TableCell className="text-sm">{log.message}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.details && (
                        <details className="cursor-pointer">
                          <summary className="hover:text-foreground">
                            詳細を表示
                          </summary>
                          <div className="mt-2 p-2 rounded bg-muted font-mono text-xs whitespace-pre-wrap">
                            {log.details}
                          </div>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
