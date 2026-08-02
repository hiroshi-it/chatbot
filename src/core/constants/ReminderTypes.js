/**
 * 週次レポートの送信曜日。
 *
 * 0 = 日曜, 1 = 月曜, ... 5 = 金曜, 6 = 土曜
 *
 * この値はコード固定とし、JSON からは変更不可とする。
 * 理由：
 * - 運用上、週次リマインドの曜日は全グループ共通とするため
 * - 設定ファイル側の入力ミスによる配信曜日のブレを防ぐため
 */
var WEEKLY_REPORT_DAY_OF_WEEK = 5;

/**
 * 共通リマインド種別定義。
 *
 * Git 上ではreminderIdとscheduleTypeのみを管理する。
 * 文言、期限、URL、Thread、@all 設定などの運用情報はここには持たせない。
 *
 * 管理対象外：
 * - description
 * - bodyText
 * - deadlineText
 * - linkUrl / linkLabel
 * - threadName
 * - mentionAll
 *
 * scheduleType:
 * - weekly         : 週次リマインド
 * - monthly        : 毎月指定日リマインド
 * - lastDayOfMonth : 月末日リマインド
 */
const REMINDER_TYPES = Object.freeze({
  weeklyReport: Object.freeze({ scheduleType: 'weekly' }),
  documentEarly: Object.freeze({ scheduleType: 'monthly' }),
  documentFinal: Object.freeze({ scheduleType: 'monthly' }),
  reportEarly: Object.freeze({ scheduleType: 'monthly' }),
  reportFinal: Object.freeze({ scheduleType: 'lastDayOfMonth' }),
});

/**
 * reminderIdに対応するリマインド種別定義を取得する。
 *
 * @param {string} reminderId リマインドID
 * @returns {{scheduleType: string}|null} 対応する定義。存在しない場合はnull
 */
function getReminderType(reminderId) {
  return REMINDER_TYPES[reminderId] || null;
}

/**
 * 定義済みのreminderId一覧を取得する。
 *
 * app.config.htmlのreminderIdバリデーションやREADME出力などで使用する。
 *
 * @returns {string[]} reminderId 一覧
 */
function listReminderTypeIds() {
  return Object.keys(REMINDER_TYPES);
}