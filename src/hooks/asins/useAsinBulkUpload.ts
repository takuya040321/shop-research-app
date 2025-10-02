/**
 * ASIN一括アップロード用カスタムフック
 * ファイルアップロード、バリデーション、アップロード処理を提供
 */

import { useState, useRef } from "react"
import { toast } from "sonner"

interface UploadResult {
  success: boolean
  successCount: number
  skippedCount: number
  errorCount: number
  errors: Array<{ row: number; message: string }>
}

interface UseAsinBulkUploadOptions {
  userId: string
}

export function useAsinBulkUpload({ userId }: UseAsinBulkUploadOptions) {
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

  const handleClickFileInput = () => {
    fileInputRef.current?.click()
  }

  return {
    // State
    file,
    uploading,
    result,
    dragActive,
    fileInputRef,

    // Actions
    handleDrag,
    handleDrop,
    handleFileChange,
    handleUpload,
    handleClickFileInput
  }
}
