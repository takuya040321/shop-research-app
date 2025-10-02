"use client"

/**
 * ASIN一括アップロードコンポーネント
 * Excel/CSVファイルからASINデータを一括登録
 */

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UploadIcon, FileIcon, DownloadIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

interface AsinBulkUploadProps {
  userId: string
}

interface UploadResult {
  success: boolean
  successCount: number
  skippedCount: number
  errorCount: number
  errors: Array<{ row: number; message: string }>
}

export function AsinBulkUpload({ userId }: AsinBulkUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ドラッグ＆ドロップ処理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  // ファイル選択処理
  const handleFileSelect = (selectedFile: File) => {
    const validExtensions = ['csv', 'xlsx', 'xls']
    const ext = selectedFile.name.split('.').pop()?.toLowerCase()

    if (!ext || !validExtensions.includes(ext)) {
      toast.error("ファイル形式エラー", {
        description: "CSV, XLSX, XLSファイルのみアップロード可能です"
      })
      return
    }

    setFile(selectedFile)
    setResult(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  // アップロード実行
  const handleUpload = async () => {
    if (!file) {
      toast.error("ファイルが選択されていません")
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", userId)

      const response = await fetch("/api/asins/bulk-upload", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)

        if (data.success) {
          toast.success("アップロード完了", {
            description: `${data.successCount}件のASINを登録しました`
          })
        } else {
          toast.warning("アップロード完了（エラーあり）", {
            description: `成功: ${data.successCount}件、エラー: ${data.errorCount}件`
          })
        }
      } else {
        toast.error("アップロード失敗", {
          description: data.message || "エラーが発生しました"
        })
      }
    } catch (error) {
      console.error("アップロードエラー:", error)
      toast.error("アップロード失敗", {
        description: "ネットワークエラーが発生しました"
      })
    } finally {
      setUploading(false)
    }
  }

  // テンプレートダウンロード
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "ASIN": "B01234ABCD",
        "Amazon商品名": "サンプル商品",
        "Amazon価格": 1980,
        "月間売上数": 100,
        "手数料率": 15,
        "FBA料": 400,
        "商品コード: EAN": "4901234567890"
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "ASIN")

    // 列幅設定
    const columnWidths = [
      { wch: 12 }, // ASIN
      { wch: 30 }, // Amazon商品名
      { wch: 12 }, // Amazon価格
      { wch: 12 }, // 月間売上数
      { wch: 10 }, // 手数料率
      { wch: 10 }, // FBA料
      { wch: 15 }, // JANコード
      { wch: 10 }, // Amazon有
      { wch: 10 }, // 公式有
      { wch: 12 }, // クレーム数
      { wch: 10 }, // 危険品
      { wch: 15 }, // パーキャリNG
      { wch: 30 }  // メモ
    ]
    worksheet['!cols'] = columnWidths

    XLSX.writeFile(workbook, "asin_template.xlsx")
    toast.success("テンプレートをダウンロードしました")
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">ASIN一括アップロード</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              テンプレートダウンロード
            </Button>
          </div>

          {/* ドロップゾーン */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="space-y-4">
                <FileIcon className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="sm"
                  >
                    ファイル変更
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    size="sm"
                  >
                    <UploadIcon className="h-4 w-4 mr-2" />
                    {uploading ? "アップロード中..." : "アップロード"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">
                    ファイルをドラッグ＆ドロップ
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    または
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  ファイルを選択
                </Button>
                <p className="text-xs text-muted-foreground">
                  対応形式: CSV, XLSX, XLS（最大10MB、10,000行まで）
                </p>
              </div>
            )}
          </div>

          {/* 結果表示 */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <CheckCircleIcon className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{result.successCount}</p>
                  <p className="text-sm text-muted-foreground">成功</p>
                </Card>
                <Card className="p-4 text-center">
                  <AlertCircleIcon className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold">{result.skippedCount}</p>
                  <p className="text-sm text-muted-foreground">スキップ（重複）</p>
                </Card>
                <Card className="p-4 text-center">
                  <XCircleIcon className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <p className="text-2xl font-bold">{result.errorCount}</p>
                  <p className="text-sm text-muted-foreground">エラー</p>
                </Card>
              </div>

              {/* エラー詳細 */}
              {result.errors.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2 text-red-600">エラー詳細</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm border-l-2 border-red-500 pl-3 py-1">
                        <span className="font-medium">行 {error.row}:</span>{" "}
                        <span className="text-muted-foreground">{error.message}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
