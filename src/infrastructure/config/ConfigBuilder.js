/**
 * デフォルト設定 + Script Properties（PREP_*）から実行時 config を生成する。
 *
 * すべての reminder 設定（文書・日程・期限）は Properties またはデフォルト値で管理する。
 * 週報の送信曜日のみコード固定（WEEKLY_REPORT_DAY_OF_WEEK）。
 */

function parseConfigBool(value) {
  if (value === true || value === false) {
    return value;
  }
  const s = String(value).trim().toUpperCase();
  return s === 'TRUE' || s === '1' || s === 'YES';
}

function parseConfigNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const n = Number(value);
  return isNaN(n) ? null : n;
}

function requireConfigString(jsonDef, key, context) {
  if (!jsonDef || jsonDef[key] === '' || jsonDef[key] === null || jsonDef[key] === undefined) {
    throw new Error('設定が未設定です（デフォルト / Script Properties）: ' + key + '（' + context + '）');
  }
  return String(jsonDef[key]).trim();
}

function buildLinkFromJson(jsonDef) {
  const url = jsonDef.linkUrl ? String(jsonDef.linkUrl).trim() : '';
  const label = jsonDef.linkLabel ? String(jsonDef.linkLabel).trim() : '';
  const enabled =
      jsonDef.linkEnabled !== undefined && jsonDef.linkEnabled !== null && jsonDef.linkEnabled !== ''
          ? parseConfigBool(jsonDef.linkEnabled)
          : url !== '';
  return {
    enabled: enabled,
    url: url,
    label: label,
  };
}

function resolveBodyLines(jsonDef, context) {
  if (jsonDef.bodyText !== undefined && jsonDef.bodyText !== null && String(jsonDef.bodyText).trim() !== '') {
    return parseBodyTextLines(String(jsonDef.bodyText).trim());
  }
  if (jsonDef.title !== undefined && jsonDef.title !== null && String(jsonDef.title).trim() !== '') {
    return parseBodyTextLines(String(jsonDef.title).trim());
  }
  throw new Error('bodyText が未設定です（デフォルト / Script Properties）: ' + context);
}

function resolveTitle(jsonDef, context) {
  if (jsonDef && jsonDef.title !== undefined && jsonDef.title !== null && String(jsonDef.title).trim() !== '') {
    return String(jsonDef.title).trim();
  }
  if (jsonDef && jsonDef.description !== undefined && jsonDef.description !== null && String(jsonDef.description).trim() !== '') {
    return String(jsonDef.description).trim();
  }
  throw new Error('設定が未設定です（デフォルト / Script Properties）: title（' + context + '）');
}

function buildWeeklyReminder(jsonDef) {
  return {
    reminderId: 'weeklyReport',
    title: resolveTitle(jsonDef, 'weeklyReport'),
    enabled: jsonDef.enabled !== false,
    schedule: {
      type: 'weekly',
    },
    message: {
      bodyLines: resolveBodyLines(jsonDef, 'weeklyReport'),
      deadlineText: requireConfigString(jsonDef, 'deadlineText', 'weeklyReport'),
      link: buildLinkFromJson(jsonDef),
    },
  };
}

function buildMonthlyReminder(reminderId, jsonDef) {
  const dayOfMonth = parseConfigNumber(requireConfigString(jsonDef, 'dayOfMonth', reminderId));

  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    throw new Error('dayOfMonth が不正です（デフォルト / Script Properties）: ' + reminderId);
  }

  return {
    reminderId: reminderId,
    title: resolveTitle(jsonDef, reminderId),
    enabled: jsonDef.enabled !== false,
    schedule: {
      type: 'monthly',
      dayOfMonth: dayOfMonth,
    },
    message: {
      bodyLines: resolveBodyLines(jsonDef, reminderId),
      deadlineText: requireConfigString(jsonDef, 'deadlineText', reminderId),
      link: buildLinkFromJson(jsonDef),
    },
  };
}

function buildLastDayReminder(reminderId, jsonDef) {
  return {
    reminderId: reminderId,
    title: resolveTitle(jsonDef, reminderId),
    enabled: jsonDef.enabled !== false,
    schedule: {
      type: 'lastDayOfMonth',
    },
    message: {
      bodyLines: resolveBodyLines(jsonDef, reminderId),
      deadlineText: requireConfigString(jsonDef, 'deadlineText', reminderId),
      link: buildLinkFromJson(jsonDef),
    },
  };
}

function buildRuntimeConfigFromApp(app) {
  const jsonReminders = app.reminders;

  return {
    version: '1.0.0',
    groupId: app.groupId,
    groupName: app.groupName,
    dispatch: app.dispatch,
    chat: app.chat,
    reminders: [
      buildWeeklyReminder(jsonReminders.weeklyReport),
      buildMonthlyReminder('documentEarly', jsonReminders.documentEarly),
      buildMonthlyReminder('documentFinal', jsonReminders.documentFinal),
      buildMonthlyReminder('reportEarly', jsonReminders.reportEarly),
      buildLastDayReminder('reportFinal', jsonReminders.reportFinal),
    ],
  };
}

function loadRuntimeConfig() {
  return buildRuntimeConfigFromApp(getAppConfig());
}

function resolveWebhookUrl(chatConfig) {
  const props = PropertiesService.getScriptProperties();
  const propertyValue = props.getProperty(SCRIPT_PROPERTY_KEYS.CHAT_WEBHOOK_URL);

  if (propertyValue) {
    return propertyValue;
  }

  return chatConfig && chatConfig.webhookUrl ? chatConfig.webhookUrl : '';
}

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
