# 技術仕様書

## 1. 技術スタック概要

### 1.1 アーキテクチャ構成
- **アプリケーション形態**: フルスタックWebアプリケーション
- **実行環境**: ローカル環境のみ
- **アーキテクチャパターン**: モノリシック構成
- **レンダリング方式**: SSR（Server-Side Rendering）+ CSR（Client-Side Rendering）

**注意**: このシステムはローカル環境のみでの使用を想定しており、デプロイや認証機能は実装していません。

### 1.2 技術選定理由

#### 1.2.1 Next.js 15選定理由
- **フルスタック対応**: フロントエンド・バックエンドの統合開発
- **App Router**: 最新のファイルベースルーティング
- **パフォーマンス**: 自動最適化機能
- **TypeScript統合**: 型安全性の確保
- **ローカル開発**: 開発サーバーの高速起動

#### 1.2.2 Supabase選定理由
- **PostgreSQL**: 高性能リレーショナルデータベース
- **リアルタイム**: リアルタイム更新機能
- **REST API**: 自動生成API
- **クラウドDB**: セットアップ不要のクラウドデータベース

## 2. 開発環境仕様

### 2.1 必要なソフトウェア
- **Node.js**: v18.17.0 以上（推奨: v20.x LTS）
- **npm**: v9.0.0 以上
- **Git**: v2.30.0 以上
- **エディター**: Visual Studio Code（推奨）

### 2.2 推奨システム要件
- **OS**: Windows 10/11、macOS 12+、Ubuntu 20.04+
- **メモリ**: 8GB以上（推奨: 16GB）
- **ストレージ**: 10GB以上の空き容量
- **ネットワーク**: 安定したインターネット接続

### 2.3 開発ツール設定
#### 2.3.1 エディター設定（VS Code）
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

#### 2.3.2 推奨VS Code拡張機能
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- TypeScript Importer
- Auto Import - ES6, TS, JSX, TSX

## 3. フロントエンド技術仕様

### 3.1 React & Next.js設定
- **Next.js**: v15.0.0+
- **React**: v18.0.0+
- **TypeScript**: v5.0.0+
- **App Router**: 完全移行

### 3.2 UI/UXフレームワーク
#### 3.2.1 Tailwind CSS
- **バージョン**: v3.4.0+
- **設定**: JIT（Just-In-Time）モード
- **カスタマイズ**: プロジェクト固有のデザインシステム

#### 3.2.2 shadcn/ui
- **コンポーネント**: Radix UIベース
- **カスタマイズ**: Tailwind CSSテーマ統合
- **アクセシビリティ**: WCAG 2.1 AA準拠

### 3.3 状態管理
- **Zustand**: v4.4.0+
- **理由**: 軽量、TypeScript親和性、単一ユーザー向け
- **設計パターン**: ドメイン別ストア分割

### 3.4 フォーム処理
- **React Hook Form**: v7.45.0+
- **Zod**: v3.22.0+ （バリデーション）
- **統合**: @hookform/resolvers/zod

### 3.5 ファイル処理
- **SheetJS**: v0.20.0+ （Excel/CSV処理）
- **対応形式**: .xlsx, .xls, .csv
- **機能**: 読み込み、パース、型変換

## 4. バックエンド技術仕様

### 4.1 API設計
- **フレームワーク**: Next.js API Routes
- **設計パターン**: RESTful API
- **レスポンス形式**: JSON
- **エラーハンドリング**: 統一エラーレスポンス

### 4.2 API構造
```
/api/
├── products/
│   ├── cleanup-duplicates/  # 重複商品クリーンアップ
│   ├── copy/               # 商品コピー（original_product_id継承）
│   └── deduplicate/        # 重複商品削除
├── asins/
│   └── bulk-upload/        # ASIN一括アップロード
├── scrape/
│   ├── vt/                 # VTスクレイピング
│   ├── dhc/                # DHCスクレイピング
│   └── innisfree/          # innisfreeスクレイピング
├── rakuten/
│   └── search/             # 楽天商品検索
├── yahoo/
│   └── search/             # Yahoo商品検索
└── image-proxy/            # 画像プロキシ

**注**: 商品・ASIN・設定のCRUD操作はSupabase REST APIを直接使用します。
```

### 4.3 スクレイピング仕様
#### 4.3.1 Puppeteer設定
- **バージョン**: v21.0.0+
- **ヘッドレスモード**: true（本番環境）
- **ユーザーエージェント**: ランダムローテーション
- **待機戦略**: ページ読み込み完了待機

#### 4.3.2 プロキシ制御
- **環境変数**: `USE_PROXY=true/false`
- **制御フロー**: 事前判定必須
- **プロキシ設定**: 一元管理
- **フェイルオーバー**: プロキシ失敗時のダイレクト接続

