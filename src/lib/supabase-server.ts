/**
 * サーバーサイド専用Supabaseクライアント
 * プロキシ対応とサービスロールキー認証を実装
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { HttpsProxyAgent } from "https-proxy-agent"
import { Database } from "@/types/database"
import { determineProxySettings, generateProxyUrl } from "@/lib/proxy"

// グローバルなクライアントインスタンス（遅延初期化）
let supabaseServerInstance: SupabaseClient<Database> | null = null

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
function createServerSupabaseClient(): SupabaseClient<Database> {
  // 1. 環境変数の取得と検証
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URLが設定されていません")
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEYが設定されていません")
  }

  // 2. プロキシ設定の判定
  const proxySettings = determineProxySettings()

  // 3. fetch関数の準備
  let customFetch: typeof fetch

  if (proxySettings.enabled && proxySettings.config) {
    // プロキシ有効: https-proxy-agentでfetchをラップ
    const proxyUrl = generateProxyUrl(proxySettings.config)
    const agent = new HttpsProxyAgent(proxyUrl)

    customFetch = (url: RequestInfo | URL, init?: RequestInit) => {
      return fetch(url, {
        ...init,
        // @ts-expect-error - agent属性はNode.js環境でのみ有効
        agent,
      })
    }
  } else {
    // プロキシ無効: 通常のfetch
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

  return client
}

/**
 * サーバーサイドSupabaseクライアントを取得（遅延初期化）
 * ビルド時のエラーを防ぐため、クライアントは初回アクセス時に初期化されます
 *
 * 使用例:
 * ```typescript
 * import { supabaseServer } from "@/lib/supabase-server"
 *
 * const { data, error } = await supabaseServer.from("products").select("*")
 * ```
 */
export const supabaseServer = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    // クライアントがまだ初期化されていない場合は初期化
    if (!supabaseServerInstance) {
      supabaseServerInstance = createServerSupabaseClient()
    }
    return supabaseServerInstance[prop as keyof SupabaseClient<Database>]
  }
})

/**
 * サーバーサイドSupabaseクライアントを取得
 * @deprecated supabaseServerを直接使用してください
 */
export const getServerSupabaseClient = () => supabaseServer
