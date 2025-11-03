# 実装計画書

## 1. 開発フェーズ概要

### 1.1 フェーズ構成
本プロジェクトは以下の4つのフェーズで段階的に実装を進める：

- **Phase 1**: 基盤構築（認証・DB・基本UI）
- **Phase 2**: 公式サイト対応（スクレイピング・商品管理）
- **Phase 3**: API統合（楽天・Yahoo）
- **Phase 4**: 高度機能・最適化

### 1.2 開発期間目安
- **Phase 1**: 2-3週間
- **Phase 2**: 3-4週間
- **Phase 3**: 3-4週間
- **Phase 4**: 2-3週間
- **合計**: 10-14週間

## 2. Phase 1: 基盤構築

### 2.1 目的
開発環境の構築とシステムの基礎となるデータベース、基本UIを構築

### 2.2 実装項目

#### 2.2.1 開発環境構築
- **優先度**: 最高
- **依存関係**: なし
- **実装内容**:
  1. Next.js 15プロジェクト初期化
  2. GitHubリポジトリ作成・初期コミット
  3. ドキュメントアップロード
     - 要件定義書
     - 技術仕様書
     - システム設計書
     - 開発ガイドライン
     - 実装計画書
     - README.md
     - CLAUDE.md
  4. Serena MCP初期設定
     - プロジェクトルートでSerena設定
     - 初回インデックス作成
     - .serenaディレクトリを.gitignoreに追加
  5. TypeScript設定
  6. ESLint・Prettier設定
  7. Tailwind CSS設定
  8. shadcn/ui導入・初期コンポーネント取り込み
  9. 環境変数設定

#### 2.2.2 共通プロキシ設定実装
- **優先度**: 最高
- **依存関係**: 開発環境構築
- **実装内容**:
  - プロキシ判定ロジック実装
  - USE_PROXY環境変数による完全制御
  - 事前判定必須ロジック
  - プロキシ設定の一元管理
  - Puppeteerへのプロキシ適用
  - エラーハンドリング
  - ✅ **Supabaseクライアントのプロキシ対応**:
    - ✅ 汎用クライアント（supabase.ts）: Anonキー、プロキシ対応
    - ✅ サーバー専用クライアント（supabase-server.ts）: サービスロールキー、プロキシ対応
    - ✅ https-proxy-agent統合
    - ✅ 詳細ログ出力

#### 2.2.3 データベース設計・構築
- **優先度**: 最高
- **依存関係**: 開発環境構築
- **実装内容**:
  - Supabaseプロジェクト作成
  - テーブル定義
    - shop_categories
    - products（asinカラムでASINを参照）
    - asins（10桁ASIN、ユニーク制約）
    - shop_discounts
    - api_settings
  - トリガー設定（updated_at自動更新）
  - インデックス作成

**注**: product_asinsテーブルは削除され、products.asinカラムで直接ASINを参照する設計に変更されました。

#### 2.2.4 基本レイアウト実装
- **優先度**: 高
- **依存関係**: データベース構築
- **実装内容**:
  - ルートレイアウト作成
  - サイドバーコンポーネント
  - ヘッダーコンポーネント
  - ナビゲーション構造実装（4階層対応）
  - 折りたたみ機能
  - レスポンシブ対応

#### 2.2.5 共通UIコンポーネント
- **優先度**: 高
- **依存関係**: 基本レイアウト
- **実装内容**:
  - ✅ shadcn/ui基本コンポーネント導入
    - Button, Input, Table, Dialog, Select, Checkbox
  - ✅ Loading コンポーネント
  - ✅ Toast通知システム（Sonner）統合
  - ErrorBoundary コンポーネント
  - Toast通知システム

### 2.3 成果物
- 完全な開発環境
- GitHubリポジトリ
- プロジェクトドキュメント一式
- Serena MCP設定済み環境
- 共通プロキシ設定
- データベーススキーマ
- 基本UI・ナビゲーション

### 2.4 検証項目
- [x] Next.jsアプリが起動する
- [x] GitHubにコミット・プッシュ可能
- [x] 全ドキュメントがリポジトリに配置済み
- [x] Serena MCPが動作する
- [x] プロキシ設定が正常に動作（USE_PROXY制御）
- [x] データベース接続確認
- [x] サイドバーが正常に動作

**Phase 1 完了**: ✅

## 3. Phase 2: 公式サイト対応

### 3.1 目的
公式サイトのスクレイピング機能と商品管理機能を実装

### 3.2 実装項目

