/**
 * ログ表示用カスタムフック
 * エラーログの取得、フィルタリング、削除機能を提供
 */

import { useState, useEffect } from "react"
import {
  getErrorLogs,
  clearErrorLogs,
  type ErrorLog,
} from "@/lib/error-logger"
import { showSuccess } from "@/lib/toast"

export function useLogs() {
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

  return {
    // State
    logs,
    filterType,
    filteredLogs,

    // Actions
    setFilterType,
    handleClear,
    formatTimestamp
  }
}
