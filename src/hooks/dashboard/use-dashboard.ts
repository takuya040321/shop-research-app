/**
 * ダッシュボード用カスタムフック
 * サマリーデータとショップ統計の取得を提供
 */

import { useQuery } from "@tanstack/react-query"
import { getDashboardSummary, getShopStats } from "@/lib/dashboard"

interface UseDashboardOptions {
  userId: string
}

export function useDashboard({ userId }: UseDashboardOptions) {
  // ダッシュボードサマリーデータ取得
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboardSummary", userId],
    queryFn: () => getDashboardSummary(userId),
  })

  // ショップ統計データ取得
  const { data: shopStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ["shopStats", userId],
    queryFn: () => getShopStats(userId),
  })

  const loading = summaryLoading || statsLoading

  return {
    // State
    summary,
    shopStats,
    loading
  }
}
