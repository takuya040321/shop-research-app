/**
 * ASIN一括アップロード API
 * Excel/CSVファイルからASINデータを一括登録
 */

import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import * as XLSX from "xlsx"
import Papa from "papaparse"
import { z } from "zod"
import type { AsinInsert } from "@/types/database"

// ASINスキーマ定義
const AsinSchema = z.object({
  asin: z.string().regex(/^[A-Z0-9]{10}$/, "ASINは10文字の英数字である必要があります"),
  amazon_name: z.string().optional().nullable(),
  amazon_price: z.number().min(0).optional().nullable(),
  monthly_sales: z.number().min(0).optional().nullable(),
  fee_rate: z.number().min(0).max(100).optional().nullable(),
  fba_fee: z.number().min(0).optional().nullable(),
  jan_code: z.string().optional().nullable()
})

type AsinData = z.infer<typeof AsinSchema>

interface UploadResult {
  success: boolean
  successCount: number
  skippedCount: number
  errorCount: number
  errors: Array<{ row: number; message: string }>
}

// ファイルサイズ制限: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024
// 最大行数: 10,000行
const MAX_ROWS = 10000

/**
 * ファイルからデータを解析
 */
function parseFile(buffer: Buffer, filename: string): any[] {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    // CSV解析
    const text = buffer.toString('utf-8')
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    })
    return result.data
  } else if (ext === 'xlsx' || ext === 'xls') {
    // Excel解析
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error("Excelファイルにシートが見つかりません")
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) throw new Error("Excelワークシートが見つかりません")
    return XLSX.utils.sheet_to_json(worksheet)
  } else {
    throw new Error("サポートされていないファイル形式です。CSV, XLSX, XLSのみ対応しています。")
  }
}

/**
 * データを正規化してバリデーション
 */
function normalizeAndValidate(rawData: any[], userId: string): {
  validData: AsinInsert[]
  errors: Array<{ row: number; message: string }>
} {
  const validData: AsinInsert[] = []
  const errors: Array<{ row: number; message: string }> = []

  rawData.forEach((row, index) => {
    const rowNumber = index + 2 // ヘッダー行を考慮

    try {
      // データ正規化（商品コード: EAN列までを使用）
      const normalized: AsinData = {
        asin: String(row.ASIN || row.asin || '').trim().toUpperCase(),
        amazon_name: row['Amazon商品名'] || row.amazon_name || null,
        amazon_price: parseNumber(row['Amazon価格'] || row.amazon_price),
        monthly_sales: parseNumber(row['月間売上数'] || row.monthly_sales),
        fee_rate: parseNumber(row['手数料率'] || row.fee_rate),
        fba_fee: parseNumber(row['FBA料'] || row.fba_fee),
        jan_code: row['JANコード'] || row['商品コード: EAN'] || row.jan_code || null
      }

      // バリデーション
      const validated = AsinSchema.parse(normalized)

      // AsinInsert形式に変換（デフォルト値を設定）
      const asinInsert: AsinInsert = {
        user_id: userId,
        asin: validated.asin,
        amazon_name: validated.amazon_name || null,
        amazon_price: validated.amazon_price || null,
        monthly_sales: validated.monthly_sales || null,
        fee_rate: validated.fee_rate || null,
        fba_fee: validated.fba_fee || null,
        jan_code: validated.jan_code || null,
        has_amazon: false,
        has_official: false,
        complaint_count: 0,
        is_dangerous: false,
        is_per_carry_ng: false,
        memo: null
      }
      validData.push(asinInsert)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push({
          row: rowNumber,
          message: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        })
      } else {
        errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : '不明なエラー'
        })
      }
    }
  })

  return { validData, errors }
}

/**
 * 数値パース
 */
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return isNaN(num) ? null : num
}

// POST /api/asins/bulk-upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: "ファイルが指定されていません" },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ユーザーIDが必要です" },
        { status: 400 }
      )
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE / 1024 / 1024}MBまでです。` },
        { status: 400 }
      )
    }

    // ファイル読み込み
    const buffer = Buffer.from(await file.arrayBuffer())

    // ファイル解析
    const rawData = parseFile(buffer, file.name)

    // 行数チェック
    if (rawData.length > MAX_ROWS) {
      return NextResponse.json(
        { success: false, message: `データ行数が多すぎます。最大${MAX_ROWS}行までです。` },
        { status: 400 }
      )
    }

    // データ正規化とバリデーション
    const { validData, errors } = normalizeAndValidate(rawData, userId)

    // 既存ASINチェック
    const asins = validData.map(d => d.asin)
    const { data: existingAsins } = await supabase
      .from("asins")
      .select("asin")
      .eq("user_id", userId)
      .in("asin", asins)
      .returns<{ asin: string }[]>()

    const existingAsinSet = new Set(existingAsins?.map(a => a.asin) || [])

    // 新規ASINのみ抽出
    const newAsins = validData.filter(d => !existingAsinSet.has(d.asin))
    const skippedCount = validData.length - newAsins.length

    // バッチ登録
    let successCount = 0
    if (newAsins.length > 0) {
      const { error } = await supabase
        .from("asins")
        .insert(newAsins as never)

      if (error) {
        errors.push({
          row: 0,
          message: `登録エラー: ${error.message}`
        })
      } else {
        successCount = newAsins.length
      }
    }

    const result: UploadResult = {
      success: errors.length === 0,
      successCount,
      skippedCount,
      errorCount: errors.length,
      errors
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error("ASIN一括アップロードエラー:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "アップロード中にエラーが発生しました"
      },
      { status: 500 }
    )
  }
}
