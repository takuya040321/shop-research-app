/**
 * 重複商品削除API
 */

import { NextRequest, NextResponse } from "next/server"
import { supabaseServer as supabase } from "@/lib/supabase-server"

type ProductWithAsins = {
  id: string
  name: string
  shop_type: string | null
  shop_name: string | null
  source_url: string | null
  created_at: string | null
  asin: string | null
}

// POST /api/products/cleanup-duplicates
export async function POST(request: NextRequest) {
  try {
    const { shopName } = await request.json()

    console.log(`重複商品のクリーンアップを開始: ${shopName || "全ショップ"}`)

    // 商品データを取得
    const { data: productsWithAsins } = await supabase
      .from("products")
      .select("id, name, shop_type, shop_name, source_url, created_at, asin")
      .neq("memo", "コピー商品")
      .order("created_at")

    let filteredProducts = productsWithAsins || []
    if (shopName) {
      // 特定ショップの場合はフィルタリング
      filteredProducts = filteredProducts.filter(p => p.shop_name === shopName)
    }

    // 重複グループを検出（正確なキーで）
    const duplicateGroups = new Map<string, ProductWithAsins[]>()

    for (const product of filteredProducts) {
      let key: string

      // products.asinから取得
      if (product.asin) {
        // ASINありの場合：shop_type + shop_name + name + asin
        key = `${product.shop_type}-${product.shop_name}-${product.name}-${product.asin}`
      } else {
        // ASINなし
        key = `${product.shop_type}-${product.shop_name}-${product.name}-null`
      }

      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, [])
      }
      const group = duplicateGroups.get(key)
      if (group) {
        group.push(product)
      }
    }

    let deletedCount = 0
    const errors: string[] = []

    // 各重複グループから最古のもの以外を削除
    for (const [, products] of duplicateGroups) {
      if (products.length > 1) {
        // 最古のもの以外を削除対象とする
        const idsToDelete = products.slice(1).map(p => p.id)

        try {
          const { error: deleteError } = await supabase
            .from("products")
            .delete()
            .in("id", idsToDelete)

          if (deleteError) {
            errors.push(`商品「${products[0]?.name || "不明"}」の重複削除でエラー: ${deleteError.message}`)
          } else {
            deletedCount += idsToDelete.length
            console.log(`商品「${products[0]?.name || "不明"}」の重複 ${idsToDelete.length}件を削除`)
          }
        } catch (error) {
          errors.push(`商品「${products[0]?.name || "不明"}」の処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
    }

    const duplicateGroupCount = Array.from(duplicateGroups.values()).filter(products => products.length > 1).length

    console.log(`重複クリーンアップ完了: ${deletedCount}件削除、${duplicateGroupCount}グループ処理`)

    return NextResponse.json({
      success: true,
      message: `重複商品のクリーンアップが完了しました`,
      data: {
        deletedCount,
        duplicateGroups: duplicateGroupCount,
        errors
      }
    })

  } catch (error) {
    console.error("重複商品削除APIエラー:", error)
    return NextResponse.json(
      {
        success: false,
        message: "内部サーバーエラーが発生しました",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// GET /api/products/cleanup-duplicates - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "重複商品削除APIは正常に動作しています",
    endpoint: "/api/products/cleanup-duplicates",
    methods: ["POST"],
    description: "重複商品を検出して古いもの以外を削除します",
    parameters: {
      shopName: "ショップ名（任意、指定しない場合は全ショップ対象）"
    }
  })
}