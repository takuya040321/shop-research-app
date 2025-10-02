# 開発ガイドライン

## 1. コーディング規約

### 1.1 基本原則
- **関数ベース**: クラスを使用せず、関数ベースでコーディングする
- **文字列**: シングルクォート（'）ではなくダブルクォート（"）を使用
- **パスエイリアス**: `@/*`は`./src/*`にマップ

### 1.2 コードスタイル
- **早期リターン**: if文でのネストを避け、条件不一致時は早期リターンを実行
- **ガード句の活用**: 異常系や前提条件チェックは関数の最初で処理
- **三項演算子の制限**: 複雑な条件分岐は避け、可読性を優先
- **関心の分離**: UI/ロジック分離を徹底

### 1.3 フレームワーク固有
- **Next.jsベストプラクティス**: Next.js 15 App Routerの推奨パターンに準拠
- **マイグレーションファイル管理**: データベーススキーマ変更の適切な管理

### 1.4 ドキュメント作成
- **mermaid記法**: 図表作成に使用可能
- **構造化された日本語**: 可読性を重視したドキュメント作成


## 3. Git運用規則（GitHub Flow）

### 3.1 ブランチ戦略
```
main # 本番環境
├── feature/issue1-*** # Issue #1: 実装内容の概略
├── feature/issue2-*** # Issue #2: 実装内容の概略
└── feature/issue3-*** # Issue #3: 実装内容の概略
```

### 3.2 ブランチ命名規則
**形式**: `[type]/[issue番号]-[brief-description]`

**ブランチタイプ**:
- `feature/`: 新機能追加
- `fix/`: バグ修正
- `refactor/`: リファクタリング
- `docs/`: ドキュメント更新

**例**:
- `feature/issue1-user-authentication`
- `fix/issue5-scraping-error`
- `refactor/issue10-table-component`

### 3.3 Issue駆動開発フロー

#### 3.3.1 開発開始
1. GitHubでIssueを作成
2. Issueに基づいてブランチ作成: `git checkout -b feature/issue1-description`
3. 実装・コミット
4. プッシュ: `git push origin feature/issue1-description`
5. プルリクエスト作成

#### 3.3.2 Issue作成ガイドライン
- **タイトル**: 簡潔かつ具体的に
- **説明**: 背景、目的、実装内容を明記
- **ラベル**: feature, bug, enhancement等を適切に付与
- **担当者**: 自分をアサイン

### 3.4 コミットメッセージ規約

**形式**: `[type]: [subject]`

**コミットタイプ一覧**:
- `feat`: 新機能追加
- `fix`: バグ修正
- `style`: コードスタイル修正（機能に影響なし）
- `refactor`: リファクタリング
- `docs`: ドキュメント更新
- `test`: テスト追加・修正

**例**:
- `feat: Google認証機能を追加`
- `fix: 商品テーブルのソートバグを修正`
- `refactor: スクレイピング処理を共通化`
- `docs: READMEにセットアップ手順を追加`

### 3.5 コミット粒度・品質
- **1つの論理的な変更ごとにコミット**: 機能追加、バグ修正、リファクタリングを混在させない
- **適切な単位**: 小さすぎず大きすぎない粒度でコミット
- **動作する状態でコミット**: 不具合を含む中途半端な状態は避ける
- **明確なメッセージ**: 変更内容が一目で分かるよう簡潔に記述
- **コミット前確認**: TypeScriptエラー・リントエラーがないことを必ず確認

### 3.6 Issue連動キーワード

プルリクエストの本文に以下のキーワードを含めることで、マージ時に自動的にIssueをクローズ:
- `Close #1`
- `Closes #1`
- `Fix #1`
- `Fixes #1`
- `Resolve #1`
- `Resolves #1`

**例**:
```markdown
## 概要
Google認証機能を実装しました。

## 変更内容
- Supabase Authの設定
- ログイン画面の作成
- 認証フローの実装

Close #1
```

### 3.7 プルリクエスト規約

#### 3.7.1 PRタイトル
- Issue番号を含める: `[#1] Google認証機能を追加`
- 変更内容を簡潔に記述

#### 3.7.2 PR本文テンプレート
```markdown
## 概要
この変更の目的を記述

## 変更内容
- 変更点1
- 変更点2
- 変更点3

## テスト内容
- テストケース1
- テストケース2

## スクリーンショット（必要に応じて）
画像を添付

## チェックリスト
- [ ] TypeScriptエラーなし
- [ ] リントエラーなし
- [ ] 動作確認済み
- [ ] ドキュメント更新済み

Close #[Issue番号]
```

### 3.8 PR・マージ規約
- **マージ方法**: 必ず `--merge` を使用してマージコミットを作成
- **ブランチ履歴**: squash merge は使用せず、ブランチの履歴を保持する
- **ブランチ削除**: マージ完了後はローカル・リモート両方のブランチを削除
- **PR本文**: Issue自動クローズキーワード（Close #N）を必ず含める

