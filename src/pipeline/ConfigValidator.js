/**
 * 設定検証処理。
 *
 * JSON固定設定とSheet運用設定を合成した実行時configを検証する。
 * エラーがある場合は例外を投げず、エラーメッセージ配列として返す。
 */

/**
 * 現在有効な実行時configを取得する。
 *
 * @returns {Object} 実行時config
 */
function getActiveConfig() {
    return loadRuntimeConfig();
}

/**
 * 実行時configを検証する。
 *
 * 主な検証対象：
 * - config本体
 * - reminders
 * - dispatch
 * - Webhook URL
 * - 各reminderのschedule/message
 *
 * @param {Object} config 実行時config
 * @returns {string[]} エラーメッセージ配列
 */
function validateConfig(config) {
    const errors = [];

    if (!config) {
        errors.push('configがnullです');
        return errors;
    }

    if (!config.dispatch) {
        errors.push('dispatchが未設定です（app.config.html）');
    } else {
        if (config.dispatch.hour === undefined || config.dispatch.hour === null || config.dispatch.hour === '') {
            errors.push('dispatch.hourが未設定です（app.config.html）');
        }
        if (config.dispatch.minute === undefined || config.dispatch.minute === null || config.dispatch.minute === '') {
            errors.push('dispatch.minuteが未設定です（app.config.html）');
        }
        if (!config.dispatch.timezone) {
            errors.push('dispatch.timezoneが未設定です（app.config.html）');
        }
    }

    const webhook = resolveWebhookUrl(config.chat || {});
    if (!webhook) {
        errors.push(
            'Webhook URLが未設定です（Script Properties: CHAT_WEBHOOK_URL、または app.config.html の chat.webhookUrl）'
        );
    }

    if (!Array.isArray(config.reminders) || config.reminders.length === 0) {
        errors.push('remindersが空です（Sheet: weekly / monthly / lastDayOfMonth）');
        return errors;
    }

    config.reminders.forEach(function (item) {
        if (!item) {
            errors.push('reminder項目がnullです');
            return;
        }

        const reminderId = item.reminderId || '';

        if (!reminderId) {
            errors.push('reminderIdが未設定です');
        }

        if (!item.schedule || !item.schedule.type) {
            errors.push('schedule.typeが未設定です: ' + reminderId);
        }

        if (item.schedule && item.schedule.type === 'monthly') {
            const dayOfMonth = Number(item.schedule.dayOfMonth);
            if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
                errors.push('dayOfMonthが不正です: ' + reminderId);
            }
        }

        if (item.enabled === true) {
            const message = item.message || {};
            const bodyLines = Array.isArray(message.bodyLines) ? message.bodyLines : [];

            if (bodyLines.length === 0) {
                errors.push('bodyTextが空です: ' + reminderId);
            }

            if (!message.deadlineText) {
                errors.push('deadlineTextが未設定です: ' + reminderId);
            }
        }
    });

    return errors;
}
