/**
 * 単一JSON設定のキャッシュ。
 *
 * app.config.htmlは実行中に何度も変わらないため、
 * 初回読み込み後はこの変数に保持し、同一実行内での再読み込みを避ける。
 */
let APP_CONFIG_CACHE = null;

/**
 * アプリケーション設定を読み込む。
 *
 * 設定ファイルはsrc/core/app.config.htmlに配置し、clasp pushでGASに同梱する。
 * ファイル拡張子はhtmlだが、内容はJSONとして扱う。
 *
 * JSON内では説明用に「_comment」などのメタキーを使用できる。
 * 読み込み後、stripMetaKeysで「_」から始まるキーを除去し、
 * 実行時設定として不要な情報を取り除く。
 *
 * @returns {Object} アプリケーション設定
 */
function getAppConfig() {
  if (APP_CONFIG_CACHE) {
    return APP_CONFIG_CACHE;
  }

  const text = HtmlService
      .createHtmlOutputFromFile('core/app.config')
      .getContent()
      .trim();

  APP_CONFIG_CACHE = stripMetaKeys(JSON.parse(text));

  return APP_CONFIG_CACHE;
}