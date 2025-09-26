/**
 * データベースヘルパー関数
 * 共通的なデータベース操作とエラーハンドリング
 */

import { supabase } from "./supabase"

// エラーハンドリング用ヘルパー
export interface DatabaseResult<T> {
  data: T | null
  error: string | null
}

/**
 * Supabaseエラーを統一フォーマットに変換
 */
export function handleDatabaseError<T>(
  data: T | null,
  error: unknown
): DatabaseResult<T> {
  if (error) {
    console.error("Database error:", error)
    return {
      data: null,
      error: error instanceof Error ? error.message : "データベースエラーが発生しました",
    }
  }

  return {
    data,
    error: null,
  }
}

/**
 * ユーザー認証状態の確認
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error("Auth error:", error)
    return null
  }

  return user
}

/**
 * 基本的なデータベース操作ヘルパー
 * Supabaseクライアントのラッパー関数
 */

// 現在の実装は型エラーを回避するため、実際の使用時に個別に実装
// 以下は基本的な使用パターンの例：

/*
// 商品取得例
export async function getProducts(filters?: { search?: string }) {
  const user = await getCurrentUser()
  if (!user) return { data: null, error: "認証が必要です" }

  let query = supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_hidden", false)

  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`)
  }

  const { data, error } = await query
  return handleDatabaseError(data, error)
}

// ASIN取得例
export async function getAsins() {
  const user = await getCurrentUser()
  if (!user) return { data: null, error: "認証が必要です" }

  const { data, error } = await supabase
    .from("asins")
    .select("*")
    .eq("user_id", user.id)

  return handleDatabaseError(data, error)
}
*/