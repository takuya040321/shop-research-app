/**
 * Supabaseクライアント設定（クライアントサイド用）
 */

import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"

/**
 * Supabaseクライアントの初期化（クライアントサイド用）
 * プロキシ設定はサーバーサイド専用のため、このファイルでは使用しない
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

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    }
  })

  return client
}

// クライアント作成
export const supabase = createSupabaseClient()

// 型安全なヘルパー関数
export const getSupabaseClient = () => supabase