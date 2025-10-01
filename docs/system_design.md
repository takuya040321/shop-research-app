# システム設計書

## 1. システム設計概要

### 1.1 設計方針
- **モノリシック構成**: Next.js フルスタックアプリケーション
- **単一責任の原則**: 各コンポーネント・関数の責任を明確化
- **型安全性**: TypeScript による厳密な型定義
- **保守性**: 機能別モジュール分割による可読性向上
- **スケーラビリティ**: 商品数増加に対応する設計

### 1.2 アーキテクチャパターン
- **プレゼンテーション層**: React コンポーネント
- **ビジネスロジック層**: カスタムフック・ユーティリティ関数
- **データアクセス層**: Supabase クライアント・API
- **外部連携層**: スクレイピング・API統合

## 2. システム全体アーキテクチャ

### 2.1 システム構成図
```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                      │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   React App     │  │  Service Worker │              │
│  │  (Next.js SPA)  │  │   (Optional)    │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────┬───────────────────────────────────────────┘
              │ HTTPS
┌─────────────▼───────────────────────────────────────────┐
│                   Next.js Server                        │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   API Routes    │  │   SSR Pages     │              │
│  │                 │  │                 │              │
│  │  ┌───────────┐  │  │  ┌───────────┐  │              │
│  │  │ Auth API  │  │  │  │   Pages   │  │              │
│  │  │Product API│  │  │  │Components │  │              │
│  │  │ ASIN API  │  │  │  │           │  │              │
│  │  │Scrape API │  │  │  └───────────┘  │              │
│  │  └───────────┘  │  └─────────────────┘              │
│  └─────────────────┘                                   │
└─────────────┬───────────────┬───────────────────────────┘
              │               │
              │ REST API      │ Web Scraping
              ▼               ▼
┌─────────────────┐  ┌─────────────────┐
│   Supabase      │  │  External Sites │
│                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │PostgreSQL DB│ │  │ │ VT Official │ │
│ │             │ │  │ │ DHC Official│ │
│ │  ┌───────┐  │ │  │ │ innisfree   │ │
│ │  │products│ │  │  │ │ Rakuten API │ │
│ │  │ asins  │ │  │  │ │  Yahoo API  │ │
│ │  │settings│ │  │  │ └─────────────┘ │
│ │  └───────┘  │ │  └─────────────────┘
│ │             │ │
│ │ ┌───────────┐│ │  ┌─────────────────┐
│ │ │   Auth    ││ │  │  Proxy Server   │
│ │ │ (Google)  ││ │  │   (Optional)    │
│ │ └───────────┘│ │  └─────────────────┘
│ └─────────────┘ │
└─────────────────┘
```

### 2.2 データフロー図
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│  Browser    │───▶│ Next.js App │
│ Interaction │    │   (React)   │    │  Component  │
└─────────────┘    └─────────────┘    └─────────────┘
                                               │
                                               ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Supabase   │◀───│ API Routes  │◀───│   Custom    │
│  Database   │    │  (Server)   │    │   Hooks     │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
┌─────────────┐    ┌─────────────┐
│ External    │◀───│ Scraping    │
│   Sites     │    │  Service    │
└─────────────┘    └─────────────┘
```

## 3. アプリケーション層設計

### 3.1 ディレクトリ構造
```
shop-research-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── (dashboard)/        # メイン機能ページ（共通レイアウト）
│   │   │   ├── layout.tsx      # 共通レイアウト（サイドバー含む）
│   │   │   ├── dashboard/      # ダッシュボードホーム
│   │   │   ├── products/       # 全商品一覧
│   │   │   ├── asins/          # ASIN管理
│   │   │   └── settings/       # 全体設定
│   │   ├── official/           # 公式サイト（独立ルート）
│   │   │   ├── page.tsx        # 公式サイト一覧
│   │   │   ├── vt/
│   │   │   │   └── page.tsx
│   │   │   ├── dhc/
│   │   │   │   └── page.tsx
│   │   │   └── innisfree/
│   │   │       └── page.tsx
│   │   ├── rakuten/            # 楽天市場（独立ルート）
│   │   │   ├── page.tsx        # 楽天一覧
│   │   │   ├── muji/
│   │   │   │   └── page.tsx
│   │   │   ├── vt/
│   │   │   │   └── page.tsx
│   │   │   └── innisfree/
│   │   │       └── page.tsx
│   │   ├── yahoo/              # Yahoo!ショッピング（独立ルート）
│   │   │   ├── page.tsx        # Yahoo一覧
│   │   │   ├── lohaco/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── dhc/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── vt/
│   │   │   │       └── page.tsx
│   │   │   ├── zozotown/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── dhc/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── vt/
│   │   │   │       └── page.tsx
│   │   │   └── vt/
│   │   │       └── page.tsx
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── asins/
│   │   │   ├── settings/
│   │   │   └── scraping/
│   │   │       ├── official/
│   │   │       │   ├── vt/
│   │   │       │   ├── dhc/
│   │   │       │   └── innisfree/
│   │   │       ├── rakuten/
│   │   │       │   ├── muji/
│   │   │       │   ├── vt/
│   │   │       │   └── innisfree/
│   │   │       └── yahoo/
│   │   │           ├── lohaco/
│   │   │           │   ├── dhc/
│   │   │           │   └── vt/
│   │   │           ├── zozotown/
│   │   │           │   ├── dhc/
│   │   │           │   └── vt/
│   │   │           └── vt/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # UI Components
│   ├── hooks/                # Custom Hooks
│   ├── lib/                  # Utilities
│   ├── store/                # Zustand Store
│   ├── types/                # Type Definitions
│   └── constants/            # Constants
├── public/                   # Static Files
├── .env.local               # Environment Variables
├── next.config.js           # Next.js Configuration
├── tailwind.config.js       # Tailwind Configuration
├── tsconfig.json            # TypeScript Configuration
└── package.json             # Dependencies
```

### 3.2 コンポーネント設計

#### 3.2.1 ページコンポーネント階層
```
App Layout
└── DashboardLayout (メイン機能用)
    ├── Header
    ├── Sidebar
    │   ├── NavigationMenu
    │   └── ShopLinks
    └── MainContent
        ├── DashboardHome (全体概要)
        │   ├── SummaryCards
        │   ├── RecentActivity
        │   └── QuickActions
        ├── AllProductsPage (全商品一覧)
        │   ├── ProductTable
        │   ├── ProductFilters
        │   └── GlobalActions
        ├── CategoryPages (カテゴリ別ページ)
        │   ├── OfficialCategoryPage
        │   ├── RakutenCategoryPage
        │   └── YahooCategoryPage
        ├── ShopPages (ショップ別ページ)
        │   ├── OfficialShopPages
        │   │   ├── VTPage
        │   │   ├── DHCPage
        │   │   └── InnisfreePage
        │   ├── RakutenShopPages
        │   │   ├── MujiPage
        │   │   ├── RakutenVTPage
        │   │   └── RakutenInnisfreePage
        │   └── YahooShopPages
        │       ├── LOHACOPage
        │       │   ├── LOHACODHCPage
        │       │   └── LOHACOVTPage
        │       ├── ZOZOTOWNPage
        │       │   ├── ZOZOTOWNDHCPage
        │       │   └── ZOZOTOWNVTPage
        │       └── YahooVTPage
        ├── ASINManagementPage
        │   ├── ASINTable
        │   ├── ASINUpload
        │   └── ASINLinking
        └── GlobalSettingsPage
            ├── AccountSettings
            ├── DiscountSettings
            └── SystemSettings
