-- Shop Research App 本番用データベーススキーマ
-- Supabase PostgreSQL用（RLSポリシー付き）

-- updated_at自動更新関数の作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. ショップカテゴリテーブル
CREATE TABLE IF NOT EXISTS shop_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('official', 'rakuten', 'yahoo')),
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    parent_type VARCHAR(20),
    hierarchy_level INTEGER DEFAULT 1 CHECK (hierarchy_level BETWEEN 1 AND 4),
    sort_order INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, type, name)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_shop_categories_user_id ON shop_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_categories_type ON shop_categories(type);
CREATE INDEX IF NOT EXISTS idx_shop_categories_parent_type ON shop_categories(parent_type);
CREATE INDEX IF NOT EXISTS idx_shop_categories_is_enabled ON shop_categories(is_enabled);

-- RLSポリシー
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own shop_categories"
ON shop_categories FOR ALL
USING (auth.uid() = user_id);

-- 更新日時トリガー
CREATE TRIGGER update_shop_categories_updated_at
    BEFORE UPDATE ON shop_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. 商品テーブル
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    shop_category_id UUID REFERENCES shop_categories(id) ON DELETE SET NULL,
    shop_type VARCHAR(20) CHECK (shop_type IN ('official', 'rakuten', 'yahoo')),
    shop_name VARCHAR(50),
    name VARCHAR(500) NOT NULL,
    price DECIMAL(10,2),
    sale_price DECIMAL(10,2),
    image_url TEXT,
    source_url TEXT,
    is_hidden BOOLEAN DEFAULT FALSE,
    memo TEXT,
    original_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_category_id ON products(shop_category_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_type ON products(shop_type);
CREATE INDEX IF NOT EXISTS idx_products_shop_name ON products(shop_name);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_is_hidden ON products(is_hidden);
CREATE INDEX IF NOT EXISTS idx_products_original_product_id ON products(original_product_id);

-- RLSポリシー
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own products"
ON products FOR ALL
USING (auth.uid() = user_id);

-- 更新日時トリガー
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. ASINテーブル
CREATE TABLE IF NOT EXISTS asins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asin VARCHAR(10) NOT NULL CHECK (LENGTH(asin) = 10),
    amazon_name VARCHAR(500),
    amazon_price DECIMAL(10,2),
    monthly_sales INTEGER DEFAULT 0 CHECK (monthly_sales >= 0),
    fee_rate DECIMAL(5,2) DEFAULT 15.0 CHECK (fee_rate >= 0 AND fee_rate <= 100),
    fba_fee DECIMAL(10,2) DEFAULT 0 CHECK (fba_fee >= 0),
    jan_code VARCHAR(13),
    has_amazon BOOLEAN DEFAULT FALSE,
    has_official BOOLEAN DEFAULT FALSE,
    complaint_count INTEGER DEFAULT 0 CHECK (complaint_count >= 0),
    is_dangerous BOOLEAN DEFAULT FALSE,
    is_per_carry_ng BOOLEAN DEFAULT FALSE,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, asin)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_asins_user_id ON asins(user_id);
CREATE INDEX IF NOT EXISTS idx_asins_asin ON asins(asin);
CREATE INDEX IF NOT EXISTS idx_asins_jan_code ON asins(jan_code);

-- RLSポリシー
ALTER TABLE asins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own asins"
ON asins FOR ALL
USING (auth.uid() = user_id);

-- 更新日時トリガー
CREATE TRIGGER update_asins_updated_at
    BEFORE UPDATE ON asins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 商品-ASIN紐付けテーブル
CREATE TABLE IF NOT EXISTS product_asins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    asin_id UUID REFERENCES asins(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(product_id, asin_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_product_asins_user_id ON product_asins(user_id);
CREATE INDEX IF NOT EXISTS idx_product_asins_product_id ON product_asins(product_id);
CREATE INDEX IF NOT EXISTS idx_product_asins_asin_id ON product_asins(asin_id);

-- RLSポリシー
ALTER TABLE product_asins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own product_asins"
ON product_asins FOR ALL
USING (auth.uid() = user_id);

-- 5. ショップ別割引設定テーブル
CREATE TABLE IF NOT EXISTS shop_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    shop_name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, shop_name)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_shop_discounts_user_id ON shop_discounts(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_discounts_shop_name ON shop_discounts(shop_name);
CREATE INDEX IF NOT EXISTS idx_shop_discounts_is_enabled ON shop_discounts(is_enabled);

-- RLSポリシー
ALTER TABLE shop_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own shop_discounts"
ON shop_discounts FOR ALL
USING (auth.uid() = user_id);

-- 更新日時トリガー
CREATE TRIGGER update_shop_discounts_updated_at
    BEFORE UPDATE ON shop_discounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. API設定テーブル
CREATE TABLE IF NOT EXISTS api_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('rakuten', 'yahoo')),
    settings JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, provider)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_api_settings_user_id ON api_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_api_settings_provider ON api_settings(provider);
CREATE INDEX IF NOT EXISTS idx_api_settings_is_enabled ON api_settings(is_enabled);

-- RLSポリシー
ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own api_settings"
ON api_settings FOR ALL
USING (auth.uid() = user_id);

-- 更新日時トリガー
CREATE TRIGGER update_api_settings_updated_at
    BEFORE UPDATE ON api_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期データ挿入用のサンプル（オプション）
-- 実際の利用時には個別にデータを挿入する