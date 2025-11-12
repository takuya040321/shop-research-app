/**
 * productsテーブルのバックアップスクリプト
 *
 * 実行方法:
 * node scripts/backup-products.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// 環境変数から接続情報を取得
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ エラー: Supabase接続情報が見つかりません");
  console.error("NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を確認してください");
  process.exit(1);
}

// Supabaseクライアントを初期化
const supabase = createClient(supabaseUrl, supabaseKey);

async function backupProducts() {
  try {
    console.log("🔄 productsテーブルのバックアップを開始します...");

    // まず総件数を取得
    const { count: totalCount, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    if (countError) {
      throw countError;
    }

    console.log(`📊 総レコード数: ${totalCount}件`);

    // 全データをページネーションで取得（1000件ずつ）
    let allData = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      console.log(`🔄 ${from + 1}〜${Math.min(from + pageSize, totalCount)}件目を取得中...`);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        from += pageSize;

        if (data.length < pageSize) {
          hasMore = false;
        }
      }
    }

    const data = allData;
    const count = totalCount;
    console.log(`✅ ${allData.length}件のデータを取得しました`);

    // バックアップディレクトリを作成
    const backupDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // タイムスタンプ付きファイル名を生成
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `products_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    // バックアップデータの構造
    const backup = {
      table: "products",
      timestamp: new Date().toISOString(),
      count: count,
      data: data,
    };

    // JSONファイルとして保存
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), "utf-8");

    console.log(`✅ バックアップが完成しました: ${filepath}`);
    console.log(`📊 統計情報:`);
    console.log(`   - テーブル名: products`);
    console.log(`   - レコード数: ${count}件`);
    console.log(`   - ファイルサイズ: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);

    // SQLインサート文も生成（オプション）
    await generateSqlBackup(data, timestamp, backupDir);

  } catch (error) {
    console.error("❌ バックアップ中にエラーが発生しました:", error.message);
    process.exit(1);
  }
}

async function generateSqlBackup(data, timestamp, backupDir) {
  try {
    console.log("\n🔄 SQLバックアップファイルを生成中...");

    const filename = `products_backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    let sqlContent = `-- productsテーブルのバックアップ
-- 生成日時: ${new Date().toISOString()}
-- レコード数: ${data.length}

BEGIN;

-- 既存のデータをクリア（必要に応じてコメント解除）
-- TRUNCATE TABLE products CASCADE;

`;

    // INSERT文を生成
    data.forEach((row) => {
      const values = [
        `'${row.id}'`,
        row.shop_type ? `'${row.shop_type}'` : "NULL",
        row.shop_name ? `'${escapeSql(row.shop_name)}'` : "NULL",
        row.name ? `'${escapeSql(row.name)}'` : "NULL",
        row.price ? `${row.price}` : "NULL",
        row.sale_price ? `${row.sale_price}` : "NULL",
        row.image_url ? `'${escapeSql(row.image_url)}'` : "NULL",
        row.source_url ? `'${escapeSql(row.source_url)}'` : "NULL",
        row.original_product_id ? `'${row.original_product_id}'` : "NULL",
        row.created_at ? `'${row.created_at}'` : "NULL",
        row.updated_at ? `'${row.updated_at}'` : "NULL",
        row.asin ? `'${escapeSql(row.asin)}'` : "NULL",
        row.is_favorite !== null ? row.is_favorite : "false",
        row.is_hidden !== null ? row.is_hidden : "false",
      ];

      sqlContent += `INSERT INTO products (id, shop_type, shop_name, name, price, sale_price, image_url, source_url, original_product_id, created_at, updated_at, asin, is_favorite, is_hidden) VALUES (${values.join(", ")});\n`;
    });

    sqlContent += "\nCOMMIT;\n";

    fs.writeFileSync(filepath, sqlContent, "utf-8");
    console.log(`✅ SQLバックアップが完成しました: ${filepath}`);
    console.log(`📊 ファイルサイズ: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error("⚠️  SQLバックアップの生成に失敗しました:", error.message);
  }
}

// SQL文字列のエスケープ
function escapeSql(str) {
  if (!str) return "";
  return str.replace(/'/g, "''");
}

// スクリプト実行
backupProducts();
