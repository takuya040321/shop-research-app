# Supabase MCP設定ガイド

このドキュメントでは、Claude CodeでSupabase MCPを設定する手順を説明します。

## 概要

Supabase MCPを使用することで、Claude CodeからSupabaseデータベースに直接アクセスし、以下の操作が可能になります：

- テーブル構造の確認・変更
- データのクエリ・更新
- スキーマの生成・管理
- デバッグ・開発支援

## 前提条件

- Node.js 20+ がインストールされていること
- Supabaseプロジェクトが作成済みであること
- 必要な環境変数が設定されていること

## セットアップ手順

### 1. Supabaseアクセストークンの取得

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. アカウント設定 → Access Tokens に移動
3. 「Generate new token」をクリック
4. トークン名を入力（例：「Claude Code MCP」）
5. 生成されたトークンをコピーして保存

### 2. プロジェクトリファレンスの確認

1. Supabaseプロジェクトの設定画面に移動
2. 「General」タブでProject Referenceを確認
3. `abcdefghijklmnop` のような文字列をコピー

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下の変数を設定：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ACCESS_TOKEN=your_access_token
SUPABASE_PROJECT_REF=your_project_ref
```

### 4. 自動セットアップスクリプトの実行

```bash
npm run setup-mcp
```

このスクリプトは以下を実行します：
- 必要なパッケージのインストール確認
- `.mcp.json` 設定ファイルの生成
- 環境変数の確認
- 接続テスト

### 5. Claude Codeの再起動

設定を反映するため、Claude Codeを再起動してください。

## 手動設定（参考）

自動セットアップがうまくいかない場合の手動設定手順：

### .mcp.json の作成

プロジェクトルートに以下の内容で `.mcp.json` を作成：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--read-only",
        "--project-ref=your_project_ref"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_access_token"
      }
    }
  }
}
```

## 使用方法

Claude Codeで以下のようなコマンドを実行できます：

### データベース構造の確認
```
Supabaseのテーブル構造を確認して
```

### データの検索
```
productsテーブルからすべてのデータを取得して
```

### スキーマの確認
```
shop_categoriesテーブルの詳細な構造を教えて
```

### データの分析
```
ASINテーブルで月間売上が100以上の商品を分析して
```

## 開発用ヘルパーコマンド

### テストデータの投入
```bash
npm run db:seed
```

### データベースのリセット
```bash
npm run db:reset
```

### リセット後にテストデータを投入
```bash
npm run db:reset-and-seed
```

## セキュリティ注意事項

### Read-Only モード
デフォルトでは `--read-only` フラグが設定されており、データの読み取りのみ可能です。

### フルアクセスモード
データの更新・削除が必要な場合は、`.mcp.json` から `--read-only` フラグを削除してください：

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase",
        "--project-ref=your_project_ref"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_access_token"
      }
    }
  }
}
```

### 環境変数の管理
- `.env.local` ファイルは `.gitignore` に含まれているため、コミットされません
- 本番環境では別途セキュアな方法で環境変数を管理してください

## トラブルシューティング

### 接続エラー
- 環境変数が正しく設定されているか確認
- Supabaseアクセストークンの有効期限を確認
- プロジェクトリファレンスが正しいか確認

### パッケージエラー
```bash
npm install -g @supabase/mcp-server-supabase
```

### 権限エラー
- アクセストークンの権限を確認
- プロジェクトへのアクセス権限を確認

## 参考リンク

- [Supabase MCP公式ドキュメント](https://supabase.com/docs/guides/getting-started/mcp)
- [Claude Code MCP設定ガイド](https://docs.claude.com/en/docs/claude-code/mcp)
- [Supabase MCP GitHub](https://github.com/supabase-community/supabase-mcp)