#### 3.2.1 商品テーブルコンポーネント ✅
- **優先度**: 最高
- **依存関係**: Phase 1完了
- **ステータス**: 完了
- **実装内容**:
  - ✅ スクロール可能なテーブル（固定ヘッダーなし）
  - ✅ 全列の実装（画像、商品名、価格、ASIN情報等）
  - ✅ お気に入り列（StarIcon、クリックでトグル、ソート対応）
  - ✅ 全列ソート機能
  - ✅ インライン編集機能
  - ✅ 画像ホバー拡大プレビュー機能
  - ✅ チェックボックス・数値入力対応
  - ✅ 列幅固定
  - ✅ テーブルヘッダー小さく中央寄せ
  - ✅ ASIN未登録時もチェックボックス表示（disabled状態）
  - ✅ Shift+マウスホイールで横スクロール対応
  - ✅ 行レベル更新機能完全実装（フルリロード完全不要）
    - ✅ ASIN登録・変更・削除時の行レベル更新と利益再計算
    - ✅ Amazon価格・手数料更新時の行レベル更新と利益再計算
    - ✅ 商品価格更新時の行レベル更新と利益再計算
    - ✅ 商品コピー時の行レベル追加（API結果から新商品を直接state追加）
    - ✅ 商品削除時の行レベル削除（filterでstateから削除）
  - ✅ initialFavoriteFilterプロップ（初期フィルター設定対応）
  - ✅ コンポーネント分割（保守性・再利用性向上）
    - ✅ ProductTableHeader: ソート機能付きヘッダー（23列対応）
    - ✅ ProductRow: 商品行コンポーネント（全セル管理、背景色制御）
    - ✅ EditableCell: インライン編集セル（テキスト/数値/真偽値、キーボードショートカット対応）
    - ✅ ImagePreview: 画像プレビュー（ホバー拡大、プロキシ対応カスタムローダー）

#### 3.2.2 商品管理機能 ✅
- **優先度**: 最高
- **依存関係**: 商品テーブル
- **ステータス**: 完了
- **実装内容**:
  - ✅ 商品一覧表示（ASIN情報・利益計算付き）
  - ✅ 商品検索・フィルタリング（テキスト、価格、利益率、ROI、ASIN設定状況、お気に入り状態、セール状況）
  - ✅ 商品情報インライン編集
  - ✅ お気に入り機能（StarIconクリックでトグル、フィルタリング対応）
  - ✅ 商品コピー機能（右クリックメニュー、Toast通知、original_product_id継承）
  - ✅ 商品削除機能（右クリックメニュー、Toast確認ダイアログ）
  - ✅ 重複商品削除機能（自動・手動実行）
  - ✅ コンテキストメニュー実装
  - ✅ **useProductTableフックの統合**: UI機能（useProductTableUI）を統合
    - ✅ Toast通知（ASIN登録成功時の利益率・ROI表示）
    - ✅ Toast確認ダイアログ（削除時のアクション付きトースト）
    - ✅ 横スクロール機能
    - ✅ コンテキストメニュー項目生成

**注**: 商品コピー機能では、コピー商品のoriginal_product_idは常に元の商品IDを継承します（コピーのコピーでも同様）。

#### 3.2.3 VT Cosmeticsスクレイピング ✅
- **優先度**: 最高
- **依存関係**: 商品管理機能
- **ステータス**: 完了
- **実装内容**:
  - ✅ Puppeteerセットアップ
  - ✅ VT固有スクレイパー実装（BaseScraperクラス継承、suppressProxyLogパラメータ対応）
  - ✅ プロキシ制御実装（USE_PROXY環境変数制御、プロキシログ抑制機能）
  - ✅ エラーハンドリング・リトライ機能
  - ✅ 商品重複チェック（新規登録前）
  - ✅ ショップ内重複削除機能（同一ショップ内の重複を自動削除）
    - ショップごとに独立した重複管理
    - カテゴリ横断の重複は許容（各ショップで独立管理）
    - 詳細なログ表示（新規挿入、重複削除、実際の新規追加を分けて表示）
  - ✅ スクレイピングAPI実装（`/api/scrape/vt`）
  - ✅ UI：スクレイピング実行ボタン（Toast通知対応）
  - ✅ 全カテゴリ一括スクレイピング（9カテゴリ対応）
  - ✅ 3段階価格取得戦略実装
    - 一覧ページから¥マーク付きテキスト検索
    - 価格系class名検索（`.price`, `[class*="price"]`等）
    - 妥当な範囲の数字パターンマッチング（100-50000円）
  - ✅ 詳細ページアクセス最適化（一覧ページで価格取得できない場合のみアクセス）
  - ✅ 詳細ページから正確な価格情報取得
    - 元価格: `#span_product_price_text`
    - セール価格: `#span_product_price_sale`
    - JavaScript変数: `product_price`, `product_sale_price`
  - ✅ ページネーション対応（最大10ページ）
  - ✅ 負荷軽減戦略（レート制限対策）
    - 詳細ページアクセス後: 300ms待機
    - ページ間: 500ms待機
    - カテゴリ間: 2000ms待機
  - ✅ バッチ処理戦略（全カテゴリスクレイピング完了後に一括保存）
  - ✅ 商品ライフサイクル管理（INSERT/UPDATE/DELETE）
  - ✅ 価格変動の自動追跡
  - ✅ 販売終了商品の物理削除
  - ✅ コピー商品の保護機能
    - original_product_idによる追跡
    - スクレイピング削除から除外
    - 重複削除から除外
    - オリジナル商品削除時のカスケード削除

