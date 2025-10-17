/**
 * サーバーサイド専用Supabaseクライアント
 * プロキシ対応とサービスロールキー認証を実装
 */

import { createClient } from "@supabase/supabase-js"
import { HttpsProxyAgent } from "https-proxy-agent"
import { Database } from "@/types/database"
import { determineProxySettings, generateProxyUrl, logProxyStatus } from "@/lib/proxy"

/**
 * サーバーサイドSupabaseクライアントの初期化
 *
 * 仕様：
 * 1. 環境変数からSupabase URLとサービスロールキーを取得
 * 2. プロキシ設定を判定（USE_PROXY環境変数）
 * 3. プロキシ有効時はhttps-proxy-agentでfetchをラップ
 * 4. プロキシ無効時は通常のfetchを使用
 * 5. サービスロールキーで認証（RLS回避、管理者権限）
 */
function createServerSupabaseClient() {
  // 1. 環境変数の取得と検証
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URLが設定されていません")
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEYが設定されていません")
  }

  console.log("=== サーバーサイドSupabaseクライアント初期化 ===")
  console.log(`Supabase URL: ${supabaseUrl}`)

  // 2. プロキシ設定の判定
  const proxySettings = determineProxySettings()
  logProxyStatus(proxySettings)

  // 3. fetch関数の準備
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

  // 4. Supabaseクライアント作成
  const client = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,  // サーバーサイドでは不要
      persistSession: false,    // サーバーサイドでは不要
      detectSessionInUrl: false // サーバーサイドでは不要
    },
    global: {
      fetch: customFetch // カスタムfetchを設定
    }
  })

  console.log("サーバーサイドSupabaseクライアント初期化完了")
  console.log("==============================================")

  return client
}

// サーバーサイド専用クライアントをエクスポート
export const supabaseServer = createServerSupabaseClient()

/**
 * サーバーサイドSupabaseクライアントを取得
 *
 * 使用例:
 * ```typescript
 * import { getServerSupabaseClient } from "@/lib/supabase-server"
 *
 * const supabase = getServerSupabaseClient()
 * const { data, error } = await supabase.from("products").select("*")
 * ```
 */
export const getServerSupabaseClient = () => supabaseServer
