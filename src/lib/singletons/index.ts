/**
 * シングルトン+プロキシパターンによるSupabase/スクレイパー管理システム
 *
 * このモジュールは、アプリケーション全体でSupabaseクライアントとスクレイパーを
 * 効率的に管理するためのシングルトン+プロキシパターンを実装しています。
 *
 * 主な機能:
 * - シングルトンパターン: アプリ起動時に一度だけインスタンスを生成
 * - プロキシパターン: USE_PROXY環境変数による動的な権限制御
 * - 統一インターフェース: 全アクセスをProxyクラス経由に限定
 * - セキュリティ: SERVICE_ROLE_KEYの厳重管理
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { BaseScraper } from "@/lib/scraper"
import { ProxyAgent, fetch as undiciFetch } from "undici"

// ========================================
// 型定義
// ========================================

/**
 * Supabaseクライアントの設定
 */
interface SupabaseClientConfig {
  /** Supabase プロジェクトURL */
  url: string
  /** 匿名キー（クライアントサイド用、制限付きアクセス） */
  anonKey: string
  /** サービスロールキー（サーバーサイド用、全権限アクセス） */
  serviceRoleKey?: string
}

/**
 * プロキシコントローラーの設定
 */
interface ProxyControllerConfig {
  /** USE_PROXY環境変数の値（"true" or "false"） */
  useProxy: boolean
}

/**
 * Supabaseクライアントのインターフェース
 * （シングルトンとプロキシで共通利用）
 */
type ISupabaseClient = SupabaseClient<Database>

// ========================================
// プロキシ対応のfetch関数
// ========================================

/**
 * プロキシ設定を考慮したfetch関数を作成
 *
 * USE_PROXY=true かつ PROXY_HOST/PROXY_PORT 環境変数が設定されている場合、
 * ProxyAgent を使用して fetch リクエストをプロキシ経由で送信します。
 * PROXY_USERNAME/PROXY_PASSWORD が設定されている場合は認証付きプロキシを使用します。
 *
 * @returns プロキシ対応のfetch関数
 */
function createProxyAwareFetch(): typeof fetch {
  // USE_PROXYがtrueかつプロキシ設定がある場合のみプロキシを使用
  const useProxy = process.env.USE_PROXY === "true"

  if (!useProxy) {
    console.log("[Supabase] USE_PROXY=false - 標準fetchを使用")
    return fetch
  }

  const proxyHost = process.env.PROXY_HOST
  const proxyPort = process.env.PROXY_PORT
  const proxyUsername = process.env.PROXY_USERNAME
  const proxyPassword = process.env.PROXY_PASSWORD

  if (!proxyHost || !proxyPort) {
    console.log("[Supabase] USE_PROXY=trueですが、PROXY_HOSTまたはPROXY_PORTが設定されていません - 標準fetchを使用")
    return fetch
  }

  // プロキシURLを構築（認証情報がある場合は含める）
  let proxyUrl: string
  if (proxyUsername && proxyPassword) {
    proxyUrl = `http://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`
    console.log(`[Supabase] 認証付きプロキシを使用: ${proxyHost}:${proxyPort} (ユーザー: ${proxyUsername})`)
  } else {
    proxyUrl = `http://${proxyHost}:${proxyPort}`
    console.log(`[Supabase] プロキシを使用: ${proxyHost}:${proxyPort}`)
  }

  const dispatcher = new ProxyAgent(proxyUrl)

  // ProxyAgentを使用したカスタムfetch関数を返す
  return (async (url: RequestInfo | URL, init?: RequestInit) => {
    const response = await undiciFetch(url as any, { ...init, dispatcher } as any)
    return response as unknown as Response
  }) as typeof fetch
}

// ========================================
// 1. SupabaseClientSingleton クラス
// 匿名キー（ANON_KEY）を使用したクライアントサイドSupabaseクライアント
// ========================================

/**
 * Supabaseクライアントのシングルトン実装
 *
 * このクラスは匿名キー（ANON_KEY）を使用し、クライアントサイドからの
 * 制限付きアクセスを提供します。アプリ起動時に一度だけインスタンスが生成され、
 * 以降は同じインスタンスが再利用されます。
 *
 * セキュリティ:
 * - 匿名キーはRow Level Security (RLS) ポリシーによって制限されます
 * - ブラウザに公開されても安全な設計
 */
class SupabaseClientSingleton {
  /** シングルトンインスタンス */
  private static instance: SupabaseClientSingleton | null = null

  /** Supabaseクライアント（匿名キー使用） */
  private client: ISupabaseClient

