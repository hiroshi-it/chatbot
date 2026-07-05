/**
 * Google Chat送信処理。
 *
 * 組み立て済みの本文をGoogle ChatのIncoming Webhookに送信する。
 * 日付判定、設定合成、本文組み立ては行わない。
 */

const REPLY_OPTION = '&messageReplyOption=REPLY_MESSAGE_OR_FAIL';

/**
 * Google Chatにメッセージを送信する。
 *
 * threadNameが指定されている場合は、指定スレッドへの返信として送信する。
 * threadNameが未指定の場合は、Spaceへの新規メッセージとして送信する。
 *
 * @param {string} text 送信本文
 * @param {Object} options 送信オプション
 * @param {string} options.webhookUrl Webhook URL
 * @param {string} [options.threadName] 返信先スレッド名
 * @returns {HTTPResponse} UrlFetchAppのレスポンス
 */
function sendChatMessage(text, options) {
  options = options || {};

  const messageText = String(text || '').trim();
  if (!messageText) {
    throw new Error('送信本文が空です');
  }

  const webhookUrl = options.webhookUrl;
  if (!webhookUrl) {
    throw new Error('Webhook URL未設定');
  }

  const threadName = options.threadName || '';
  const payload = { text: messageText };
  let requestUrl = webhookUrl;

  if (threadName) {
    payload.thread = { name: threadName };
    requestUrl += REPLY_OPTION;
  }

  const response = UrlFetchApp.fetch(requestUrl, {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    Logger.log('[Chat] HTTP' + code + ': ' + response.getContentText());
    throw new Error('Chat送信失敗 HTTP' + code);
  }

  return response;
}

/**
 * reminder項目をGoogle Chatに送信する。
 *
 * composeMessageで本文を組み立てたうえで、
 * config.chatおよびitem.chatから送信先情報を解決して送信する。
 *
 * @param {Object} item reminder項目
 * @param {Object} config 実行時設定
 * @returns {HTTPResponse} UrlFetchAppのレスポンス
 */
function sendReminderItem(item, config) {
  const text = composeMessage(item, config);
  const chatConfig = config.chat || {};

  return sendChatMessage(text, {
    webhookUrl: resolveWebhookUrl(chatConfig),
    threadName: resolveThreadName(chatConfig, item.chat),
  });
}

/**
 * Spaceに直接メッセージを送信する。
 *
 * reminder送信ではなく、テスト送信や管理用通知で使用する。
 * threadNameは指定せず、Spaceへの新規メッセージとして送信する。
 *
 * @param {string} text 送信本文
 * @param {Object} config 実行時設定
 * @returns {HTTPResponse} UrlFetchAppのレスポンス
 */
function sendToSpace(text, config) {
  const chatConfig = (config && config.chat) || {};

  return sendChatMessage(text, {
    webhookUrl: resolveWebhookUrl(chatConfig),
    threadName: '',
  });
}
