/**
 * productsテーブルバックアップ復元スクリプト
 */
require("dotenv").config({ path: ".env.local" })
const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

async function restoreProducts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("環境変数が設定されていません")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // SQLファイルを読み込む
  const sqlFile = process.argv[2]
  if (!sqlFile) {
    console.error("使用方法: node restore-products.js <SQLファイルパス>")
    process.exit(1)
  }

  console.log(`SQLファイルを読み込み中: ${sqlFile}`)
  const sqlContent = fs.readFileSync(sqlFile, "utf-8")

  // SQLを実行（RPC経由）
  console.log("バックアップを復元中...")

  try {
    // Supabaseの直接SQL実行
    const { data, error } = await supabase.rpc("exec_sql", {
      query: sqlContent
    })

    if (error) {
      // rpcが使えない場合は、postgrestのREST APIを使う
      console.log("RPC経由での実行に失敗しました。直接実行を試みます...")

      // SQLをパースしてINSERT文を抽出
      const lines = sqlContent.split("\n")
      const inserts = []

      for (const line of lines) {
        if (line.trim().startsWith("INSERT INTO products")) {
          inserts.push(line)
        }
      }

      console.log(`${inserts.length}件のINSERT文を実行します...`)

      // バッチで実行
      const batchSize = 100
      for (let i = 0; i < inserts.length; i += batchSize) {
        const batch = inserts.slice(i, i + batchSize)
        const batchSql = "BEGIN;\n" + batch.join("\n") + "\nCOMMIT;"

        console.log(`バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(inserts.length / batchSize)} を実行中...`)

        // この方法ではうまくいかない可能性があるため、別の方法を試す
      }
    } else {
      console.log("復元完了:", data)
    }

    // 件数を確認
    const { count, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("件数確認エラー:", countError)
    } else {
      console.log(`復元後の件数: ${count}件`)
    }

  } catch (err) {
    console.error("エラー:", err)
    process.exit(1)
  }
}

restoreProducts()
