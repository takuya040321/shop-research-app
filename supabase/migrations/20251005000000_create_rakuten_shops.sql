-- 楽天ショップ設定テーブル
CREATE TABLE IF NOT EXISTS rakuten_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL UNIQUE, -- 内部識別用ID（URLパスに使用）
  display_name TEXT NOT NULL, -- サイドバー・ヘッダー表示名
  shop_code TEXT, -- 楽天ショップコード
  genre_id TEXT, -- 楽天ジャンルID
  default_keyword TEXT, -- デフォルト検索キーワード（ブランド名など）
  is_active BOOLEAN NOT NULL DEFAULT true, -- アクティブフラグ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_rakuten_shops_shop_id ON rakuten_shops(shop_id);
CREATE INDEX idx_rakuten_shops_is_active ON rakuten_shops(is_active);

-- updated_at自動更新トリガー
CREATE TRIGGER update_rakuten_shops_updated_at
  BEFORE UPDATE ON rakuten_shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE rakuten_shops IS '楽天ショップ（ブランド）の設定情報を管理するテーブル';
COMMENT ON COLUMN rakuten_shops.shop_id IS '内部識別用ID（URLパスに使用、例: muji, vt）';
COMMENT ON COLUMN rakuten_shops.display_name IS 'サイドバーやヘッダーに表示する名前';
COMMENT ON COLUMN rakuten_shops.shop_code IS '楽天API用のショップコード';
COMMENT ON COLUMN rakuten_shops.genre_id IS '楽天API用のジャンルID';
COMMENT ON COLUMN rakuten_shops.default_keyword IS 'デフォルト検索キーワード（ブランド名など）';
COMMENT ON COLUMN rakuten_shops.is_active IS 'アクティブ状態（無効化したショップは非表示）';
