"use client"

import { useState, useEffect, useCallback } from "react"
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
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Database as DB } from "@/types/database"

interface SidebarProps {
  className?: string
}

type RakutenShop = DB["public"]["Tables"]["rakuten_shops"]["Row"]

// 静的ナビゲーション（楽天市場以外）
const staticNavigation = [
  {
    name: "ダッシュボード",
    href: "/",
    icon: Home,
  },
  {
    name: "公式",
    href: "/official",
    icon: Store,
    children: [
      { name: "VT Cosmetics", href: "/official/vt" },
      { name: "DHC", href: "/official/dhc" },
      { name: "innisfree", href: "/official/innisfree" },
    ],
  },
]

const yahooNavigation = {
  name: "Yahoo!ショッピング",
  href: "/yahoo",
  icon: ShoppingCart,
  children: [
    { name: "LOHACO-DHC", href: "/yahoo/lohaco/dhc" },
    { name: "LOHACO-VT", href: "/yahoo/lohaco/vt" },
    { name: "ZOZOTOWN-DHC", href: "/yahoo/zozotown/dhc" },
    { name: "ZOZOTOWN-VT", href: "/yahoo/zozotown/vt" },
    { name: "Yahoo-VT", href: "/yahoo/vt" },
  ],
}

const bottomNavigation = [
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
      { name: "楽天ショップ設定", href: "/rakuten" },
      { name: "エラーログ", href: "/settings/logs" },
    ],
  },
]

export function Sidebar({ className }: SidebarProps) {
  const [rakutenShops, setRakutenShops] = useState<RakutenShop[]>([])

  // 楽天ショップを読み込み
  const loadRakutenShops = useCallback(async () => {
    const { data, error } = await supabase
      .from("rakuten_shops")
      .select("*")
      .eq("is_active", true)
      .order("display_name")

    if (!error && data) {
      setRakutenShops(data)
    }
  }, [])

  // 初回読み込み
  useEffect(() => {
    loadRakutenShops()
  }, [loadRakutenShops])

  // カスタムイベントでリフレッシュ
  useEffect(() => {
    const handleUpdate = () => {
      loadRakutenShops()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("rakuten:shop:updated", handleUpdate)
      return () => {
        window.removeEventListener("rakuten:shop:updated", handleUpdate)
      }
    }

    return undefined
  }, [loadRakutenShops])

  // 動的ナビゲーションを構築
  const rakutenNavigation = {
    name: "楽天市場",
    href: "/rakuten",
    icon: ShoppingBag,
    children: rakutenShops.map(shop => ({
      name: shop.display_name,
      href: `/rakuten/${shop.shop_id}`
    }))
  }

  // 全体のナビゲーション
  const navigation = [
    ...staticNavigation,
    rakutenNavigation,
    yahooNavigation,
    ...bottomNavigation
  ]
  const [collapsed, setCollapsed] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const pathname = usePathname()

  // 現在のパスに基づいて親メニューを自動展開
  useEffect(() => {
    const menusToExpand: string[] = []
    navigation.forEach(item => {
      if (item.children && item.children.some(child => pathname.startsWith(child.href))) {
        menusToExpand.push(item.name)
      }
    })
    setExpandedMenus(menusToExpand)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev =>
      prev.includes(name)
        ? prev.filter(m => m !== name)
        : [...prev, name]
    )
  }

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* ヘッダー */}
      <div className="flex h-14 items-center justify-between px-3 border-b">
        {!collapsed && (
          <h1 className="text-base font-semibold text-foreground tracking-tight">
            Shop Research
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-8 w-8 p-0 hover:bg-accent transition-colors",
            collapsed && "mx-auto"
          )}
          title={collapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
        >
          {collapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 space-y-0.5 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.children && item.children.some(child => pathname.startsWith(child.href)))
          const isExpanded = expandedMenus.includes(item.name)
          const hasChildren = !!item.children

          return (
            <div key={item.name} className="space-y-0.5">
              {/* 子メニューがある場合はリンクなし、ない場合はリンクあり */}
              {hasChildren ? (
                <Button
                  variant="ghost"
                  className={cn(
                    "group w-full justify-start relative transition-colors duration-200 h-9 px-3",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-accent text-foreground border-l-2 border-primary"
                      : "hover:bg-accent/50"
                  )}
                  title={collapsed ? item.name : undefined}
                  onClick={() => toggleMenu(item.name)}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors shrink-0",
                    !collapsed && "mr-3",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  {!collapsed && (
                    <>
                      <span className={cn(
                        "flex-1 text-left text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.name}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className={cn(
                          "h-4 w-4 ml-auto transition-transform duration-200 shrink-0",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )} />
                      ) : (
                        <ChevronDown className={cn(
                          "h-4 w-4 ml-auto transition-transform duration-200 shrink-0",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )} />
                      )}
                    </>
                  )}
                </Button>
              ) : (
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "group w-full justify-start relative transition-colors duration-200 h-9 px-3",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-accent text-foreground border-l-2 border-primary"
                        : "hover:bg-accent/50"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors shrink-0",
                      !collapsed && "mr-3",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    {!collapsed && (
                      <span className={cn(
                        "text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.name}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* 子メニュー */}
              {!collapsed && hasChildren && isExpanded && item.children && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/40 pl-2">
                  {item.children.map((child) => {
                    const isChildActive = pathname === child.href
                    return (
                      <Link key={child.name} href={child.href}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "group w-full justify-start relative transition-colors duration-200 h-8 px-3",
                            isChildActive
                              ? "bg-accent text-foreground border-l-2 border-primary"
                              : "hover:bg-accent/50 text-muted-foreground"
                          )}
                        >
                          <span className={cn(
                            "text-sm font-normal transition-colors",
                            isChildActive ? "text-foreground font-medium" : "text-muted-foreground"
                          )}>
                            {child.name}
                          </span>
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
      <div className="border-t p-3">
        {!collapsed && (
          <p className="text-xs text-muted-foreground/70 text-center">
            © 2025 Shop Research App
          </p>
        )}
      </div>
    </div>
  )
}