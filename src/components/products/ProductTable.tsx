"use client"

/**
 * 商品テーブルコンポーネント
 * 商品情報とASIN情報を結合して表示し、インライン編集機能を提供
 */

import { useState } from "react"
import { Table, TableBody } from "@/components/ui/Table"
import { Card } from "@/components/ui/Card"
import { CopyIcon, TrashIcon } from "lucide-react"
import type { ExtendedProduct } from "@/lib/products"
import { useProductTable } from "@/hooks/products/useProductTable"
import { ProductSearch } from "./ProductSearch"
import { DisplaySettingsPanel } from "./DisplaySettingsPanel"
import { ProductTableHeader } from "./ProductTableHeader"
import { ProductRow } from "./ProductRow"
import { ContextMenu, useContextMenu } from "@/components/ui/ContextMenu"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"

interface ProductTableProps {
  className?: string
  shopFilter?: string
  initialFavoriteFilter?: "all" | "favorite_only" | "non_favorite_only"
}

export function ProductTable({ className, shopFilter, initialFavoriteFilter }: ProductTableProps) {
  const [selectedProductForMenu, setSelectedProductForMenu] = useState<ExtendedProduct | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<ExtendedProduct | null>(null)
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
    getSortIcon,
    scrollContainerRef,
    handleToggleFavorite,
    handleDeleteProduct,
    getContextMenuItems,
  } = useProductTable({
    shopFilter,
    pageSize: 9999, // 全件表示するため大きな値を設定
    initialFavoriteFilter: initialFavoriteFilter || undefined,
  })

  // 右クリックハンドラー
  const onRowRightClick = (event: React.MouseEvent, product: ExtendedProduct) => {
    event.preventDefault()
    setSelectedProductForMenu(product)
    showContextMenu(event)
  }

  // 削除確認モーダルを開く
  const handleDeleteClick = (product: ExtendedProduct) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
    hideContextMenu()
  }

  // 削除を実行
  const handleConfirmDelete = async () => {
    if (productToDelete) {
      await handleDeleteProduct(productToDelete.id)
      setProductToDelete(null)
    }
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
    <>
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

        {/* テーブル */}
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
                    onContextMenu={onRowRightClick}
                    onToggleFavorite={handleToggleFavorite}
                    onStartEdit={startEditing}
                    onCancelEdit={cancelEditing}
                    onSaveEdit={saveEdit}
                    onEditingValueChange={(value) => {
                      if (editingCell) {
                        setEditingCell({ ...editingCell, value })
                      }
                    }}
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
      </div>

      {/* 右クリックコンテキストメニュー */}
      {selectedProductForMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          visible={contextMenu.visible}
          items={getContextMenuItems(
            selectedProductForMenu,
            <CopyIcon className="w-4 h-4" />,
            <TrashIcon className="w-4 h-4" />,
            handleDeleteClick
          )}
          onClose={hideContextMenu}
        />
      )}

      {/* 削除確認モーダル */}
      <DeleteConfirmDialog
        product={productToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}