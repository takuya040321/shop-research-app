---
agents:
  - path: .claude/agents/doc-updater.md
    name: doc-updater
---

Documentation Updater Agentを起動して、実装内容に基づいてプロジェクトドキュメントを更新します。

# タスク

Serena MCPを活用して、以下のプロセスでドキュメントを更新してください:

## 1. 実装変更の分析
- 最近のGitコミットから変更内容を確認
- Serena MCPのシンボル検索で変更されたコード要素を特定
- 変更内容をカテゴリ別に整理（データベース、API、コンポーネント、機能）

## 2. ドキュメント更新
以下のドキュメントを実装に合わせて更新:
- `docs/system_design.md`: データベース、API、コンポーネント設計
- `docs/technical_spec.md`: 技術仕様、型定義、API構造
- `docs/implementation_plan.md`: 実装状況、完了マーク
- `docs/requirements.md`: 機能要件、制約条件

## 3. Serena MCP活用指示
- `mcp__serena__find_symbol`: シンボル検索で変更箇所を特定
- `mcp__serena__search_for_pattern`: パターン検索でテーブル名、API等を検索
- `mcp__serena__list_dir`: ディレクトリ構造の変更を確認
- `mcp__serena__get_symbols_overview`: ファイル概要を効率的に取得

## 4. 更新方針
- 実装内容を正確に反映
- 既存のフォーマット・スタイルを維持
- 最小限の変更で効率的に更新
- 変更箇所を明確に記録

## 重要な制約
- **Serena MCPを積極的に活用**して効率化
- **実装されている内容のみ**を記載
- **既存のドキュメント構造**を維持
- **マークダウンフォーマット**を厳守

更新完了後、変更内容のサマリーを報告してください。
