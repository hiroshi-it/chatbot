/**
 * 手動運用用の関数群。
 *
 * 時間主導型Triggerからは呼び出さない。
 * GASエディタでの手動実行、テスト送信、補足送信に使用する。
 */

/**
 * 周知用の新規メッセージをSpaceに送信する。
 *
 * sendToSpaceを使用するため、Spaceへの新規メッセージとして送信する。
 *
 * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse}
 */
function createAnnouncementThread() {
    const config = getActiveConfig();
    const text = '# *周知*\n============================';

    return sendToSpace(text, config);
}

/**
 * Spaceへの送信をテストする。
 *
 * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse}
 */
function sendTestToSpace() {
    const config = getActiveConfig();
    const text = '[TEST] Space送信テストです。';

    return sendToSpace(text, config);
}

/**
 * 設定済みthreadへの送信をテストする。
 *
 * resolveThreadNameで解決したthreadNameを使用する。
 *
 * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse}
 */
function sendTestToThread() {
    const config = getActiveConfig();
    const chatConfig = config.chat || {};
    const threadName = resolveThreadName(chatConfig, null);

    if (!threadName) {
        throw new Error('threadNameが未設定です');
    }

    return sendChatMessage('[TEST] Thread送信テストです。', {
        webhookUrl: resolveWebhookUrl(chatConfig),
        threadName: threadName,
    });
}

/**
 * reminderIdを指定してreminderを手動送信する。
 *
 * 日付判定は行わず、指定されたreminderを即時送信する。
 *
 * @param {string} reminderId 送信対象のreminderId
 * @returns {GoogleAppsScript.URL_Fetch.HTTPResponse}
 */
function sendByReminderId(reminderId) {
    const config = getActiveConfig();
    const item = findReminderById(config, reminderId);

    return sendReminderItem(item, config);
}

/**
 * reminderIdを指定してメッセージ組み立てのみ実行する。
 *
 * Google Chatへの送信は行わない。
 *
 * @param {string} reminderId 対象のreminderId
 * @returns {string} 組み立て後の本文
 */
function dryRunByReminderId(reminderId) {
    const config = getActiveConfig();
    const item = findReminderById(config, reminderId);
    const text = composeMessage(item, config);

    Logger.log('[DryRun] ' + reminderId + ':\n' + text);

    return text;
}

/**
 * 現在の実行時configを検証する。
 *
 * @returns {string[]} エラーメッセージ配列（問題なければ空配列）
 */
function validateActiveConfig() {
    const config = getActiveConfig();
    const errors = validateConfig(config);

    if (!errors.length) {
        Logger.log('[Validate] OK');
        return [];
    }

    errors.forEach(function (msg) {
        Logger.log('[Validate] ' + msg);
    });

    return errors;
}

/**
 * reminderIdに対応するreminder項目を取得する。
 *
 * @param {Object} config 実行時config
 * @param {string} reminderId reminderId
 * @returns {Object} reminder項目
 */
function findReminderById(config, reminderId) {
    if (!config || !Array.isArray(config.reminders)) {
        throw new Error('remindersが未設定です');
    }

    const item = config.reminders.find(function (r) {
        return r.reminderId === reminderId;
    });

    if (!item) {
        throw new Error('reminderIdが見つかりません: ' + reminderId);
    }

    return item;
}