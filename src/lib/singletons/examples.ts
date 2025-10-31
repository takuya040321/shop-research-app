/**
 * Proxyクラスの使用例
 *
 * このファイルは、シングルトン+プロキシパターンの実際の使用方法を示しています。
 * 注意: このファイルは参考用であり、実際のアプリケーションには含めません。
 */

import { Proxy } from "./index"
import type { ProductInsert } from "@/types/database"

// ========================================
// 例1: Supabaseクライアントの基本的な使用
// ========================================

/**
 * 商品一覧を取得
 */
export async function example1_getProducts() {
  // Proxyクラスを通じてSupabaseクライアントを取得
  const supabase = Proxy.getSupabase()

  // USE_PROXY環境変数に応じて、適切なクライアントが自動で選択される
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_type", "official")
    .limit(10)

  if (error) {
    console.error("商品取得エラー:", error)
    return []
  }

  return data
}

/**
 * 特定の商品を取得
 */
export async function example2_getProductById(id: string) {
  const supabase = Proxy.getSupabase()

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(`商品の取得に失敗しました: ${error.message}`)
  }

  return data
}

// ========================================
// 例3: 商品の挿入・更新・削除
// ========================================

/**
 * 新しい商品を作成
 */
export async function example3_createProduct(product: ProductInsert) {
  const supabase = Proxy.getSupabase()

  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single()

  if (error) {
    throw new Error(`商品の作成に失敗しました: ${error.message}`)
  }

  console.log("✅ 商品を作成しました:", data.name)
  return data
}

/**
 * 商品を更新
 */
export async function example4_updateProduct(
  id: string,
  updates: { price?: number; sale_price?: number }
) {
  const supabase = Proxy.getSupabase()

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(`商品の更新に失敗しました: ${error.message}`)
  }

  console.log("✅ 商品を更新しました:", data.name)
  return data
}

/**
 * 商品を削除
 */
export async function example5_deleteProduct(id: string) {
  const supabase = Proxy.getSupabase()

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(`商品の削除に失敗しました: ${error.message}`)
  }

  console.log("✅ 商品を削除しました:", id)
}

// ========================================
// 例6: スクレイパーの基本的な使用
// ========================================

/**
 * シンプルなスクレイピング例
 */
export async function example6_simpleScraping() {
  // Proxyクラスを通じてスクレイパーを取得
  const scraper = Proxy.getScraper()

  try {
    // ブラウザを起動
    await scraper.launch({ headless: true })

    // スクレイピング実行
    const result = await scraper.scrape(
      "https://example.com",
      async (page) => {
        // ページタイトルを取得
        const title = await page.title()

        // ページから商品情報を抽出（例）
        const products = await page.evaluate(() => {
          const items = document.querySelectorAll(".product-item")
          return Array.from(items).map((item) => ({
            name: item.querySelector(".product-name")?.textContent || "",
            price: item.querySelector(".product-price")?.textContent || "",
          }))
        })

        return { title, products }
      }
    )

    if (result.success) {
      console.log("✅ スクレイピング成功:", result.data)
      console.log("🔒 プロキシ使用:", result.proxyUsed)
      return result.data
    } else {
      console.error("❌ スクレイピング失敗:", result.error)
      return null
    }
  } finally {
    // 必ずブラウザを閉じる
    await scraper.close()
  }
}

/**
 * 複数ページのスクレイピング例
 */
export async function example7_multiPageScraping() {
  const scraper = Proxy.getScraper()

  try {
    await scraper.launch()

    const urls = [
      "https://example.com/page1",
      "https://example.com/page2",
      "https://example.com/page3",
    ]

    const results = []

    for (const url of urls) {
      const result = await scraper.scrape(url, async (page) => {
        return await page.evaluate(() => ({
          title: document.title,
          content: document.body.textContent || "",
        }))
      })

      if (result.success) {
        results.push(result.data)
      }
    }

    console.log(`✅ ${results.length}/${urls.length}ページのスクレイピングに成功`)
    return results
  } finally {
    await scraper.close()
  }
}

// ========================================
// 例8: プロキシモードの判定と処理分岐
// ========================================

/**
 * 環境に応じた処理分岐の例
 */
export async function example8_conditionalProcessing() {
  // プロキシモードが有効かどうかを確認
  const isProxyMode = Proxy.isProxyEnabled()

  if (isProxyMode) {
    console.log("🔐 プロキシモード（SERVICE_ROLE_KEY使用）")
    console.log("⚠️  全権限で動作中 - サーバーサイドでのみ使用してください")

    // プロキシモードの場合、RLSをバイパスして全データにアクセス可能
    const supabase = Proxy.getSupabase()
    const { data } = await supabase.from("products").select("*")
    console.log(`📦 全商品数: ${data?.length}`)
  } else {
    console.log("🔓 通常モード（ANON_KEY使用）")
    console.log("✅ RLS制限付きで動作中 - クライアントサイドでも安全")

    // 通常モードの場合、RLSポリシーに従ったアクセス
    const supabase = Proxy.getSupabase()
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_hidden", false) // RLSで制限された範囲のみ

    console.log(`📦 表示可能な商品数: ${data?.length}`)
  }
}

