"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Database,
} from "lucide-react"

interface SidebarProps {
  className?: string
}

const navigation = [
  {
    name: "ダッシュボード",
    href: "/",
    icon: Home,
  },
  {
    name: "商品リサーチ",
    href: "/research",
    icon: Search,
    children: [
      { name: "公式サイト", href: "/official" },
      { name: "楽天市場", href: "/rakuten" },
      { name: "Yahoo!ショッピング", href: "/yahoo" },
    ],
  },
  {
    name: "商品管理",
    href: "/products",
    icon: Package,
  },
  {
    name: "ASIN管理",
    href: "/asins",
    icon: Database,
  },
  {
    name: "レポート",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "設定",
    href: "/settings",
    icon: Settings,
    children: [
      { name: "全体設定", href: "/settings" },
      { name: "割引設定", href: "/settings/discounts" },
      { name: "エラーログ", href: "/settings/logs" },
    ],
  },
]

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-card",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* ヘッダー */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!collapsed && (
          <h1 className="text-lg font-semibold text-foreground">
            Shop Research
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.children && item.children.some(child => pathname.startsWith(child.href)))

          return (
            <div key={item.name}>
              <Link href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>

              {/* 子メニュー */}
              {!collapsed && item.children && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link key={child.name} href={child.href}>
                      <Button
                        variant={pathname.startsWith(child.href) ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                      >
                        {child.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* フッター */}
      <div className="border-t p-2">
        {!collapsed && (
          <p className="text-xs text-muted-foreground text-center">
            © 2025 Shop Research App
          </p>
        )}
      </div>
    </div>
  )
}