**注**: BaseScraperのsuppressProxyLogパラメータにより、子スクレイパー（VT/DHC/innisfree）でのプロキシログ出力を抑制可能です。価格取得戦略により、詳細ページアクセスを最小化してスクレイピング速度を大幅に向上させました。

#### 3.2.4 DHCスクレイピング ✅
- **優先度**: 高
- **依存関係**: VTスクレイピング
- **ステータス**: 完了
- **実装内容**:
  - ✅ DHC固有スクレイパー実装（BaseScraperクラス継承、suppressProxyLogパラメータ対応）
  - ✅ タイムアウト最適化（30秒に延長、サイト読み込み時間に対応）
  - ✅ 待機戦略変更（domcontentloaded使用、より高速で信頼性の高い読み込み）
  - ✅ 共通化可能な処理の抽出
  - ✅ スクレイピングAPI実装（`/api/scrape/dhc`）
  - ✅ UI：スクレイピング実行ボタン（Toast通知対応）
  - ✅ 商品ライフサイクル管理（INSERT/UPDATE/HIDE）

**注**: DHCサイトは読み込みが遅いため、タイムアウトを30秒に設定し、waitUntilを'domcontentloaded'に変更して安定性を向上させています。

#### 3.2.5 innisfreeスクレイピング ✅
- **優先度**: 高
- **依存関係**: DHCスクレイピング
- **ステータス**: 完了
- **実装内容**:
  - ✅ innisfree固有スクレイパー実装（BaseScraperクラス継承、suppressProxyLogパラメータ対応）
  - ✅ スクレイピングAPI実装（`/api/scrape/innisfree`）
  - ✅ UI：スクレイピング実行ボタン（Toast通知対応）
  - ✅ 商品ライフサイクル管理（INSERT/UPDATE/HIDE）
  - ✅ 詳細ページから正確な価格情報取得

#### 3.2.8 お気に入り商品スクレイピング ✅
- **優先度**: 高
- **依存関係**: VT/DHC/innisfreeスクレイピング
- **ステータス**: 完了
- **実装内容**:
  - ✅ FavoriteScraperクラス実装（各ブランドスクレイパーを統合）
  - ✅ source_urlからブランド自動判定機能
  - ✅ お気に入り商品のみを対象とした個別価格更新
  - ✅ プロキシログの一元管理（親スクレイパーで1回のみ出力、子スクレイパーでは抑制）
  - ✅ スクレイピングAPI実装（`/api/scrape/favorites`）
  - ✅ ダッシュボードからの実行ボタン
  - ✅ 商品ライフサイクル管理（価格変動の追跡）

**注**: FavoriteScraperは既存のブランド別スクレイパーを活用し、お気に入り商品の価格を効率的に更新します。プロキシログの重複を防ぐため、suppressProxyLogパラメータを使用して子スクレイパーのログ出力を抑制しています。

#### 3.2.6 ASIN管理機能 ✅
- **優先度**: 高
- **依存関係**: 商品管理機能
- **ステータス**: 完了
- **実装内容**:
  - ✅ ASINテーブル内インライン編集
  - ✅ ASIN作成（商品テーブルから直接入力、自動作成）
  - ✅ ASIN編集（手数料率、FBA料、JANコード等）
  - ✅ 商品とASIN紐付け（products.asinカラムで管理）
  - ✅ ASINフラグ編集（Amazon有、公式有、危険品、パーキャリNG）
  - ⏳ ASIN一括アップロード（Excel/CSV）- 未実装

**注**: ASIN紐付けはproducts.asinカラムで管理され、商品とASINは1:1の関係です。商品テーブルでASINを入力すると、存在しない場合は自動的にasinsテーブルに新規レコードが作成されます。

#### 3.2.7 利益計算機能 ✅
- **優先度**: 高
- **依存関係**: ASIN管理機能
- **ステータス**: 完了
- **実装内容**:
  - ✅ 利益額計算ロジック（Amazon価格 - 仕入価格 - 手数料 - FBA料）
  - ✅ 利益率計算ロジック（利益額 / Amazon価格 × 100）
  - ✅ ROI計算ロジック（利益額 / 仕入価格 × 100）
  - ✅ リアルタイム計算（商品取得時に自動計算）
  - ✅ 割引設定反映（shop_discountsテーブル対応）
  - ✅ 仕入価格計算（セール価格 or 通常価格に割引適用）

