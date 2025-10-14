/**
 * お気に入り商品専用テーブルコンポーネント
 * ProductTableをベースにお気に入り商品のみを表示
 */

import { ProductTable } from "./ProductTable"

export function FavoriteProductTable() {
  return <ProductTable shopFilter="" initialFavoriteFilter="favorite_only" className="mt-0" />
}
