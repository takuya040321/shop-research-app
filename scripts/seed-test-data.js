#!/usr/bin/env node

/**
 * テストデータ投入スクリプト
 * 開発・テスト用のサンプルデータをSupabaseに投入
 */

const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

// Supabaseクライアント初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Supabase環境変数が設定されていません")
  console.error("NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// テストデータ定義
const testData = {
  shopCategories: [
    {
      type: "official",
      name: "cosmetics",
      display_name: "化粧品",
      hierarchy_level: 1,
      sort_order: 1,
      is_enabled: true
    },
    {
      type: "rakuten",
      name: "beauty",
      display_name: "美容・コスメ・香水",
      hierarchy_level: 1,
      sort_order: 1,
      is_enabled: true
    },
    {
      type: "yahoo",
      name: "beauty",
      display_name: "美容、健康",
      hierarchy_level: 1,
      sort_order: 1,
      is_enabled: true
    }
  ],

  asins: [
    {
      asin: "B08XXXXX01",
      amazon_name: "テスト化粧水 200ml",
      amazon_price: 2980,
      monthly_sales: 150,
      fee_rate: 15.0,
      fba_fee: 500,
      jan_code: "4901234567890",
      has_amazon: true,
      has_official: true,
      complaint_count: 0,
      is_dangerous: false,
      is_per_carry_ng: false,
      memo: "テスト用ASIN 1"
    },
    {
      asin: "B08XXXXX02",
      amazon_name: "テスト美容液 30ml",
      amazon_price: 4500,
      monthly_sales: 80,
      fee_rate: 15.0,
      fba_fee: 450,
      jan_code: "4901234567891",
      has_amazon: true,
      has_official: false,
      complaint_count: 2,
      is_dangerous: false,
      is_per_carry_ng: true,
      memo: "テスト用ASIN 2"
    }
  ],

  products: [
    {
      shop_type: "official",
      shop_name: "公式オンラインストア",
      name: "プレミアム化粧水 200ml",
      price: 2500,
      sale_price: 2200,
      image_url: "https://example.com/product1.jpg",
      source_url: "https://official-store.com/product1",
      is_hidden: false,
      memo: "公式サイトのテスト商品"
    },
    {
      shop_type: "rakuten",
      shop_name: "楽天コスメショップ",
      name: "高級美容液 30ml",
      price: 4200,
      sale_price: 3980,
      image_url: "https://example.com/product2.jpg",
      source_url: "https://rakuten.co.jp/shop/product2",
      is_hidden: false,
      memo: "楽天のテスト商品"
    },
    {
      shop_type: "yahoo",
      shop_name: "Yahoo!ビューティー",
      name: "保湿クリーム 50g",
      price: 3200,
      sale_price: 2980,
      image_url: "https://example.com/product3.jpg",
      source_url: "https://shopping.yahoo.co.jp/product3",
      is_hidden: false,
      memo: "Yahoo!のテスト商品"
    }
  ],

  shopDiscounts: [
    {
      shop_name: "公式オンラインストア",
      discount_type: "percentage",
      discount_value: 10.0,
      is_enabled: true
    },
    {
      shop_name: "楽天コスメショップ",
      discount_type: "fixed",
      discount_value: 500,
      is_enabled: true
    }
  ]
}

// ユーザーID取得（テスト用）
async function getTestUserId() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers()

  if (error) {
    console.error("❌ ユーザー取得エラー:", error.message)
    return null
  }

  if (users.length === 0) {
    console.log("⚠️  ユーザーが存在しません。テストユーザーを作成してください")
    return null
  }

  return users[0].id
}

// テストデータ投入関数
async function seedTestData() {
  console.log("🌱 テストデータの投入を開始...")

  try {
    const userId = await getTestUserId()
    if (!userId) {
      console.error("❌ テストユーザーIDが取得できませんでした")
      return
    }

    console.log(`👤 テストユーザーID: ${userId}`)

    // 1. ショップカテゴリ投入
    console.log("📂 ショップカテゴリを投入中...")
    for (const category of testData.shopCategories) {
      const { error } = await supabase
        .from("shop_categories")
        .insert({ ...category, user_id: userId })

      if (error) {
        console.error(`❌ カテゴリ投入エラー [${category.name}]:`, error.message)
      } else {
        console.log(`✅ カテゴリ投入完了: ${category.display_name}`)
      }
    }

    // 2. ASIN投入
    console.log("🏷️  ASINを投入中...")
    for (const asin of testData.asins) {
      const { error } = await supabase
        .from("asins")
        .insert({ ...asin, user_id: userId })

      if (error) {
        console.error(`❌ ASIN投入エラー [${asin.asin}]:`, error.message)
      } else {
        console.log(`✅ ASIN投入完了: ${asin.asin}`)
      }
    }

    // 3. 商品投入
    console.log("🛍️  商品を投入中...")
    for (const product of testData.products) {
      const { error } = await supabase
        .from("products")
        .insert({ ...product, user_id: userId })

      if (error) {
        console.error(`❌ 商品投入エラー [${product.name}]:`, error.message)
      } else {
        console.log(`✅ 商品投入完了: ${product.name}`)
      }
    }

    // 4. ショップ割引設定投入
    console.log("💰 ショップ割引設定を投入中...")
    for (const discount of testData.shopDiscounts) {
      const { error } = await supabase
        .from("shop_discounts")
        .insert({ ...discount, user_id: userId })

      if (error) {
        console.error(`❌ 割引設定投入エラー [${discount.shop_name}]:`, error.message)
      } else {
        console.log(`✅ 割引設定投入完了: ${discount.shop_name}`)
      }
    }

    console.log("\n🎉 テストデータの投入が完了しました！")

  } catch (error) {
    console.error("❌ テストデータ投入中にエラーが発生しました:", error.message)
  }
}

// データベースリセット関数
async function resetDatabase() {
  console.log("🗑️  データベースをリセット中...")

  try {
    const tables = ["product_asins", "products", "asins", "shop_categories", "shop_discounts", "api_settings"]

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // 全件削除

      if (error) {
        console.error(`❌ テーブル削除エラー [${table}]:`, error.message)
      } else {
        console.log(`✅ テーブルリセット完了: ${table}`)
      }
    }

    console.log("🎉 データベースのリセットが完了しました")

  } catch (error) {
    console.error("❌ データベースリセット中にエラーが発生しました:", error.message)
  }
}

// コマンドライン引数処理
async function main() {
  const command = process.argv[2]

  switch (command) {
    case "seed":
      await seedTestData()
      break
    case "reset":
      await resetDatabase()
      break
    case "reset-and-seed":
      await resetDatabase()
      await seedTestData()
      break
    default:
      console.log("使用方法:")
      console.log("  node scripts/seed-test-data.js seed           # テストデータを投入")
      console.log("  node scripts/seed-test-data.js reset          # データベースをリセット")
      console.log("  node scripts/seed-test-data.js reset-and-seed # リセット後にテストデータを投入")
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  main()
}

module.exports = {
  seedTestData,
  resetDatabase,
  testData
}