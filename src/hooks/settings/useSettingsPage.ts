/**
 * 設定ページ用カスタムフック
 * 設定の読み込み、保存、リセット機能を提供
 */

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { loadSettings, saveSettings, resetSettings } from "@/lib/settings"
import { GlobalSettings, DEFAULT_SETTINGS } from "@/types/settings"

export function useSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  // 設定読み込み
  useEffect(() => {
    const loaded = loadSettings()
    setSettings(loaded)
    setLoading(false)
  }, [])

  // 設定保存
  const handleSave = () => {
    const success = saveSettings(settings)
    if (success) {
      toast.success("設定を保存しました")
    } else {
      toast.error("設定の保存に失敗しました")
    }
  }

  // 設定リセット
  const handleReset = () => {
    if (confirm("設定をデフォルトに戻しますか？")) {
      resetSettings()
      setSettings(DEFAULT_SETTINGS)
      toast.success("設定をリセットしました")
    }
  }

  return {
    // State
    settings,
    loading,
    setSettings,

    // Actions
    handleSave,
    handleReset
  }
}
