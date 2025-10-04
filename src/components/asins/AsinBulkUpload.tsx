"use client"

/**
 * ASIN一括アップロードコンポーネント
 * Excel/CSVファイルからASINデータを一括登録
 */

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { UploadIcon, FileIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, InfoIcon } from "lucide-react"
import { useAsinBulkUpload } from "@/hooks/asins/useAsinBulkUpload"

export function AsinBulkUpload() {
  // カスタムフックから全てのロジックを取得
  const {
    file,
    uploading,
    result,
    dragActive,
    preview,
    loadingPreview,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileChange,
    handleUpload,
    handleClickFileInput
  } = useAsinBulkUpload()

  // 長いテキストを省略表示する関数
  const truncateText = (text: string, maxLength = 30): string => {
    if (!text || text.length <= maxLength) return text
    return `${text.substring(0, maxLength)}...`
  }

  // 列幅を動的に設定する関数（テーブル用）
  const getColumnStyle = (key: string): React.CSSProperties => {
    const normalizedKey = key.toLowerCase().trim()

    // 画像・URL列はかなり小さく
    if (normalizedKey === "画像" || normalizedKey.includes("url")) {
      return { width: "60px", maxWidth: "60px" }
    }

    // ブランド列は狭く
    if (normalizedKey === "ブランド") {
      return { width: "60px", maxWidth: "60px" }
    }

    // 商品名は長く
    if (normalizedKey === "商品名") {
      return { width: "300px", maxWidth: "300px" }
    }

    // デフォルト
    return { width: "120px", maxWidth: "120px" }
  }

  // 列の省略文字数を動的に設定する関数
  const getTruncateLength = (key: string): number => {
    const normalizedKey = key.toLowerCase().trim()

    // 画像・URL列は非常に短く
    if (normalizedKey === "画像" || normalizedKey.includes("url")) {
      return 8
    }

    // 商品名は長く
    if (normalizedKey === "商品名") {
      return 50
    }

    return 20 // デフォルト
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">ASIN一括アップロード</h2>

          {/* 注意事項 */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-3">
              <InfoIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-blue-900">CSVファイルアップロード時の注意事項</p>
                <ul className="space-y-1.5 text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>CSVファイルの列順序は必ず以下の通りにしてください</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>列順: 画像、URL: Amazon、ブランド、商品名、ASIN、先月の購入、Buy Box 🚚: 現在価格、紹介料％、FBA Pick&Pack 料金、商品コード: EAN</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>最大ファイルサイズ: 10MB</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>最大行数: 10,000行</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>対応形式: CSV、Excel（.xlsx、.xls）</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

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
                    onClick={handleClickFileInput}
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
                  onClick={handleClickFileInput}
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

          {/* プレビュー表示 */}
          {file && preview.length > 0 && preview[0] && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">ファイルプレビュー（最初の5行）</h3>
              {loadingPreview ? (
                <div className="text-center py-8 text-muted-foreground">
                  読み込み中...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs table-fixed">
                    <thead>
                      <tr className="border-b">
                        {Object.keys(preview[0]).map((key) => (
                          <th
                            key={key}
                            className="px-3 py-2 text-left font-medium text-muted-foreground"
                            style={getColumnStyle(key)}
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, index) => (
                        <tr key={index} className="border-b last:border-0">
                          {Object.entries(row).map(([key, value], cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 overflow-hidden text-ellipsis"
                              style={getColumnStyle(key)}
                              title={value?.toString() || "-"}
                            >
                              {truncateText(value?.toString() || "-", getTruncateLength(key))}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

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
