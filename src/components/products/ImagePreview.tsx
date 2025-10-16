/**
 * 商品画像プレビューコンポーネント
 * ホバー時に拡大表示
 */

import Image, { ImageLoader } from "next/image"

interface ImagePreviewProps {
  imageUrl: string | null
  productName: string
}

// プロキシ環境用のカスタム画像ローダー
const myLoader: ImageLoader = ({ src, width, quality }) => {
  return `${src}?w=${width}&q=${quality ?? 75}`
}

export function ImagePreview({ imageUrl, productName }: ImagePreviewProps) {
  if (!imageUrl) {
    return (
      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
        <span className="text-xs text-gray-400">画像なし</span>
      </div>
    )
  }

  return (
    <div className="relative w-16 h-16 group">
      <Image
        loader={myLoader}
        src={imageUrl}
        alt={productName}
        width={64}
        height={64}
        className="rounded object-cover"
        style={{ width: "64px", height: "64px" }}
      />
      {/* ホバー時の拡大表示 */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{ zIndex: 9999 }}
      >
        <Image
          loader={myLoader}
          src={imageUrl}
          alt={productName}
          width={384}
          height={384}
          className="rounded object-cover shadow-2xl"
          style={{ width: "384px", height: "384px" }}
        />
      </div>
    </div>
  )
}
