/**
 * プロキシ対応画像取得API
 * Next.js Image Optimizationでプロキシ使用時のDNS解決エラーを回避
 */

import { NextRequest, NextResponse } from "next/server"
import { determineProxySettings, generateProxyUrl } from "@/lib/proxy"
import https from "https"
import http from "http"
import { URL } from "url"

/**
 * プロキシ経由でHTTPリクエストを実行
 */
async function fetchWithProxy(imageUrl: string, proxyUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(imageUrl)
    const proxyUrlObj = new URL(proxyUrl)

    const headers: Record<string, string> = {
      "Host": targetUrl.hostname,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }

    // プロキシ認証がある場合
    if (proxyUrlObj.username && proxyUrlObj.password) {
      const auth = Buffer.from(`${proxyUrlObj.username}:${proxyUrlObj.password}`).toString("base64")
      headers["Proxy-Authorization"] = `Basic ${auth}`
    }

    const proxyOptions = {
      host: proxyUrlObj.hostname,
      port: parseInt(proxyUrlObj.port || "80"),
      method: "GET",
      path: imageUrl,
      headers,
    }

    const protocol = proxyUrlObj.protocol === "https:" ? https : http

    const req = protocol.request(proxyOptions, (res) => {
      const chunks: Buffer[] = []

      res.on("data", (chunk) => {
        chunks.push(chunk)
      })

      res.on("end", () => {
        resolve(Buffer.concat(chunks))
      })
    })

    req.on("error", (error) => {
      reject(error)
    })

    req.end()
  })
}

/**
 * 画像をプロキシ経由で取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get("url")

    if (!imageUrl) {
      return new NextResponse("画像URLが指定されていません", { status: 400 })
    }

    // プロキシ設定を判定
    const proxySettings = determineProxySettings()

    let imageBuffer: Buffer

    if (proxySettings.enabled && proxySettings.config) {
      // プロキシ経由で画像を取得
      const proxyUrl = generateProxyUrl(proxySettings.config)
      console.log(`プロキシ経由で画像を取得: ${imageUrl}`)

      try {
        imageBuffer = await fetchWithProxy(imageUrl, proxyUrl)
      } catch (proxyError) {
        console.error("プロキシ経由の取得エラー:", proxyError)
        return new NextResponse("プロキシ経由の画像取得に失敗しました", { status: 500 })
      }
    } else {
      // プロキシなしで画像を取得（環境変数のプロキシ設定を除外）
      const originalHttpProxy = process.env.HTTP_PROXY
      const originalHttpsProxy = process.env.HTTPS_PROXY

      try {
        delete process.env.HTTP_PROXY
        delete process.env.HTTPS_PROXY

        const imageResponse = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })

        if (!imageResponse.ok) {
          console.error(`画像取得エラー: ${imageUrl} (${imageResponse.status})`)
          return new NextResponse("画像の取得に失敗しました", { status: imageResponse.status })
        }

        const arrayBuffer = await imageResponse.arrayBuffer()
        imageBuffer = Buffer.from(arrayBuffer)
      } finally {
        // 環境変数を復元
        if (originalHttpProxy) process.env.HTTP_PROXY = originalHttpProxy
        if (originalHttpsProxy) process.env.HTTPS_PROXY = originalHttpsProxy
      }
    }

    // 画像の種類を推測（URLの拡張子から）
    const contentType = imageUrl.match(/\.(jpg|jpeg)$/i)
      ? "image/jpeg"
      : imageUrl.match(/\.png$/i)
      ? "image/png"
      : imageUrl.match(/\.webp$/i)
      ? "image/webp"
      : imageUrl.match(/\.gif$/i)
      ? "image/gif"
      : "image/jpeg"

    // キャッシュヘッダーを設定
    return new NextResponse(Buffer.from(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("画像プロキシエラー:", error)
    return new NextResponse("画像の取得中にエラーが発生しました", { status: 500 })
  }
}
