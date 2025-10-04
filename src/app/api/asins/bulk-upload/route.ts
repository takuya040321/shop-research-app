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
  amazon_price: z.number().int().min(0).optional().nullable(),  // 整数型
  monthly_sales: z.number().int().min(0).optional().nullable(),  // 整数型
  fee_rate: z.number().int().min(0).max(100).optional().nullable(),  // 整数型
  fba_fee: z.number().int().min(0).optional().nullable(),  // 整数型
  jan_code: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  product_url: z.string().optional().nullable()
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
function parseFile(buffer: Buffer, filename: string): unknown[][] {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'csv') {
    // CSV解析（ヘッダーなし、配列形式）
    const text = buffer.toString('utf-8')
    const result = Papa.parse(text, {
      header: false,
      skipEmptyLines: true
    })
    // 最初の行（ヘッダー）をスキップ
    return (result.data as unknown[][]).slice(1)
  } else if (ext === 'xlsx' || ext === 'xls') {
    // Excel解析（ヘッダーなし、配列形式）
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error("Excelファイルにシートが見つかりません")
    const worksheet = workbook.Sheets[sheetName]
    if (!worksheet) throw new Error("Excelワークシートが見つかりません")
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]
    // 最初の行（ヘッダー）をスキップ
    return jsonData.slice(1)
  } else {
    throw new Error("サポートされていないファイル形式です")
  }
}

/**
 * データを正規化してバリデーション
 */
function normalizeAndValidate(rawData: unknown[][]): {
  validData: AsinInsert[]
  errors: Array<{ row: number; message: string }>
} {
  const validData: AsinInsert[] = []
  const errors: Array<{ row: number; message: string }> = []

  rawData.forEach((row, index) => {
    const rowNumber = index + 2 // ヘッダー行を考慮

    try {
      // CSV列番号でデータを取得
      // 0: 画像, 1: URL: Amazon, 2: ブランド, 3: 商品名, 4: ASIN,
      // 5: 先月の購入, 6: Buy Box 🚚: 現在価格, 7: 紹介料％,
      // 8: FBA Pick&Pack 料金, 9: 商品コード: EAN
      const normalized: AsinData = {
        asin: String(row[4] || '').trim().toUpperCase(),
        amazon_name: row[3] ? String(row[3]) : null,
        amazon_price: parseInteger(row[6]), // 整数（切り捨て）
        monthly_sales: parseInteger(row[5]), // 整数（切り捨て）
        fee_rate: parseIntegerRound(row[7]), // 整数（四捨五入）
        fba_fee: parseInteger(row[8]), // 整数（切り捨て）
        jan_code: row[9] ? String(row[9]) : null,
        image_url: row[0] ? String(row[0]) : null,
        product_url: row[1] ? String(row[1]) : null
      }

      // バリデーション
      const validated = AsinSchema.parse(normalized)

      // AsinInsert形式に変換（デフォルト値を設定）
      const asinInsert: AsinInsert = {
        asin: validated.asin,
        amazon_name: validated.amazon_name || null,
        amazon_price: validated.amazon_price || null,
        monthly_sales: validated.monthly_sales || null,
        fee_rate: validated.fee_rate ?? 15,  // デフォルト15（整数）
        fba_fee: validated.fba_fee ?? 0,  // デフォルト0（整数）
        jan_code: validated.jan_code || null,
        image_url: validated.image_url || null,
        product_url: validated.product_url || null,
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
 * 整数パース（小数点以下切り捨て）
 * amazon_price、fba_fee用
 */
function parseInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  // 文字列に変換
  const str = String(value).trim()
  if (str === '') return null

  // 通貨記号（¥、$）、パーセント記号（%）、カンマ、スペースを削除
  const cleaned = str.replace(/[¥$%,\s]/g, '')

  const num = Number(cleaned)
  if (isNaN(num)) return null

  // 小数点以下切り捨て
  return Math.floor(num)
}

/**
 * 整数パース（小数点第一位を四捨五入）
 * fee_rate用
 */
function parseIntegerRound(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null

  // 文字列に変換
  const str = String(value).trim()
  if (str === '') return null

  // 通貨記号（¥、$）、パーセント記号（%）、カンマ、スペースを削除
  const cleaned = str.replace(/[¥$%,\s]/g, '')

  const num = Number(cleaned)
  if (isNaN(num)) return null

  // 小数点第一位を四捨五入
  return Math.round(num)
}

// POST /api/asins/bulk-upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, message: "ファイルが指定されていません" },
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
    const { validData, errors } = normalizeAndValidate(rawData)

    // 既存ASINチェック
    const asins = validData.map(d => d.asin)
    const { data: existingAsins } = await supabase
      .from("asins")
      .select("asin")
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
