/**
 * 商品コピー API
 */

import { NextRequest, NextResponse } from "next/server"
import { Proxy } from "@/lib/singletons"
import { randomUUID } from "crypto"
import type { Product } from "@/types/database"

// POST /api/products/copy
export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "商品IDが必要です" },
        { status: 400 }
      )
    }

    // 元商品の取得
    const supabase = Proxy.getSupabase()
    const { data: originalProduct, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle<Product>()

    if (fetchError) {
      console.error("商品コピーエラー:", fetchError.message)
      return NextResponse.json(
        {
          success: false,
          message: `データベースエラー: ${fetchError.message}${fetchError.hint ? ` (ヒント: ${fetchError.hint})` : ""}`
        },
        { status: 500 }
      )
    }

    if (!originalProduct) {
      return NextResponse.json(
        { success: false, message: "商品が見つかりません" },
        { status: 404 }
      )
    }

    // 新しい商品IDを生成
    const newProductId = randomUUID()

    // コピー元商品がコピー商品の場合は、元の商品IDを取得
    // コピー元商品が通常商品の場合は、そのIDを使用
    const originalProductId = originalProduct.original_product_id || productId

    // 商品データをコピー（asinをクリアしてASIN紐付けを解除、source_urlは保持）
    const copiedProduct = {
      id: newProductId,
      shop_type: originalProduct.shop_type,
      shop_name: originalProduct.shop_name,
      name: originalProduct.name,
      price: originalProduct.price,
      sale_price: originalProduct.sale_price,
      image_url: originalProduct.image_url,
      source_url: originalProduct.source_url, // source_urlは保持
      asin: null, // asinをクリアしてASIN紐付けを解除
      original_product_id: originalProductId, // 常に元の商品を参照
      is_favorite: false,
      is_hidden: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 新しい商品を挿入
    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert(copiedProduct as never)
      .select()
      .single()

    if (insertError) {
      console.error("商品コピーエラー:", insertError.message)
      return NextResponse.json(
        {
          success: false,
          message: `商品のコピーに失敗しました: ${insertError.message}${insertError.hint ? ` (ヒント: ${insertError.hint})` : ""}`
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "商品を正常にコピーしました",
      data: {
        originalProductId: productId,
        copiedProductId: newProductId,
        copiedProduct: newProduct
      }
    })

  } catch (error) {
    console.error("商品コピー APIエラー:", error)

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

// GET /api/products/copy - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "商品コピー APIは正常に動作しています",
    endpoint: "/api/products/copy",
    methods: ["POST"],
    description: "商品データを複製し、ASIN情報をクリアします",
    parameters: {
      productId: "コピー元商品ID"
    }
  })
}