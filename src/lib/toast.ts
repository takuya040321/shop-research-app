/**
 * Toast通知ユーティリティ
 * 設定に基づいてtoast通知を制御
 */

import { toast as sonnerToast } from "sonner"
import { loadSettings } from "./settings"

/**
 * 成功通知
 */
export function showSuccess(message: string, description?: string) {
  const settings = loadSettings()
  if (!settings.system.enableNotifications) {
    return
  }

  sonnerToast.success(message, description ? { description } : undefined)
}

/**
 * エラー通知
 */
export function showError(message: string, description?: string) {
  const settings = loadSettings()
  if (!settings.system.enableNotifications) {
    return
  }

  sonnerToast.error(message, description ? { description } : undefined)
}

/**
 * 情報通知
 */
export function showInfo(message: string, description?: string) {
  const settings = loadSettings()
  if (!settings.system.enableNotifications) {
    return
  }

  sonnerToast.info(message, description ? { description } : undefined)
}

/**
 * 警告通知
 */
export function showWarning(message: string, description?: string) {
  const settings = loadSettings()
  if (!settings.system.enableNotifications) {
    return
  }

  sonnerToast.warning(message, description ? { description } : undefined)
}
