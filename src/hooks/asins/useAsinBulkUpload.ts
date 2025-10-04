/**
 * ASIN一括アップロード用カスタムフック
 * ファイルアップロード、バリデーション、アップロード処理を提供
 */

import { useState, useRef } from "react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import Papa from "papaparse"

interface UploadResult {
  success: boolean
  successCount: number
  skippedCount: number
  errorCount: number
  errors: Array<{ row: number; message: string }>
}

interface PreviewRow {
  [key: string]: string | number | null
}

export function useAsinBulkUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
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

  // ファイルプレビューを読み込む
  const loadFilePreview = async (file: File): Promise<PreviewRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      const ext = file.name.split('.').pop()?.toLowerCase()

      reader.onload = (e) => {
        try {
          const data = e.target?.result

          if (ext === 'csv') {
            // CSV解析
            const text = data as string
            const result = Papa.parse(text, {
              header: true,
              skipEmptyLines: true,
              transformHeader: (header) => header.trim(),
              preview: 5 // 最初の5行のみ
            })
            resolve(result.data as PreviewRow[])
          } else if (ext === 'xlsx' || ext === 'xls') {
            // Excel解析
            const workbook = XLSX.read(data, { type: 'binary' })
            const sheetName = workbook.SheetNames[0]
            if (!sheetName) {
              reject(new Error("Excelファイルにシートが見つかりません"))
              return
            }
            const worksheet = workbook.Sheets[sheetName]
            if (!worksheet) {
              reject(new Error("Excelワークシートが見つかりません"))
              return
            }
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as PreviewRow[]
            // 最初の5行のみ
            resolve(jsonData.slice(0, 5))
          } else {
            reject(new Error("サポートされていないファイル形式です"))
          }
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error("ファイル読み込みエラー"))

      if (ext === 'csv') {
        reader.readAsText(file)
      } else {
        reader.readAsBinaryString(file)
      }
    })
  }

  // ファイル選択処理
  const handleFileSelect = async (selectedFile: File) => {
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
    setLoadingPreview(true)

    try {
      const previewData = await loadFilePreview(selectedFile)
      setPreview(previewData)
    } catch (error) {
      console.error("プレビュー読み込みエラー:", error)
      toast.error("プレビュー読み込み失敗", {
        description: "ファイルのプレビューを表示できませんでした"
      })
      setPreview([])
    } finally {
      setLoadingPreview(false)
    }
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

  const handleClickFileInput = () => {
    fileInputRef.current?.click()
  }

  return {
    // State
    file,
    uploading,
    result,
    dragActive,
    preview,
    loadingPreview,
    fileInputRef,

    // Actions
    handleDrag,
    handleDrop,
    handleFileChange,
    handleUpload,
    handleClickFileInput
  }
}