```

#### 3.2.2 共通コンポーネント
- Button
- Input
- Table
- Dialog
- Select
- Checkbox
- Loading
- ErrorBoundary
- ProductForm
- AsinForm
- SettingsForm
- FileUploadForm
- ProductTable
- EditableCell
- SortableHeader
- FilterRow
- DashboardLayout
- AuthLayout
- PageHeader
- Sidebar

## 4. API設計

### 4.1 REST API エンドポイント設計

#### 4.1.1 商品API
- **GET /api/products**: 商品一覧取得（検索・ソート・フィルター対応）
- **POST /api/products**: 商品作成
- **PUT /api/products/[id]**: 商品更新
- **DELETE /api/products/[id]**: 商品削除
- **POST /api/products/[id]/copy**: 商品コピー

#### 4.1.2 ASIN API
- **GET /api/asins**: ASIN一覧取得
- **POST /api/asins**: ASIN作成
- **PUT /api/asins/[id]**: ASIN更新
- **POST /api/asins/upload**: ASIN一括アップロード
- **POST /api/products/[productId]/asins/[asinId]/link**: ASIN紐付け

#### 4.1.3 ショップ別スクレイピングAPI
- **POST /api/scraping/official/vt**: VTスクレイピング
- **POST /api/scraping/official/dhc**: DHCスクレイピング
- **POST /api/scraping/official/innisfree**: innisfreeスクレイピング
- **POST /api/scraping/rakuten/muji**: 楽天-無印良品API取得
- **POST /api/scraping/rakuten/vt**: 楽天-VTAPI取得
- **POST /api/scraping/yahoo/lohaco/dhc**: Yahoo-LOHACO-DHCAPI取得
- **POST /api/scraping/yahoo/zozotown/vt**: Yahoo-ZOZOTOWN-VTAPI取得

#### 4.1.4 統計API
- **GET /api/shops/[shopType]/stats**: カテゴリ別統計
- **GET /api/shops/[shopType]/[shopName]/stats**: ショップ別統計
- **GET /api/shops/[shopType]/[shopName]/products**: ショップ別商品一覧

#### 4.1.5 設定API
- **GET /api/settings/discount**: 割引設定取得
- **PUT /api/settings/discount**: 割引設定更新
- **GET /api/settings/rakuten**: 楽天設定取得
- **PUT /api/settings/rakuten**: 楽天設定更新
- **GET /api/settings/yahoo**: Yahoo設定取得
- **PUT /api/settings/yahoo**: Yahoo設定更新

### 4.2 エラーハンドリング設計

#### 4.2.1 統一エラーレスポンス形式
- **エラーコード**: 標準化されたエラーコード体系
- **エラーメッセージ**: ユーザーフレンドリーなメッセージ
- **詳細情報**: 開発者向けの詳細エラー情報
- **タイムスタンプ**: エラー発生時刻
- **リクエストパス**: エラーが発生したAPI パス

#### 4.2.2 主要エラーコード
- **UNAUTHORIZED**: 認証エラー
- **FORBIDDEN**: 認可エラー
- **NOT_FOUND**: リソースが見つからない
- **VALIDATION_ERROR**: バリデーションエラー
- **SCRAPING_ERROR**: スクレイピングエラー
- **DATABASE_ERROR**: データベースエラー
- **EXTERNAL_API_ERROR**: 外部APIエラー

## 5. データベース設計

### 5.1 テーブル設計

#### 5.1.1 users テーブル (Supabase Auth)
Supabase Authが自動管理（参照のみ使用）

#### 5.1.2 shop_categories テーブル（ショップカテゴリ管理）
- **主キー**: id (UUID)
- **外部キー**: user_id (users テーブル)
- **ショップタイプ**: type ('official', 'rakuten', 'yahoo')
- **ショップ名**: name ('vt', 'dhc', 'muji', 'lohaco', 'zozotown', etc.)
- **表示名**: display_name ('VT Cosmetics', '無印良品', 'LOHACO', etc.)
- **親カテゴリ**: parent_type (階層構造用)
- **親ショップ**: parent_shop (LOHACO配下のDHCなど)
- **説明**: description
- **アイコン**: icon
- **有効フラグ**: is_enabled
- **スクレイピング設定**: scraping_config (JSONB)
- **API設定**: api_config (JSONB)
- **楽天固有設定**: rakuten_config (JSONB - shopCode, genreId, keyword)
- **最終実行日時**: last_scraped_at
- **作成日時**: created_at
- **更新日時**: updated_at

#### 5.1.3 products テーブル
- **主キー**: id (UUID)
- **外部キー**: user_id (users テーブル)
- **ショップカテゴリID**: shop_category_id (shop_categories テーブル)
- **商品名**: name
- **価格**: price
- **セール価格**: sale_price
- **画像URL**: image_url
- **ショップタイプ**: shop_type ('official', 'rakuten', 'yahoo')
- **ショップ名**: shop_name ('vt', 'dhc', 'muji', etc.)
- **親ショップ**: parent_shop (階層構造用)
- **ソースURL**: source_url
- **非表示フラグ**: is_hidden
- **メモ**: memo
- **元商品ID**: original_product_id (コピー元商品のID)
- **作成日時**: created_at
- **更新日時**: updated_at

#### 5.1.4 asins テーブル
- **主キー**: id (UUID)
- **外部キー**: user_id (users テーブル)
- **ASIN**: asin (10桁)
- **Amazon商品名**: amazon_name
- **Amazon価格**: amazon_price
- **月間販売数**: monthly_sales
- **手数料率**: fee_rate
- **FBA手数料**: fba_fee
- **JANコード**: jan_code
- **危険物フラグ**: is_dangerous
- **パーキャリ制限フラグ**: is_carrier_restricted
- **苦情回数**: complaint_count
- **メモ**: memo
- **作成日時**: created_at
- **更新日時**: updated_at

#### 5.1.5 product_asins テーブル（商品とASINの紐付け）
- **主キー**: id (UUID)
- **外部キー**: user_id (users テーブル)
- **商品ID**: product_id (products テーブル)
- **ASIN ID**: asin_id (asins テーブル)
- **作成日時**: created_at

#### 5.1.6 shop_discounts テーブル（ショップ別割引設定）
- **主キー**: id (UUID)
- **外部キー**: user_id (users テーブル)
- **ショップ名**: shop_name
- **割引タイプ**: discount_type ('percentage', 'fixed')
- **割引値**: discount_value
- **有効フラグ**: is_enabled
- **作成日時**: created_at
- **更新日時**: updated_at

#### 5.1.7 api_settings テーブル（API設定）
- **主キー**: id (UUID)
- **外部キー**: user_id (users テーブル)
- **プロバイダー**: provider ('rakuten', 'yahoo')
- **設定**: settings (JSONB)
- **有効フラグ**: is_enabled
- **作成日時**: created_at
- **更新日時**: updated_at

### 5.2 行レベルセキュリティ（RLS）ポリシー

#### 5.2.1 基本ポリシー
全テーブルに対して「ユーザーは自分のデータのみアクセス可能」ポリシーを適用

#### 5.2.2 対象テーブル
- shop_categories
- products
- asins
- product_asins
- shop_discounts
- api_settings

### 5.3 データベース関数・トリガー

#### 5.3.1 自動更新トリガー
全テーブルに対してupdated_at列の自動更新トリガーを設定

#### 5.3.2 カスケード削除
適切な外部キー制約とカスケード削除設定

## 6. 外部システム連携設計

### 6.1 スクレイピング設計

#### 6.1.1 共通スクレイピング基盤
- **基底クラス**: BaseScraper
- **設定駆動**: ScrapingConfig
- **プロキシ制御**: 環境変数による完全制御
- **エラーハンドリング**: 統一エラー処理
- **レート制限**: アクセス間隔制御

#### 6.1.2 個別スクレイパー設計
- **VTScraper**: VT Cosmetics専用
- **DHCScraper**: DHC専用
- **InnisfreeScraper**: innisfree専用

### 6.2 API統合設計

#### 6.2.1 楽天API統合
- **認証**: アプリケーションID
- **商品検索**: IchibaItem/Search API
- **パラメータ**: shopCode, genreId, keyword
- **レスポンス変換**: 統一Product形式への変換

#### 6.2.2 Yahoo!ショッピングAPI統合
- **認証**: クライアントID/シークレット
- **商品検索**: Shopping API
- **パラメータ**: query, categoryId, storeId
- **レスポンス変換**: 統一Product形式への変換

## 7. 状態管理設計

### 7.1 Zustand Store 設計

#### 7.1.1 ストア分割
- **productStore**: 商品関連状態
- **asinStore**: ASIN関連状態
- **authStore**: 認証関連状態
- **settingsStore**: 設定関連状態
- **shopStore**: ショップ関連状態

#### 7.1.2 ショップ別ストア
- **カテゴリ別**: official, rakuten, yahoo
- **ショップ別**: vt, dhc, muji, lohaco, zozotown等
- **階層対応**: 親子関係を考慮した状態管理

## 8. UI/UX設計

### 8.1 ナビゲーション構造

#### 8.1.1 修正されたナビゲーション階層
```
├── ダッシュボード
├── 全商品一覧
├── 公式サイト
│   ├── VT Cosmetics
│   ├── DHC
│   └── innisfree
├── 楽天市場
│   ├── 無印良品
│   ├── VT Cosmetics
│   └── innisfree
├── Yahoo!ショッピング
│   ├── LOHACO
│   │   ├── DHC
│   │   └── VT Cosmetics
│   ├── ZOZOTOWN
│   │   ├── DHC
│   │   └── VT Cosmetics
│   └── VT Cosmetics（直販）
├── ASIN管理
└── 設定
```

#### 8.1.2 楽天ショップ設定項目
楽天市場の各ブランドページには以下の設定項目を用意：
- **表示名**: サイドバー・ヘッダーに表示される名前
- **shopCode**: 楽天ショップコード
- **genreId**: 楽天ジャンルID
- **キーワード**: ブランド検索用キーワード

### 8.2 階層ナビゲーションサイドバー設計

#### 8.2.1 サイドバー特徴
- **4階層対応**: カテゴリ → プラットフォーム → ショップ → ブランド
- **自動展開**: 現在のページが含まれるカテゴリは自動展開
- **視覚的階層**: インデントとアイコンサイズで階層を表現
- **状態保持**: 展開状態をセッション間で保持

#### 8.2.2 階層表現
- **第1階層**: 左端配置、大きなアイコン
- **第2階層**: 1レベルインデント、中サイズアイコン
- **第3階層**: 2レベルインデント、小サイズアイコン
- **第4階層**: 3レベルインデント、最小アイコン

### 8.3 カテゴリ別ページレイアウト設計

#### 8.3.1 カテゴリ概要ページ
- **ヘッダー**: カテゴリ名、説明、統計情報
- **ショップカード**: 各ショップの概要と統計
- **アクションボタン**: 一括操作、設定へのリンク
- **統計表示**: カテゴリ全体の集計情報

#### 8.3.2 ショップ詳細ページ
- **ショップヘッダー**: ショップ名、ステータス、最終更新
- **商品テーブル**: ショップ固有の商品一覧
- **操作パネル**: スクレイピング実行、設定変更
- **統計ダッシュ**: ショップの詳細統計

### 8.4 テーブル設計詳細

#### 8.4.1 商品一覧テーブル仕様
- **表示方式**: 全件表示（ページネーションなし）
- **レイアウト**: 固定ヘッダー付きスクロールテーブル
- **カラム幅**: 固定幅レイアウト（table-fixed）

#### 8.4.2 テーブル列構成
- **画像**: 96px
- **商品名**: 320px
- **価格**: 128px（取り消し線対応）
- **仕入価格**: 112px
- **ASIN**: 128px
- **Amazon商品名**: 320px
- **Amazon価格**: 128px（編集可能）
- **月販数**: 96px（編集可能）
- **手数料率**: 96px（編集可能）
- **FBA料**: 96px（編集可能）
- **Amazon有無**: 80px（チェックボックス）
- **公式有無**: 80px（チェックボックス）
- **苦情回数**: 96px（入力可能）
- **危険物**: 80px（チェックボックス）
- **パーキャリ不可**: 96px（チェックボックス）
- **ユーザーメモ**: 160px（入力可能）
- **利益額**: 112px
- **利益率**: 96px
- **ROI**: 96px

#### 8.4.3 ソート機能対応列
- **文字列ソート**: 商品名、Amazon商品名
- **数値ソート**: 価格、仕入価格、Amazon価格、月販数、苦情回数、利益額、利益率、ROI

#### 8.4.4 編集機能
- **インライン編集**: クリックで編集モード
- **保存方式**: Enter/Escape キーまたはフォーカスアウト
- **バリデーション**: リアルタイム入力検証
- **エラー表示**: フィールド単位でのエラー表示

### 8.5 レスポンシブ設計
- **デスクトップファースト**: 主要な利用環境
- **サイドバー**: 768px以下で自動折りたたみ
- **テーブル**: 1024px以下で横スクロール対応
- **ショップページ**: モバイルでは1カラムレイアウト

## 9. セキュリティ設計

**注意**: このシステムはローカル環境のみでの使用を想定しており、認証機能は実装していません。

### 9.1 データセキュリティ
- **環境変数管理**: .env.local で機密情報を管理
- **ローカル使用**: 単一ユーザー向けローカル環境専用
- **データ保護**: ローカルストレージによる設定保存

## 10. パフォーマンス最適化設計

### 10.1 フロントエンド最適化
- **仮想化テーブル**: 大量データ対応
- **遅延ローディング**: 画像の段階的読み込み
- **コード分割**: ページ単位の動的インポート
- **メモ化**: 不要な再レンダリング防止
- **キャッシュ**: React Query による効率的なデータキャッシュ

### 10.2 バックエンド最適化
- **バルク操作**: 複数データの一括処理
- **インデックス**: データベースクエリ最適化
- **接続プール**: データベース接続の効率化
- **非同期処理**: 重い処理の非同期実行

### 10.3 画像最適化
- **Next.js Image**: 自動画像最適化
- **WebP対応**: 現代的画像フォーマット使用
- **サイズ最適化**: レスポンシブ画像配信
- **プレビュー**: ホバー時の拡大表示

## 11. エラー処理・ログ設計

### 11.1 エラー境界設計
- **React Error Boundary**: コンポーネントエラーキャッチ
- **エラー画面**: ユーザーフレンドリーなエラー表示
- **ログ送信**: エラー情報の自動収集
- **復旧機能**: ページリロードによる復旧

### 11.2 統一ログ設計
- **ログレベル**: DEBUG, INFO, WARN, ERROR
- **出力形式**: JSON構造化ログ
- **コンテキスト**: ユーザーID、リクエストID付与
- **出力先**: コンソール出力（プラットフォーム依存）

### 11.3 スクレイピングエラー処理
- **リトライ機能**: 失敗時の自動再試行
- **タイムアウト**: 応答時間制限
- **部分成功**: 一部成功時の継続処理
- **エラー詳細**: 失敗原因の詳細ログ

## 12. テスト設計

### 12.1 テスト戦略
- **単体テスト**: ユーティリティ関数、カスタムフック
- **統合テスト**: API エンドポイント
- **E2Eテスト**: 主要ユーザーフロー
- **スクレイピングテスト**: 各サイト対応テスト

### 12.2 テスト環境
- **Jest**: 単体テスト・統合テスト
- **React Testing Library**: コンポーネントテスト
- **Playwright**: E2Eテスト
- **MSW**: API モック

## 13. 拡張性設計

### 13.1 プラグイン設計
- **スクレイパープラグイン**: 新サイト対応の容易化
- **API統合プラグイン**: 新しいEC API対応
- **設定スキーマ**: JSON Schema による設定検証

### 13.2 設定駆動設計
- **サイト設定**: 設定ファイルによるサイト定義
- **セレクター設定**: CSS セレクターの外部定義
- **API設定**: API エンドポイント・パラメータの設定化

### 13.3 階層拡張対応
- **無制限階層**: 任意の深さまでの階層対応
- **動的メニュー**: 設定に基づくナビゲーション生成
- **柔軟ルーティング**: 階層に応じたURL生成

## 14. 運用設計

### 14.1 ローカル実行
- **開発環境**: npm run dev でローカル起動
- **環境変数**: .env.local で管理
- **ポート**: 3000（デフォルト）
- **注意**: ローカル環境のみでの使用を想定

### 14.2 監視・メンテナンス
- **ヘルスチェック**: 基本的な生存監視
- **エラー監視**: 重要エラーの検出
- **パフォーマンス監視**: レスポンス時間計測
- **定期メンテナンス**: データベース最適化

### 14.3 バックアップ・復旧
- **Supabase**: 自動バックアップ機能
- **データエクスポート**: 定期的なデータダウンロード
- **災害復旧**: サービス中断時の復旧手順

## 15. データモデル詳細設計

### 15.1 楽天ショップ設定データ構造
```json
{
  "displayName": "無印良品 楽天市場店",
  "shopCode": "muji-net",  
  "genreId": "100939",
  "keyword": "無印良品",
  "categories": ["スキンケア", "メイクアップ", "ヘアケア"],
  "enabled": true,
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

### 15.2 Yahoo階層ショップ設定
```json
{
  "displayName": "LOHACO - DHC",
  "parentShop": "lohaco",
  "brandName": "DHC", 
  "storeId": "lohaco",
  "categoryId": "beauty",
  "searchKeyword": "DHC",
  "enabled": true
}
```

### 15.3 商品データ統合形式
```json
{
  "id": "uuid",
  "name": "商品名",
  "price": 1000,
  "salePrice": 800,
  "imageUrl": "https://...",
  "shopType": "rakuten",
  "shopName": "muji",
  "parentShop": null,
  "sourceUrl": "https://...",
  "scraped": {
    "timestamp": "2024-01-01T00:00:00Z",
    "source": "rakuten_api",
    "metadata": {}
  }
}
```

## 16. 開発フェーズ設計

### 16.1 Phase 1: 基盤構築
- 基本データベース設計
- サイドバー・ナビゲーション
- 商品一覧テーブル
- 基本レイアウト実装

### 16.2 Phase 2: 公式サイト対応
- VT Cosmetics スクレイピング
- DHC スクレイピング
- innisfree スクレイピング
- ASIN管理機能

### 16.3 Phase 3: API統合
- 楽天市場 API実装
- Yahoo!ショッピング API実装
- 階層ショップ対応
- 統計ダッシュボード

### 16.4 Phase 4: 高度機能
- 利益計算最適化
- パフォーマンス向上
- エラーハンドリング強化
- 運用機能充実

## 17. 設定画面削除について

各ブランド・ショップの設定ページは削除し、以下に統合：

### 17.1 統合設定画面
- **全体設定 (/settings)**: アカウント設定、システム設定
- **割引設定 (/settings/discounts)**: ショップ別割引設定  
- **API設定 (/settings/api)**: 楽天・Yahoo API設定

### 17.2 インライン設定
- **ショップページ内設定**: 各ショップページに設定パネルを配置
- **モーダル設定**: 設定ボタンクリックでモーダル表示
- **クイック設定**: よく使う設定項目の直接編集

これにより、設定の分散を防ぎ、より使いやすいインターフェースを実現します。#### 8.1.2 階層ナビゲーションサイドバー設計
```typescript
// components/navigation/Sidebar.tsx
interface SidebarProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const pathname = usePathname()
  
  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* ヘッダー部分 */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900">Shop Research</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* ナビゲーション */}
      <nav className="p-2 flex-1 overflow-y-auto">
        {navigationConfig.map((item) => (
          <NavigationGroup
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            currentPath={pathname}
          />
        ))}
      </nav>
      
      {/* ユーザー情報 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <UserProfile isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}

// 階層ナビゲーショングループ
const NavigationGroup: React.FC<{
  item: NavigationItem
  isCollapsed: boolean
  currentPath: string
}> = ({ item, isCollapsed, currentPath }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    // 現在のパスが含まれる場合はデフォルトで展開
    return item.children?.some(child => 
      currentPath.startsWith(child.href) || 
      child.children?.some(subChild => currentPath.startsWith(subChild.href))
    ) || false
  })
  
  const hasChildren = item.children && item.children.length > 0
  const isActive = currentPath === item.href || 
    (hasChildren && item.children?.some(child => 
      currentPath.startsWith(child.href)
    ))
  
  // 子項目がない場合は通常のリンク
  if (!hasChildren) {
    return (
      <div className="mb-1">
        <Link href={item.href}>
          <Button
            variant={currentPath === item.href ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2",
              isCollapsed ? "px-2" : "px-3"
            )}
          >
            <Icon name={item.icon} className="h-4 w-4" />
            {!isCollapsed && (
              <>
                <span>{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="mb-1">
      {/* 親カテゴリ */}
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start gap-2",
          isCollapsed ? "px-2" : "px-3"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Icon name={item.icon} className="h-4 w-4" />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isExpanded ? "rotate-180" : ""
            )} />
          </>
        )}
      </Button>
      
      {/* 子カテゴリ（第2階層） */}
      {!isCollapsed && isExpanded &&#### 7.1.5 統合ショップストア
```typescript
// store/shopStore.ts
interface ShopState {
  activeShop: string | null
  allShopsStats: Record<string, ShopStats>
  globalScrapingStatus: ScrapingStatus
  
  // Actions
  setActiveShop: (shopName: string) => void
  fetchAllShopsStats: () => Promise<void>
  runGlobalScraping: () => Promise<void>
}

export const useShopStore = create<ShopState>((set, get) => ({
  activeShop: null,
  allShopsStats: {},
  globalScrapingStatus: 'idle',
  
  setActiveShop: (shopName) => {
    set({ activeShop: shopName })
  },
  
  fetchAllShopsStats: async () => {
    const shops = ['vt', 'dhc', 'innisfree', 'rakuten', 'yahoo']
    const statsPromises = shops.map(shop => 
      fetch(`/api/shops/${shop}/stats`).then(res => res.json())
    )
    
    try {
      const allStats = await Promise.all(statsPromises)
      const statsMap = shops.reduce((acc, shop, index) => {
        acc[shop] = allStats[index]
        return acc
      }, {} as Record<string, ShopStats>)
      
      set({ allShopsStats: statsMap })
    } catch (error) {
      console.error('統計情報の取得に失敗:', error)
    }
  }
}))
```

### 8.4 ダッシュボードページ設計
```typescript
// app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 全体サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlobalSummaryCards />
      </div>
      
      {/* ショップ別概要 */}
      <Card>
        <CardHeader>
          <CardTitle>ショップ別状況</CardTitle>
        </CardHeader>
        <CardContent>
          <ShopOverviewTable />
        </CardContent>
      </Card>
      
      {/* 最近のアクティビティ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>最近の活動</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivityFeed />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>利益トレンド</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitTrendChart />
          </CardContent>
        </Card>
      </div>
      
      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickActionButtons />
        </CardContent>
      </Card>
    </div>
  )
}

// グローバルサマリーカード
const GlobalSummaryCards = () => {
  const { data: globalStats } = useGlobalStats()
  
  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総商品数</p>
              <p className="text-2xl font-bold">{globalStats?.totalProducts || 0}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ASIN紐付け率</p>
              <p className="text-2xl font-bold">{globalStats?.asinLinkageRate || 0}%</p>
            </div>
            <Link2 className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">平均利益率</p>
              <p className="text-2xl font-bold">{globalStats?.avgProfitRate || 0}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">推定総利益</p>
              <p className="text-2xl font-bold">¥{globalStats?.estimatedTotalProfit?.toLocaleString() || 0}</p>
            </div>
            <DollarSign className="h-8 w-8 text-red-500" />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ショップ別概要テーブル
const ShopOverviewTable = () => {
  const { data: shopsStats } = useAllShopsStats()
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ショップ</TableHead>
          <TableHead>商品数</TableHead>
          <TableHead>紐付け済み</TableHead>
          <TableHead>平均利益率</TableHead>
          <TableHead>最終更新</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(shopsStats || {}).map(([shopName, stats]) => (
          <TableRow key={shopName}>
            <TableCell className="flex items-center gap-2">
              <Icon name={getShopIcon(shopName)} className="h-4 w-4" />
              <span className="font-medium">{getShopDisplayName(shopName)}</span>
            </TableCell>
            <TableCell>{stats.totalProducts}</TableCell>
            <TableCell>{stats.linkedProducts}</TableCell>
            <TableCell>{stats.avgProfitRate}%</TableCell>
            <TableCell>
              {stats.lastUpdate ? format(new Date(stats.lastUpdate), 'MM/dd HH:mm') : '未実行'}
            </TableCell>
            <TableCell>
              <Badge variant={stats.isActive ? "default" : "secondary"}>
                {stats.isActive ? "アクティブ" : "非アクティブ"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/shops/${shopName}`}>
                    <Eye className="h-3 w-3" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### 8.5 データベース設計更新

#### 8.5.1 shops テーブルの追加
```sql
-- ショップ設定テーブル
CREATE TABLE shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(50) NOT NULL, -- 'vt', 'dhc', 'innisfree', 'rakuten', 'yahoo'
    display_name VARCHAR(100) NOT NULL, -- 'VT Cosmetics', 'DHC', etc.
    is_enabled BOOLEAN DEFAULT TRUE,
    scraping_config JSONB, -- ショップ固有の設定
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- インデックス
CREATE INDEX idx_shops_user_id ON shops(user_id);
CREATE INDEX idx_shops_name ON shops(name);
CREATE INDEX idx_shops_is_enabled ON shops(is_enabled);

-- RLSポリシー
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own shops" 
ON shops FOR ALL 
USING (auth.uid() = user_id);
```

#### 8.5.2 products テーブルの更新
```sql
-- products テーブルにshop_idを追加
ALTER TABLE products ADD COLUMN shop_id UUID REFERENCES shops(id);

-- 既存データ用のマイグレーション（sourceからshop_idへの変換）
UPDATE products SET shop_id = (
    SELECT id FROM shops 
    WHERE shops.name = products.source 
    AND shops.user_id = products.user_id
);

-- 新しいインデックス
CREATE INDEX idx_products_shop_id ON products(shop_id);
```

### 8.6 ルーティング設計更新

#### 8.6.1 完全な階層ルーティング構造
```
/                              # ホーム（ダッシュボード）
/products                      # 全商品一覧
/asins                         # ASIN管理
/settings                      # 全体設定

# 公式サイトカテゴリ
/official                      # 公式サイト一覧
/official/vt                   # VT詳細ページ
/official/dhc                  # DHC詳細ページ
/official/innisfree            # innisfree詳細ページ

# 楽天市場カテゴリ
/rakuten                       # 楽天市場一覧
/rakuten/muji                  # 楽天-無印良品ページ
/rakuten/vt                    # 楽天-VTページ
/rakuten/innisfree             # 楽天-innisfreeページ

# Yahoo!ショッピングカテゴリ
/yahoo                         # Yahoo!ショッピング一覧
/yahoo/lohaco                  # LOHACOページ
/yahoo/lohaco/dhc              # LOHACO-DHCページ
/yahoo/lohaco/vt               # LOHACO-VTページ
/yahoo/zozotown                # ZOZOTOWNページ
/yahoo/zozotown/dhc            # ZOZOTOWN-DHCページ
/yahoo/zozotown/vt             # ZOZOTOWN-VTページ
/yahoo/vt                      # Yahoo直販-VTページ
```

これで、各ショップごとの専用ページとサイドバーの関係性が明確になりました。サイドバーのショップセクションから各ショップページに直接アクセスでき、それぞれのページで独立した商品管理とスクレイピング設定が可能になります。

他に設計について確認したい点やご質問はございますか？#### 7.1.4 ショップ別ストア
```typescript
// store/shops/vtStore.ts
interface VTState {
  products: Product[]
  stats: ShopStats | null
  isLoading: boolean
  error: string | null
  scrapingStatus: ScrapingStatus
  
  // Actions
  fetchVTProducts: () => Promise<void>
  fetchVTStats: () => Promise<void>
  scrapeVT: (config: VTScrapingRequest) => Promise<void>
  updateVTProduct: (id: string, updates: ProductUpdateRequest) => Promise<void>
  deleteVTProduct: (id: string) => Promise<void>
}

export const useVTStore = create<VTState>((set, get) => ({
  products: [],
  stats: null,
  isLoading: false,
  error: null,
  scrapingStatus: 'idle',
  
  fetchVTProducts: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/shops/vt/products')
      const data = await response.json()
      set({ products: data.data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },
  
  scrapeVT: async (config) => {
    set({ scrapingStatus: 'running', error: null })
    try {
      const response = await fetch('/api/scraping/vt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (!response.ok) throw new Error('スクレイピングに失敗しました')
      
      const result = await response.json()
      set({ scrapingStatus: 'completed' })
      
      // 商品リストを再取得
      get().fetchVTProducts()
      get().fetchVTStats()
    } catch (error) {
      set({ 
        scrapingStatus: 'error', 
        error: error.message 
      })
    }
  }
}))

// 同様にDHC, innisfree, rakuten, yahooストアを定義
```

#### 7.1.5 統合ショップストア
```typescript
// store/shopStore.ts
interface ShopState {
  activeShop: string |# システム設計書 - Shop Research app

## 1. システム設計概要

### 1.1 設計方針
- **モノリシック構成**: Next.js フルスタックアプリケーション
- **単一責任の原則**: 各コンポーネント・関数の責任を明確化
- **型安全性**: TypeScript による厳密な型定義
- **保守性**: 機能別モジュール分割による可読性向上
- **スケーラビリティ**: 商品数増加に対応する設計

### 1.2 アーキテクチャパターン
- **プレゼンテーション層**: React コンポーネント
- **ビジネスロジック層**: カスタムフック・ユーティリティ関数
- **データアクセス層**: Supabase クライアント・API
- **外部連携層**: スクレイピング・API統合

## 2. システム全体アーキテクチャ

### 2.1 システム構成図
```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                      │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   React App     │  │  Service Worker │              │
│  │  (Next.js SPA)  │  │   (Optional)    │              │
│  └─────────────────┘  └─────────────────┘              │
└─────────────┬───────────────────────────────────────────┘
              │ HTTPS
┌─────────────▼───────────────────────────────────────────┐
│                   Next.js Server                        │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   API Routes    │  │   SSR Pages     │              │
│  │                 │  │                 │              │
│  │  ┌───────────┐  │  │  ┌───────────┐  │              │
│  │  │ Auth API  │  │  │  │   Pages   │  │              │
│  │  │Product API│  │  │  │Components │  │              │
│  │  │ ASIN API  │  │  │  │           │  │              │
│  │  │Scrape API │  │  │  └───────────┘  │              │
│  │  └───────────┘  │  └─────────────────┘              │
│  └─────────────────┘                                   │
└─────────────┬───────────────┬───────────────────────────┘
              │               │
              │ REST API      │ Web Scraping
              ▼               ▼
┌─────────────────┐  ┌─────────────────┐
│   Supabase      │  │  External Sites │
│                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │PostgreSQL DB│ │  │ │    VT       │ │
│ │             │ │  │ │    DHC      │ │
│ │  ┌───────┐  │ │  │ │  innisfree  │ │
│ │  │products│ │  │  │ │   Rakuten   │ │
│ │  │ asins  │ │  │  │ │   Yahoo     │ │
│ │  │settings│ │  │  │ └─────────────┘ │
│ │  └───────┘  │ │  └─────────────────┘
│ │             │ │
│ │ ┌───────────┐│ │  ┌─────────────────┐
│ │ │   Auth    ││ │  │  Proxy Server   │
│ │ │ (Google)  ││ │  │   (Optional)    │
│ │ └───────────┘│ │  └─────────────────┘
│ └─────────────┐ │
└─────────────────┘
```

### 2.2 データフロー図
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│  Browser    │───▶│ Next.js App │
│ Interaction │    │   (React)   │    │  Component  │
└─────────────┘    └─────────────┘    └─────────────┘
                                               │
                                               ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Supabase   │◀───│ API Routes  │◀───│   Custom    │
│  Database   │    │  (Server)   │    │   Hooks     │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
┌─────────────┐    ┌─────────────┐
│ External    │◀───│ Scraping    │
│   Sites     │    │  Service    │
└─────────────┘    └─────────────┘
```

## 3. アプリケーション層設計

### 3.1 ディレクトリ構造
```
shop-research-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── callback/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/      # ダッシュボードホーム
│   │   │   ├── products/       # 全商品一覧
│   │   │   ├── shops/          # ショップ別ページ
│   │   │   │   ├── official/   # 公式サイト
│   │   │   │   │   ├── page.tsx         # 公式サイト一覧
│   │   │   │   │   ├── vt/
│   │   │   │   │   │   ├── page.tsx     # VTページ
│   │   │   │   │   │   └── settings/
│   │   │   │   │   │       └── page.tsx # VT設定
│   │   │   │   │   ├── dhc/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── settings/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── innisfree/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── settings/
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── rakuten/    # 楽天市場
│   │   │   │   │   ├── page.tsx         # 楽天一覧
│   │   │   │   │   ├── muji/
│   │   │   │   │   │   ├── page.tsx     # 無印良品ページ
│   │   │   │   │   │   └── settings/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── cosme/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── settings/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── skincare/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── settings/
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── makeup/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── settings/
│   │   │   │   │           └── page.tsx
│   │   │   │   └── yahoo/      # Yahoo!ショッピング
│   │   │   │       ├── page.tsx         # Yahoo一覧
│   │   │   │       ├── lohaco/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   └── settings/
│   │   │   │       │       └── page.tsx
│   │   │   │       ├── cosme/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   └── settings/
│   │   │   │       │       └── page.tsx
│   │   │   │       ├── beauty/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   └── settings/
│   │   │   │       │       └── page.tsx
│   │   │   │       └── skincare/
│   │   │   │           ├── page.tsx
│   │   │   │           └── settings/
│   │   │   │               └── page.tsx
│   │   │   ├── asins/          # ASIN管理
│   │   │   ├── settings/       # 全体設定
│   │   │   └── layout.tsx
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── asins/
│   │   │   ├── settings/
│   │   │   └── scraping/
│   │   │       ├── official/
│   │   │       │   ├── vt/
│   │   │       │   ├── dhc/
│   │   │       │   └── innisfree/
│   │   │       ├── rakuten/
│   │   │       │   ├── muji/
│   │   │       │   ├── cosme/
│   │   │       │   ├── skincare/
│   │   │       │   └── makeup/
│   │   │       └── yahoo/
│   │   │           ├── lohaco/
│   │   │           ├── cosme/
│   │   │           ├── beauty/
│   │   │           └── skincare/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # UI Components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Form components
│   │   ├── tables/           # Table components
│   │   ├── shops/            # ショップ固有コンポーネント
│   │   │   ├── official/
│   │   │   │   ├── VTComponents.tsx
│   │   │   │   ├── DHCComponents.tsx
│   │   │   │   └── InnisfreeComponents.tsx
│   │   │   ├── rakuten/
│   │   │   │   ├── MujiComponents.tsx
│   │   │   │   ├── CosmeComponents.tsx
│   │   │   │   ├── SkincareComponents.tsx
│   │   │   │   └── MakeupComponents.tsx
│   │   │   └── yahoo/
│   │   │       ├── LOHACOComponents.tsx
│   │   │       ├── CosmeComponents.tsx
│   │   │       ├── BeautyComponents.tsx
│   │   │       └── SkincareComponents.tsx
│   │   ├── navigation/       # ナビゲーション関連
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── BreadCrumb.tsx
│   │   └── layouts/          # Layout components
│   ├── hooks/                # Custom Hooks
│   │   ├── useProducts.ts
│   │   ├── useAsins.ts
│   │   ├── useAuth.ts
│   │   ├── useScraping.ts
│   │   └── shops/            # ショップ固有フック
│   │       ├── official/
│   │       │   ├── useVT.ts
│   │       │   ├── useDHC.ts
│   │       │   └── useInnisfree.ts
│   │       ├── rakuten/
│   │       │   ├── useMuji.ts
│   │       │   ├── useCosme.ts
│   │       │   ├── useSkincare.ts
│   │       │   └── useMakeup.ts
│   │       └── yahoo/
│   │           ├── useLOHACO.ts
│   │           ├── useCosme.ts
│   │           ├── useBeauty.ts
│   │           └── useSkincare.ts
│   ├── lib/                  # Utilities
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   ├── scraper/
│   │   │   ├── base.ts
│   │   │   └── official/
│   │   │       ├── vt.ts
│   │   │       ├── dhc.ts
│   │   │       └── innisfree.ts
│   │   ├── api/
│   │   │   ├── rakuten.ts
│   │   │   └── yahoo.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── store/                # Zustand Store
│   │   ├── productStore.ts
│   │   ├── asinStore.ts
│   │   ├── authStore.ts
│   │   ├── settingsStore.ts
│   │   └── shops/            # ショップ固有ストア
│   │       ├── official/
│   │       │   ├── vtStore.ts
│   │       │   ├── dhcStore.ts
│   │       │   └── innisfreeStore.ts
│   │       ├── rakuten/
│   │       │   ├── mujiStore.ts
│   │       │   ├── cosmeStore.ts
│   │       │   ├── skincareStore.ts
│   │       │   └── makeupStore.ts
│   │       └── yahoo/
│   │           ├── lohacoStore.ts
│   │           ├── cosmeStore.ts
│   │           ├── beautyStore.ts
│   │           └── skincareStore.ts
│   ├── types/                # Type Definitions
│   │   ├── database.ts
│   │   ├── products.ts
│   │   ├── asins.ts
│   │   ├── api.ts
│   │   └── shops.ts
│   └── constants/            # Constants
│       ├── api.ts
│       ├── scraping.ts
│       └── navigation.ts
├── public/                   # Static Files
├── .env.local               # Environment Variables
├── next.config.js           # Next.js Configuration
├── tailwind.config.js       # Tailwind Configuration
├── tsconfig.json            # TypeScript Configuration
└── package.json             # Dependencies
```

### 3.2 コンポーネント設計

#### 3.2.1 ページコンポーネント階層
```
App Layout
└── DashboardLayout (メイン機能用)
    ├── Header
    ├── Sidebar
    │   ├── NavigationMenu
    │   ├── ShopLinks
    │   └── SettingsLinks
    └── MainContent
        ├── DashboardHome (全体概要)
        │   ├── SummaryCards
        │   ├── RecentActivity
        │   └── QuickActions
        ├── AllProductsPage (全商品一覧)
        │   ├── ProductTable
        │   ├── ProductFilters
        │   └── GlobalActions
        ├── ShopPages (ショップ別ページ)
        │   ├── VTPage
        │   │   ├── VTProductTable
        │   │   ├── VTScrapingControls
        │   │   └── VTSettings
        │   ├── DHCPage
        │   │   ├── DHCProductTable
        │   │   ├── DHCScrapingControls
        │   │   └── DHCSettings
        │   ├── InnisfreePage
        │   │   ├── InnisfreeProductTable
        │   │   ├── InnisfreeScrapingControls
        │   │   └── InnisfreeSettings
        │   ├── RakutenPage
        │   │   ├── RakutenProductTable
        │   │   ├── RakutenAPIControls
        │   │   └── RakutenSettings
        │   └── YahooPage
        │       ├── YahooProductTable
        │       ├── YahooAPIControls
        │       └── YahooSettings
        ├── ASINManagementPage
        │   ├── ASINTable
        │   ├── ASINUpload
        │   └── ASINLinking
        └── GlobalSettingsPage
            ├── AccountSettings
            ├── DiscountSettings
            └── SystemSettings
```

#### 3.2.2 共通コンポーネント
```typescript
// components/ui/ (shadcn/ui ベース)
- Button
- Input
- Table
- Dialog
- Select
- Checkbox
- Loading
- ErrorBoundary

// components/forms/
- ProductForm
- AsinForm
- SettingsForm
- FileUploadForm

// components/tables/
- ProductTable
- EditableCell
- SortableHeader
- FilterRow

// components/layouts/
- DashboardLayout
- AuthLayout
- PageHeader
- Sidebar
```

## 4. API設計

### 4.1 REST API エンドポイント設計

#### 4.1.1 商品API
```typescript
// GET /api/products
// クエリ: ?search=&sortBy=&sortOrder=&limit=&offset=
interface ProductsGetResponse {
  data: Product[]
  total: number
  hasMore: boolean
}

// POST /api/products
interface ProductCreateRequest {
  name: string
  price: number
  salePrice?: number
  imageUrl?: string
  source: string
}

// PUT /api/products/[id]
interface ProductUpdateRequest {
  name?: string
  price?: number
  salePrice?: number
  imageUrl?: string
  isHidden?: boolean
  memo?: string
}

// DELETE /api/products/[id]
interface ProductDeleteResponse {
  success: boolean
}

// POST /api/products/[id]/copy
interface ProductCopyResponse {
  newProduct: Product
}
```

#### 4.1.2 ASIN API
```typescript
// GET /api/asins
interface AsinsGetResponse {
  data: Asin[]
  total: number
}

// POST /api/asins
interface AsinCreateRequest {
  asin: string
  amazonName: string
  amazonPrice?: number
  monthlySales?: number
  feeRate?: number
  fbaFee?: number
  janCode?: string
  isDangerous?: boolean
  isCarrierRestricted?: boolean
  memo?: string
}

// PUT /api/asins/[id]
interface AsinUpdateRequest {
  amazonPrice?: number
  monthlySales?: number
  feeRate?: number
  fbaFee?: number
  isDangerous?: boolean
  isCarrierRestricted?: boolean
  memo?: string
}

// POST /api/asins/upload
interface AsinUploadRequest {
  file: File // Excel/CSV
}

// POST /api/products/[productId]/asins/[asinId]/link
interface AsinLinkRequest {
  productId: string
  asinId: string
}
```

#### 4.1.3 ショップ別スクレイピングAPI
```typescript
// POST /api/scraping/vt
interface VTScrapingRequest {
  categoryUrl: string
  useProxy?: boolean
  targetCategories?: string[] // 特定カテゴリーのみ
}

interface VTScrapingResponse {
  success: boolean
  data?: {
    newProducts: number
    updatedProducts: number
    deletedProducts: number
    errors: string[]
    processedUrls: string[]
  }
  error?: string
}

// POST /api/scraping/dhc
interface DHCScrapingRequest {
  categoryUrl: string
  useProxy?: boolean
  targetCategories?: string[]
}

// POST /api/scraping/innisfree
interface InnisfreeScrapingRequest {
  categoryUrl: string
  useProxy?: boolean
  targetCategories?: string[]
}

// POST /api/scraping/rakuten
interface RakutenScrapingRequest {
  keyword?: string
  genreId?: number
  shopCode?: string
  maxItems?: number
}

// POST /api/scraping/yahoo
interface YahooScrapingRequest {
  query: string
  categoryId?: string
  storeId?: string
  maxItems?: number
}

// GET /api/shops/[shopName]/stats
interface ShopStatsResponse {
  shopName: string
  totalProducts: number
  linkedProducts: number
  avgProfitRate: number
  lastUpdate: string
  recentActivity: {
    date: string
    newProducts: number
    updatedProducts: number
  }[]
}

// GET /api/shops/[shopName]/products
interface ShopProductsRequest {
  shopName: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  hasAsin?: boolean
  limit?: number
  offset?: number
}
```

#### 4.1.5 設定API
```typescript
// GET /api/settings/discount
interface DiscountSettingsResponse {
  shops: ShopDiscount[]
}

// PUT /api/settings/discount
interface DiscountSettingsRequest {
  shopId: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  isEnabled: boolean
}

// GET /api/settings/rakuten
// PUT /api/settings/rakuten
// GET /api/settings/yahoo
// PUT /api/settings/yahoo
// 同様の構造
```

### 4.2 エラーハンドリング設計

#### 4.2.1 統一エラーレスポンス
```typescript
interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  path: string
}

// エラーコード定義
enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SCRAPING_ERROR = 'SCRAPING_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR'
}
```

#### 4.2.2 エラーハンドラー
```typescript
// lib/apiErrorHandler.ts
export function handleApiError(error: unknown): ApiErrorResponse {
  if (error instanceof ValidationError) {
    return {
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Invalid input data',
        details: error.details
      },
      timestamp: new Date().toISOString(),
      path: req.url
    }
  }
  
  // その他のエラータイプ処理
  return defaultErrorResponse
}
```

## 5. データベース設計

### 5.1 テーブル設計

#### 5.1.1 users テーブル (Supabase Auth)
```sql
-- Supabase Authが自動管理
-- 参照のみ使用
```

#### 5.1.2 products テーブル
```sql
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(500) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    image_url TEXT,
    source VARCHAR(100) NOT NULL, -- 'vt', 'dhc', 'innisfree', 'rakuten', 'yahoo'
    source_url TEXT,
    is_hidden BOOLEAN DEFAULT FALSE,
    memo TEXT,
    original_product_id UUID REFERENCES products(id), -- コピー元商品のID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_source ON products(source);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_is_hidden ON products(is_hidden);
CREATE INDEX idx_products_original_product_id ON products(original_product_id);
```

#### 5.1.3 asins テーブル
```sql
CREATE TABLE asins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asin VARCHAR(10) NOT NULL,
    amazon_name VARCHAR(500) NOT NULL,
    amazon_price DECIMAL(10,2),
    monthly_sales INTEGER DEFAULT 0,
    fee_rate DECIMAL(5,2), -- 手数料率（例：15.00%）
    fba_fee DECIMAL(10,2), -- FBA手数料
    jan_code VARCHAR(13),
    is_dangerous BOOLEAN DEFAULT FALSE,
    is_carrier_restricted BOOLEAN DEFAULT FALSE,
    complaint_count INTEGER DEFAULT 0,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, asin)
);

-- インデックス
CREATE INDEX idx_asins_user_id ON asins(user_id);
CREATE INDEX idx_asins_asin ON asins(asin);
CREATE INDEX idx_asins_jan_code ON asins(jan_code);
```

#### 5.1.4 product_asins テーブル（商品とASINの紐付け）
```sql
CREATE TABLE product_asins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    asin_id UUID REFERENCES asins(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, asin_id)
);

-- インデックス
CREATE INDEX idx_product_asins_user_id ON product_asins(user_id);
CREATE INDEX idx_product_asins_product_id ON product_asins(product_id);
CREATE INDEX idx_product_asins_asin_id ON product_asins(asin_id);
```

#### 5.1.5 shop_discounts テーブル（ショップ別割引設定）
```sql
CREATE TABLE shop_discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    shop_name VARCHAR(100) NOT NULL, -- 'vt', 'dhc', 'innisfree', etc.
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value DECIMAL(10,2) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, shop_name)
);

-- インデックス
CREATE INDEX idx_shop_discounts_user_id ON shop_discounts(user_id);
```

#### 5.1.6 api_settings テーブル（API設定）
```sql
CREATE TABLE api_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'rakuten', 'yahoo'
    settings JSONB NOT NULL, -- API固有の設定を格納
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, provider)
);

-- インデックス
CREATE INDEX idx_api_settings_user_id ON api_settings(user_id);
CREATE INDEX idx_api_settings_provider ON api_settings(provider);
```

### 5.2 行レベルセキュリティ（RLS）ポリシー

#### 5.2.1 products テーブル
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own products" 
ON products FOR ALL 
USING (auth.uid() = user_id);
```

#### 5.2.2 asins テーブル
```sql
ALTER TABLE asins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own asins" 
ON asins FOR ALL 
USING (auth.uid() = user_id);
```

#### 5.2.3 product_asins テーブル
```sql
ALTER TABLE product_asins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own product_asins" 
ON product_asins FOR ALL 
USING (auth.uid() = user_id);
```

#### 5.2.4 shop_discounts テーブル
```sql
ALTER TABLE shop_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own shop_discounts" 
ON shop_discounts FOR ALL 
USING (auth.uid() = user_id);
```

#### 5.2.5 api_settings テーブル
```sql
ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own api_settings" 
ON api_settings FOR ALL 
USING (auth.uid() = user_id);
```

### 5.3 データベース関数・トリガー

#### 5.3.1 updated_at 自動更新トリガー
```sql
-- 更新日時自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asins_updated_at 
    BEFORE UPDATE ON asins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_discounts_updated_at 
    BEFORE UPDATE ON shop_discounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_settings_updated_at 
    BEFORE UPDATE ON api_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 6. 外部システム連携設計

### 6.1 スクレイピング設計

#### 6.1.1 共通スクレイピング基盤
```typescript
// lib/scraper/base.ts
interface ScrapingConfig {
  name: string
  baseUrl: string
  selectors: {
    productList: string
    productName: string
    price: string
    salePrice?: string
    imageUrl: string
    productUrl: string
  }
  pagination?: {
    nextButton: string
    hasMore: (page: Page) => Promise<boolean>
  }
}

abstract class BaseScraper {
  protected config: ScrapingConfig
  protected browser: Browser
  
  abstract scrape(categoryUrl: string): Promise<Product[]>
  
  protected async setupBrowser(): Promise<Browser> {
    const useProxy = process.env.USE_PROXY === 'true'
    const launchOptions: PuppeteerLaunchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
    
    if (useProxy) {
      launchOptions.args?.push(`--proxy-server=${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`)
    }
    
    return await puppeteer.launch(launchOptions)
  }
}
```

#### 6.1.2 個別スクレイパー設計
```typescript
// lib/scraper/vt.ts
export class VTScraper extends BaseScraper {
  constructor() {
    super({
      name: 'VT',
      baseUrl: 'https://www.vt-cosmetics.jp',
      selectors: {
        productList: '.product-item',
        productName: '.product-name',
        price: '.price-original',
        salePrice: '.price-sale',
        imageUrl: '.product-image img',
        productUrl: '.product-link'
      }
    })
  }
  
  async scrape(categoryUrl: string): Promise<Product[]> {
    // VT固有のスクレイピングロジック
  }
}
```

### 6.2 API統合設計

#### 6.2.1 楽天API統合
```typescript
// lib/api/rakuten.ts
interface RakutenApiConfig {
  applicationId: string
  baseUrl: 'https://app.rakuten.co.jp/services/api'
}

export class RakutenApiClient {
  private config: RakutenApiConfig
  
  constructor() {
    this.config = {
      applicationId: process.env.RAKUTEN_APP_ID!,
      baseUrl: 'https://app.rakuten.co.jp/services/api'
    }
  }
  
  async searchProducts(params: RakutenSearchParams): Promise<RakutenProduct[]> {
    const url = new URL('/IchibaItem/Search/20220601', this.config.baseUrl)
    url.searchParams.append('applicationId', this.config.applicationId)
    url.searchParams.append('keyword', params.keyword)
    url.searchParams.append('genreId', params.genreId.toString())
    
    const response = await fetch(url.toString())
    const data = await response.json()
    
    return data.Items.map(this.transformProduct)
  }
}
```

#### 6.2.2 Yahoo!ショッピングAPI統合
```typescript
// lib/api/yahoo.ts
export class YahooApiClient {
  private config: YahooApiConfig
  
  async searchProducts(params: YahooSearchParams): Promise<YahooProduct[]> {
    // Yahoo API固有の実装
  }
}
```

## 7. 状態管理設計

### 7.1 Zustand Store 設計

#### 7.1.1 商品ストア
```typescript
// store/productStore.ts
interface ProductState {
  products: Product[]
  isLoading: boolean
  error: string | null
  filters: ProductFilters
  sortConfig: SortConfig
  
  // Actions
  fetchProducts: () => Promise<void>
  createProduct: (product: ProductCreateRequest) => Promise<void>
  updateProduct: (id: string, updates: ProductUpdateRequest) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  copyProduct: (id: string) => Promise<void>
  setFilters: (filters: Partial<ProductFilters>) => void
  setSortConfig: (config: SortConfig) => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  filters: {},
  sortConfig: { field: 'created_at', direction: 'desc' },
  
  fetchProducts: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      set({ products: data.data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  }
}))
```

#### 7.1.2 ASINストア
```typescript
// store/asinStore.ts
interface AsinState {
  asins: Asin[]
  isLoading: boolean
  error: string | null
  
  fetchAsins: () => Promise<void>
  createAsin: (asin: AsinCreateRequest) => Promise<void>
  updateAsin: (id: string, updates: AsinUpdateRequest) => Promise<void>
  deleteAsin: (id: string) => Promise<void>
  uploadAsins: (file: File) => Promise<void>
  linkAsin: (productId: string, asinId: string) => Promise<void>
}
```

## 8. UI/UX設計

### 8.1 サイドバー設計

#### 8.1.1 ナビゲーション構造
```typescript
// constants/navigation.ts
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: string
  badge?: number
  children?: NavigationItem[]
}

export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'ダッシュボード',
    href: '/dashboard',
    icon: 'Home'
  },
  {
    id: 'products',
    label: '全商品一覧',
    href: '/products',
    icon: 'Package'
  },
  {
    id: 'official',
    label: '公式サイト',
    href: '/shops/official',
    icon: 'Building2',
    children: [
      {
        id: 'vt',
        label: 'VT Cosmetics',
        href: '/shops/official/vt',
        icon: 'ExternalLink'
      },
      {
        id: 'dhc',
        label: 'DHC',
        href: '/shops/official/dhc',
        icon: 'ExternalLink'
      },
      {
        id: 'innisfree',
        label: 'innisfree',
        href: '/shops/official/innisfree',
        icon: 'ExternalLink'
      }
    ]
  },
  {
    id: 'rakuten',
    label: '楽天市場',
    href: '/shops/rakuten',
    icon: 'ShoppingCart',
    children: [
      {
        id: 'rakuten-muji',
        label: '無印良品',
        href: '/shops/rakuten/muji',
        icon: 'Store'
      },
      {
        id: 'rakuten-cosme',
        label: 'コスメ・香水・美容',
        href: '/shops/rakuten/cosme',
        icon: 'Store'
      },
      {
        id: 'rakuten-skincare',
        label: 'スキンケア・基礎化粧品',
        href: '/shops/rakuten/skincare',
        icon: 'Store'
      },
      {
        id: 'rakuten-makeup',
        label: 'ベースメイク・メイクアップ',
        href: '/shops/rakuten/makeup',
        icon: 'Store'
      }
    ]
  },
  {
    id: 'yahoo',
    label: 'Yahoo!ショッピング',
    href: '/shops/yahoo',
    icon: 'ShoppingBag',
    children: [
      {
        id: 'yahoo-lohaco',
        label: 'LOHACO',
        href: '/shops/yahoo/lohaco',
        icon: 'Store'
      },
      {
        id: 'yahoo-cosme',
        label: 'コスメ・香水',
        href: '/shops/yahoo/cosme',
        icon: 'Store'
      },
      {
        id: 'yahoo-beauty',
        label: 'ビューティー・健康',
        href: '/shops/yahoo/beauty',
        icon: 'Store'
      },
      {
        id: 'yahoo-skincare',
        label: 'スキンケア',
        href: '/shops/yahoo/skincare',
        icon: 'Store'
      }
    ]
  },
  {
    id: 'asins',
    label: 'ASIN管理',
    href: '/asins',
    icon: 'Database'
  },
  {
    id: 'settings',
    label: '設定',
    href: '/settings',
    icon: 'Settings'
  }
]

// ショップタイプ定義
export type ShopType = 'official' | 'rakuten' | 'yahoo'
export type OfficialShop = 'vt' | 'dhc' | 'innisfree'
export type RakutenShop = 'muji' | 'cosme' | 'skincare' | 'makeup'
export type YahooShop = 'lohaco' | 'cosme' | 'beauty' | 'skincare'

export interface ShopConfig {
  type: ShopType
  name: string
  displayName: string
  parent?: string
  description: string
  icon: string
}

export const shopConfigs: Record<string, ShopConfig> = {
  // 公式サイト
  'official-vt': {
    type: 'official',
    name: 'vt',
    displayName: 'VT Cosmetics',
    parent: 'official',
    description: 'VT Cosmetics公式オンラインショップ',
    icon: 'ExternalLink'
  },
  'official-dhc': {
    type: 'official',
    name: 'dhc',
    displayName: 'DHC',
    parent: 'official',
    description: 'DHC公式オンラインショップ',
    icon: 'ExternalLink'
  },
  'official-innisfree': {
    type: 'official',
    name: 'innisfree',
    displayName: 'innisfree',
    parent: 'official',
    description: 'innisfree公式オンラインショップ',
    icon: 'ExternalLink'
  },
  
  // 楽天市場
  'rakuten-muji': {
    type: 'rakuten',
    name: 'muji',
    displayName: '無印良品',
    parent: 'rakuten',
    description: '楽天市場 無印良品公式ショップ',
    icon: 'Store'
  },
  'rakuten-cosme': {
    type: 'rakuten',
    name: 'cosme',
    displayName: 'コスメ・香水・美容',
    parent: 'rakuten',
    description: '楽天市場 コスメ・香水・美容カテゴリ',
    icon: 'Store'
  },
  'rakuten-skincare': {
    type: 'rakuten',
    name: 'skincare',
    displayName: 'スキンケア・基礎化粧品',
    parent: 'rakuten',
    description: '楽天市場 スキンケア・基礎化粧品カテゴリ',
    icon: 'Store'
  },
  'rakuten-makeup': {
    type: 'rakuten',
    name: 'makeup',
    displayName: 'ベースメイク・メイクアップ',
    parent: 'rakuten',
    description: '楽天市場 ベースメイク・メイクアップカテゴリ',
    icon: 'Store'
  },
  
  // Yahoo!ショッピング
  'yahoo-lohaco': {
    type: 'yahoo',
    name: 'lohaco',
    displayName: 'LOHACO',
    parent: 'yahoo',
    description: 'Yahoo!ショッピング LOHACO by ASKUL',
    icon: 'Store'
  },
  'yahoo-cosme': {
    type: 'yahoo',
    name: 'cosme',
    displayName: 'コスメ・香水',
    parent: 'yahoo',
    description: 'Yahoo!ショッピング コスメ・香水カテゴリ',
    icon: 'Store'
  },
  'yahoo-beauty': {
    type: 'yahoo',
    name: 'beauty',
    displayName: 'ビューティー・健康',
    parent: 'yahoo',
    description: 'Yahoo!ショッピング ビューティー・健康カテゴリ',
    icon: 'Store'
  },
  'yahoo-skincare': {
    type: 'yahoo',
    name: 'skincare',
    displayName: 'スキンケア',
    parent: 'yahoo',
    description: 'Yahoo!ショッピング スキンケアカテゴリ',
    icon: 'Store'
  }
}
```

      {/* 子カテゴリ（第2階層） */}
      {!isCollapsed && isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavigationSubItem
              key={child.id}
              item={child}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// サブナビゲーションアイテム（さらに子要素を持つ可能性）
const NavigationSubItem: React.FC<{
  item: NavigationItem
  currentPath: string
}> = ({ item, currentPath }) => {
  const [isSubExpanded, setIsSubExpanded] = useState(() => {
    // 現在のパスが含まれる場合はデフォルトで展開
    return item.children?.some(subChild => currentPath.startsWith(subChild.href)) || false
  })
  
  const hasSubChildren = item.children && item.children.length > 0
  const isActive = currentPath === item.href || 
    (hasSubChildren && item.children?.some(subChild => currentPath === subChild.href))
  
  // 子項目がない場合は通常のリンク
  if (!hasSubChildren) {
    return (
      <Link href={item.href}>
        <Button
          variant={currentPath === item.href ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start gap-2 text-sm"
        >
          <Icon name={item.icon} className="h-3 w-3" />
          {item.label}
        </Button>
      </Link>
    )
  }
  
  return (
    <div>
      {/* サブカテゴリヘッダー */}
      <Button
        variant={isActive ? "secondary" : "ghost"}
        size="sm"
        className="w-full justify-start gap-2 text-sm"
        onClick={() => setIsSubExpanded(!isSubExpanded)}
      >
        <Icon name={item.icon} className="h-3 w-3" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform",
          isSubExpanded ? "rotate-180" : ""
        )} />
      </Button>
      
      {/* サブカテゴリ内容（第3階層） */}
      {isSubExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children?.map((subChild) => (
            <Link key={subChild.id} href={subChild.href}>
              <Button
                variant={currentPath === subChild.href ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2 text-xs pl-6"
              >
                <Icon name={subChild.icon} className="h-3 w-3" />
                {subChild.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 8.3 カテゴリ別ページレイアウト設計

#### 8.3.1 公式サイトカテゴリページ
```typescript
// app/(dashboard)/shops/official/page.tsx
export default function OfficialShopsPage() {
  return (
    <CategoryOverviewLayout
      categoryName="公式サイト"
      categoryIcon="Building2"
      description="ブランド公式オンラインショップからの商品情報"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ShopCard
          shopKey="official-vt"
          href="/shops/official/vt"
        />
        <ShopCard
          shopKey="official-dhc"
          href="/shops/official/dhc"
        />
        <ShopCard
          shopKey="official-innisfree"
          href="/shops/official/innisfree"
        />
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>公式サイト全体統計</CardTitle>
          </CardHeader>
          <CardContent>
            <OfficialShopsStats />
          </CardContent>
        </Card>
      </div>
    </CategoryOverviewLayout>
  )
}

// 楽天カテゴリページ
// app/(dashboard)/shops/rakuten/page.tsx
export default function RakutenCategoryPage() {
  return (
    <CategoryOverviewLayout
      categoryName="楽天市場"
      categoryIcon="ShoppingCart"
      description="楽天市場から楽天APIを使用した商品情報取得"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ShopCard
          shopKey="rakuten-muji"
          href="/shops/rakuten/muji"
        />
        <ShopCard
          shopKey="rakuten-cosme"
          href="/shops/rakuten/cosme"
        />
        <ShopCard
          shopKey="rakuten-skincare"
          href="/shops/rakuten/skincare"
        />
        <ShopCard
          shopKey="rakuten-makeup"
          href="/shops/rakuten/makeup"
        />
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>楽天市場全体統計</CardTitle>
          </CardHeader>
          <CardContent>
            <RakutenCategoryStats />
          </CardContent>
        </Card>
      </div>
    </CategoryOverviewLayout>
  )
}
```

#### 8.3.2 共通カテゴリレイアウト
```typescript
// components/layouts/CategoryOverviewLayout.tsx
interface CategoryOverviewLayoutProps {
  categoryName: string
  categoryIcon: string
  description: string
  children: React.ReactNode
}

export const CategoryOverviewLayout: React.FC<CategoryOverviewLayoutProps> = ({
  categoryName,
  categoryIcon,
  description,
  children
}) => {
  return (
    <div className="space-y-6">
      {/* カテゴリヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name={categoryIcon} className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{categoryName}</h1>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <CategoryStatusBadge categoryName={categoryName.toLowerCase()} />
          <CategoryActionButtons categoryName={categoryName.toLowerCase()} />
        </div>
      </div>
      
      {/* カテゴリ固有コンテンツ */}
      {children}
    </div>
  )
}

// ショップカード
interface ShopCardProps {
  shopKey: string
  href: string
}

const ShopCard: React.FC<ShopCardProps> = ({ shopKey, href }) => {
  const shopConfig = shopConfigs[shopKey]
  const { data: shopStats } = useShopStats(shopKey)
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Icon name={shopConfig.icon} className="h-6 w-6" />
          <div className="flex-1">
            <CardTitle className="text-lg">{shopConfig.displayName}</CardTitle>
            <p className="text-sm text-gray-600">{shopConfig.description}</p>
          </div>
          <Badge variant={shopStats?.isActive ? "default" : "secondary"}>
            {shopStats?.isActive ? "アクティブ" : "非アクティブ"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {shopStats?.totalProducts || 0}
            </p>
            <p className="text-xs text-gray-600">商品数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {shopStats?.linkedProducts || 0}
            </p>
            <p className="text-xs text-gray-600">ASIN紐付け</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            最終更新: {shopStats?.lastUpdate ? 
              format(new Date(shopStats.lastUpdate), 'MM/dd HH:mm') : 
              '未実行'
            }
          </div>
          <Button size="sm" asChild>
            <Link href={href}>
              詳細を見る
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 8.4 データベース設計更新

#### 8.4.1 shop_categories テーブルの追加
```sql
-- ショップカテゴリテーブル
CREATE TABLE shop_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'official', 'rakuten', 'yahoo'
    name VARCHAR(50) NOT NULL, -- 'vt', 'dhc', 'muji', 'cosme', etc.
    display_name VARCHAR(100) NOT NULL,
    parent_type VARCHAR(20), -- 親カテゴリタイプ
    description TEXT,
    icon VARCHAR(50),
    is_enabled BOOLEAN DEFAULT TRUE,
    scraping_config JSONB, -- ショップ固有の設定
    api_config JSONB, -- API固有の設定（楽天・Yahoo用）
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, type, name)
);

-- インデックス
CREATE INDEX idx_shop_categories_user_id ON shop_categories(user_id);
CREATE INDEX idx_shop_categories_type ON shop_categories(type);
CREATE INDEX idx_shop_categories_parent_type ON shop_categories(parent_type);
CREATE INDEX idx_shop_categories_is_enabled ON shop_categories(is_enabled);

-- RLSポリシー
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own shop_categories" 
ON shop_categories FOR ALL 
USING (auth.uid() = user_id);

-- 更新日時トリガー
CREATE TRIGGER update_shop_categories_updated_at 
    BEFORE UPDATE ON shop_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 8.4.2 products テーブルの更新
```sql
-- products テーブルにカテゴリ情報を追加
ALTER TABLE products ADD COLUMN shop_category_id UUID REFERENCES shop_categories(id);
ALTER TABLE products ADD COLUMN shop_type VARCHAR(20); -- 'official', 'rakuten', 'yahoo'
ALTER TABLE products ADD COLUMN shop_name VARCHAR(50); -- 'vt', 'dhc', 'muji', etc.

-- 既存のsource列からの移行用
UPDATE products SET 
    shop_type = CASE 
        WHEN source IN ('vt', 'dhc', 'innisfree') THEN 'official'
        WHEN source = 'rakuten' THEN 'rakuten'
        WHEN source = 'yahoo' THEN 'yahoo'
        ELSE 'official'
    END,
    shop_name = source;

-- 新しいインデックス
CREATE INDEX idx_products_shop_category_id ON products(shop_category_id);
CREATE INDEX idx_products_shop_type ON products(shop_type);
CREATE INDEX idx_products_shop_name ON products(shop_name);
```

### 8.5 API設計更新

#### 8.5.1 階層化されたAPI構造
```typescript
// カテゴリ別統計API
// GET /api/categories/official/stats
// GET /api/categories/rakuten/stats  
// GET /api/categories/yahoo/stats
interface CategoryStatsResponse {
  categoryType: string
  totalProducts: number
  totalLinkedProducts: number
  avgProfitRate: number
  shops: Array<{
    shopName: string
    displayName: string
    totalProducts: number
    linkedProducts: number
    avgProfitRate: number
    lastUpdate: string
    isActive: boolean
  }>
}

// ショップ別API（階層構造対応）
// GET /api/shops/official/vt/products
// GET /api/shops/rakuten/muji/products  
// GET /api/shops/yahoo/lohaco/products
interface HierarchicalShopProductsRequest {
  categoryType: 'official' | 'rakuten' | 'yahoo'
  shopName: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  hasAsin?: boolean
  limit?: number
  offset?: number
}

// スクレイピングAPI（階層構造対応）
// POST /api/scraping/official/vt
// POST /api/scraping/rakuten/muji
// POST /api/scraping/yahoo/lohaco
interface HierarchicalScrapingRequest {
  categoryType: string
  shopName: string
  config: {
    // 公式サイト用
    categoryUrls?: string[]
    useProxy?: boolean
    // API用
    keywords?: string[]
    categoryIds?: string[]
    maxItems?: number
  }
}
```

### 8.6 ルーティング設計更新

#### 8.6.1 完全な階層ルーティング構造
```
/dashboard                           # ダッシュボードホーム
/products                           # 全商品一覧

# 公式サイトカテゴリ
/shops/official                     # 公式サイト一覧
/shops/official/vt                  # VT詳細ページ
/shops/official/vt/settings         # VT設定ページ
/shops/official/dhc                 # DHC詳細ページ
/shops/official/dhc/settings        # DHC設定ページ
/shops/official/innisfree           # innisfree詳細ページ
/shops/official/innisfree/settings  # innisfree設定ページ

# 楽天市場カテゴリ
/shops/rakuten                      # 楽天市場一覧
/shops/rakuten/muji                 # 楽天-無印良品ページ
/shops/rakuten/muji/settings        # 楽天-無印良品設定
/shops/rakuten/cosme                # 楽天-コスメページ
/shops/rakuten/cosme/settings       # 楽天-コスメ設定
/shops/rakuten/skincare             # 楽天-スキンケアページ
/shops/rakuten/skincare/settings    # 楽天-スキンケア設定
/shops/rakuten/makeup               # 楽天-メイクアップページ
/shops/rakuten/makeup/settings      # 楽天-メイクアップ設定

# Yahoo!ショッピングカテゴリ
/shops/yahoo                        # Yahoo!ショッピング一覧
/shops/yahoo/lohaco                 # Yahoo-LOHACOページ
/shops/yahoo/lohaco/settings        # Yahoo-LOHACO設定
/shops/yahoo/cosme                  # Yahoo-コスメページ
/shops/yahoo/cosme/settings         # Yahoo-コスメ設定
/shops/yahoo/beauty                 # Yahoo-ビューティーページ
/shops/yahoo/beauty/settings        # Yahoo-ビューティー設定
/shops/yahoo/skincare               # Yahoo-スキンケアページ
/shops/yahoo/skincare/settings      # Yahoo-スキンケア設定

# その他
/asins                              # ASIN管理
/settings                           # 全体設定
```

この階層化されたナビゲーション設計により、ユーザーは以下のように直感的に操作できます：

1. **公式サイト** → VT、DHC、innisfreeを選択
2. **楽天市場** → 無印良品、コスメカテゴリなどを選択  
3. **Yahoo!ショッピング** → LOHACO、各種カテゴリを選択

各レベルで統計情報の確認と設定が可能で、非常に使いやすい構造になりました。
```

### 8.2 ショップ別ページ設計

#### 8.2.1 共通ショップページレイアウト
```typescript
// components/shops/ShopPageLayout.tsx
interface ShopPageLayoutProps {
  shopName: string
  shopIcon: string
  children: React.ReactNode
}

export const ShopPageLayout: React.FC<ShopPageLayoutProps> = ({
  shopName,
  shopIcon,
  children
}) => {
  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name={shopIcon} className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shopName}</h1>
            <p className="text-sm text-gray-600">
              {shopName}から取得した商品の管理と設定
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ShopStatusBadge shopName={shopName.toLowerCase()} />
          <ShopActionButtons shopName={shopName.toLowerCase()} />
        </div>
      </div>
      
      {/* ショップ固有コンテンツ */}
      {children}
    </div>
  )
}

// ショップ状態表示
const ShopStatusBadge: React.FC<{ shopName: string }> = ({ shopName }) => {
  const { data: shopStatus } = useShopStatus(shopName)
  
  return (
    <Badge variant={shopStatus?.isActive ? "default" : "secondary"}>
      {shopStatus?.isActive ? "アクティブ" : "非アクティブ"}
    </Badge>
  )
}

// ショップアクションボタン
const ShopActionButtons: React.FC<{ shopName: string }> = ({ shopName }) => {
  const { scrapeShop, isLoading } = useScraping()
  
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => scrapeShop(shopName)}
        disabled={isLoading}
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            実行中...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            スクレイピング実行
          </>
        )}
      </Button>
      
      <Button variant="outline" size="sm">
        <Settings className="h-4 w-4 mr-2" />
        設定
      </Button>
    </div>
  )
}
```

#### 8.2.2 個別ショップページ実装例
```typescript
// app/(dashboard)/shops/vt/page.tsx
export default function VTPage() {
  return (
    <ShopPageLayout shopName="VT Cosmetics" shopIcon="ExternalLink">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* サマリーカード */}
        <div className="lg:col-span-4">
          <VTSummaryCards />
        </div>
        
        {/* メインコンテンツエリア */}
        <div className="lg:col-span-3">
          <VTProductTable />
        </div>
        
        {/* サイドパネル */}
        <div className="lg:col-span-1 space-y-4">
          <VTScrapingPanel />
          <VTSettingsPanel />
        </div>
      </div>
    </ShopPageLayout>
  )
}

