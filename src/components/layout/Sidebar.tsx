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
  Star,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Database as DB } from "@/types/database"

interface SidebarProps {
  className?: string
}

type RakutenShop = DB["public"]["Tables"]["rakuten_shops"]["Row"]
type YahooShop = DB["public"]["Tables"]["yahoo_shops"]["Row"]

// ナビゲーション項目の型定義
type NavigationItem = {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  children?: NavigationChild[]
}

type NavigationChild = {
  name: string
  href: string
  children?: { name: string; href: string }[]
}

// 静的ナビゲーション（楽天市場以外）
const staticNavigation = [
  {
    name: "ダッシュボード",
    href: "/",
    icon: Home,
  },
  {
    name: "お気に入り",
    href: "/favorites",
    icon: Star,
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
      { name: "Yahooショップ設定", href: "/settings/yahoo" },
      { name: "Yahoo APIテスト", href: "/test/yahoo-api" },
      { name: "エラーログ", href: "/settings/logs" },
    ],
  },
]

export function Sidebar({ className }: SidebarProps) {
  const [rakutenShops, setRakutenShops] = useState<RakutenShop[]>([])
  const [yahooShops, setYahooShops] = useState<YahooShop[]>([])

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

  // Yahooショップを読み込み
  const loadYahooShops = useCallback(async () => {
    const { data, error } = await supabase
      .from("yahoo_shops")
      .select("*")
      .eq("is_active", true)
      .order("parent_category", { nullsFirst: false })
      .order("display_name")

    if (!error && data) {
      setYahooShops(data)
    }
  }, [])

  // 初回読み込み
  useEffect(() => {
    loadRakutenShops()
    loadYahooShops()
  }, [loadRakutenShops, loadYahooShops])

  // カスタムイベントでリフレッシュ（楽天）
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

  // カスタムイベントでリフレッシュ（Yahoo）
  useEffect(() => {
    const handleUpdate = () => {
      loadYahooShops()
    }

    if (typeof window !== "undefined") {
      window.addEventListener("yahoo:shop:updated", handleUpdate)
      return () => {
        window.removeEventListener("yahoo:shop:updated", handleUpdate)
      }
    }

    return undefined
  }, [loadYahooShops])

  // 楽天の動的ナビゲーションを構築
  const rakutenNavigation = {
    name: "楽天市場",
    href: "/rakuten",
    icon: ShoppingBag,
    children: rakutenShops.map(shop => ({
      name: shop.display_name,
      href: `/rakuten/${shop.shop_id}`
    }))
  }

  // Yahooの動的ナビゲーションを構築（階層構造対応）
  const buildYahooNavigation = () => {
    const lohacoShops = yahooShops
      .filter(shop => shop.parent_category === "lohaco")
      .map(shop => ({
        name: shop.display_name,
        href: `/yahoo/lohaco/${shop.shop_id}`
      }))

    const zozotownShops = yahooShops
      .filter(shop => shop.parent_category === "zozotown")
      .map(shop => ({
        name: shop.display_name,
        href: `/yahoo/zozotown/${shop.shop_id}`
      }))

    const directShops = yahooShops
      .filter(shop => !shop.parent_category)
      .map(shop => ({
        name: shop.display_name,
        href: `/yahoo/${shop.shop_id}`
      }))

    const yahooChildren = []
    
    // LOHACOグループを追加
    if (lohacoShops.length > 0) {
      yahooChildren.push({
        name: "LOHACO",
        href: "/yahoo/lohaco",
        children: lohacoShops
      })
    }

    // ZOZOTOWNグループを追加
    if (zozotownShops.length > 0) {
      yahooChildren.push({
        name: "ZOZOTOWN",
        href: "/yahoo/zozotown",
        children: zozotownShops
      })
    }

    // 直販ショップを追加
    yahooChildren.push(...directShops)

    return {
      name: "Yahoo!ショッピング",
      href: "/yahoo",
      icon: ShoppingCart,
      children: yahooChildren
    }
  }

  const yahooNavigation = buildYahooNavigation()

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

    const checkAndExpand = (items: NavigationItem[]) => {
      items.forEach(item => {
        const itemMatches = pathname === item.href || pathname.startsWith(`${item.href}/`)
        
        if (item.children) {
          const hasActiveChild = item.children.some(child => {
            if ("children" in child && child.children) {
              return child.children.some(grandchild => pathname.startsWith(grandchild.href))
            }
            return pathname.startsWith(child.href)
          })
          
          if (itemMatches || hasActiveChild) {
            menusToExpand.push(item.name)
            
            // 3階層対応：孫要素がアクティブな場合、子要素も展開
            item.children.forEach(child => {
              if ("children" in child && child.children) {
                const hasActiveGrandchild = child.children.some(grandchild => 
                  pathname.startsWith(grandchild.href)
                )
                if (hasActiveGrandchild) {
                  menusToExpand.push(child.name)
                }
              }
            })
          }
        }
      })
    }
    
    checkAndExpand(navigation)
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

  // 再帰的にメニュー項目をレンダリング
  const renderMenuItem = (item: NavigationItem, depth: number = 0) => {
    const isActive = pathname === item.href ||
      (item.children && item.children.some(child => {
        if ("children" in child && child.children) {
          return child.children.some(grandchild => pathname.startsWith(grandchild.href))
        }
        return pathname.startsWith(child.href)
      }))
    const isExpanded = expandedMenus.includes(item.name)
    const hasChildren = !!item.children && item.children.length > 0

    return (
      <div key={item.name} className="space-y-0.5">
        {/* 親メニュー項目 */}
        {hasChildren ? (
          <Button
            variant="ghost"
            className={cn(
              "group w-full justify-start relative transition-colors duration-200 h-9 px-3",
              collapsed && "justify-center px-2",
              depth > 0 && "ml-4",
              isActive
                ? "bg-accent text-foreground border-l-2 border-primary"
                : "hover:bg-accent/50"
            )}
            title={collapsed ? item.name : undefined}
            onClick={() => toggleMenu(item.name)}
          >
            {"icon" in item && item.icon && (
              <item.icon className={cn(
                "h-4 w-4 transition-colors shrink-0",
                !collapsed && "mr-3",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
            )}
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
                depth > 0 && "ml-4",
                isActive
                  ? "bg-accent text-foreground border-l-2 border-primary"
                  : "hover:bg-accent/50"
              )}
              title={collapsed ? item.name : undefined}
            >
              {"icon" in item && item.icon && (
                <item.icon className={cn(
                  "h-4 w-4 transition-colors shrink-0",
                  !collapsed && "mr-3",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
              )}
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
              // 子要素が孫要素を持つ場合（3階層目）
              if ("children" in child && child.children) {
                return renderMenuItem(child, depth + 1)
              }
              
              // 通常の子要素（2階層目）
              const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`)
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
        {navigation.map((item) => renderMenuItem(item))}
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
