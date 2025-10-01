/**
 * エラーログ管理ユーティリティ
 */

export interface ErrorLog {
  id: string
  timestamp: string
  type: "error" | "warning" | "info"
  category: string
  message: string
  details?: string | undefined
  stack?: string | undefined
}

const ERROR_LOG_KEY = "error_logs"
const MAX_LOGS = 100

/**
 * エラーログを記録
 */
export function logError(
  category: string,
  message: string,
  details?: string,
  error?: Error
): void {
  try {
    const log: ErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: "error",
      category,
      message,
      details,
      stack: error?.stack,
    }

    const logs = getErrorLogs()
    logs.push(log)

    // 最新MAX_LOGS件のみ保持
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS)
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs))
    }

    // コンソールにも出力
    console.error(`[${category}] ${message}`, details, error)
  } catch (e) {
    console.error("エラーログ保存失敗:", e)
  }
}

/**
 * 警告ログを記録
 */
export function logWarning(category: string, message: string, details?: string): void {
  try {
    const log: ErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: "warning",
      category,
      message,
      details,
    }

    const logs = getErrorLogs()
    logs.push(log)

    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS)
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs))
    }

    console.warn(`[${category}] ${message}`, details)
  } catch (e) {
    console.error("警告ログ保存失敗:", e)
  }
}

/**
 * 情報ログを記録
 */
export function logInfo(category: string, message: string, details?: string): void {
  try {
    const log: ErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: "info",
      category,
      message,
      details,
    }

    const logs = getErrorLogs()
    logs.push(log)

    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS)
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs))
    }

    console.info(`[${category}] ${message}`, details)
  } catch (e) {
    console.error("情報ログ保存失敗:", e)
  }
}

/**
 * エラーログ一覧を取得
 */
export function getErrorLogs(): ErrorLog[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const logs = localStorage.getItem(ERROR_LOG_KEY)
    if (!logs) return []

    return JSON.parse(logs) as ErrorLog[]
  } catch (e) {
    console.error("エラーログ読み込み失敗:", e)
    return []
  }
}

/**
 * エラーログをクリア
 */
export function clearErrorLogs(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ERROR_LOG_KEY)
  }
}

/**
 * カテゴリ別にエラーログを取得
 */
export function getErrorLogsByCategory(category: string): ErrorLog[] {
  return getErrorLogs().filter((log) => log.category === category)
}

/**
 * 型別にエラーログを取得
 */
export function getErrorLogsByType(type: ErrorLog["type"]): ErrorLog[] {
  return getErrorLogs().filter((log) => log.type === type)
}

/**
 * 期間を指定してエラーログを取得
 */
export function getErrorLogsByDateRange(startDate: Date, endDate: Date): ErrorLog[] {
  return getErrorLogs().filter((log) => {
    const logDate = new Date(log.timestamp)
    return logDate >= startDate && logDate <= endDate
  })
}

/**
 * エラーメッセージを分かりやすく変換
 */
export function formatErrorMessage(error: Error | string): string {
  const message = typeof error === "string" ? error : error.message

  // よくあるエラーを分かりやすく変換
  const errorMap: Record<string, string> = {
    "Failed to fetch": "ネットワークエラーが発生しました。インターネット接続を確認してください。",
    "Network request failed": "ネットワークリクエストに失敗しました。接続を確認してください。",
    "Timeout": "リクエストがタイムアウトしました。もう一度お試しください。",
    "PGRST116": "データが見つかりませんでした。",
    "PGRST": "データベースエラーが発生しました。",
  }

  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value
    }
  }

  return message
}
