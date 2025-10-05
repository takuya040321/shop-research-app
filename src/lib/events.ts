/**
 * カスタムイベント定義
 * コンポーネント間でイベントを送信するためのヘルパー関数
 */

export const RAKUTEN_SHOP_UPDATED = "rakuten:shop:updated"

/**
 * 楽天ショップ更新イベントを発行
 */
export function emitRakutenShopUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RAKUTEN_SHOP_UPDATED))
  }
}

/**
 * 楽天ショップ更新イベントをリッスン
 */
export function onRakutenShopUpdated(callback: () => void) {
  if (typeof window !== "undefined") {
    window.addEventListener(RAKUTEN_SHOP_UPDATED, callback)
    return () => window.removeEventListener(RAKUTEN_SHOP_UPDATED, callback)
  }
  return () => {}
}
