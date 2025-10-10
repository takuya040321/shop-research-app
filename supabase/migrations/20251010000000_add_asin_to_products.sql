-- productsテーブルにasinカラムを追加
-- 商品に直接ASINを保持し、UI入力・表示を改善

-- ステップ1: asinカラムを追加
ALTER TABLE products ADD COLUMN asin TEXT;

-- ステップ2: 既存のproduct_asinsからasinを取得してproductsに設定
UPDATE products p
SET asin = pa.asin
FROM product_asins pa
WHERE p.source_url = pa.source_url
AND p.source_url IS NOT NULL;

-- ステップ3: インデックスを作成（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);

-- ステップ4: コメント追加
COMMENT ON COLUMN products.asin IS 'ASIN（Amazon Standard Identification Number）。商品に紐付くASINコード。';
