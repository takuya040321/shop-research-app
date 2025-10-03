"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import {
  Home,
  Settings,
  Database,
  Store,
  ShoppingBag,
  ShoppingCart,
  Menu,
  X,
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
    name: "公式サイト",
    href: "/official",
    icon: Store,
  },
  {
    name: "楽天市場",
    href: "/rakuten",
    icon: ShoppingBag,
  },
  {
    name: "Yahoo!ショッピング",
    href: "/yahoo",
    icon: ShoppingCart,
  },
  {
    name: "ASIN管理",
    href: "/asins",
    icon: Database,
  },
  {
    name: "設定",
    href: "/settings",
    icon: Settings,
    children: [
      { name: "全体設定", href: "/settings/system" },
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
          className={cn(
            "h-9 w-9 p-0 hover:bg-accent",
            collapsed && "mx-auto"
          )}
          title={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
        >
          {collapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
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
                    "w-full justify-start transition-colors relative",
                    collapsed && "justify-center px-2",
                    isActive && "bg-primary/10 hover:bg-primary/15 border-l-4 border-primary font-semibold"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn(
                    "h-4 w-4",
                    !collapsed && "mr-2",
                    isActive && "text-primary"
                  )} />
                  {!collapsed && (
                    <span className={cn(isActive && "text-primary")}>
                      {item.name}
                    </span>
                  )}
                </Button>
              </Link>

              {/* 子メニュー */}
              {!collapsed && item.children && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isChildActive = pathname.startsWith(child.href)
                    return (
                      <Link key={child.name} href={child.href}>
                        <Button
                          variant={isChildActive ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "w-full justify-start transition-colors",
                            isChildActive && "bg-primary/10 hover:bg-primary/15 font-medium text-primary"
                          )}
                        >
                          {child.name}
                        </Button>
                      </Link>
                    )
                  })}
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