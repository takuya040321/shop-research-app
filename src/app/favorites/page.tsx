"use client"

/**
 * お気に入り商品ページ
 */

import { ProductTable } from "@/components/products/ProductTable"

export default function FavoritesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">お気に入り商品</h1>
        <p className="mt-2 text-gray-600">
          お気に入りに登録した商品を一覧表示します
        </p>
      </div>

      <ProductTable initialFavoriteFilter="favorite_only" />
    </div>
  )
}
