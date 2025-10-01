"use client"

/**
 * React Query Provider
 * データキャッシュとサーバー状態管理
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5分間データを新鮮と見なす
            gcTime: 1000 * 60 * 10, // 10分間キャッシュを保持
            refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効化
            retry: (failureCount, error) => {
              // ネットワークエラーは3回までリトライ
              if (error instanceof Error && error.message.includes("fetch")) {
                return failureCount < 3
              }
              // その他のエラーは1回リトライ
              return failureCount < 1
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数バックオフ
          },
          mutations: {
            retry: false, // ミューテーションはリトライしない
          },
        },
        queryCache: undefined,
        mutationCache: undefined,
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
