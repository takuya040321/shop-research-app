/**
 * Supabaseクライアント設定
 */

import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"

// 環境変数の検証
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URLが設定されていません")
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEYが設定されていません")
}

// クライアント作成
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    // Supabase接続時はプロキシを使用しない（グローバルfetch設定を上書き）
    fetch: (...args) => {
      // 環境変数からプロキシ設定を一時的に除外
      const originalHttpProxy = process.env.HTTP_PROXY
      const originalHttpsProxy = process.env.HTTPS_PROXY
      
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY
      
      // fetchを実行
      const result = fetch(...args)
      
      // 環境変数を復元
      if (originalHttpProxy) process.env.HTTP_PROXY = originalHttpProxy
      if (originalHttpsProxy) process.env.HTTPS_PROXY = originalHttpsProxy
      
      return result
    }
  }
})


// 型安全なヘルパー関数
export const getSupabaseClient = () => supabase