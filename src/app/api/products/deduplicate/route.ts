/**
 * 商品重複削除 API
 */

import { NextRequest, NextResponse } from "next/server"
import { removeDuplicateProducts } from "@/lib/deduplication"

// POST /api/products/deduplicate
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ユーザーIDが必要です" },
        { status: 400 }
      )
    }

    // 重複削除を実行
    const result = await removeDuplicateProducts(userId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${result.deletedCount}件の重複商品を削除しました`,
        deletedCount: result.deletedCount
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "重複削除中にエラーが発生しました",
          errors: result.errors
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("商品重複削除 APIエラー:", error)

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

// GET /api/products/deduplicate - API説明
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "商品重複削除 APIは正常に動作しています",
    endpoint: "/api/products/deduplicate",
    methods: ["POST"],
    description: "データベース内の重複商品を検出して削除します（最新のものを残す）",
    parameters: {
      userId: "ユーザーID"
    }
  })
}