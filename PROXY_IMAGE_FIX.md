# プロキシ設定時のNext.js Image Optimization DNS解決エラー修正

## 問題
プロキシ設定ON時にNext.js Image Optimizationで外部画像(www.dhc.co.jp等)を取得する際、DNS解決エラー(EAI_AGAIN)が発生していました。

## 原因
Next.jsのImage Optimizationは内部でNode.jsのfetchを使用して画像を取得しますが、プロキシ設定がこのfetch処理に適用されていませんでした。

## 解決策
プロキシ使用時はカスタムローダーを使用し、API経由で画像を取得する方式に変更しました。

### 実装内容

#### 1. カスタム画像ローダー作成
- **ファイル**: `src/lib/image-loader.ts`
- **機能**: プロキシ対応のため、画像取得APIを経由するURLを生成

#### 2. 画像プロキシAPI作成
- **ファイル**: `src/app/api/image-proxy/route.ts`
- **機能**:
  - プロキシ設定を判定
  - プロキシ経由または直接アクセスで画像を取得
  - Node.jsの`http`/`https`モジュールを使用したプロキシ対応実装

#### 3. Next.js設定更新
- **ファイル**: `next.config.ts`
- **変更**:
  - `USE_PROXY=true`の場合、カスタムローダーを使用
  - `USE_PROXY=false`の場合、デフォルトの最適化を使用

## テスト手順

### プロキシON時のテスト
1. 環境変数を設定:
   ```bash
   USE_PROXY=true
   PROXY_HOST=your_proxy_host
   PROXY_PORT=your_proxy_port
   PROXY_USERNAME=your_username  # オプション
   PROXY_PASSWORD=your_password  # オプション
   ```

2. 開発サーバーを起動:
   ```bash
   npm run dev
   ```

3. 公式サイトページ(例: `/official/dhc`)にアクセス

4. 画像が正常に表示されることを確認

5. ブラウザのコンソールで以下を確認:
   - エラーが発生していないこと
   - 画像URLが`/api/image-proxy?url=...`形式になっていること

6. サーバーログで以下を確認:
   ```
   プロキシ経由で画像を取得: https://www.dhc.co.jp/goods/...
   ```

### プロキシOFF時のテスト
1. 環境変数を設定:
   ```bash
   USE_PROXY=false
   ```

2. 開発サーバーを再起動:
   ```bash
   npm run dev
   ```

3. 公式サイトページにアクセス

4. 画像が正常に表示されることを確認

5. 画像URLが`/_next/image?url=...`形式になっていることを確認

## 技術詳細

### プロキシリクエスト実装
Node.jsの`http`/`https`モジュールを使用して、プロキシ経由でのHTTPリクエストを実装しました。

```typescript
// プロキシオプション
const proxyOptions = {
  host: proxyUrlObj.hostname,
  port: parseInt(proxyUrlObj.port || "80"),
  method: "GET",
  path: imageUrl,
  headers: {
    "Host": targetUrl.hostname,
    "User-Agent": "Mozilla/5.0 ...",
    "Proxy-Authorization": "Basic ..." // 認証がある場合
  }
}
```

### キャッシュ戦略
取得した画像には長期キャッシュヘッダーを設定:
```
Cache-Control: public, max-age=31536000, immutable
```

## 注意事項

1. **ビルド時の環境変数**
   - `USE_PROXY`は**ビルド時**に読み込まれます
   - プロキシ設定を変更した場合は再ビルドが必要です
   - 開発時は`npm run dev`の再起動が必要です

2. **画像フォーマット**
   - Content-TypeはURLの拡張子から推測
   - サポート: JPEG, PNG, WebP, GIF

3. **エラーハンドリング**
   - プロキシエラー時は500エラーを返します
   - 画像取得失敗時のフォールバックは未実装

## 今後の改善案

1. **画像最適化**
   - 現在は元画像をそのまま返しています
   - Sharp等を使用した画像最適化を検討

2. **エラーハンドリング**
   - フォールバック画像の表示
   - リトライ機能の実装

3. **キャッシュ最適化**
   - Redis等を使用したサーバーサイドキャッシュ
   - CDN連携の検討