#### 3.8.1 マージコマンド例
```bash
# mainブランチに移動
git checkout main

# マージ（--mergeオプション必須）
git merge --merge feature/issue1-description

# リモートにプッシュ
git push origin main

# ブランチ削除
git branch -d feature/issue1-description
git push origin --delete feature/issue1-description
```

## 4. 開発環境セットアップ

### 4.1 必要なツール
- **Node.js**: v20.x LTS
- **npm**: v9.0.0以上
- **Git**: v2.30.0以上
- **VS Code**: 推奨エディター

### 4.2 VS Code推奨拡張機能
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- TypeScript Importer
- Auto Import - ES6, TS, JSX, TSX

### 4.3 プロジェクトセットアップ
```bash
# リポジトリクローン
git clone https://github.com/your-username/shop-research-app.git
cd shop-research-app

# 依存関係インストール
npm install

# Serena MCP設定（Claude Code使用時）
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project "$(pwd)"

# 初回インデックス作成
uvx --from git+https://github.com/oraios/serena serena project index

# .serenaディレクトリを.gitignoreに追加
echo ".serena/" >> .gitignore

# 環境変数設定
cp .env.example .env.local
# .env.localを編集して必要な環境変数を設定

# 開発サーバー起動
npm run dev
```

### 4.4 環境変数設定
`.env.local`に以下の環境変数を設定:
```env
# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# MCP設定用（開発ツール用途・オプション）
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
SUPABASE_PROJECT_REF=your_supabase_project_ref

# プロキシ（オプション）
USE_PROXY=false
PROXY_HOST=your_proxy_host
PROXY_PORT=your_proxy_port

# 楽天API（オプション）
RAKUTEN_APP_ID=your_app_id

# Yahoo API（オプション）
YAHOO_CLIENT_ID=your_client_id
YAHOO_CLIENT_SECRET=your_client_secret
```

## 5. コード品質管理

### 5.1 静的解析ツール
- **TypeScript**: 型チェック
- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマット

### 5.2 実行コマンド
```bash
# 型チェック
npm run type-check

# リント実行
npm run lint

# フォーマット実行
npm run format

# ビルド確認
npm run build
```

### 5.3 コミット前チェック
以下を必ず実行してからコミット:
1. `npm run type-check` - TypeScriptエラーなし
2. `npm run lint` - リントエラーなし
3. `npm run build` - ビルド成功
4. 動作確認 - 実装機能の動作確認

## 6. テスト方針

### 6.1 テストレベル
- **単体テスト**: ユーティリティ関数、カスタムフック
- **統合テスト**: API エンドポイント
- **E2Eテスト**: 主要ユーザーフロー

### 6.2 テスト実行
```bash
# 全テスト実行
npm test

# 特定テスト実行
npm test -- <test-file-name>

# カバレッジ確認
npm run test:coverage
```


## 7. トラブルシューティング

### 7.1 よくある問題

#### 問題: npm installが失敗する
**解決策**:
```bash
# node_modules削除
rm -rf node_modules package-lock.json

# 再インストール
npm install
```

#### 問題: TypeScriptエラーが解消しない
**解決策**:
```bash
# TypeScriptサーバー再起動（VS Code）
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

#### 問題: Supabase接続エラー
**解決策**:
- `.env.local`の環境変数を確認
- SupabaseダッシュボードでAPIキーを再確認
- ネットワーク接続を確認

### 7.2 ログ確認
開発時のログ確認方法:
```bash
# 開発サーバーログ
npm run dev

# ブラウザコンソール
# Chrome DevTools → Console タブ

# サーバーログ
# ターミナルに出力される console.log を確認
```

## 8. レビュー基準

### 8.1 コードレビューチェックリスト
- [ ] コーディング規約に準拠
- [ ] 適切な命名（変数、関数、コンポーネント）
- [ ] 適切なエラーハンドリング
- [ ] 型定義の適切性
- [ ] パフォーマンスへの配慮
- [ ] セキュリティリスクなし
- [ ] テストカバレッジ十分

### 8.2 レビューコメント例
**良い例**:
- 「この関数は○○の責務も持っているので、分割を検討してください」
- 「エラーハンドリングが不足しています。try-catchを追加してください」

**避けるべき例**:
- 「これは良くない」（具体性なし）
- 「前のやり方の方が良かった」（代案なし）

## 9. 参考リソース

### 9.1 公式ドキュメント
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### 9.2 プロジェクト関連
- 要件定義書: `./docs/requirement.md`
- 技術仕様書: `./docs/technical_spec.md`
- システム設計書: `./docs/system_design.md`

---

**このガイドラインに従って、品質の高いコードを書きましょう！**