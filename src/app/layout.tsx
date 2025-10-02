import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/Sonner"
import { QueryProvider } from "@/components/providers/QueryProvider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Shop Research App - 化粧品転売リサーチツール",
  description: "Amazon化粧品転売のための価格比較・在庫調査ツール",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <div className="min-h-screen">
            {children}
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
