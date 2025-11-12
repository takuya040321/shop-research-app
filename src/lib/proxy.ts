/**
 * 共通プロキシ設定ライブラリ
 * USE_PROXY環境変数による完全制御を提供
 */

export interface ProxyConfig {
  host: string
  port: number
  username?: string
  password?: string
}

export interface ProxySettings {
  enabled: boolean
  config?: ProxyConfig
}

/**
 * 環境変数からプロキシ設定を取得
 */
function getProxyConfigFromEnv(): ProxyConfig | null {
  const host = process.env.PROXY_HOST
  const port = process.env.PROXY_PORT
  const username = process.env.PROXY_USERNAME
  const password = process.env.PROXY_PASSWORD

  if (!host || !port) {
    return null
  }

  // PROXY_HOSTからプロトコル部分を削除（http://やhttps://が含まれている場合）
  const cleanHost = host.replace(/^https?:\/\//, "")

  const config: ProxyConfig = {
    host: cleanHost,
    port: parseInt(port, 10),
  }

  if (username) {
    config.username = username
  }

  if (password) {
    config.password = password
  }

  return config
}

/**
 * プロキシ設定の事前判定（必須）
 * データベース処理・スクレイピング処理開始前に必ず実行する
 */
export function determineProxySettings(): ProxySettings {
  // USE_PROXY環境変数による完全制御
  const useProxy = process.env.USE_PROXY === "true"

  if (!useProxy) {
    return { enabled: false }
  }

  const config = getProxyConfigFromEnv()

  if (!config) {
    console.warn("USE_PROXY=trueですが、プロキシ設定が不完全です。プロキシを無効にします。")
    return { enabled: false }
  }

  return {
    enabled: true,
    config,
  }
}

/**
 * プロキシURLを生成
 */
export function generateProxyUrl(config: ProxyConfig): string {
  const auth = config.username && config.password
    ? `${config.username}:${config.password}@`
    : ""

  return `http://${auth}${config.host}:${config.port}`
}

/**
 * プロキシ設定の検証
 */
export function validateProxyConfig(config: ProxyConfig): boolean {
  if (!config.host || !config.port) {
    return false
  }

  if (config.port < 1 || config.port > 65535) {
    return false
  }

  return true
}

/**
 * プロキシログ出力
 */
export function logProxyStatus(settings: ProxySettings): void {
  if (settings.enabled && settings.config) {
    console.log("[プロキシ設定] プロキシを使用します")
    console.log(`  ホスト: ${settings.config.host}`)
    console.log(`  ポート: ${settings.config.port}`)
    console.log(`  認証: ${settings.config.username ? `あり (ユーザー: ${settings.config.username})` : "なし"}`)
  } else {
    console.log("[プロキシ設定] プロキシを使用しません")
  }
}