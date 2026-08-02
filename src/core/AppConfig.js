/**
 * 実行時アプリケーション設定。
 *
 * デフォルト値は AppConfigDefaults.js。
 * Thread事前準備 UI から保存した CSV 形式 Properties（PREP_*）で上書きする。
 */
let APP_CONFIG_CACHE = null;

/**
 * デフォルト設定を返す。
 *
 * @returns {Object}
 */
function getPrepConfigDefaults() {
  return cloneAppConfigDefaults();
}

/**
 * Properties に保存済みかどうかを返す。
 *
 * @param {string} propertyKey
 * @returns {boolean}
 */
function hasPrepProperty(propertyKey) {
  const raw = PropertiesService.getScriptProperties().getProperty(propertyKey);
  return !!(raw && String(raw).trim());
}

/**
 * CSV 形式の Properties を保存する。
 *
 * @param {string} propertyKey
 * @param {string[]} fields
 */
function savePrepConfigGroup(propertyKey, fields) {
  PropertiesService.getScriptProperties().setProperty(
      propertyKey,
      serializePrepCsvRow(fields)
  );
  invalidateAppConfigCache();
}

/**
 * CSV 形式の Properties を読み込む。
 *
 * @param {string} propertyKey
 * @param {number} expectedCount
 * @returns {string[]|null}
 */
function readPrepConfigGroup(propertyKey, expectedCount) {
  const raw = PropertiesService.getScriptProperties().getProperty(propertyKey);
  if (!raw || !String(raw).trim()) {
    return null;
  }
  return parsePrepCsvRow(raw, expectedCount);
}

/**
 * group / dispatch / chat / reminders を Properties からマージする。
 *
 * @param {Object} config
 * @returns {Object}
 */
function applyPrepPropertiesToConfig(config) {
  const merged = Object.assign({}, config);
  const schemas = getPrepConfigSchemas();

  const groupValues = readPrepConfigGroup(
      schemas.group.propertyKey,
      schemas.group.fields.length
  );
  if (groupValues) {
    merged.groupId = groupValues[0];
    merged.groupName = groupValues[1];
  }

  const dispatchValues = readPrepConfigGroup(
      schemas.dispatch.propertyKey,
      schemas.dispatch.fields.length
  );
  if (dispatchValues) {
    merged.dispatch = Object.assign({}, merged.dispatch, {
      hour: Number(dispatchValues[0]),
      minute: Number(dispatchValues[1]),
      timezone: dispatchValues[2],
    });
  }

  const chatValues = readPrepConfigGroup(
      schemas.chat.propertyKey,
      schemas.chat.fields.length
  );
  if (chatValues) {
    merged.chat = Object.assign({}, merged.chat, {
      mentionAll: parsePrepBool(chatValues[0]),
    });
  }

  merged.reminders = Object.assign({}, merged.reminders);
  PREP_REMINDER_IDS.forEach(function (reminderId) {
    const schema = schemas.reminders[reminderId];
    const values = readPrepConfigGroup(schema.propertyKey, schema.fields.length);
    if (!values) {
      return;
    }

    const reminder = Object.assign({}, merged.reminders[reminderId]);
    schema.fields.forEach(function (fieldName, index) {
      const value = values[index];
      if (fieldName === 'enabled') {
        reminder.enabled = parsePrepBool(value);
      } else if (fieldName === 'dayOfMonth') {
        reminder.dayOfMonth = Number(value);
      } else {
        reminder[fieldName] = value;
      }
    });
    merged.reminders[reminderId] = reminder;
  });

  return merged;
}

/**
 * 設定キャッシュを破棄する。
 */
function invalidateAppConfigCache() {
  APP_CONFIG_CACHE = null;
}

/**
 * 実行時に有効なアプリケーション設定を読み込む。
 *
 * @returns {Object}
 */
function getAppConfig() {
  if (APP_CONFIG_CACHE) {
    return APP_CONFIG_CACHE;
  }

  const defaults = cloneAppConfigDefaults();
  APP_CONFIG_CACHE = applyPrepPropertiesToConfig(defaults);

  return APP_CONFIG_CACHE;
}

/**
 * reminderId に対応する Properties 上書きがあるか。
 *
 * @param {string} reminderId
 * @returns {boolean}
 */
function hasPrepReminderProperty(reminderId) {
  const schemas = getPrepConfigSchemas().reminders;
  const schema = schemas[reminderId];
  if (!schema) {
    return false;
  }
  return hasPrepProperty(schema.propertyKey);
}

/**
 * システム設定の Properties 上書きがあるか。
 *
 * @returns {boolean}
 */
function hasPrepSystemProperty() {
  return hasPrepProperty(SCRIPT_PROPERTY_KEYS.PREP_GROUP) ||
      hasPrepProperty(SCRIPT_PROPERTY_KEYS.PREP_DISPATCH) ||
      hasPrepProperty(SCRIPT_PROPERTY_KEYS.PREP_CHAT);
}
