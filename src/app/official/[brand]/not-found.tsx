/**
 * ブランドページのNot Foundページ
 */

import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangleIcon, HomeIcon } from "lucide-react"

export default function BrandNotFound() {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto p-8 text-center">
          <AlertTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ブランドが見つかりません
          </h1>
          <p className="text-gray-600 mb-6">
            指定されたブランドページは存在しません。
          </p>
          <div className="space-y-2">
            <Link href="/official">
              <Button className="w-full flex items-center gap-2">
                <HomeIcon className="w-4 h-4" />
                公式サイト一覧に戻る
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                ダッシュボードに戻る
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}