### 3.3 成果物
- ✅ VT Cosmeticsスクレイピング機能（プロキシログ抑制対応）
- ✅ DHC/innisfreeスクレイピング機能（タイムアウト最適化、プロキシログ抑制対応）
- ✅ お気に入り商品スクレイピング機能（FavoriteScraper、統合スクレイピング）
- ✅ 商品管理・編集機能（テーブル、検索、フィルター、行レベル更新）
- ✅ ASIN管理機能（インライン編集）
- ✅ 利益計算機能（リアルタイム計算）
- ✅ 重複商品削除機能
- ✅ Toaster通知システム

### 3.4 検証項目
- [x] VT Cosmeticsのスクレイピングが正常動作
- [x] DHC/innisfreeのスクレイピングが正常動作
- [x] お気に入り商品スクレイピングが正常動作
- [x] プロキシログが1回のみ出力される（重複なし）
- [x] DHC価格更新が安定動作（タイムアウトなし）
- [x] 商品データが正しく保存される
- [x] 商品テーブルの全機能が動作（行レベル更新含む）
- [x] お気に入りフィルターが正常動作
- [x] ASINの紐付けが正常動作
- [x] 利益計算が正確
- [x] 重複商品が自動削除される
- [x] コピー・削除機能が正常動作

**Phase 2 完了**: ✅ 全ブランド対応完了、お気に入りスクレイピング実装完了

## 4. Phase 3: API統合

### 4.1 目的
楽天市場APIとYahoo!ショッピングAPIの統合

### 4.2 実装項目

#### 4.2.1 楽天市場API統合基盤
- **優先度**: 最高
- **依存関係**: Phase 2完了
- **実装内容**:
  - 楽天APIクライアント実装
  - 認証処理
  - 商品検索API実装
  - レスポンス変換処理
  - エラーハンドリング

#### 4.2.2 楽天ショップ設定機能
- **優先度**: 最高
- **依存関係**: 楽天API基盤
- **実装内容**:
  - ショップ設定画面
  - 表示名・shopCode・genreId・キーワード入力
  - 設定保存・読み込み
  - バリデーション

#### 4.2.3 楽天ブランドページ実装
- **優先度**: 高
- **依存関係**: 楽天ショップ設定
- **実装内容**:
  - 無印良品ページ
  - VT Cosmeticsページ
  - innisfreeページ
  - 各ページでの商品取得・表示
  - API実行ボタン

#### 4.2.4 Yahoo!ショッピングAPI統合基盤
- **優先度**: 高
- **依存関係**: 楽天API統合完了
- **実装内容**:
  - Yahoo APIクライアント実装
  - 認証処理
  - 商品検索API実装
  - レスポンス変換処理

#### 4.2.5 Yahooショップ階層実装 ✅
- **優先度**: 高
- **依存関係**: Yahoo API基盤
- **ステータス**: 完了
- **実装内容**:
  - ✅ yahoo_shopsテーブル作成（shop_id, display_name, parent_category, store_id, category_id, brand_id）
  - ✅ Yahooショップ設定画面実装（/settings/yahoo）
  - ✅ AddShopDialogコンポーネント実装
    - ✅ 親カテゴリ選択（LOHACO/ZOZOTOWN/Direct）
    - ✅ ショップID自動生成（親カテゴリプレフィックス付き）
    - ✅ seller_id自動設定（ZOZOTOWNの場合）
    - ✅ データベース自動保存（yahoo_shopsテーブル）
  - ✅ 階層構造対応（直販、LOHACO、ZOZOTOWN）
  - ✅ ZOZOTOWNブランドID対応（brand_idカラム）
  - ✅ 条件付きフォーム表示（ZOZOTOWNの場合のみbrand_id入力欄表示）
  - ✅ サイドバーでの階層表示
  - ✅ ショップ名フォーマット統一（`{parent_category}/{display_name}`）
  - ✅ Yahoo API統合基盤（環境変数: YAHOO_CLIENT_ID）
  - ✅ 画像ホスト設定（item-shopping.c.yimg.jp）
  - ✅ 各ショップページ実装（動的ルーティング対応）
  - ✅ Yahoo API商品取得機能（ページネーション対応）
  - ✅ useYahooShopPageカスタムフック実装
  - ✅ データベース設定の自動利用
  - ✅ 公式サイトと同じUI構成に統一

**注**: yahoo_shopsテーブルのbrand_idはZOZOTOWN配下のブランド検索に使用されます。parent_categoryがnullの場合は直販、'lohaco'の場合はLOHACO、'zozotown'の場合はZOZOTOWNとして扱われます。ショップ名は`generateShopName()`関数で`{parent_category}/{display_name}`形式に統一されています。

