# MCP（Model Context Protocol）セットアップガイド

このドキュメントでは、Shop Research Appの開発で推奨されるMCPのセットアップ方法を説明します。

## MCPとは

MCP（Model Context Protocol）は、Claude Codeが外部ツールやサービスと連携するためのプロトコルです。MCPを追加することで、開発効率を大幅に向上させることができます。

## 推奨MCP

### 1. context7 MCP
コンテキスト管理を改善し、大規模なコードベースでの作業効率を向上させます。

### 2. playwright MCP
ブラウザ自動化とE2Eテストをサポートし、スクレイピング機能のテストを容易にします。

## セットアップ方法

### 前提条件

- Claude Code がインストールされていること
- Node.js 20.x 以上がインストールされていること

### context7 MCPのインストール

#### 1. Claude Code設定ファイルを開く

**macOS/Linux:**
```bash
code ~/.config/claude/config.json
```

**Windows:**
```bash
code %APPDATA%\claude\config.json
```

#### 2. MCP設定を追加

`config.json`の`mcpServers`セクションに以下を追加：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": {}
    }
  }
}
```

#### 3. Claude Codeを再起動

設定を反映させるため、Claude Codeを再起動します。

#### 4. 動作確認

Claude Codeで以下のコマンドを実行して、context7が利用可能か確認：

```
/mcp list
```

`context7`が表示されれば成功です。

### playwright MCPのインストール

#### 1. playwright MCPパッケージをインストール

プロジェクトルートで以下を実行：

```bash
npm install -D @playwright/test
npx playwright install
```

#### 2. Claude Code設定ファイルを開く

**macOS/Linux:**
```bash
code ~/.config/claude/config.json
```

**Windows:**
```bash
code %APPDATA%\claude\config.json
```

#### 3. MCP設定を追加

`config.json`の`mcpServers`セクションに以下を追加：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": {}
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp-server"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0"
      }
    }
  }
}
```

#### 4. Claude Codeを再起動

設定を反映させるため、Claude Codeを再起動します。

#### 5. 動作確認

Claude Codeで以下のコマンドを実行して、playwrightが利用可能か確認：

```
/mcp list
```

`playwright`が表示されれば成功です。

## 使用方法

### context7 MCPの使用

context7を使用すると、以下のような操作が可能になります：

```
# コンテキストの保存
Claude、このファイルの内容を context7 に保存して

# コンテキストの検索
context7で「スクレイピング」に関連するファイルを検索して

# コンテキストの取得
保存したコンテキストから「認証」関連の情報を取得して
```

### playwright MCPの使用

playwrightを使用すると、以下のような操作が可能になります：

```
# ブラウザでページを開く
playwrightでhttps://www.innisfree.jp/を開いて

# 要素の取得
ページ内の商品リストを取得して

# スクリーンショットの撮影
現在のページのスクリーンショットを撮って
```

## トラブルシューティング

### context7が認識されない

**原因**: MCPサーバーが正しくインストールされていない

**解決策**:
```bash
# グローバルにインストール
npm install -g @context7/mcp-server

# Claude Codeを再起動
```

### playwrightが起動しない

**原因**: ブラウザがインストールされていない

**解決策**:
```bash
# ブラウザを再インストール
npx playwright install --force

# Claude Codeを再起動
```

### MCPリストに表示されない

**原因**: `config.json`の構文エラー

**解決策**:
1. `config.json`をJSONバリデーターで確認
2. カンマやブラケットの不足をチェック
3. 修正後、Claude Codeを再起動

### 権限エラーが発生する

**原因**: MCPサーバーの実行権限がない

**解決策**:
```bash
# macOS/Linux
chmod +x $(which npx)

# Windowsの場合は管理者権限で実行
```

## 設定例（完全版）

以下は、context7とplaywrightの両方を含む完全な`config.json`の例です：

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": {},
      "disabled": false
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp-server"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0"
      },
      "disabled": false
    }
  }
}
```

## 参考リソース

- [Claude Code MCP Documentation](https://docs.anthropic.com/claude/docs/model-context-protocol)
- [context7 公式ドキュメント](https://github.com/context7/mcp-server)
- [playwright MCP 公式ドキュメント](https://github.com/microsoft/playwright-mcp)

## 注意事項

- MCPの追加はClaude Code側の設定変更が必要です
- プロジェクトの`.gitignore`にMCP関連の設定ファイルは含めないでください
- MCPサーバーはネットワーク接続が必要な場合があります
- セキュリティ上、信頼できるMCPのみを使用してください

---

セットアップに問題がある場合は、GitHubのIssueで報告してください。
