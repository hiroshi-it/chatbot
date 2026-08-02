/**
 * 日付判定処理。
 *
 * 実行時reminder項目のscheduleをもとに、
 * 指定日が送信対象日かどうかを判定する。
 */

/**
 * 指定されたscheduleが対象日に該当するかどうかを判定する。
 *
 * weeklyの場合はコード固定の曜日で判定する。
 * monthlyの場合はschedule.dayOfMonthで判定する。
 * lastDayOfMonthの場合は月末日で判定する。
 *
 * @param {Object|null|undefined} schedule スケジュール設定
 * @param {Date} [today] 判定対象日
 * @returns {boolean} 送信対象日の場合true
 */
function isScheduledToday(schedule, today) {
  if (!schedule || !schedule.type) {
    return false;
  }

  const date = today || getTodayDate();
  const type = schedule.type;

  if (type === 'weekly') {
    return date.getDay() === WEEKLY_REPORT_DAY_OF_WEEK;
  }

  if (type === 'monthly') {
    const dayOfMonth = Number(schedule.dayOfMonth);

    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
      Logger.log('[Schedule] 不正なdayOfMonth: ' + schedule.dayOfMonth);
      return false;
    }

    return date.getDate() === dayOfMonth;
  }

  if (type === 'lastDayOfMonth') {
    return isLastDayOfMonth(date);
  }

  Logger.log('[Schedule] 未知のtype: ' + type);
  return false;
}

/**
 * 本日送信対象のreminder項目を抽出する。
 *
 * config.remindersはConfigBuilderで配列化済みであること。
 * enabledがtrue、かつscheduleが本日に該当する項目のみ返す。
 *
 * @param {Object} config 実行時設定
 * @param {Date} [today] 判定対象日
 * @returns {Object[]} 本日送信対象のreminder項目
 */
function filterDueToday(config, today) {
  if (!config || !Array.isArray(config.reminders)) {
    return [];
  }

  const date = today || getTodayDate(config.dispatch && config.dispatch.timezone);

  return config.reminders.filter(function (item) {
    return item.enabled === true && isScheduledToday(item.schedule, date);
  });
}