**最新の実装（2025-11-02）**:
- `/yahoo/[...slug]/page.tsx`: 動的ルーティングで全Yahooショップに対応
- `/api/yahoo/search`: Yahoo APIのページネーション対応（20件制限を自動処理）
- `useYahooShopPage`: データベース設定を自動読み込み、1クリックで商品取得
- 検索フォーム削除、公式サイトと同じ「商品取得（API）」ボタンに統一

#### 4.2.6 カテゴリ一覧ページ実装
- **優先度**: 中
- **依存関係**: 各API統合完了
- **実装内容**:
  - 公式サイト一覧ページ
  - 楽天市場一覧ページ
  - Yahoo!ショッピング一覧ページ
  - 各カテゴリの統計表示
  - ショップカード表示

### 4.3 成果物
- 楽天市場API統合
- Yahoo!ショッピングAPI統合
- 階層型ショップページ
- カテゴリ一覧ページ

### 4.4 検証項目
- [ ] 楽天APIで商品取得可能
- [ ] Yahoo APIで商品取得可能
- [ ] 各ブランドページが正常動作
- [ ] 階層ナビゲーションが正常動作
- [ ] 商品データが統一形式で保存

## 5. Phase 4: 高度機能・最適化

### 5.1 目的
システムの完成度を高め、パフォーマンス最適化と運用機能を追加
**注意**: ローカル環境のみでの使用を想定。認証機能は不要。

### 5.2 実装項目

#### 5.2.1 全体設定機能 ✅
- **優先度**: 高
- **依存関係**: Phase 3完了
- **ステータス**: 完了
- **実装内容**:
  - ✅ 表示設定（列の表示/非表示、ページサイズ）
  - ✅ ソート設定（3段階優先順位、列選択・昇順降順）
  - ✅ システム設定（ローカルストレージ保存）
  - ✅ 設定の保存・読み込み
  - ✅ 各ページへの設定適用
  - ✅ DisplaySettingsPanelコンポーネント（列設定、並び順設定）
  - ✅ 列定義の統一化（columnDefinitions.ts）
  - ✅ テーブルヘッダー・行への動的適用
  - ✅ ソート優先度表示（①②③マーク）

#### 5.2.2 割引設定機能 ✅
- **優先度**: 高
- **依存関係**: 全体設定機能
- **ステータス**: 完了
- **実装内容**:
  - ✅ ショップ別割引設定画面
  - ✅ パーセンテージ割引
  - ✅ 固定額割引
  - ✅ 有効/無効切り替え
  - ✅ 利益計算への反映
  - ✅ UI/ロジック分離（DiscountSettingsコンポーネント、useDiscountSettingsフック）

#### 5.2.3 ホーム（ダッシュボード）実装 ✅
- **優先度**: 中
- **依存関係**: Phase 3完了
- **ステータス**: 完了
- **実装内容**:
  - ✅ グローバルサマリーカード（総商品数、ASIN紐付け数、総利益額、平均利益率）
  - ✅ お気に入り商品一覧セクション（FavoriteProductTableコンポーネント、initialFavoriteFilter使用）
  - ✅ ショップ別概要テーブル（ショップごとの統計、ASIN紐付け率、平均利益率）
  - ✅ クイックアクションボタン（公式サイト、楽天市場、設定へのリンク）
  - ✅ リアルタイムデータ読み込みとローディング状態管理
  - ⏳ 最近のアクティビティ（未実装）
  - ⏳ 利益トレンドチャート（未実装）

**注**: ダッシュボードではgetDashboardSummaryとgetShopStats関数を使用して、Supabaseから集計データを取得します。お気に入り商品テーブルはProductTableコンポーネントをinitialFavoriteFilter="favorite_only"で再利用しています。

#### 5.2.4 パフォーマンス最適化
- **優先度**: 中
- **依存関係**: 全機能実装完了
- **実装内容**:
  - テーブル仮想化（大量データ対応）
  - 画像遅延ロード最適化
  - API レスポンスキャッシュ
  - バルクデータ更新最適化
  - データベースクエリ最適化

#### 5.2.5 エラーハンドリング強化
- **優先度**: 中
- **依存関係**: 全機能実装完了
- **実装内容**:
  - グローバルエラーハンドラー
  - スクレイピングエラー詳細表示
  - リトライ機能
  - エラーログ記録
  - ユーザーフレンドリーなエラーメッセージ

#### 5.2.6 運用機能
- **優先度**: 低
- **依存関係**: Phase 4の他機能
- **実装内容**:
  - 開発ログ表示機能
  - データエクスポート機能
  - 一括操作機能（商品削除等）
  - システム情報表示

### 5.3 成果物
- 完全な設定管理機能（ローカルストレージ）
- ダッシュボード
- パフォーマンス最適化
- 運用機能

### 5.4 検証項目
- [ ] 全体設定が各ページに反映される
- [ ] 設定がローカルストレージに保存される
- [ ] 割引設定が利益計算に反映される
- [ ] ダッシュボードが統計を正しく表示
- [ ] 数万件の商品でもスムーズに動作
- [ ] エラーが適切に処理・表示される
- [ ] ローカル環境で全機能が正常動作

