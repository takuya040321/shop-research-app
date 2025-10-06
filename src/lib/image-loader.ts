/**
 * Next.js Image Optimizationのカスタムローダー
 * プロキシ設定に対応するため、API経由で画像を取得する
 *
 * このローダーは USE_PROXY=true の場合にのみ有効化されます（next.config.tsで設定）
 */

import type { ImageLoaderProps } from "next/image"

/**
 * カスタム画像ローダー
 * プロキシ対応のため、常にAPI経由で画像を取得
 */
export default function customImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // API経由で画像を取得（プロキシ対応）
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: (quality || 75).toString(),
  })

  return `/api/image-proxy?${params.toString()}`
}
