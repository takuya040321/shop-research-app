/**
 * ダッシュボード用カスタムフック
 * サマリーデータとショップ統計の取得を提供
 */

import { useQuery } from "@tanstack/react-query"
import { getDashboardSummary, getShopStats } from "@/lib/dashboard"
import { getFavoriteProducts } from "@/lib/products"

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

  // お気に入り商品データ取得
  const { data: favoriteProducts = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["favoriteProducts"],
    queryFn: () => getFavoriteProducts(),
  })

  const loading = summaryLoading || statsLoading || favoritesLoading

  return {
    // State
    summary,
    shopStats,
    favoriteProducts,
    loading
  }
}