## 6. 次のステップ

### 6.1 開発開始前の準備
1. 開発環境セットアップ
2. Supabaseプロジェクト作成
3. Google OAuth設定
4. 楽天・Yahoo API申請・取得
5. プロキシサーバー準備（必要に応じて）

### 6.2 Phase 1開始タスク
1. Next.js 15プロジェクト作成
2. GitHubリポジトリ作成・初期push
3. ドキュメント一式アップロード
4. Serena MCP設定
5. TypeScript・ESLint・Prettier設定
6. Tailwind CSS + shadcn/ui設定
7. 共通プロキシ設定実装
8. データベーススキーマ作成

---

## 7. 追加実装項目（2025-10-31）

### 7.1 シングルトン+プロキシパターン実装
- **実装日**: 2025-10-31
- **優先度**: 高
- **状態**: ✅ 完了

#### 実装内容
Supabaseクライアントとスクレイパーの統一管理システムを実装

**成果物:**
1. `src/lib/singletons/index.ts`
   - SupabaseClientSingleton クラス
   - ScraperSingleton クラス
   - ProxyController クラス（USE_PROXY判定）
   - Proxy クラス（統一インターフェース）

2. `src/lib/singletons/README.md`
   - 完全なドキュメント
   - アーキテクチャ図
   - 使用方法とセキュリティガイド
   - FAQ

3. `src/lib/singletons/examples.ts`
   - 14種類の実用例
   - エラーハンドリング例
   - API Routes / Server Components での使用例

**既存コード統合:**
- `src/lib/scraper.ts`: `supabaseServer` → `Proxy.getSupabase()` に置き換え
- `src/lib/deduplication.ts`: 未使用変数を削除

**主な機能:**
- ✅ シングルトンパターンによるインスタンス一元管理
- ✅ USE_PROXY環境変数による動的な権限制御
  - `USE_PROXY=false`: ANON_KEY（RLS制限付き）
  - `USE_PROXY=true`: SERVICE_ROLE_KEY（全権限、サーバーサイドのみ）
- ✅ 統一インターフェースによる一貫性のあるアクセス
- ✅ SERVICE_ROLE_KEYの厳重なセキュリティ管理

**使用方法:**
```typescript
import { Proxy } from "@/lib/singletons"

// Supabaseクライアント取得
const supabase = Proxy.getSupabase()
const { data } = await supabase.from("products").select()

// スクレイパー取得
const scraper = Proxy.getScraper()
await scraper.launch()
await scraper.close()
```

**セキュリティ考慮事項:**
- SERVICE_ROLE_KEYはサーバーサイド（API Routes / Server Components）でのみ使用
- クライアントコンポーネントでは絶対に使用しない
- 環境変数として管理し、コードに直接記述しない

**ドキュメント更新:**
- ✅ `docs/system_design.md`: 5.4節「データアクセス層設計」を追加
- ✅ `docs/technical_spec.md`: 5.2.3節「シングルトン+プロキシパターン」を追加
- ✅ `docs/implementation_plan.md`: 本セクションを追加

**テスト結果:**
- TypeScriptコンパイル: エラーなし
- ビルド: 成功
- 既存機能: 正常動作

---

## 8. データベース最適化・スクレイパー最適化（2025-11-02）

### 8.1 productsテーブルからmemoカラムの削除
- **実装日**: 2025-11-02
- **優先度**: 高
- **状態**: ✅ 完了

#### 実装内容
不要なmemoカラムをproductsテーブルから削除し、関連コードを整理

**データベースマイグレーション:**
- `supabase/migrations/20251102170140_remove_memo_column_from_products.sql`
  - `ALTER TABLE products DROP COLUMN IF EXISTS memo;`

**API Routes修正:**
1. `src/app/api/rakuten/search/route.ts`: 楽天商品挿入時のmemoフィールド削除
2. `src/app/api/yahoo/search/route.ts`: Yahoo商品挿入時のmemoフィールド削除
3. `src/app/api/products/copy/route.ts`: コピー商品のmemoフィールド削除
4. `src/app/api/products/cleanup-duplicates/route.ts`: memo-based filteringを削除

**コンポーネント修正:**
5. `src/components/products/DisplaySettingsPanel.tsx`: メモカラムの表示設定を削除

**エクスポート修正:**
6. `src/lib/export.ts`: CSV出力からメモカラムを削除

**型定義修正:**
7. `src/types/database.ts`: Row/Insert/Update型からmemoを削除
8. `src/types/settings.ts`: columnWidths/visibleColumnsからmemoを削除

**影響範囲:**
- 11ファイル修正
- データベーススキーマ変更（マイグレーション実行必要）
- 型安全性維持
- 既存機能への影響なし