  /**
   * コンストラクタ（private: 外部からの直接インスタンス化を禁止）
   * @param config - Supabaseクライアント設定
   */
  private constructor(config: SupabaseClientConfig) {
    // 匿名キーでSupabaseクライアントを作成（プロキシ対応fetch使用）
    this.client = createClient<Database>(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: createProxyAwareFetch(),
      },
    })
  }

  /**
   * シングルトンインスタンスを取得
   *
   * @returns SupabaseClientSingletonインスタンス
   * @throws 環境変数が設定されていない場合はエラー
   */
  public static getInstance(): SupabaseClientSingleton {
    // 既にインスタンスが存在する場合はそれを返す
    if (SupabaseClientSingleton.instance) {
      return SupabaseClientSingleton.instance
    }

    // 環境変数の検証
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
      throw new Error(
        "Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを確認してください。"
      )
    }

    // 新しいインスタンスを作成してキャッシュ
    SupabaseClientSingleton.instance = new SupabaseClientSingleton({
      url,
      anonKey,
    })

    return SupabaseClientSingleton.instance
  }

  /**
   * Supabaseクライアントを取得
   *
   * @returns Supabaseクライアント（匿名キー使用）
   */
  public getClient(): ISupabaseClient {
    return this.client
  }

  /**
   * シングルトンインスタンスをリセット（主にテスト用）
   *
   * 注意: 本番環境では使用しないでください
   */
  public static resetInstance(): void {
    SupabaseClientSingleton.instance = null
  }
}

// ========================================
// 2. ScraperSingleton クラス
// スクレイパーのシングルトン管理
// ========================================

/**
 * スクレイパーのシングルトン実装
 *
 * このクラスはBaseScraperを継承したスクレイパーインスタンスを管理し、
 * アプリ全体で同一のスクレイパーインスタンスを再利用します。
 *
 * 利点:
 * - ブラウザインスタンスの再利用によるパフォーマンス向上
 * - プロキシ設定の一元管理
 * - リソースの効率的な利用
 */
class ScraperSingleton {
  /** シングルトンインスタンス */
  private static instance: ScraperSingleton | null = null

  /** BaseScraperインスタンス */
  private scraper: BaseScraper

  /**
   * コンストラクタ（private: 外部からの直接インスタンス化を禁止）
   */
  private constructor() {
    // BaseScraperをインスタンス化
    // suppressProxyLog: true でプロキシログを抑制（プロキシ制御はProxyControllerが担当）
    this.scraper = new BaseScraper(true)
  }

  /**
   * シングルトンインスタンスを取得
   *
   * @returns ScraperSingletonインスタンス
   */
  public static getInstance(): ScraperSingleton {
    // 既にインスタンスが存在する場合はそれを返す
    if (ScraperSingleton.instance) {
      return ScraperSingleton.instance
    }

    // 新しいインスタンスを作成してキャッシュ
    ScraperSingleton.instance = new ScraperSingleton()

    return ScraperSingleton.instance
  }

  /**
   * BaseScraperインスタンスを取得
   *
   * @returns BaseScraperインスタンス
   */
  public getScraper(): BaseScraper {
    return this.scraper
  }

  /**
   * シングルトンインスタンスをリセット（主にテスト用）
   *
   * 注意: 本番環境では使用しないでください
   * スクレイパーを閉じてからリセットします
   */
  public static async resetInstance(): Promise<void> {
    if (ScraperSingleton.instance) {
      await ScraperSingleton.instance.scraper.close()
      ScraperSingleton.instance = null
    }
  }
}

// ========================================
// 3. ProxyController クラス
// USE_PROXY環境変数による振り分け制御
// ========================================

/**
 * プロキシコントローラー
 *
 * このクラスは、USE_PROXY環境変数の値に基づいて、
 * 使用するSupabaseクライアントを動的に切り替えます。
 *
 * 動作:
 * - USE_PROXY="true": SERVICE_ROLE_KEY（全権限）を使用
 * - USE_PROXY="false" または未設定: ANON_KEY（制限付き）を使用
 *
 * セキュリティ上の重要事項:
 * - SERVICE_ROLE_KEYは必ずサーバーサイドでのみ使用すること
 * - クライアントサイドに絶対に露出させないこと
 * - RLSポリシーをバイパスする全権限を持つため、厳重に管理すること
 */
class ProxyController {
  /** ProxyControllerの設定 */
  private config: ProxyControllerConfig

  /** SERVICE_ROLE_KEYを使用したSupabaseクライアント（USE_PROXY=trueの場合のみ） */
  private serviceRoleClient: ISupabaseClient | null = null

  /**
   * コンストラクタ
   */
  constructor() {
    // 環境変数からUSE_PROXYの値を取得
    const useProxyEnv = process.env.USE_PROXY
    this.config = {
      useProxy: useProxyEnv === "true",
    }

    // USE_PROXY=trueの場合、SERVICE_ROLE_KEYでクライアントを作成
    if (this.config.useProxy) {
      this.initializeServiceRoleClient()
    }
  }

  /**
   * SERVICE_ROLE_KEYを使用したSupabaseクライアントを初期化
   *
   * セキュリティ警告:
   * このメソッドはサーバーサイドでのみ実行されることを前提としています。
   * クライアントサイドで実行された場合、SERVICE_ROLE_KEYが露出する危険性があります。
   *
   * @private
   */
  private initializeServiceRoleClient(): void {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRoleKey) {
      throw new Error(
        "Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYを確認してください。"
      )
    }