// VT固有のコンポーネント
const VTSummaryCards = () => {
  const { data: vtStats } = useVTStats()
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">総商品数</p>
              <p className="text-2xl font-bold">{vtStats?.totalProducts || 0}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ASIN紐付け済み</p>
              <p className="text-2xl font-bold">{vtStats?.linkedProducts || 0}</p>
            </div>
            <Link2 className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">平均利益率</p>
              <p className="text-2xl font-bold">{vtStats?.avgProfitRate || 0}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">最終更新</p>
              <p className="text-sm font-medium">
                {vtStats?.lastUpdate ? format(new Date(vtStats.lastUpdate), 'MM/dd HH:mm') : '未実行'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 8.3 レスポンシブ設計
- **デスクトップファースト**: 主要な利用環境
- **サイドバー**: 768px以下で自動的に折りたたみモード
- **テーブル**: 1024px以下で横スクロール対応
- **ショップページ**: モバイルでは1カラムレイアウトに変更

### 8.2 テーブル設計詳細
```typescript
// components/tables/ProductTable.tsx
interface ProductTableProps {
  products: Product[]
  onProductUpdate: (id: string, updates: ProductUpdateRequest) => Promise<void>
  onAsinUpdate: (productId: string, asinId: string, updates: AsinUpdateRequest) => Promise<void>
  onSort: (field: string, direction: 'asc' | 'desc') => void
}

// テーブル列定義
const columns: TableColumn[] = [
  { key: 'image', label: '画像', width: 'w-24', sortable: false },
  { key: 'name', label: '商品名', width: 'w-80', sortable: true },
  { key: 'price', label: '価格', width: 'w-32', sortable: true },
  { key: 'purchasePrice', label: '仕入価格', width: 'w-28', sortable: true },
  { key: 'asin', label: 'ASIN', width: 'w-32', sortable: false },
  { key: 'amazonName', label: 'Amazon商品名', width: 'w-80', sortable: true },
  { key: 'amazonPrice', label: 'Amazon価格', width: 'w-32', sortable: true, editable: true },
  { key: 'monthlySales', label: '月販数', width: 'w-24', sortable: true, editable: true },
  { key: 'feeRate', label: '手数料率', width: 'w-24', sortable: false, editable: true },
  { key: 'fbaFee', label: 'FBA料', width: 'w-24', sortable: false, editable: true },
  { key: 'hasAmazon', label: 'Amazon有無', width: 'w-20', sortable: false, type: 'checkbox' },
  { key: 'hasOfficial', label: '公式有無', width: 'w-20', sortable: false, type: 'checkbox' },
  { key: 'complaintCount', label: '苦情回数', width: 'w-24', sortable: true, editable: true },
  { key: 'isDangerous', label: '危険物', width: '