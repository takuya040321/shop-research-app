/**
 * Supabaseクライアント設定（プロキシ対応版）
 */

import { createClient } from "@supabase/supabase-js"
import { HttpsProxyAgent } from "https-proxy-agent"
import { Database } from "@/types/database"
import { determineProxySettings, generateProxyUrl, logProxyStatus } from "@/lib/proxy"

/**
 * Supabaseクライアントの初期化
 * プロキシ対応（USE_PROXY環境変数で制御）
 */
function createSupabaseClient() {
  // 環境変数の検証
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URLが設定されていません")
  }

  if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEYが設定されていません")
  }

  console.log("=== Supabaseクライアント初期化（Anonキー） ===")
  console.log(`Supabase URL: ${supabaseUrl}`)

  // プロキシ設定の判定
  const proxySettings = determineProxySettings()
  logProxyStatus(proxySettings)

  // fetch関数の準備
  let customFetch: typeof fetch

  if (proxySettings.enabled && proxySettings.config) {
    // プロキシ有効: https-proxy-agentでfetchをラップ
    const proxyUrl = generateProxyUrl(proxySettings.config)
    const agent = new HttpsProxyAgent(proxyUrl)

    console.log(`プロキシエージェント作成: ${proxySettings.config.host}:${proxySettings.config.port}`)

    customFetch = (url: RequestInfo | URL, init?: RequestInit) => {
      return fetch(url, {
        ...init,
        // @ts-ignore - agent属性はNode.js環境でのみ有効
        agent,
      })
    }
  } else {
    // プロキシ無効: 通常のfetch
    console.log("通常のfetchを使用します")
    customFetch = fetch
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      fetch: customFetch
    }
  })

  console.log("Supabaseクライアント初期化完了")
  console.log("==========================================")

  return client
}

// クライアント作成
export const supabase = createSupabaseClient()

// 型安全なヘルパー関数
export const getSupabaseClient = () => supabase