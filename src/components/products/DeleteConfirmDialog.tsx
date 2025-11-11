/**
 * 商品削除確認ダイアログ
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/Button"
import type { ExtendedProduct } from "@/lib/products"

interface DeleteConfirmDialogProps {
  product: ExtendedProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">商品を削除しますか？</DialogTitle>
          <DialogDescription className="text-gray-600">
            この操作は取り消せません。本当に削除しますか？
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-900">商品名:</span>
              <p className="text-gray-700 mt-1">{product.name}</p>
            </div>
            {product.asin && (
              <div className="text-sm">
                <span className="font-medium text-gray-900">ASIN:</span>
                <p className="text-gray-700 mt-1">{product.asin.asin}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300"
          >
            キャンセル
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            削除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
