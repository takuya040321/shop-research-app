"use client"

import { useEffect } from "react"
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react"

export type ToastType = "success" | "error" | "warning"

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const styles = {
    success: {
      bg: "bg-gradient-to-r from-green-500 to-emerald-600",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    error: {
      bg: "bg-gradient-to-r from-red-500 to-rose-600",
      icon: <XCircle className="w-5 h-5" />,
    },
    warning: {
      bg: "bg-gradient-to-r from-yellow-500 to-orange-600",
      icon: <AlertCircle className="w-5 h-5" />,
    },
  }

  const style = styles[type]

  return (
    <div
      className={`${style.bg} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md animate-slide-in`}
      role="alert"
    >
      {style.icon}
      <p className="flex-1 font-medium">{message}</p>
      <button
        onClick={onClose}
        className="hover:bg-white/20 rounded-full p-1 transition-colors"
        aria-label="閉じる"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
