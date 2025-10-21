"use client"

/**
 * 商品テーブルコンポーネント
 * 商品情報とASIN情報を結合して表示し、インライン編集機能を提供
 */

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Table, TableBody } from "@/components/ui/Table"
import { Card } from "@/components/ui/Card"
import { CopyIcon, TrashIcon } from "lucide-react"

import type { ExtendedProduct } from "@/lib/products"
import { updateProduct } from "@/lib/products"
import { ProductSearch } from "./ProductSearch"
import { DisplaySettingsPanel } from "./DisplaySettingsPanel"
import { ContextMenu, useContextMenu } from "@/components/ui/ContextMenu"
import { useProductTable } from "@/hooks/products/useProductTable"
import { ProductTableHeader } from "./ProductTableHeader"
import { ProductRow } from "./ProductRow"

interface ProductTableProps {
  className?: string
  shopFilter?: string
  initialFavoriteFilter?: "all" | "favorite_only" | "non_favorite_only"
}

export function ProductTable({ className, shopFilter, initialFavoriteFilter }: ProductTableProps) {
  const [selectedProductForMenu, setSelectedProductForMenu] = useState<ExtendedProduct | null>(null)
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu()

  // カスタムフックから全てのロジックを取得（ページネーション無しで全件表示）
  const {
    allProducts,
    totalProductsCount,
    loading,
    error,
    editingCell,
    filters,
    setFilters,
    setEditingCell,
    updateProductInState,
    handleSort,
    startEditing,
    cancelEditing,
    saveEdit,
    handleCopyProduct,
    handleDeleteProduct,
    getSortIcon,
  } = useProductTable({
    shopFilter,
    pageSize: 9999 // 全件表示するため大きな値を設定
  })

  // 初期フィルター設定
  useEffect(() => {
    if (initialFavoriteFilter) {
      setFilters(prev => ({
        ...prev,
        favoriteStatus: initialFavoriteFilter
      }))
    }
  }, [initialFavoriteFilter, setFilters])

  // 横スクロールコンテナのref
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // お気に入りトグルハンドラー
  const handleToggleFavorite = async (product: ExtendedProduct) => {
    const newFavoriteStatus = !product.is_favorite
    try {
      const success = await updateProduct(product.id, {
        is_favorite: newFavoriteStatus
      })
      if (success) {
        updateProductInState(product.id, { is_favorite: newFavoriteStatus })
        toast.success(newFavoriteStatus ? "お気に入りに追加しました" : "お気に入りを解除しました")
      } else {
        toast.error("更新に失敗しました")
      }
    } catch (err) {
      console.error("お気に入り更新エラー:", err)
      toast.error("更新中にエラーが発生しました")
    }
  }

  // Shift+ホイールで横スクロール
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault()
        container.scrollLeft += e.deltaY
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // 右クリックメニューの項目
  const getContextMenuItems = (product: ExtendedProduct) => {
    return [
      {
        label: "商品をコピー",
        icon: <CopyIcon className="w-4 h-4" />,
        onClick: () => handleCopyProduct(product)
      },
      {
        separator: true,
        label: "",
        onClick: () => {}
      },
      {
        label: "商品を削除",
        icon: <TrashIcon className="w-4 h-4" />,
        onClick: () => handleDeleteProduct(product)
      }
    ]
  }

  // 右クリックハンドラー
  const handleRowRightClick = (event: React.MouseEvent, product: ExtendedProduct) => {
    setSelectedProductForMenu(product)
    showContextMenu(event)
  }

  if (loading) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">商品データを読み込んでいます...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* 表示設定 */}
      <DisplaySettingsPanel onSettingsChange={() => window.location.reload()} />

      {/* 検索・フィルター */}
      <ProductSearch
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={allProducts.length}
        filteredCount={allProducts.length}
      />

      <Card>
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto max-h-screen"
      >
        <Table>
          <ProductTableHeader onSort={handleSort} getSortIcon={getSortIcon} />

          <TableBody>
            {allProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                editingCell={editingCell}
                onContextMenu={handleRowRightClick}
                onToggleFavorite={handleToggleFavorite}
                onStartEdit={startEditing}
                onCancelEdit={cancelEditing}
                onSaveEdit={saveEdit}
                onEditingValueChange={(value) => setEditingCell({ ...editingCell!, value })}
                onUpdateProductInState={updateProductInState}
              />
            ))}
          </TableBody>
        </Table>
      </div>

        {allProducts.length === 0 && totalProductsCount > 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>条件に一致する商品がありません</p>
            <p className="text-sm mt-1">検索条件やフィルターを変更してください</p>
          </div>
        )}

        {totalProductsCount === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>商品データがありません</p>
            <p className="text-sm mt-1">スクレイピングを実行して商品を取得してください</p>
          </div>
        )}
      </Card>

      {/* 右クリックコンテキストメニュー */}
      {selectedProductForMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          visible={contextMenu.visible}
          items={getContextMenuItems(selectedProductForMenu)}
          onClose={hideContextMenu}
        />
      )}
    </div>
  )
}