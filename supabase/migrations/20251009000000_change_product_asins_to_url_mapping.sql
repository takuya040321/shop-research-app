-- product_asinsテーブルをURL-ASIN紐付けに変更
-- 商品削除後の再スクレイピング時にASIN紐付けが失われる問題を解決

-- ステップ1: 既存データを一時テーブルにバックアップ
CREATE TEMP TABLE product_asins_backup AS
SELECT
  pa.id,
  p.source_url,
  a.asin,
  pa.created_at
FROM product_asins pa
JOIN products p ON pa.product_id = p.id
JOIN asins a ON pa.asin_id = a.id
WHERE p.source_url IS NOT NULL;

-- ステップ2: 外部キー制約を削除
ALTER TABLE product_asins DROP CONSTRAINT IF EXISTS product_asins_product_id_fkey;
ALTER TABLE product_asins DROP CONSTRAINT IF EXISTS product_asins_asin_id_fkey;

-- ステップ3: 既存カラムを削除
ALTER TABLE product_asins DROP COLUMN IF EXISTS product_id;
ALTER TABLE product_asins DROP COLUMN IF EXISTS asin_id;

-- ステップ4: 新しいカラムを追加
ALTER TABLE product_asins ADD COLUMN source_url TEXT;
ALTER TABLE product_asins ADD COLUMN asin TEXT;

-- ステップ5: バックアップからデータを復元
UPDATE product_asins pa
SET
  source_url = b.source_url,
  asin = b.asin
FROM product_asins_backup b
WHERE pa.id = b.id;

-- ステップ6: NULLデータを削除（source_urlがないデータ）
DELETE FROM product_asins WHERE source_url IS NULL OR asin IS NULL;

-- ステップ7: NOT NULL制約を追加
ALTER TABLE product_asins ALTER COLUMN source_url SET NOT NULL;
ALTER TABLE product_asins ALTER COLUMN asin SET NOT NULL;

-- ステップ8: UNIQUE制約を追加
ALTER TABLE product_asins ADD CONSTRAINT product_asins_source_url_key UNIQUE (source_url);

-- ステップ9: 外部キー制約を追加（asinsテーブルのasinカラムを参照）
ALTER TABLE product_asins ADD CONSTRAINT product_asins_asin_fkey
  FOREIGN KEY (asin) REFERENCES asins(asin) ON DELETE RESTRICT;

-- ステップ10: インデックスを作成
CREATE INDEX IF NOT EXISTS idx_product_asins_source_url ON product_asins(source_url);
CREATE INDEX IF NOT EXISTS idx_product_asins_asin ON product_asins(asin);

-- ステップ11: updated_atトリガーを追加（存在しない場合）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_asins_updated_at ON product_asins;
CREATE TRIGGER update_product_asins_updated_at
  BEFORE UPDATE ON product_asins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
