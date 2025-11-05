"use client"

/**
 * 商品テーブルコンポーネント
 * 商品情報とASIN情報を結合して表示し、インライン編集機能を提供
 */

import { useState, useEffect } from "react"
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
import { loadSettings, updateDisplaySettings } from "@/lib/settings"
import { COLUMN_DEFINITIONS, type ColumnDefinition } from "@/lib/columnDefinitions"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"

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
  const [orderedColumns, setOrderedColumns] = useState<ColumnDefinition[]>([])

  // 列の順序を読み込む
  useEffect(() => {
    const settings = loadSettings()
    const columnOrder = settings.display.columnOrder || []

    // 保存された順序で列を並べ替え
    const ordered = columnOrder
      .map((colId) => COLUMN_DEFINITIONS.find((col) => col.id === colId))
      .filter((col): col is ColumnDefinition => col !== undefined)

    // 新しく追加された列があれば末尾に追加
    const existingIds = new Set(columnOrder)
    const newColumns = COLUMN_DEFINITIONS.filter((col) => !existingIds.has(col.id))

    setOrderedColumns([...ordered, ...newColumns])
  }, [])

  // DnDセンサーの設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ドラッグ終了時の処理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = orderedColumns.findIndex((col) => col.id === active.id)
    const newIndex = orderedColumns.findIndex((col) => col.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // 配列を並べ替え
    const newOrder = [...orderedColumns]
    const [movedColumn] = newOrder.splice(oldIndex, 1)
    if (!movedColumn) {
      return
    }
    newOrder.splice(newIndex, 0, movedColumn)

    setOrderedColumns(newOrder)

    // ローカルストレージに保存
    const newColumnOrder = newOrder.map((col) => col.id)
    updateDisplaySettings({ columnOrder: newColumnOrder })
  }

  // 表示する列のIDリストを取得
  const settings = loadSettings()
  const visibleColumns = settings.display.visibleColumns
  const visibleColumnIds = orderedColumns
    .filter((col) => visibleColumns[col.id] !== false)
    .map((col) => col.id)

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
    startEditing,
    cancelEditing,
    saveEdit,
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <SortableContext
                  items={visibleColumnIds}
                  strategy={horizontalListSortingStrategy}
                >
                  <ProductTableHeader orderedColumns={orderedColumns} />
                </SortableContext>

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
                      orderedColumns={orderedColumns}
                    />
                  ))}
                </TableBody>
              </Table>
            </DndContext>
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