### 8.2 スクレイパーのパフォーマンス最適化
- **実装日**: 2025-11-02
- **優先度**: 高
- **状態**: ✅ 完了

#### 実装内容
不要なdescription取得処理を削除し、スクレイピング速度を改善

**DHC Scraper (`src/lib/scrapers/dhc-scraper.ts`):**
- DHCProduct interfaceからdescription削除
- scrapeProductDetailsメソッドの戻り値からdescription削除
- description抽出ロジック全削除（30-40行削減）
- 商品オブジェクト作成時のdescription除外

**Innisfree Scraper (`src/lib/scrapers/innisfree-scraper.ts`):**
- InnisfreeProduct interfaceからdescription削除
- scrapeProductDetailsメソッドの戻り値からdescription削除
- description抽出ロジック全削除（15行削減）
- 商品オブジェクト作成時のdescription除外

**VT Scraper (`src/lib/scrapers/vt-cosmetics-scraper.ts`):**
- VTProduct interfaceからdescription削除
- VTスクレイパーはもともとdescription取得ロジックなし

**最適化効果:**
- 詳細ページアクセス時のDOM解析処理削減
- 不要なデータ取得の排除
- スクレイピング速度の向上
- メモリ使用量の削減

**ドキュメント更新:**
- `docs/system_design.md`: スクレイピング設計にパフォーマンス最適化の記載追加
- `docs/technical_spec.md`: Product型コメントからmemo削除
- `docs/implementation_plan.md`: 本セクション追加

**テスト結果:**
- TypeScriptコンパイル: エラーなし
- ビルド: 成功
- 全スクレイパー: 正常動作

**主な効果:**
- ✅ 不要なフィールドの完全削除
- ✅ データベーススキーマの簡素化
- ✅ スクレイピング処理の高速化
- ✅ コードの保守性向上
- ✅ 型安全性の維持

**セキュリティ考慮事項:**
- asinsテーブルのmemoカラムは意図的に保持（別用途）
- productsテーブルのみの変更
- データ整合性の維持

---

## 9. ログ出力の統一化・エラーハンドリング強化（2025-11-03）

### 9.1 ログ出力の統一化
- **実装日**: 2025-11-03
- **優先度**: 高
- **状態**: ✅ 完了

#### 実装内容
全てのAPI（Yahoo検索、楽天検索、公式サイトスクレイピング）でログ出力形式を統一

**統一ログフォーマット:**
```
=== [サービス名]API ===
リクエストパラメータ: { ... }
[サービス名] 取得: X件 | 保存: Y件 | 更新: Z件 | スキップ: W件 | 削除: 0件
```

**対象ファイル:**
1. `src/app/api/yahoo/search/route.ts`
   - 開始ログ: `=== Yahoo商品検索API ===`
   - 結果サマリー: `[Yahoo検索] 取得: X件 | 保存: Y件 | 更新: 0件 | スキップ: W件 | 削除: 0件`

2. `src/app/api/rakuten/search/route.ts`
   - 開始ログ: `=== 楽天商品検索API ===`
   - 結果サマリー: `[楽天検索] 取得: X件 | 保存: Y件 | 更新: Z件 | スキップ: W件 | 削除: 0件`

3. `src/app/api/scrape/dhc/route.ts`
   - 開始ログ: `=== DHCスクレイピングAPI ===`
   - 結果サマリー: `[DHCスクレイピング] 取得: X件 | 保存: Y件 | 更新: 0件 | スキップ: W件 | 削除: 0件`

4. `src/app/api/scrape/innisfree/route.ts`
   - 開始ログ: `=== innisfreeスクレイピングAPI ===`
   - 結果サマリー: `[innisfreeスクレイピング] 取得: X件 | 保存: Y件 | 更新: 0件 | スキップ: W件 | 削除: 0件`

5. `src/app/api/scrape/vt/route.ts`
   - 開始ログ: `=== VTスクレイピングAPI ===`
   - 結果サマリー: `[VTスクレイピング] 取得: X件 | 保存: Y件 | 更新: 0件 | スキップ: W件 | 削除: 0件`

**主な効果:**
- ✅ 統一されたログフォーマットでデバッグが容易
- ✅ 各API呼び出しの結果を一目で把握可能
- ✅ リクエストパラメータと結果の追跡が容易
- ✅ 保守性の向上

### 9.2 エラーハンドリングの強化
- **実装日**: 2025-11-03
- **優先度**: 高
- **状態**: ✅ 完了

#### 実装内容
全てのAPIで詳細なエラーログを追加し、問題の迅速な特定を可能に

**エラーログフォーマット:**
```
=== [サービス名]でエラー ===
エラー発生時刻: 2025-11-03T12:34:56.789Z
エラータイプ: Error
エラーメッセージ: [エラーメッセージ]
スタックトレース: [スタックトレース]
リクエストパラメータ（再確認）: { ... }
================================
```