// ========================================
// 例9: エラーハンドリング
// ========================================

/**
 * エラーハンドリングの例
 */
export async function example9_errorHandling() {
  const supabase = Proxy.getSupabase()

  try {
    // 存在しない商品IDで取得を試みる
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", "non-existent-id")
      .single()

    if (error) {
      // Supabaseエラーの処理
      if (error.code === "PGRST116") {
        console.log("ℹ️  商品が見つかりませんでした")
        return null
      }

      throw new Error(`データベースエラー: ${error.message}`)
    }

    return data
  } catch (error) {
    // その他のエラーの処理
    console.error("❌ 予期しないエラー:", error)
    return null
  }
}

/**
 * スクレイピングのエラーハンドリング例
 */
export async function example10_scrapingErrorHandling() {
  const scraper = Proxy.getScraper()

  try {
    await scraper.launch()

    const result = await scraper.scrape(
      "https://invalid-url-example.com",
      async (page) => {
        return await page.evaluate(() => ({
          title: document.title,
        }))
      },
      { timeout: 10000 } // 10秒でタイムアウト
    )

    if (!result.success) {
      console.error("❌ スクレイピングエラー:", result.error)
      console.log("🔒 プロキシ使用:", result.proxyUsed)

      // エラーに応じた処理
      if (result.error?.includes("timeout")) {
        console.log("⏱️  タイムアウトしました。リトライを推奨します。")
      } else if (result.error?.includes("navigation")) {
        console.log("🔗 URLにアクセスできませんでした。")
      }

      return null
    }

    return result.data
  } catch (error) {
    console.error("❌ 致命的エラー:", error)
    return null
  } finally {
    await scraper.close()
  }
}

// ========================================
// 例11: トランザクション処理
// ========================================

/**
 * トランザクション的な処理の例
 */
export async function example11_transactionLikeProcessing() {
  const supabase = Proxy.getSupabase()

  // 複数の操作を実行
  try {
    // 1. 商品を作成
    const { data: newProduct, error: createError } = await supabase
      .from("products")
      .insert({
        shop_type: "official",
        shop_name: "Test Shop",
        name: "Test Product",
        price: 1000,
      })
      .select()
      .single()

    if (createError) throw createError

    // 2. 作成した商品を更新
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({ price: 1500 })
      .eq("id", newProduct.id)
      .select()
      .single()

    if (updateError) {
      // エラーが発生したら作成した商品を削除（ロールバック的な処理）
      await supabase.from("products").delete().eq("id", newProduct.id)
      throw updateError
    }

    console.log("✅ 商品の作成と更新に成功しました")
    return updatedProduct
  } catch (error) {
    console.error("❌ 処理に失敗しました:", error)
    throw error
  }
}

// ========================================
// 例12: バッチ処理
// ========================================

/**
 * バッチ処理の例
 */
export async function example12_batchProcessing() {
  const supabase = Proxy.getSupabase()

  // 複数の商品を一度に挿入
  const products: ProductInsert[] = [
    {
      shop_type: "official",
      shop_name: "Batch Shop",
      name: "Product 1",
      price: 1000,
    },
    {
      shop_type: "official",
      shop_name: "Batch Shop",
      name: "Product 2",
      price: 2000,
    },
    {
      shop_type: "official",
      shop_name: "Batch Shop",
      name: "Product 3",
      price: 3000,
    },
  ]

  const { data, error } = await supabase
    .from("products")
    .insert(products)
    .select()

  if (error) {
    console.error("❌ バッチ挿入に失敗しました:", error)
    return []
  }

  console.log(`✅ ${data.length}件の商品を挿入しました`)
  return data
}

// ========================================
// 例13: API Routes での使用
// ========================================

/**
 * API Routesでの使用例（Next.js）
 *
 * ファイル: src/app/api/products/route.ts
 */
export async function example13_apiRoute() {
  // API Routesはサーバーサイドなので、USE_PROXY=trueでも安全
  const supabase = Proxy.getSupabase()

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return {
      error: error.message,
      status: 500,
    }
  }

  return {
    data,
    status: 200,
  }
}

// ========================================
// 例14: Server Components での使用
// ========================================

/**
 * Server Componentsでの使用例（Next.js）
 *
 * ファイル: src/app/products/page.tsx
 */
export async function example14_serverComponent() {
  // Server ComponentsもサーバーサイドなのでUSE_PROXY=trueでも安全
  const supabase = Proxy.getSupabase()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_hidden", false)

  // Server Componentでは直接データを返却できる
  return products || []
}

// ========================================
// 使用例のまとめ
// ========================================

/**
 * すべての例を実行するデモ関数（開発用）
 */
export async function runAllExamples() {
  console.log("=== Proxyクラス使用例デモ開始 ===\n")

  try {
    console.log("📝 例1: 商品一覧取得")
    await example1_getProducts()

    console.log("\n📝 例8: プロキシモード判定")
    await example8_conditionalProcessing()

    console.log("\n📝 例9: エラーハンドリング")
    await example9_errorHandling()

    console.log("\n=== デモ完了 ===")
  } catch (error) {
    console.error("デモ実行中にエラーが発生しました:", error)
  }
}