    // SERVICE_ROLE_KEYでSupabaseクライアントを作成（プロキシ対応fetch使用）
    // 注意: このクライアントはRLSポリシーをバイパスし、全権限を持つ
    this.serviceRoleClient = createClient<Database>(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: createProxyAwareFetch(),
      },
    })
  }

  /**
   * 適切なSupabaseクライアントを取得
   *
   * USE_PROXY環境変数の値に基づいて、使用するクライアントを決定します:
   * - USE_PROXY="true": SERVICE_ROLE_KEY（全権限）
   * - USE_PROXY="false" または未設定: ANON_KEY（制限付き）
   *
   * @returns Supabaseクライアント
   */
  public getSupabaseClient(): ISupabaseClient {
    if (this.config.useProxy && this.serviceRoleClient) {
      // USE_PROXY=trueの場合、SERVICE_ROLE_KEYクライアントを返す
      return this.serviceRoleClient
    }

    // USE_PROXY=falseまたは未設定の場合、匿名キークライアントを返す
    return SupabaseClientSingleton.getInstance().getClient()
  }

  /**
   * スクレイパーインスタンスを取得
   *
   * @returns BaseScraperインスタンス
   */
  public getScraperInstance(): BaseScraper {
    return ScraperSingleton.getInstance().getScraper()
  }

  /**
   * USE_PROXYが有効かどうかを確認
   *
   * @returns USE_PROXY=trueの場合true、それ以外はfalse
   */
  public isProxyEnabled(): boolean {
    return this.config.useProxy
  }
}

// ========================================
// 4. Proxy クラス（統一インターフェース）
// すべてのアクセスはこのクラス経由に限定
// ========================================

/**
 * プロキシクラス（統一インターフェース）
 *
 * このクラスは、Supabaseクライアントとスクレイパーへのアクセスを
 * 統一されたインターフェースで提供します。
 *
 * 設計原則:
 * 1. 全アクセスはこのクラスを経由する（直接インスタンスにアクセスしない）
 * 2. ProxyControllerによる動的な権限制御
 * 3. SERVICE_ROLE_KEYの厳重管理（外部に露出させない）
 * 4. 一貫性のあるAPIインターフェース
 *
 * 使用例:
 * ```typescript
 * // Supabaseクライアントの取得
 * const supabase = Proxy.getSupabase()
 * const { data, error } = await supabase.from("products").select()
 *
 * // スクレイパーの取得
 * const scraper = Proxy.getScraper()
 * await scraper.launch()
 * ```
 */
class Proxy {
  /** ProxyControllerインスタンス（シングルトン） */
  private static controller: ProxyController | null = null

  /**
   * ProxyControllerを初期化
   *
   * @private
   */
  private static initializeController(): ProxyController {
    if (!Proxy.controller) {
      Proxy.controller = new ProxyController()
    }
    return Proxy.controller
  }

  /**
   * Supabaseクライアントを取得
   *
   * USE_PROXY環境変数に基づいて、適切なクライアントを返します:
   * - USE_PROXY="true": SERVICE_ROLE_KEY（全権限、サーバーサイド用）
   * - USE_PROXY="false" または未設定: ANON_KEY（制限付き、クライアントサイド用）
   *
   * @returns Supabaseクライアント
   *
   * @example
   * ```typescript
   * const supabase = Proxy.getSupabase()
   * const { data, error } = await supabase.from("products").select()
   * ```
   */
  public static getSupabase(): ISupabaseClient {
    const controller = Proxy.initializeController()
    return controller.getSupabaseClient()
  }

  /**
   * スクレイパーインスタンスを取得
   *
   * @returns BaseScraperインスタンス
   *
   * @example
   * ```typescript
   * const scraper = Proxy.getScraper()
   * await scraper.launch()
   * await scraper.scrape("https://example.com", async (page) => {
   *   // スクレイピング処理
   * })
   * await scraper.close()
   * ```
   */
  public static getScraper(): BaseScraper {
    const controller = Proxy.initializeController()
    return controller.getScraperInstance()
  }

  /**
   * USE_PROXYが有効かどうかを確認
   *
   * @returns USE_PROXY=trueの場合true、それ以外はfalse
   *
   * @example
   * ```typescript
   * if (Proxy.isProxyEnabled()) {
   *   console.log("プロキシモード（SERVICE_ROLE_KEY使用）")
   * } else {
   *   console.log("通常モード（ANON_KEY使用）")
   * }
   * ```
   */
  public static isProxyEnabled(): boolean {
    const controller = Proxy.initializeController()
    return controller.isProxyEnabled()
  }

  /**
   * ProxyControllerをリセット（主にテスト用）
   *
   * 注意: 本番環境では使用しないでください
   */
  public static resetController(): void {
    Proxy.controller = null
  }
}

// ========================================
// エクスポート
// ========================================

/**
 * 外部に公開するのはProxyクラスのみ
 *
 * これにより、すべてのアクセスがProxy経由に限定され、
 * 統一されたインターフェースと権限制御を保証します。
 */
export { Proxy }

/**
 * 型定義のエクスポート（TypeScriptの型チェック用）
 */
export type {
  ISupabaseClient,
  SupabaseClientConfig,
  ProxyControllerConfig,
}
