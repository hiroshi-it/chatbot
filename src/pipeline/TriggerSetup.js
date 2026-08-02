/**
 * Trigger管理。
 *
 * 時間主導型Triggerを作成・削除する。
 * Botは常駐プロセスではないため、毎日の自動実行にはTrigger登録が必要となる。
 */

const DISPATCH_HANDLER = 'dailyReminderDispatcher';

/**
 * 既存の配信Triggerを削除する。
 *
 * 同じhandlerのTriggerが複数存在すると、同じリマインドが重複送信される可能性がある。
 * そのため、新規作成前に既存Triggerを削除する。
 */
function removeDispatchTriggers() {
  ScriptApp.getProjectTriggers()
      .filter(function (t) {
        return t.getHandlerFunction() === DISPATCH_HANDLER;
      })
      .forEach(function (t) {
        ScriptApp.deleteTrigger(t);
      });
}

/**
 * TriggerのnearMinuteに使用する分を補正する。
 *
 * GAS の nearMinute() は 0 / 15 / 30 / 45 のみ有効。
 * それ以外が指定された場合は 0 分に丸める。
 *
 * @param {number} minute 分
 * @returns {number} 補正後の分
 */
function snapNearMinute(minute) {
  const valid = [0, 15, 30, 55];
  return valid.indexOf(minute) !== -1 ? minute : 0;
}

/**
 * 配信用Triggerを作成する。
 *
 * デフォルト設定 + Script Properties の dispatch 設定をもとに、
 * dailyReminderDispatcherを毎日実行する時間主導型Triggerを登録する。
 *
 * 作成前に既存Triggerを削除し、重複実行を防ぐ。
 */
function installDispatchTrigger() {
  const config = getActiveConfig();
  const dispatch = config.dispatch || {};
  const hour = dispatch.hour !== undefined && dispatch.hour !== null ? dispatch.hour : 19;
  const minute = snapNearMinute(dispatch.minute !== undefined && dispatch.minute !== null ? dispatch.minute : 0);
  const timezone = dispatch.timezone || 'Asia/Tokyo';

  removeDispatchTriggers();

  ScriptApp.newTrigger(DISPATCH_HANDLER)
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .nearMinute(minute)
      .inTimezone(timezone)
      .create();
}

/**
 * 配信用Triggerのセットアップ入口。
 *
 * GASエディタから手動実行し、Triggerを登録・更新する。
 * 初回または appsscript.json 更新後は、実行時の承認ダイアログで権限を許可すること。
 */
function setupDispatchTrigger() {
  installDispatchTrigger();
  Logger.log('[Trigger] dailyReminderDispatcherを登録しました');
}

/**
 * UI 表示用にプロジェクト内 Trigger 一覧を返す。
 *
 * @returns {Object[]}
 */
function listProjectTriggersSnapshot() {
  return ScriptApp.getProjectTriggers().map(function (trigger) {
    return {
      handlerFunction: trigger.getHandlerFunction(),
      eventType: String(trigger.getEventType()),
      triggerSource: String(trigger.getTriggerSource()),
      uniqueId: trigger.getUniqueId(),
      isDispatchTrigger: trigger.getHandlerFunction() === DISPATCH_HANDLER,
    };
  });
}

/**
 * 配信 Trigger の UI 向け状態を返す。
 *
 * @returns {Object}
 */
function getDispatchTriggerUiStatus() {
  const triggers = listProjectTriggersSnapshot();
  const config = getAppConfig();
  const dispatch = config.dispatch || {};
  const hour = dispatch.hour !== undefined && dispatch.hour !== null ? dispatch.hour : 19;
  const minute = dispatch.minute !== undefined && dispatch.minute !== null ? dispatch.minute : 0;
  const timezone = dispatch.timezone || 'Asia/Tokyo';
  const dispatchTriggers = triggers.filter(function (item) {
    return item.isDispatchTrigger;
  });

  return {
    plannedSchedule: {
      handlerFunction: DISPATCH_HANDLER,
      hour: hour,
      minute: minute,
      timezone: timezone,
      label: '毎日 ' + hour + ':' + String(minute).padStart(2, '0') + '（' + timezone + '）',
    },
    triggers: triggers,
    dispatchRegistered: dispatchTriggers.length > 0,
    dispatchTriggerCount: dispatchTriggers.length,
  };
}
