/**
 * 分割されたSQLバッチファイルを順番に実行
 */
require("dotenv").config({ path: ".env.local" })
const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

async function executeBatches() {
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

  const batchDir = "/tmp/restore_products"
  const files = fs.readdirSync(batchDir).filter(f => f.startsWith("batch_")).sort()

  console.log(`${files.length}個のバッチファイルを実行します...`)

  let totalInserted = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const filePath = path.join(batchDir, file)
    const sqlContent = fs.readFileSync(filePath, "utf-8")
    const lines = sqlContent.trim().split("\n")

    console.log(`\nバッチ ${i + 1}/${files.length} (${file}): ${lines.length}件のINSERT文を実行中...`)

    try {
      // BEGIN/COMMITで囲んで実行
      const batchSql = "BEGIN;\n" + lines.join("\n") + "\nCOMMIT;"

      const { error } = await supabase.rpc("exec_sql", { query: batchSql })

      if (error) {
        console.error(`バッチ ${i + 1} 実行エラー:`, error.message)

        // rpcが使えない場合は、POSTGRESTのSQL実行を試みる
        console.log("別の方法で実行を試みます...")

        // 各INSERT文を個別に実行
        let successCount = 0
        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const { error: insertError } = await supabase.rpc("exec_sql", { query: line })

            if (insertError) {
              console.error(`INSERT実行エラー:`, insertError.message)
            } else {
              successCount++
            }
          } catch (err) {
            console.error(`INSERT実行エラー:`, err.message)
          }
        }

        console.log(`バッチ ${i + 1}: ${successCount}/${lines.length}件成功`)
        totalInserted += successCount
      } else {
        console.log(`バッチ ${i + 1}: 完了 (${lines.length}件)`)
        totalInserted += lines.length
      }

    } catch (err) {
      console.error(`バッチ ${i + 1} 実行エラー:`, err.message)
    }

    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\n復元完了: 合計 ${totalInserted}件`)

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

executeBatches().catch(err => {
  console.error("エラー:", err)
  process.exit(1)
})
