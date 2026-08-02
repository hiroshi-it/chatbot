/**
 * Script Properties のキー名。
 *
 * 機密情報・環境依存値のみPropertiesで管理する。
 * reminder 文案・日程は app.config.html で管理する。
 */
const SCRIPT_PROPERTY_KEYS = Object.freeze({
  CHAT_WEBHOOK_URL: 'CHAT_WEBHOOK_URL',
  CHAT_THREAD_NAME: 'CHAT_THREAD_NAME',
});
