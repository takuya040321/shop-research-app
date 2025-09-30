/**
 * 重複商品削除API
 */

import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// POST /api/products/cleanup-duplicates
export async function POST(request: NextRequest) {
  try {
    const { userId, shopName } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ユーザーIDが必要です" },
        { status: 400 }
      )
    }

    console.log(`重複商品のクリーンアップを開始: ${shopName || "全ショップ"}`)


    // 正確な重複検出（shop_type + shop_name + name + ASIN考慮）
    const { data: productsWithAsins } = await supabase
      .from("products")
      .select(`
        id,
        name,
        shop_type,
        shop_name,
        created_at,
        product_asins!left (
          asin_id,
          asins!inner (
            asin
          )
        )
      `)
      .eq("user_id", userId)
      .neq("memo", "コピー商品")
      .order("created_at")

    if (shopName) {
      // 特定ショップの場合はフィルタリング
      const filteredProducts = productsWithAsins?.filter(p => p.shop_name === shopName)
      productsWithAsins.splice(0, productsWithAsins.length, ...filteredProducts || [])
    }

    // 重複グループを検出（正確なキーで）
    const duplicateGroups = new Map<string, any[]>()

    for (const product of productsWithAsins || []) {
      // ASINが関連付けられているかチェック
      const hasAsin = product.product_asins && product.product_asins.length > 0
      let key: string

      if (hasAsin) {
        // ASINありの場合：shop_type + shop_name + name + asin
        const asin = product.product_asins[0]?.asins?.asin
        key = `${product.shop_type}-${product.shop_name}-${product.name}-${asin}`
      } else {
        // ASINなしの場合：shop_type + shop_name + name + null
        key = `${product.shop_type}-${product.shop_name}-${product.name}-null`
      }

      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, [])
      }
      duplicateGroups.get(key)!.push(product)
    }

    let deletedCount = 0
    const errors: string[] = []

    // 各重複グループから最古のもの以外を削除
    for (const [key, products] of duplicateGroups) {
      if (products.length > 1) {
        // 最古のもの以外を削除対象とする
        const idsToDelete = products.slice(1).map(p => p.id)

        try {
          const { error: deleteError } = await supabase
            .from("products")
            .delete()
            .in("id", idsToDelete)

          if (deleteError) {
            errors.push(`商品「${products[0].name}」の重複削除でエラー: ${deleteError.message}`)
          } else {
            deletedCount += idsToDelete.length
            console.log(`商品「${products[0].name}」の重複 ${idsToDelete.length}件を削除`)
          }
        } catch (error) {
          errors.push(`商品「${products[0].name}」の処理でエラー: ${error instanceof Error ? error.message : String(error)}`)
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
      userId: "ユーザーID（必須）",
      shopName: "ショップ名（任意、指定しない場合は全ショップ対象）"
    }
  })
}