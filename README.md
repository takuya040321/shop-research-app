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
- **公式サイトスクレイピング**: VT Cosmetics、DHC、innisfree
- **楽天市場API**: 無印良品、VT、innisfree等のブランド商品
- **Yahoo!ショッピングAPI**: LOHACO、ZOZOTOWN等の階層型ショップ

### 🔗 ASIN管理
- ASIN情報の一括アップロード（Excel/CSV）
- 商品とASINの手動紐付け
- 商品コピー機能（1商品に複数ASIN対応）

### 💰 利益計算
- 利益額・利益率・ROI の自動計算
- ショップ別割引設定（パーセンテージ・固定額）
- Amazon手数料（販売手数料率・FBA手数料）の考慮

### 📊 商品管理
- 固定ヘッダー付きスクロールテーブル
- インライン編集機能
- ソート・フィルタリング機能
- 画像プレビュー機能

### ⚙️ 設定管理
- 表示設定（デフォルト表示列、列幅）
- ソート設定（初期ソート列・方向）
- ショップ別割引設定

## 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (Radix UI)

### バックエンド
- **Next.js API Routes**
- **Supabase** (PostgreSQL)
- **Puppeteer** (スクレイピング)
- **Cheerio** (HTMLパース)

### 状態管理・フォーム
- **Zustand** (状態管理)
- **React Hook Form** (フォーム管理)
- **Zod** (バリデーション)

### その他
- **SheetJS** (Excel/CSV処理)
- **楽天市場API**
- **Yahoo!ショッピングAPI**

## セットアップ

### 前提条件
- Node.js v20.x 以上
- npm v9.0.0 以上
- Supabaseアカウント
- Google Cloud Platform アカウント（OAuth用）

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

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

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

1. **ログイン**
   - Google認証でログイン

2. **スクレイピング実行**
   - サイドバーからショップを選択
   - スクレイピング実行ボタンをクリック
   - 商品データが自動取得・保存される

3. **ASIN紐付け**
   - ASIN管理ページでExcel/CSVをアップロード
   - または手動でASIN情報を入力
   - 商品とASINを紐付け

4. **利益確認**
   - 商品一覧テーブルで利益額・利益率・ROIを確認
   - インライン編集でAmazon価格や手数料を調整

5. **設定カスタマイズ**
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
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/      # 認証ページ
│   │   ├── page.tsx     # ホーム
│   │   ├── products/    # 全商品一覧
│   │   ├── official/    # 公式サイト
│   │   ├── rakuten/     # 楽天市場
│   │   ├── yahoo/       # Yahoo!ショッピング
│   │   ├── asins/       # ASIN管理
│   │   ├── settings/    # 設定
│   │   └── api/         # API Routes
│   ├── components/       # UIコンポーネント
│   ├── hooks/           # カスタムフック
│   ├── lib/             # ユーティリティ
│   ├── store/           # 状態管理
│   ├── types/           # 型定義
│   └── constants/       # 定数
├── docs/                # ドキュメント
│   ├── requirement.md
│   ├── technical_spec.md
│   ├── system_design.md
│   ├── CONTRIBUTING.md
│   └── implementation_plan.md
└── public/              # 静的ファイル
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

## ドキュメント

- [要件定義書](./docs/requirement.md)
- [技術仕様書](./docs/technical_spec.md)
- [システム設計書](./docs/system_design.md)
- [開発ガイドライン](./docs/CONTRIBUTING.md)
- [実装計画書](./docs/implementation_plan.md)
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