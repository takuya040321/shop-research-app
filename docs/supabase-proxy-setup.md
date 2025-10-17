# Supabaseプロキシ対応実装ガイド

## 概要

サーバーサイドのSupabaseアクセスでプロキシ環境でも正常に動作するように、以下の機能を実装しました：

1. **サービスロールキー認証**: RLS（行レベルセキュリティ）を回避した管理者権限アクセス
2. **プロキシ対応fetch**: `USE_PROXY`環境変数によるプロキシ制御
3. **https-proxy-agent統合**: プロキシ経由の安全なHTTPS通信

## 実装ファイル

### 1. `/src/lib/supabase.ts` (更新)

汎用Supabaseクライアント（Anonキー認証、プロキシ対応）。

#### 主な機能

- **環境変数検証**: `NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`の存在確認
- **プロキシ判定**: `determineProxySettings()`でプロキシ使用の可否を判定
- **カスタムfetch**:
  - プロキシ有効時: `https-proxy-agent`でfetchをラップ
  - プロキシ無効時: 標準のfetchを使用
- **認証設定**: autoRefreshToken、persistSession、detectSessionInUrlを有効化
- **ログ出力**: プロキシ状態、設定値を明示的にコンソール出力

#### 変更内容

```typescript
// 変更前: プロキシを無効化
global: {
  fetch: (...args) => {
    delete process.env.HTTP_PROXY
    delete process.env.HTTPS_PROXY
    const result = fetch(...args)
    // 環境変数を復元
    return result
  }
}

// 変更後: プロキシ対応
const proxySettings = determineProxySettings()

if (proxySettings.enabled && proxySettings.config) {
  const agent = new HttpsProxyAgent(proxyUrl)
  customFetch = (url, init) => fetch(url, { ...init, agent })
} else {
  customFetch = fetch
}

global: { fetch: customFetch }
```

### 2. `/src/lib/supabase-server.ts` (新規作成)

サーバーサイド専用のSupabaseクライアント実装。

#### 主な機能

- **環境変数検証**: `NEXT_PUBLIC_SUPABASE_URL`と`SUPABASE_SERVICE_ROLE_KEY`の存在確認
- **プロキシ判定**: `determineProxySettings()`でプロキシ使用の可否を判定
- **カスタムfetch**:
  - プロキシ有効時: `https-proxy-agent`でfetchをラップ
  - プロキシ無効時: 標準のfetchを使用
- **ログ出力**: プロキシ状態、設定値を明示的にコンソール出力

#### コード構造

```typescript
import { createClient } from "@supabase/supabase-js"
import { HttpsProxyAgent } from "https-proxy-agent"
import { determineProxySettings, generateProxyUrl } from "@/lib/proxy"

function createServerSupabaseClient() {
  // 1. 環境変数取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // 2. プロキシ判定
  const proxySettings = determineProxySettings()

  // 3. fetch関数準備
  let customFetch: typeof fetch

  if (proxySettings.enabled && proxySettings.config) {
    // プロキシ有効: https-proxy-agentでラップ
    const proxyUrl = generateProxyUrl(proxySettings.config)
    const agent = new HttpsProxyAgent(proxyUrl)

    customFetch = (url, init) => fetch(url, { ...init, agent })
  } else {
    // プロキシ無効: 標準fetch
    customFetch = fetch
  }

  // 4. クライアント作成（サービスロールキー使用）
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: { fetch: customFetch }
  })
}

export const supabaseServer = createServerSupabaseClient()
```

### 2. `.env.example` (更新)

サービスロールキーの環境変数を追加。

```env
# Supabaseサーバーサイド設定（サーバー処理で必須）
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. `/src/lib/scraper.ts` (更新)

BaseScraperクラスのスクレイピング処理で`supabaseServer`を使用。

#### 変更内容

```typescript
// スクレイピング処理専用でサーバークライアントを使用
import { supabaseServer } from "./supabase-server"

// saveOrUpdateProducts メソッド内
const db = supabaseServer  // プロキシ対応クライアント

