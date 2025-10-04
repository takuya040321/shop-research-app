/**
 * ダッシュボード用カスタムフック
 * サマリーデータとショップ統計の取得を提供
 */

import { useQuery } from "@tanstack/react-query"
import { getDashboardSummary, getShopStats } from "@/lib/dashboard"

export function useDashboard() {
  // ダッシュボードサマリーデータ取得
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => getDashboardSummary(),
  })

  // ショップ統計データ取得
  const { data: shopStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ["shopStats"],
    queryFn: () => getShopStats(),
  })

  const loading = summaryLoading || statsLoading

  return {
    // State
    summary,
    shopStats,
    loading
  }
}
