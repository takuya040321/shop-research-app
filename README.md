# Shop Research app

Amazon販売事業者向けの商品リサーチ・利益計算システム

## 📋 目次

- [概要](#概要)
- [主な機能](#主な機能)
- [技術スタック](#技術スタック)
- [セットアップ](#セットアップ)
- [使い方](#使い方)
- [プロジェクト構成](#プロジェクト構成)
- [開発ガイド](#開発ガイド)
- [ライセンス](#ライセンス)

## 概要

Shop Research appは、個人のAmazon販売事業者が複数のECサイトから商品情報を効率的に収集し、Amazon販売における利益計算を自動化することで、仕入れ判断を支援するシステムです。

### 対象ユーザー
- 個人Amazon販売事業者

### システムの特徴
- **多様なデータソース**: 公式サイトスクレイピング、楽天市場API、Yahoo!ショッピングAPI
- **階層型ナビゲーション**: 4階層の直感的なショップ管理
- **自動利益計算**: Amazon販売価格と仕入価格の比較による利益額・利益率・ROI計算
- **柔軟な商品管理**: ASIN紐付け、商品コピー、インライン編集

## 主な機能

### 📦 商品情報収集
- **公式サイトスクレイピング**: ✅ VT Cosmetics、DHC、innisfree（全カテゴリ一括取得）
- **楽天市場API**: ✅ 実装完了
- **Yahoo!ショッピングAPI**: ✅ 実装完了

### 🔗 ASIN管理
- ✅ 商品とASINのインライン紐付け
- ✅ ASIN情報の直接入力・編集
- ✅ 商品コピー機能（1商品に複数ASIN対応）
- ✅ ASIN一括アップロード（Excel/CSV）

### 💰 利益計算
- ✅ 利益額・利益率・ROI の自動計算
- ✅ ショップ別割引設定対応（shop_discountsテーブル）
- ✅ Amazon手数料（販売手数料率・FBA手数料）の考慮
- ✅ リアルタイム計算（商品取得時に自動実行）

### 📊 商品管理
- ✅ スクロール可能なテーブル（列幅固定）
- ✅ 全列インライン編集機能
- ✅ 全列ソート機能
- ✅ 高度なフィルタリング（テキスト、価格、利益率、ROI、ASIN設定状況）
- ✅ 画像ホバー拡大プレビュー
- ✅ 右クリックメニュー（コピー、削除）
- ✅ Toaster通知システム

### 🔧 データ管理
- ✅ 重複商品自動削除（スクレイピング後）
- ✅ 重複商品手動削除API（`/api/products/deduplicate`）

### ⚙️ 設定管理
- ⏳ 表示設定（デフォルト表示列、列幅）- 未実装
- ⏳ ソート設定（初期ソート列・方向）- 未実装
- ⏳ ショップ別割引設定UI - 未実装（テーブルは存在）

## 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (Radix UI)
- **Sonner** (Toast通知)

### バックエンド
- **Next.js API Routes**
- **Supabase** (PostgreSQL)
- **Puppeteer** (スクレイピング)
- **Cheerio** (HTMLパース)

### 開発ツール
- **Serena MCP** (コードベース理解・検索)
- **Supabase MCP** (データベース操作)

### その他
- ✅ **SheetJS** (Excel/CSV処理)
- ✅ **楽天市場API**
- ✅ **Yahoo!ショッピングAPI**

## セットアップ

### 前提条件
- Node.js v20.x 以上
- npm v9.0.0 以上
- Supabaseアカウント

**注意**: このシステムはローカル環境のみでの使用を想定しており、デプロイや認証機能は実装していません。

### インストール手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/your-username/shop-research-app.git
cd shop-research-app
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定**
```bash
cp .env.example .env.local
```

`.env.local` を編集して以下の環境変数を設定:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# プロキシ（オプション）
USE_PROXY=false
PROXY_HOST=your_proxy_host
PROXY_PORT=your_proxy_port

# 楽天API
RAKUTEN_APP_ID=your_rakuten_app_id

# Yahoo API
YAHOO_CLIENT_ID=your_yahoo_client_id
YAHOO_CLIENT_SECRET=your_yahoo_client_secret
```

4. **データベースのセットアップ**
- Supabaseダッシュボードで新規プロジェクト作成
- `docs/system_design.md` のデータベース設計に従ってテーブルを作成

5. **開発サーバーの起動**
```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 使い方

### 基本的なワークフロー

1. **スクレイピング実行**
   - サイドバーからショップを選択
   - スクレイピング実行ボタンをクリック
   - 商品データが自動取得・保存される

2. **ASIN紐付け**
   - ASIN管理ページでExcel/CSVをアップロード
   - または手動でASIN情報を入力
   - 商品とASINを紐付け

3. **利益確認**
   - 商品一覧テーブルで利益額・利益率・ROIを確認
   - インライン編集でAmazon価格や手数料を調整

4. **設定カスタマイズ**
   - 全体設定で表示列・ソート順を設定
   - ショップ別割引設定で利益計算を最適化

### 階層ナビゲーション

```
├── ホーム
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

## プロジェクト構成

```
shop-research-app/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx             # ホーム（ダッシュボード予定）
│   │   ├── layout.tsx           # ルートレイアウト
│   │   ├── official/            # ✅ 公式サイト（VT Cosmetics）
│   │   │   └── page.tsx
│   │   └── api/                 # API Routes
│   │       ├── products/        # 商品操作API
│   │       │   ├── copy/        # 商品コピー
│   │       │   ├── delete/      # 商品削除
│   │       │   └── deduplicate/ # 重複削除
│   │       └── scrape/          # スクレイピングAPI
│   │           └── vt/          # VT Cosmetics
│   ├── components/              # UIコンポーネント
│   │   ├── layout/              # レイアウト関連
│   │   │   └── sidebar.tsx      # サイドバー
│   │   ├── products/            # 商品関連
│   │   │   ├── product-table.tsx
│   │   │   └── product-search.tsx
│   │   └── ui/                  # shadcn/ui コンポーネント
│   ├── lib/                     # ユーティリティ
│   │   ├── supabase.ts          # Supabaseクライアント
│   │   ├── products.ts          # 商品操作・利益計算
│   │   ├── deduplication.ts     # 重複削除
│   │   ├── scraper.ts           # スクレイパー基底クラス
│   │   ├── scrapers/            # 各ブランドスクレイパー
│   │   │   └── vt-cosmetics-scraper.ts
│   │   ├── proxy.ts             # プロキシ設定
│   │   └── brand-config.ts      # ブランド設定
│   └── types/                   # 型定義
│       └── database.ts          # データベース型定義
├── database/                    # データベーススキーマ
│   └── schema.sql
├── docs/                        # ドキュメント
│   ├── requirements.md
│   ├── technical_spec.md
│   ├── system_design.md
│   ├── implementation_plan.md
│   ├── SUPABASE_MCP_SETUP.md
│   └── CLAUDE.md
└── public/                      # 静的ファイル
```

## 開発ガイド

### 開発環境のセットアップ

詳細は [CONTRIBUTING.md](./docs/CONTRIBUTING.md) を参照してください。

### コーディング規約

- **関数ベース**: クラスを使用せず、関数ベースでコーディング
- **文字列**: ダブルクォート（"）を使用
- **早期リターン**: if文のネストを避ける
- **型安全性**: TypeScriptの厳密な型定義を活用

### Git運用規則（GitHub Flow）

```bash
# 機能開発
git checkout -b feature/issue1-description
# 実装・コミット
git commit -m "feat: 機能を追加"
# プッシュ・プルリクエスト
git push origin feature/issue1-description
```

詳細は [CONTRIBUTING.md](./docs/CONTRIBUTING.md) を参照してください。

### コマンド一覧

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# リント実行
npm run lint

# フォーマット実行
npm run format

# ビルド
npm run build

# 本番サーバー起動
npm start
```

## 実装状況

### Phase 1: 基盤構築 ✅
- ✅ Next.js 15 + TypeScript環境構築
- ✅ Supabaseデータベースセットアップ
- ✅ 基本レイアウト・サイドバー実装
- ✅ プロキシ制御実装
- ✅ Serena MCP・Supabase MCP統合

### Phase 2: 公式サイト対応 ✅
- ✅ **商品テーブルコンポーネント**: 全機能実装完了
- ✅ **商品管理機能**: 検索、フィルター、編集、コピー、削除
- ✅ **VT Cosmeticsスクレイピング**: 全カテゴリ対応完了
- ✅ **DHCスクレイピング**: 全カテゴリ対応完了
- ✅ **innisfreeスクレイピング**: 全カテゴリ対応完了
- ✅ **ASIN管理機能**: インライン編集・一括アップロード完全対応
- ✅ **利益計算機能**: リアルタイム自動計算
- ✅ **重複削除機能**: 自動・手動実行対応

### Phase 3: API統合 ✅
- ✅ 楽天市場API統合
- ✅ Yahoo!ショッピングAPI統合

### Phase 4: 高度機能（未着手）
- ⏳ ダッシュボード
- ⏳ 全体設定・割引設定UI

## ドキュメント

- [要件定義書](./docs/requirements.md)
- [技術仕様書](./docs/technical_spec.md)
- [システム設計書](./docs/system_design.md)
- [実装計画書](./docs/implementation_plan.md)
- [Supabase MCP設定ガイド](./docs/SUPABASE_MCP_SETUP.md)
- [Claude開発ガイド](./CLAUDE.md)

## 貢献

プルリクエストを歓迎します！変更を提案する前に、[開発ガイドライン](./docs/CONTRIBUTING.md) を確認してください。

### 開発フロー
1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトは個人利用を目的としています。

---

**Shop Research app** - Amazon販売を効率化する商品リサーチツール