/**
 * Sheet運用設定を読み込む。
 *
 * 共通設定、送信先、本文、リンク、enabledなどの固定設定はJSON側で管理する。
 * Sheet側では、運用時に変更されるdescription、deadlineText、dayOfMonthのみを管理する。
 *
 * 読み込み対象タブ：
 * - weekly
 * - monthly
 * - lastDayOfMonth
 *
 * @returns {{weekly:Object|null,monthly:Object[],lastDayOfMonth:Object|null}} Sheet運用設定
 */
function loadSheetOverrides() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty(SCRIPT_PROPERTY_KEYS.CONFIG_SHEET_ID);

  if (!sheetId) {
    throw new Error('CONFIG_SHEET_ID未設定');
  }

  const ss = SpreadsheetApp.openById(sheetId);
  const weeklySheet = ss.getSheetByName(SHEET_TAB.WEEKLY);
  const monthlySheet = ss.getSheetByName(SHEET_TAB.MONTHLY);
  const lastDaySheet = ss.getSheetByName(SHEET_TAB.LAST_DAY_OF_MONTH);

  if (!weeklySheet || !monthlySheet || !lastDaySheet) {
    throw new Error('Sheetタブweekly/monthly/lastDayOfMonthが必要です');
  }

  const weeklyRows = sheetToRecords(weeklySheet);
  const monthlyRows = sheetToRecords(monthlySheet);
  const lastDayRows = sheetToRecords(lastDaySheet);

  return {
    weekly: weeklyRows.length ? weeklyRows[0] : null,
    monthly: monthlyRows,
    lastDayOfMonth: lastDayRows.length ? lastDayRows[0] : null,
  };
}

/**
 * Sheetの内容をオブジェクト配列に変換する。
 *
 * 1行目をヘッダー行として扱い、2行目以降をデータ行として読み込む。
 * 空行は無視する。
 * ヘッダーが空の列は無視する。
 *
 * 例：
 * description | deadlineText
 * A           | B
 *
 * 変換後：
 * [{description:'A',deadlineText:'B'}]
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 読み込み対象Sheet
 * @returns {Object[]} 行データの配列
 */
function sheetToRecords(sheet) {
  if (!sheet) {
    return [];
  }
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return [];
  }

  const headers = values[0].map(function (h) {
    return String(h).trim();
  });

  const records = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row.some(function (cell) {
      return cell !== '' && cell !== null && cell !== undefined;
    })) {
      continue;
    }
    const record = {};
    headers.forEach(function (header, col) {
      if (header) {
        record[header] = row[col];
      }
    });
    records.push(record);
  }
  return records;
}

