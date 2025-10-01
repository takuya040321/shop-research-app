/**
 * ブランド設定
 */

export interface BrandConfig {
  id: string
  name: string
  displayName: string
  shopName: string
  color: string
  borderColor: string
  description: string
  hasScrapingAPI: boolean
}

export const BRAND_CONFIGS: Record<string, BrandConfig> = {
  vt: {
    id: "vt",
    name: "vt",
    displayName: "VT Cosmetics",
    shopName: "VT Cosmetics",
    color: "text-blue-600",
    borderColor: "border-blue-200",
    description: "VT Cosmetics公式サイトから取得した商品の管理・編集",
    hasScrapingAPI: true
  },
  dhc: {
    id: "dhc",
    name: "dhc",
    displayName: "DHC",
    shopName: "DHC",
    color: "text-orange-600",
    borderColor: "border-orange-200",
    description: "DHC公式サイトから取得した商品の管理・編集",
    hasScrapingAPI: true
  },
  innisfree: {
    id: "innisfree",
    name: "innisfree",
    displayName: "innisfree",
    shopName: "innisfree",
    color: "text-green-600",
    borderColor: "border-green-200",
    description: "innisfree公式サイトから取得した商品の管理・編集",
    hasScrapingAPI: true
  }
}

/**
 * ブランド設定を取得
 */
export function getBrandConfig(brandId: string): BrandConfig | null {
  return BRAND_CONFIGS[brandId] || null
}

/**
 * すべてのブランドIDを取得
 */
export function getAllBrandIds(): string[] {
  return Object.keys(BRAND_CONFIGS)
}

/**
 * ブランドが存在するかチェック
 */
export function isValidBrand(brandId: string): boolean {
  return brandId in BRAND_CONFIGS
}