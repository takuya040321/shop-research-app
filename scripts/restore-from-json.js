/**
 * JSONバックアップからproductsテーブルを復元
 */
require("dotenv").config({ path: ".env.local" })
const fs = require("fs")
const { createClient } = require("@supabase/supabase-js")

async function restoreFromJson() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("環境変数が設定されていません")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // JSONファイルを読み込む
  const jsonFile = process.argv[2]
  if (!jsonFile) {
    console.error("使用方法: node restore-from-json.js <JSONファイルパス>")
    process.exit(1)
  }

  console.log(`JSONファイルを読み込み中: ${jsonFile}`)
  const jsonContent = fs.readFileSync(jsonFile, "utf-8")
  const backup = JSON.parse(jsonContent)
  const products = backup.data

  if (!products || !Array.isArray(products)) {
    console.error("JSONファイルの形式が不正です")
    process.exit(1)
  }

  console.log(`バックアップ情報:`)
  console.log(`  テーブル: ${backup.table}`)
  console.log(`  タイムスタンプ: ${backup.timestamp}`)
  console.log(`  レコード数: ${backup.count}`)
  console.log(`${products.length}件のレコードを復元します...`)

  // バッチサイズ
  const batchSize = 100
  let totalInserted = 0

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    console.log(`バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)} (${batch.length}件) を挿入中...`)

    try {
      const { data, error } = await supabase
        .from("products")
        .insert(batch)

      if (error) {
        console.error(`バッチ挿入エラー:`, error.message)
        console.error(`詳細:`, error)
      } else {
        console.log(`バッチ ${Math.floor(i / batchSize) + 1}: 成功`)
        totalInserted += batch.length
      }
    } catch (err) {
      console.error(`バッチ挿入エラー:`, err.message)
    }

    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log(`\n復元完了: 合計 ${totalInserted}件挿入`)

  // 件数を確認
  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })

  if (countError) {
    console.error("件数確認エラー:", countError)
  } else {
    console.log(`最終件数: ${count}件`)
  }
}

restoreFromJson().catch(err => {
  console.error("エラー:", err)
  process.exit(1)
})
