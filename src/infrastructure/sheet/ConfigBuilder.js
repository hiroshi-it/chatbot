/**
 * JSON固定設定とSheet運用設定を合成し、実行時configを生成する。
 *
 * JSON側で管理する項目：
 * - group/groupName
 * - dispatch
 * - chat
 * - enabled
 * - bodyText
 * - linkEnabled/linkUrl/linkLabel
 *
 * Sheet側で管理する項目：
 * - description
 * - deadlineText
 * - monthlyのdayOfMonth
 *
 * コード固定の項目：
 * - 週報の送信曜日
 */
function parseSheetBool(value) {
  if (value === true || value === false) {
    return value;
  }
  const s = String(value).trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YES';
}

/**
 * SheetまたはJSONから取得した値を数値に変換する。
 *
 * 空文字、null、undefinedの場合はnullを返す。
 * 数値変換できない場合もnullを返す。
 *
 * @param {*} value 変換対象
 * @returns {number|null} 数値またはnull
 */
function parseSheetNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const n = Number(value);
  return isNaN(n) ? null : n;
}

/**
 * Sheet行から必須項目を取得する。
 *
 * 対象項目が存在しない、または空の場合は実行時エラーとする。
 * JSON側のデフォルト値でSheetの欠落を隠蔽しない。
 *
 * @param {Object} row Sheetの1行データ
 * @param {string} key 取得対象の列名
 * @param {string} context エラー表示用の文脈
 * @returns {string} トリム済みのセル値
 */
function requireSheetCell(row, key, context) {
  if (!row || row[key] === '' || row[key] === null || row[key] === undefined) {
    throw new Error('Sheet列が欠落 ' + key + '（' + context + '）');
  }
  return String(row[key]).trim();
}

/**
 * JSON側のリンク設定を実行時message.link形式に変換する。
 *
 * linkEnabledが明示されている場合はその値を使用する。
 * linkEnabledが未設定の場合は、linkUrlが存在する場合のみリンク有効とする。
 *
 * @param {Object} jsonDef JSON側のreminder定義
 * @returns {{enabled:boolean,url:string,label:string}} リンク設定
 */
function buildLinkFromJson(jsonDef) {
  const url = jsonDef.linkUrl ? String(jsonDef.linkUrl).trim() : '';
  const label = jsonDef.linkLabel ? String(jsonDef.linkLabel).trim() : '';
  const enabled =
    jsonDef.linkEnabled !== undefined && jsonDef.linkEnabled !== null && jsonDef.linkEnabled !== ''
      ? parseSheetBool(jsonDef.linkEnabled)
      : url !== '';
  return {
    enabled: enabled,
    url: url,
    label: label,
  };
}

/**
 * weeklyタブのSheet行とJSON定義から週次reminderを生成する。
 *
 * bodyText、enabled、linkはJSON側を使用する。
 * description、deadlineTextはSheet側を使用する。
 * 送信曜日はコード固定のWEEKLY_REPORT_DAY_OF_WEEKで判定する。
 *
 * @param {Object} jsonDef JSON側のweeklyReport定義
 * @param {Object} weeklyRow weeklyタブの行データ
 * @returns {Object} 実行時reminder項目
 */
function buildWeeklyReminder(jsonDef, weeklyRow) {
  if (!weeklyRow) {
    throw new Error('Sheetタブweeklyにデータ行がありません');
  }

  return {
    reminderId: 'weeklyReport',
    name: requireSheetCell(weeklyRow, 'description', 'weekly'),
    enabled: jsonDef.enabled !== false,
    schedule: {
      type: 'weekly',
    },
    message: {
      bodyLines: parseBodyTextLines(jsonDef.bodyText || ''),
      deadlineText: requireSheetCell(weeklyRow, 'deadlineText', 'weekly'),
      link: buildLinkFromJson(jsonDef),
    },
  };
}

/**
 * monthlyタブのSheet行とJSON定義から月次reminderを生成する。
 *
 * bodyText、enabled、linkはJSON側を使用する。
 * description、dayOfMonth、deadlineTextはSheet側を使用する。
 *
 * @param {string} reminderId reminderId
 * @param {Object} jsonDef JSON側のreminder定義
 * @param {Object} row monthlyタブの該当行
 * @returns {Object} 実行時reminder項目
 */
function buildMonthlyReminder(reminderId, jsonDef, row) {
  if (!row) {
    throw new Error('SheetタブmonthlyにreminderId行がありません: ' + reminderId);
  }

  const dayOfMonth = parseSheetNumber(requireSheetCell(row, 'dayOfMonth', reminderId));

  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    throw new Error('dayOfMonthが不正です: ' + reminderId);
  }

  return {
    reminderId: reminderId,
    name: requireSheetCell(row, 'description', reminderId),
    enabled: jsonDef.enabled !== false,
    schedule: {
      type: 'monthly',
      dayOfMonth: dayOfMonth,
    },
    message: {
      bodyLines: parseBodyTextLines(jsonDef.bodyText || ''),
      deadlineText: requireSheetCell(row, 'deadlineText', reminderId),
      link: buildLinkFromJson(jsonDef),
    },
  };
}

