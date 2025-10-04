/**
 * 商品重複削除 API
 */

import { NextResponse } from "next/server"
import { removeDuplicateProducts } from "@/lib/deduplication"

// POST /api/products/deduplicate
export async function POST() {
  try {
    const result = await removeDuplicateProducts()
    return NextResponse.json(result)
  } catch (error) {
    console.error("重複削除エラー:", error)
    return NextResponse.json(
      { error: "重複削除処理に失敗しました" },
      { status: 500 }
    )
  }
}

// GET /api/products/deduplicate - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "商品重複削除 APIは正常に動作しています",
    endpoint: "/api/products/deduplicate",
    methods: ["POST"],
    description: "データベース内の重複商品を検出して削除します（最新のものを残す）"
  })
}