**追加されたエラー情報:**
1. **エラー発生時刻**: ISO8601形式のタイムスタンプ
2. **エラータイプ**: エラークラス名（Error, TypeError, NetworkErrorなど）
3. **エラーメッセージ**: error.message
4. **スタックトレース**: error.stack（Error型の場合）
5. **リクエストパラメータ**: 問題再現のための入力値

**API呼び出しエラーの詳細化:**
```typescript
try {
  const result = await client.searchItems({ ... })
} catch (apiError) {
  console.error("=== Yahoo API呼び出しエラー ===")
  console.error("エラー発生時刻:", new Date().toISOString())
  console.error("リクエストパラメータ:", { ... })
  console.error("エラー詳細:", apiError)
  if (apiError instanceof Error) {
    console.error("エラーメッセージ:", apiError.message)
    console.error("スタックトレース:", apiError.stack)
  }
  console.error("================================")
  throw apiError
}
```

**データベース保存エラーの警告:**
```typescript
if (saveResult.errors.length > 0) {
  console.warn("=== データベース保存時にエラーが発生 ===")
  saveResult.errors.forEach((err, index) => {
    console.warn(`エラー ${index + 1}:`, err)
  })
  console.warn("=========================================")
}
```

**スクレイピング失敗時の詳細ログ:**
```typescript
if (!result.success) {
  console.error("=== DHCスクレイピング失敗 ===")
  console.error("エラー発生時刻:", new Date().toISOString())
  console.error("エラー一覧:", result.errors)
  console.error("プロキシ使用:", result.proxyUsed)
  console.error("================================")
}
```

**対象ファイル:**
1. `src/app/api/yahoo/search/route.ts`
   - トップレベルエラーハンドリング強化
   - API呼び出しエラーの詳細化
   - データベース保存エラーの警告

2. `src/app/api/rakuten/search/route.ts`
   - トップレベルエラーハンドリング強化
   - API呼び出しエラーの詳細化
   - データベース保存エラーの警告

3. `src/app/api/scrape/dhc/route.ts`
   - スクレイピング失敗時のエラーログ追加

4. `src/app/api/scrape/innisfree/route.ts`
   - スクレイピング失敗時のエラーログ追加

5. `src/app/api/scrape/vt/route.ts`
   - スクレイピング失敗時のエラーログ追加

6. `src/lib/api/yahoo-client.ts`
   - Yahoo APIエラーハンドリング強化

7. `src/lib/api/rakuten-client.ts`
   - 楽天APIエラーハンドリング強化

**主な効果:**
- ✅ エラー発生箇所の迅速な特定
- ✅ エラーパターンの分析が容易
- ✅ リクエスト内容の追跡可能
- ✅ デバッグ効率の大幅向上
- ✅ タイムアウト/ネットワークエラーの判定と警告
- ✅ HTTPステータスコードの表示
- ✅ Supabaseエラー詳細の表示

### 9.3 Supabaseクライアント初期化ログの削除
- **実装日**: 2025-11-03
- **優先度**: 中
- **状態**: ✅ 完了

#### 実装内容
冗長なSupabaseクライアント初期化ログを削除し、ログ出力をクリーンに

**対象ファイル:**
- `src/lib/supabase-server.ts`

**削除されたログ:**
```typescript
// 削除前
console.log("Supabase server client initializing...")
console.log("URL:", supabaseUrl)
console.log("Has service role key:", !!supabaseServiceRoleKey)

// 削除後
// エラー時のみ出力
```

**主な効果:**
- ✅ ログ出力のクリーンアップ
- ✅ 必要な情報のみを出力（エラー時のみ）
- ✅ ログノイズの削減

### 9.4 ドキュメント更新
- **状態**: ✅ 完了

**更新されたドキュメント:**
1. `docs/system_design.md`
   - セクション11.2「統一ログ設計」を拡張
   - 11.2.1 API統一ログフォーマット追加
   - 11.2.2 エラーハンドリング強化追加

2. `docs/technical_spec.md`
   - セクション11.2「統一ログフォーマット」を拡張
   - 11.2.1 API統一ログフォーマット追加
   - 11.2.2 エラーハンドリング強化追加
   - 11.3 エラー種別と対応追加
   - 11.4 ログ出力の利点追加

3. `docs/implementation_plan.md`
   - 本セクション（セクション9）を追加

**テスト結果:**
- TypeScriptコンパイル: エラーなし
- ビルド: 成功
- 全API: 正常動作確認
- ログ出力: 統一形式で出力

**セキュリティ考慮事項:**
- 環境変数やAPIキーなどの機密情報はログに出力しない
- エラー情報は開発時のデバッグ用途に限定
- 本番環境ではログレベルを適切に設定

---

**この実装計画に従って、段階的に確実な開発を進めましょう！**