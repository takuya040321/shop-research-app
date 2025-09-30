"use client"

/**
 * 右クリックコンテキストメニューコンポーネント
 */

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"

interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  disabled?: boolean
  separator?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
  visible: boolean
}

export function ContextMenu({ x, y, items, onClose, visible }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [visible, onClose])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <Card
        ref={menuRef}
        className="fixed bg-white border shadow-lg py-1 min-w-[160px]"
        style={{
          left: x,
          top: y,
          zIndex: 1000
        }}
      >
        {items.map((item, index) => (
          <div key={index}>
            {item.separator ? (
              <div className="h-px bg-gray-200 my-1" />
            ) : (
              <button
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 ${
                  item.disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-700"
                }`}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick()
                    onClose()
                  }
                }}
                disabled={item.disabled}
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                {item.label}
              </button>
            )}
          </div>
        ))}
      </Card>
    </div>
  )
}

// 右クリックメニューを管理するカスタムフック
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    visible: boolean
  }>({
    x: 0,
    y: 0,
    visible: false
  })

  const showContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      visible: true
    })
  }

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu
  }
}