/**
 * グローバル設定管理ユーティリティ
 */

import { GlobalSettings, DEFAULT_SETTINGS, validateSettings } from "@/types/settings"

const STORAGE_KEY = "shop-research-settings"

/**
 * ローカルストレージから設定を読み込み
 */
export function loadSettings(): GlobalSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_SETTINGS
    }

    const parsed = JSON.parse(stored)
    if (!validateSettings(parsed)) {
      console.warn("Invalid settings found, using defaults")
      return DEFAULT_SETTINGS
    }

    return parsed
  } catch (error) {
    console.error("Failed to load settings:", error)
    return DEFAULT_SETTINGS
  }
}

/**
 * 設定をローカルストレージに保存
 */
export function saveSettings(settings: GlobalSettings): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const updated = {
      ...settings,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return true
  } catch (error) {
    console.error("Failed to save settings:", error)
    return false
  }
}

/**
 * 設定をデフォルトにリセット
 */
export function resetSettings(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Failed to reset settings:", error)
    return false
  }
}

/**
 * 表示設定を更新
 */
export function updateDisplaySettings(
  updates: Partial<GlobalSettings["display"]>
): boolean {
  const current = loadSettings()
  const updated: GlobalSettings = {
    ...current,
    display: {
      ...current.display,
      ...updates
    }
  }
  return saveSettings(updated)
}

/**
 * ソート設定を更新
 */
export function updateSortSettings(
  updates: Partial<GlobalSettings["sort"]>
): boolean {
  const current = loadSettings()
  const updated: GlobalSettings = {
    ...current,
    sort: {
      ...current.sort,
      ...updates
    }
  }
  return saveSettings(updated)
}

/**
 * システム設定を更新
 */
export function updateSystemSettings(
  updates: Partial<GlobalSettings["system"]>
): boolean {
  const current = loadSettings()
  const updated: GlobalSettings = {
    ...current,
    system: {
      ...current.system,
      ...updates
    }
  }
  return saveSettings(updated)
}