/**
 * lastDayOfMonthタブのSheet行とJSON定義から月末reminderを生成する。
 *
 * bodyText、enabled、linkはJSON側を使用する。
 * description、deadlineTextはSheet側を使用する。
 * 送信日はコード側で月末判定する。
 *
 * @param {string} reminderId reminderId
 * @param {Object} jsonDef JSON側のreminder定義
 * @param {Object} row lastDayOfMonthタブの行データ
 * @returns {Object} 実行時reminder項目
 */
function buildLastDayReminder(reminderId, jsonDef, row) {
  if (!row) {
    throw new Error('SheetタブlastDayOfMonthにデータ行がありません');
  }

  return {
    reminderId: reminderId,
    name: requireSheetCell(row, 'description', 'lastDayOfMonth'),
    enabled: jsonDef.enabled !== false,
    schedule: {
      type: 'lastDayOfMonth',
    },
    message: {
      bodyLines: parseBodyTextLines(jsonDef.bodyText || ''),
      deadlineText: requireSheetCell(row, 'deadlineText', 'lastDayOfMonth'),
      link: buildLinkFromJson(jsonDef),
    },
  };
}

/**
 * monthlyタブの行配列をreminderIdキーのMap形式に変換する。
 *
 * monthlyタブでは複数reminderを1タブで管理するため、
 * reminderIdで対象行を引けるようにする。
 *
 * @param {Object[]} monthlyRows monthlyタブの行配列
 * @returns {Object} reminderIdをキーにした行Map
 */
function indexMonthlyRows(monthlyRows) {
  const map = {};
  monthlyRows.forEach(function (row) {
    if (row.reminderId) {
      map[String(row.reminderId).trim()] = row;
    }
  });
  return map;
}

/**
 * app.config.htmlのJSON設定とSheet設定を合成する。
 *
 * この関数の戻り値が、日付判定、メッセージ組み立て、送信処理で使用する実行時configとなる。
 *
 * @param {Object} app JSON側の固定設定
 * @param {Object} sheetOverrides Sheet側の運用設定
 * @returns {Object} 実行時config
 */
function mergeAppConfigWithSheet(app, sheetOverrides) {
  const jsonReminders = app.reminders;
  const monthlyMap = indexMonthlyRows(sheetOverrides.monthly || []);

  return {
    version: '1.0.0',
    groupId: app.groupId,
    groupName: app.groupName,
    dispatch: app.dispatch,
    chat: app.chat,
    reminders: [
      buildWeeklyReminder(jsonReminders.weeklyReport, sheetOverrides.weekly),
      buildMonthlyReminder('documentEarly', jsonReminders.documentEarly, monthlyMap.documentEarly),
      buildMonthlyReminder('documentFinal', jsonReminders.documentFinal, monthlyMap.documentFinal),
      buildMonthlyReminder('reportEarly', jsonReminders.reportEarly, monthlyMap.reportEarly),
      buildLastDayReminder('reportFinal', jsonReminders.reportFinal, sheetOverrides.lastDayOfMonth),
    ],
  };
}

/**
 * JSON設定とSheet設定を読み込み、実行時configを生成する。
 *
 * getAppConfigでJSON固定設定を読み込む。
 * loadSheetOverridesでSheet運用設定を読み込む。
 * 最後にmergeAppConfigWithSheetで両者を合成する。
 *
 * @returns {Object} 実行時config
 */
function loadRuntimeConfigFromSheet() {
  const app = getAppConfig();
  const overrides = loadSheetOverrides();
  return mergeAppConfigWithSheet(app, overrides);
}

/**
 * 実行時configを読み込む。
 *
 * getAppConfig側で「_comment」などのメタキー除去を実施済みのため、
 * ここでは合成済みconfigをそのまま返す。
 *
 * @returns {Object} 実行時config
 */
function loadRuntimeConfig() {
  return loadRuntimeConfigFromSheet();
}

/**
 * Google ChatのWebhook URLを解決する。
 *
 * 本番環境ではScript Propertiesを優先する。
 * JSON側のwebhookUrlは開発用またはサンプル用のフォールバックとして扱う。
 *
 * @param {Object} chatConfig JSON側または実行時configのchat設定
 * @returns {string} Webhook URL
 */
function resolveWebhookUrl(chatConfig) {
  const props = PropertiesService.getScriptProperties();
  const propertyValue = props.getProperty(SCRIPT_PROPERTY_KEYS.CHAT_WEBHOOK_URL);

  if (propertyValue) {
    return propertyValue;
  }

  return chatConfig && chatConfig.webhookUrl ? chatConfig.webhookUrl : '';
}

/**
 * Google Chatの送信先スレッド名を解決する。
 *
 * 優先順位：
 * 1. reminder個別のitemChat.threadName
 * 2. Script PropertiesのCHAT_THREAD_NAME
 * 3. JSON側のchat.threadName
 *
 * @param {Object} chatConfig JSON側または実行時configのchat設定
 * @param {Object|null|undefined} itemChat reminder個別のchat設定
 * @returns {string} スレッド名。未設定の場合は空文字
 */
function resolveThreadName(chatConfig, itemChat) {
  if (itemChat && itemChat.threadName) {
    return itemChat.threadName;
  }

  const props = PropertiesService.getScriptProperties();
  const propertyValue = props.getProperty(SCRIPT_PROPERTY_KEYS.CHAT_THREAD_NAME);

  if (propertyValue) {
    return propertyValue;
  }

  return chatConfig && chatConfig.threadName ? chatConfig.threadName : '';
}
