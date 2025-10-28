import { useEffect, useRef } from "react"
import { toast } from "sonner"
import type { ExtendedProduct } from "@/lib/products"
import { updateProduct } from "@/lib/products"

interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  separator?: boolean
  onClick: () => void
}

/**
 * ProductTableのUI関連ロジックを管理するカスタムフック
 */
export function useProductTableUI(
  updateProductInState: (id: string, updates: Partial<ExtendedProduct>) => void,
  handleCopyProduct: (product: ExtendedProduct) => void,
  handleDeleteProduct: (product: ExtendedProduct) => void
) {
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

    container.addEventListener("wheel", handleWheel, { passive: false })
    return () => {
      container.removeEventListener("wheel", handleWheel)
    }
  }, [])

  // 右クリックメニューの項目（アイコンは呼び出し側で提供）
  const getContextMenuItems = (
    product: ExtendedProduct,
    copyIcon: React.ReactNode,
    trashIcon: React.ReactNode
  ): ContextMenuItem[] => {
    return [
      {
        label: "商品をコピー",
        icon: copyIcon,
        onClick: () => handleCopyProduct(product)
      },
      {
        separator: true,
        label: "",
        onClick: () => {}
      },
      {
        label: "商品を削除",
        icon: trashIcon,
        onClick: () => handleDeleteProduct(product)
      }
    ]
  }

  return {
    scrollContainerRef,
    handleToggleFavorite,
    getContextMenuItems
  }
}
