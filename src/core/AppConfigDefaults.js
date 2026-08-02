/**
 * アプリケーション設定のデフォルト値。
 * 運用時の変更は Thread事前準備 UI 経由で Script Properties（PREP_*）に保存する。
 */
const APP_CONFIG_DEFAULTS = Object.freeze({
    groupId: 'default',
    groupName: 'デフォルト（全体ルーム）',
    dispatch: Object.freeze({
        hour: 19,
        minute: 0,
        timezone: 'Asia/Tokyo',
    }),
    chat: Object.freeze({
        threadName: '',
        mentionAll: true,
    }),
    reminders: Object.freeze({
        weeklyReport: Object.freeze({
            enabled: true,
            title: '週次報告リマインド',
            bodyText: '週次報告の提出をお願いします。',
            deadlineText: '翌週月曜10:00まで',
            linkLabel: '提出先リンク（表示名をここに入力してください）',
            linkUrl: 'hiroshi-it.com',
        }),
        documentEarly: Object.freeze({
            enabled: true,
            title: '月次シフト表・事前リマインド',
            bodyText: '月次シフト表の提出締切が近づいています。\n期限内のご提出をお願いします。',
            dayOfMonth: 17,
            deadlineText: '毎月20日まで',
            linkLabel: '提出先リンク（表示名をここに入力してください）',
            linkUrl: 'hiroshi-it.com/tools',
        }),
        documentFinal: Object.freeze({
            enabled: true,
            title: '月次シフト表・正式リマインド',
            bodyText: '月次シフト表の正式提出をお願いします。',
            dayOfMonth: 20,
            deadlineText: '毎月20日まで',
            linkLabel: '提出先リンク（表示名をここに入力してください）',
            linkUrl: 'hiroshi-it.com/courses',
        }),
        reportEarly: Object.freeze({
            enabled: true,
            title: '月次勤務表・事前リマインド',
            bodyText: '月次勤務表の提出をお願いします。',
            dayOfMonth: 27,
            deadlineText: '翌月1日正午まで',
            linkLabel: '提出先リンク（表示名をここに入力してください）',
            linkUrl: 'hiroshi-it.com/practice',
        }),
        reportFinal: Object.freeze({
            enabled: true,
            title: '月次勤務表・正式リマインド',
            bodyText: '月次勤務表の提出締切が近づいています。\n期限内のご提出をお願いします。',
            deadlineText: '翌月1日正午まで',
            linkLabel: '提出先リンク（表示名をここに入力してください）',
            linkUrl: 'hiroshi-it.com/ai',
        }),
    }),
});

/**
 * デフォルト設定のディープコピーを返す。
 *
 * @returns {Object}
 */
function cloneAppConfigDefaults() {
    const defaults = APP_CONFIG_DEFAULTS;
    const reminders = {};

    Object.keys(defaults.reminders).forEach(function (reminderId) {
        reminders[reminderId] = Object.assign({}, defaults.reminders[reminderId]);
    });

    return {
        groupId: defaults.groupId,
        groupName: defaults.groupName,
        dispatch: Object.assign({}, defaults.dispatch),
        chat: Object.assign({}, defaults.chat),
        reminders: reminders,
    };
}