// すべてのDB操作で db を使用
await db.from("products").select(...)
await db.from("products").insert(...)
await db.from("products").update(...)
```

**重要**:
- スクレイピング処理のみ`supabaseServer`（プロキシ対応）を使用
- その他の箇所は従来の`supabase`クライアントを継続使用
- これにより既存コードへの影響を最小化

## 使用方法

### 環境変数設定

`.env.local`ファイルに以下を追加：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 新規追加

# プロキシ設定
USE_PROXY=true
PROXY_HOST=your-proxy-host
PROXY_PORT=8080
PROXY_USERNAME=your-username  # オプション
PROXY_PASSWORD=your-password  # オプション
```

### サーバーサイドでの使用例

```typescript
import { getServerSupabaseClient } from "@/lib/supabase-server"

// サーバーコンポーネント、API Route、スクレイパーなどで使用
const supabase = getServerSupabaseClient()

const { data, error } = await supabase
  .from("products")
  .select("*")
  .eq("shop_type", "official")
```

## 動作フロー

### プロキシ無効時（USE_PROXY=false）

1. `determineProxySettings()` → `{ enabled: false }`
2. 標準の`fetch`を使用
3. Supabaseに直接接続

```
[アプリ] → [fetch] → [Supabase]
```

### プロキシ有効時（USE_PROXY=true）

1. `determineProxySettings()` → `{ enabled: true, config: {...} }`
2. `https-proxy-agent`でfetchをラップ
3. プロキシ経由でSupabaseに接続

```
[アプリ] → [fetch + proxy-agent] → [プロキシ] → [Supabase]
```

## ログ出力例

### プロキシ無効時

```
=== サーバーサイドSupabaseクライアント初期化 ===
Supabase URL: https://wzocfcqvlxzcbmfdjvzk.supabase.co
プロキシを使用しません
通常のfetchを使用します
サーバーサイドSupabaseクライアント初期化完了
==============================================
```

### プロキシ有効時

```
=== サーバーサイドSupabaseクライアント初期化 ===
Supabase URL: https://wzocfcqvlxzcbmfdjvzk.supabase.co
プロキシを使用します: proxy.example.com:8080
プロキシエージェント作成: proxy.example.com:8080
サーバーサイドSupabaseクライアント初期化完了
==============================================
```

## トラブルシューティング

### エラー: SUPABASE_SERVICE_ROLE_KEYが設定されていません

**原因**: サービスロールキーが環境変数に設定されていない

**解決策**:
1. Supabaseダッシュボード → Settings → API
2. "Service Role Key"をコピー
3. `.env.local`に`SUPABASE_SERVICE_ROLE_KEY=<コピーした値>`を追加

### エラー: プロキシ認証失敗

**原因**: プロキシ設定が不正確

**解決策**:
1. `PROXY_HOST`, `PROXY_PORT`が正しいか確認
2. 認証が必要な場合、`PROXY_USERNAME`, `PROXY_PASSWORD`を設定
3. `USE_PROXY=true`が設定されているか確認

### 接続タイムアウト

**原因**: プロキシが応答していない、またはSupabaseにアクセスできない

**解決策**:
1. プロキシサーバーが稼働しているか確認
2. ファイアウォールでSupabase（*.supabase.co）へのアクセスが許可されているか確認
3. ログを確認してプロキシ設定が正しく反映されているか確認

## セキュリティ注意事項

### サービスロールキーの取り扱い

⚠️ **重要**: サービスロールキーは**絶対にクライアントサイドで使用しない**こと

- RLS（行レベルセキュリティ）を回避する管理者権限
- データベースへの完全なアクセス権限
- サーバーサイドコード（API Route、Server Component、スクレイパー）でのみ使用

### 環境変数の管理

- `.env.local`はGit管理下に**含めない**（`.gitignore`で除外済み）
- 本番環境では環境変数を安全に管理（Vercel Secrets等）
- サービスロールキーは定期的にローテーション

## 参考資料

- [Supabase Server-side Auth](https://supabase.com/docs/guides/auth/server-side)
- [https-proxy-agent Documentation](https://github.com/TooTallNate/proxy-agents)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
