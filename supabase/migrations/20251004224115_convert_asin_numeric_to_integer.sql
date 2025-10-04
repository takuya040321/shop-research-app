-- ASINテーブルの数値フィールドを小数点第二位→整数に変更
-- amazon_price: numeric(10,2) → integer
-- fee_rate: numeric(5,2) → integer (小数点第一位を四捨五入)
-- fba_fee: numeric(10,2) → integer

-- 1. amazon_priceを整数型に変更（既存データは小数点以下切り捨て）
ALTER TABLE asins
  ALTER COLUMN amazon_price TYPE INTEGER
  USING FLOOR(COALESCE(amazon_price, 0))::INTEGER;

-- 2. fee_rateを整数型に変更（既存データは小数点第一位を四捨五入）
ALTER TABLE asins
  ALTER COLUMN fee_rate TYPE INTEGER
  USING ROUND(COALESCE(fee_rate, 15))::INTEGER;

-- 3. fba_feeを整数型に変更（既存データは小数点以下切り捨て）
ALTER TABLE asins
  ALTER COLUMN fba_fee TYPE INTEGER
  USING FLOOR(COALESCE(fba_fee, 0))::INTEGER;

-- 4. デフォルト値と制約を再設定
ALTER TABLE asins
  ALTER COLUMN amazon_price DROP NOT NULL,
  ALTER COLUMN fee_rate SET DEFAULT 15,
  ALTER COLUMN fee_rate SET NOT NULL,
  ALTER COLUMN fba_fee SET DEFAULT 0,
  ALTER COLUMN fba_fee SET NOT NULL;

-- 5. チェック制約を再作成
ALTER TABLE asins
  DROP CONSTRAINT IF EXISTS asins_fee_rate_check;

ALTER TABLE asins
  ADD CONSTRAINT asins_fee_rate_check
  CHECK (fee_rate >= 0 AND fee_rate <= 100);

ALTER TABLE asins
  DROP CONSTRAINT IF EXISTS asins_fba_fee_check;

ALTER TABLE asins
  ADD CONSTRAINT asins_fba_fee_check
  CHECK (fba_fee >= 0);
