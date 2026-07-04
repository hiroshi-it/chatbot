/**
 * Script Propertiesのキー名。
 *
 * 本番環境では、機密情報および環境依存値はScript Propertiesで管理する。
 * 特にWebhook URLはGit管理対象のJSONには記載しない。
 *
 * CONFIG_SHEET_ID:
 * 設定用Google SheetのID。
 *
 * CHAT_WEBHOOK_URL:
 * Google ChatのWebhook URL。本番環境では必ずScript Propertiesに設定する。
 *
 * CHAT_THREAD_NAME:
 * 返信先スレッド名。必要な場合のみScript Propertiesに設定する。
 */
const SCRIPT_PROPERTY_KEYS = Object.freeze({
  CONFIG_SHEET_ID: 'CONFIG_SHEET_ID',
  CHAT_WEBHOOK_URL: 'CHAT_WEBHOOK_URL',
  CHAT_THREAD_NAME: 'CHAT_THREAD_NAME',
});

/**
 * 設定用Google Sheetのタブ名。
 *
 * Sheet構成はweekly、monthly、lastDayOfMonthの3タブとする。
 * タブ名の表記ゆれを防ぐため、コード内ではこの定義を使用する。
 */
const SHEET_TAB = Object.freeze({
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  LAST_DAY_OF_MONTH: 'lastDayOfMonth',
});