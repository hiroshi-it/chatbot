/**
 * 指定タイムゾーン基準の「今日」を取得する。
 *
 * 戻り値は、指定タイムゾーン上の年月日をもとに生成したDateオブジェクト。
 * 時刻部分は0:00:00として扱う。
 *
 * 注意：
 * Dateオブジェクト自体はタイムゾーン情報を保持しない。
 * そのため、Utilities.formatDateで指定タイムゾーン上の年月日を取得し、
 * その年月日からDateを再生成している。
 *
 * @param {string} timezone タイムゾーン。例：Asia/Tokyo
 * @returns {Date} 指定タイムゾーン基準の今日
 */
function getTodayDate(timezone) {
  const now = new Date();
  if (!timezone || timezone === 'Asia/Tokyo') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const formatted = Utilities.formatDate(now, timezone, 'yyyy-MM-dd');
  const parts = formatted.split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

/**
 * 指定日が属する月の最終日を取得する。
 *
 * 例：
 * 2026-07-01〜2026-07-31のいずれを渡しても31を返す。
 *
 * @param {Date} date 対象日
 * @returns {number} 月末日
 */
function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * 指定日が月末日かどうかを判定する。
 *
 * lastDayOfMonthタブのリマインド送信判定で使用する。
 *
 * @param {Date} date 対象日
 * @returns {boolean} 月末日の場合true
 */
function isLastDayOfMonth(date) {
  return date.getDate() === getLastDayOfMonth(date);
}
