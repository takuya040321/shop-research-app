/**
 * 商品コピー API
 */

import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { randomUUID } from "crypto"

// POST /api/products/copy
export async function POST(request: NextRequest) {
  try {
    const { productId, userId } = await request.json()

    if (!productId || !userId) {
      return NextResponse.json(
        { success: false, message: "商品IDとユーザーIDが必要です" },
        { status: 400 }
      )
    }

    // 元商品の取得
    const { data: originalProduct, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("user_id", userId)
      .single()

    if (fetchError || !originalProduct) {
      return NextResponse.json(
        { success: false, message: "商品が見つかりません" },
        { status: 404 }
      )
    }

    // 新しい商品IDを生成
    const newProductId = randomUUID()

    // 商品データをコピー（元商品を参照として設定、ASIN情報はクリア）
    const copiedProduct = {
      id: newProductId,
      user_id: userId,
      shop_category_id: originalProduct.shop_category_id,
      shop_type: originalProduct.shop_type,
      shop_name: originalProduct.shop_name,
      name: originalProduct.name,
      price: originalProduct.price,
      sale_price: originalProduct.sale_price,
      image_url: originalProduct.image_url,
      source_url: originalProduct.source_url,
      is_hidden: originalProduct.is_hidden,
      memo: originalProduct.memo ? `${originalProduct.memo} (コピー)` : "コピー商品",
      original_product_id: productId, // 元商品への参照
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 新しい商品を挿入
    const { data: newProduct, error: insertError } = await supabase
      .from("products")
      .insert(copiedProduct)
      .select()
      .single()

    if (insertError) {
      console.error("商品コピーエラー:", insertError)
      return NextResponse.json(
        { success: false, message: "商品のコピーに失敗しました" },
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
      productId: "コピー元商品ID",
      userId: "ユーザーID"
    }
  })
}