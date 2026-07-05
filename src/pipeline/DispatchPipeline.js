/**
 * 共通実行パイプライン。
 *
 * 設定読込→送信対象判定→メッセージ組み立て→Google Chat送信の順に実行する。
 */

/**
 * 配信パイプラインを実行する。
 *
 * dryRun=trueの場合は、送信対象判定とメッセージ組み立てのみ行い、
 * Google Chatへの実送信は行わない。
 *
 * @param {Object} [options] 実行オプション
 * @param {boolean} [options.dryRun] ドライラン実行の場合true
 * @returns {{ok:boolean,dueCount:number,successCount?:number,failedCount?:number,errors?:string[]}} 実行結果
 */
function runDispatchPipeline(options) {
    options = options || {};
    const dryRun = options.dryRun === true;

    const config = readRuntimeConfig();
    const errors = validateConfig(config);

    if (errors.length) {
        errors.forEach(function (msg) {
            Logger.log('[Pipeline] ' + msg);
        });
        return {
            ok: false,
            dueCount: 0,
            errors: errors,
        };
    }

    const timezone = config.dispatch && config.dispatch.timezone;
    const today = getTodayDate(timezone);
    const dueList = judgeDueReminders(config, today);

    Logger.log(
        '[Pipeline] group=' +
        config.groupId +
        ' date=' +
        Utilities.formatDate(today, timezone || 'Asia/Tokyo', 'yyyy-MM-dd') +
        ' due=' +
        dueList.length
    );

    if (!dueList.length) {
        return {
            ok: true,
            dueCount: 0,
            successCount: 0,
            failedCount: 0,
        };
    }

    let successCount = 0;
    let failedCount = 0;
    const sendErrors = [];

    dueList.forEach(function (item) {
        try {
            if (dryRun) {
                Logger.log('[Pipeline] ' + item.reminderId + ':\n' + renderMessage(item, config));
                successCount++;
                return;
            }

            sendRenderedReminder(item, config);
            successCount++;
        } catch (e) {
            failedCount++;
            const message = '[Pipeline] 送信失敗 ' + item.reminderId + ': ' + e.message;
            Logger.log(message);
            sendErrors.push(message);
        }
    });

    return {
        ok: failedCount === 0,
        dueCount: dueList.length,
        successCount: successCount,
        failedCount: failedCount,
        errors: sendErrors.length ? sendErrors : undefined,
    };
}

/**
 * 実行時configを読み込む。
 *
 * JSON固定設定とSheet運用設定を合成したconfigを返す。
 *
 * @returns {Object} 実行時config
 */
function readRuntimeConfig() {
    return loadRuntimeConfig();
}

/**
 * 本日送信対象のreminderを判定する。
 *
 * @param {Object} config 実行時config
 * @param {Date} today 判定対象日
 * @returns {Object[]} 本日送信対象のreminder一覧
 */
function judgeDueReminders(config, today) {
    return filterDueToday(config, today);
}

/**
 * reminder項目から送信本文を生成する。
 *
 * @param {Object} item reminder項目
 * @param {Object} config 実行時config
 * @returns {string} 送信本文
 */
function renderMessage(item, config) {
    return composeMessage(item, config);
}

/**
 * 組み立て済みのreminderをGoogle Chatへ送信する。
 *
 * @param {Object} item reminder項目
 * @param {Object} config 実行時config
 * @returns {HTTPResponse} 送信結果
 */
function sendRenderedReminder(item, config) {
    return sendReminderItem(item, config);
}