#### 4.3.3 Cheerio設定
- **用途**: HTMLパース・要素抽出
- **セレクター**: CSS セレクター使用
- **データクレンジング**: 自動テキスト整形

## 5. データベース仕様

### 5.1 Supabase設定
- **バージョン**: PostgreSQL 15+
- **接続方式**: REST API + リアルタイム購読
- **ローカル使用**: 単一ユーザー向け設定

### 5.2 接続設定
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 5.3 型定義
```typescript
// types/database.ts
export interface Database {
  public: {
    Tables: {
      products: {
        Row: ProductRow
        Insert: ProductInsert
        Update: ProductUpdate
      }
      asins: {
        Row: AsinRow
        Insert: AsinInsert
        Update: AsinUpdate
      }
      shop_discounts: {
        Row: ShopDiscountRow
        Insert: ShopDiscountInsert
        Update: ShopDiscountUpdate
      }
    }
  }
}

// 商品とASINの関係
// - products.asin カラムでASINを参照（文字列）
// - asins.asin とJOINして詳細情報を取得
```

## 6. セキュリティ仕様

### 6.1 データセキュリティ
#### 6.1.1 環境変数セキュリティ
- **機密情報**: .env.local で管理
- **公開情報**: NEXT_PUBLIC_ プレフィックス
- **ローカル環境**: ローカルファイルで管理

## 7. 環境設定

### 7.1 環境変数仕様
```env
# .env.local
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# プロキシ設定（オプション）
USE_PROXY=false
PROXY_HOST=your_proxy_host
PROXY_PORT=your_proxy_port
PROXY_USERNAME=your_proxy_username
PROXY_PASSWORD=your_proxy_password

# 楽天API設定
RAKUTEN_APP_ID=your_rakuten_app_id
RAKUTEN_SECRET=your_rakuten_secret

# Yahoo API設定
YAHOO_CLIENT_ID=your_yahoo_client_id
YAHOO_CLIENT_SECRET=your_yahoo_client_secret

# アプリケーション設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 7.2 設定値詳細
#### 7.2.1 必須設定
- **Supabase**: プロジェクトURL、匿名キー、サービスロールキー
- **Google OAuth**: クライアントID、クライアントシークレット
- **NextAuth**: URL、シークレットキー

#### 7.2.2 オプション設定
- **プロキシ**: 利用時のみ設定
- **楽天API**: 利用時のみ設定
- **Yahoo API**: 利用時のみ設定

## 8. パフォーマンス要件

### 8.1 フロントエンドパフォーマンス
- **初期ロード**: 3秒以内
- **ページ遷移**: 1秒以内
- **テーブル描画**: 5000件までスムーズ表示
- **画像読み込み**: 遅延ロード対応

### 8.2 バックエンドパフォーマンス
- **API応答**: 500ms以内
- **スクレイピング**: サイト別並列実行
- **データベース**: インデックス最適化
- **メモリ使用**: 512MB以内

### 8.3 最適化手法
- **Next.js Image**: 画像最適化
- **Dynamic Import**: コード分割
- **React.memo**: 不要な再レンダリング防止
- **useMemo/useCallback**: 計算結果キャッシュ

## 9. 依存関係管理

### 9.1 主要依存関係
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.45.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "tailwindcss": "^3.4.0",
    "puppeteer": "^21.0.0",
    "cheerio": "^1.0.0",
    "xlsx": "^0.20.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.45.0",
    "eslint-config-next": "^15.0.0",
    "prettier": "^3.0.0",
    "@tailwindcss/typography": "^0.5.0"
  }
}
```

### 9.2 バージョン管理方針
- **メジャーバージョン**: 慎重な更新
- **マイナーバージョン**: 定期更新
- **パッチバージョン**: セキュリティ更新優先
- **依存関係監査**: 月次実行

## 10. 開発・デプロイメント仕様

### 10.1 開発サーバー
```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# Linter実行
npm run lint

# フォーマッター実行
npm run format
```

### 10.2 ビルド設定
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['puppeteer']
  }
}

module.exports = nextConfig
```

### 10.3 ローカル実行
- **開発サーバー**: npm run dev
- **環境変数**: .env.local で管理
- **ポート**: 3000（デフォルト）
- **注意**: ローカル環境のみでの使用を想定

## 11. 監視・ログ仕様

### 11.1 ログ設定
- **ログレベル**: INFO、WARN、ERROR
- **出力先**: コンソール出力のみ
- **ログ形式**: JSON形式
- **用途**: 開発時のデバッグ・問題調査用

### 11.2 エラーハンドリング
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      data,
      timestamp: new Date().toISOString()
    }))
  },
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    }))
  }
}
```

## 12. 品質保証

### 12.1 静的解析
- **TypeScript**: 厳密な型チェック
- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマット統一

### 12.2 設定ファイル
```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

```json
// prettier.config.js
module.exports = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5'
}
```