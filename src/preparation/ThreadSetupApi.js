/**
 * Thread 事前準備 UI 向けサーバー API。
 */

const PREPARATION_REMINDER_ROWS = Object.freeze([
    { reminderId: 'weeklyReport', label: '週次・業務報告', hasDayOfMonth: false },
    { reminderId: 'documentEarly', label: '月次・シフト事前', hasDayOfMonth: true },
    { reminderId: 'documentFinal', label: '月次・シフト当日', hasDayOfMonth: true },
    { reminderId: 'reportEarly', label: '月次・勤務表事前', hasDayOfMonth: true },
    { reminderId: 'reportFinal', label: '月次・勤務表当日', hasDayOfMonth: false },
]);

function doGet() {
    return HtmlService.createHtmlOutputFromFile('preparation/ThreadSetup')
        .setTitle('Thread事前準備')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function extractShortThreadId(threadName) {
    const parts = String(threadName || '').split('/');
    return parts.length ? parts[parts.length - 1] : String(threadName || '');
}

function pickSystemEditorFields(config) {
    const dispatch = config.dispatch || {};
    const chat = config.chat || {};

    return {
        groupId: config.groupId || '',
        groupName: config.groupName || '',
        dispatchHour: dispatch.hour,
        dispatchMinute: dispatch.minute,
        dispatchTimezone: dispatch.timezone || 'Asia/Tokyo',
        mentionAll: chat.mentionAll !== false,
    };
}

function pickReminderEditorFields(reminderDef) {
    const fields = {
        enabled: reminderDef.enabled !== false,
        title: reminderDef.title || '',
        bodyText: reminderDef.bodyText || '',
        deadlineText: reminderDef.deadlineText || '',
        linkLabel: reminderDef.linkLabel || '',
        linkUrl: reminderDef.linkUrl || '',
    };

    if (reminderDef.dayOfMonth !== undefined && reminderDef.dayOfMonth !== null) {
        fields.dayOfMonth = reminderDef.dayOfMonth;
    }

    return fields;
}

function resolveWithDefault(value, defaultValue) {
    const trimmed = String(value === undefined || value === null ? '' : value).trim();
    if (trimmed !== '') {
        return trimmed;
    }
    return String(defaultValue === undefined || defaultValue === null ? '' : defaultValue).trim();
}

function buildSystemCsvFields(payload, defaults) {
    const groupId = resolveWithDefault(payload.groupId, defaults.groupId);
    const groupName = resolveWithDefault(payload.groupName, defaults.groupName);
    const dispatchHour = Number(
        payload.dispatchHour === '' || payload.dispatchHour === null || payload.dispatchHour === undefined
            ? defaults.dispatchHour
            : payload.dispatchHour
    );
    const dispatchMinute = Number(
        payload.dispatchMinute === '' || payload.dispatchMinute === null || payload.dispatchMinute === undefined
            ? defaults.dispatchMinute
            : payload.dispatchMinute
    );
    const dispatchTimezone = resolveWithDefault(payload.dispatchTimezone, defaults.dispatchTimezone);
    const mentionAll = payload.mentionAll === true || payload.mentionAll === 'true';

    if (!groupId) {
        throw new Error('グループIDを入力してください');
    }
    if (!groupName) {
        throw new Error('グループ名を入力してください');
    }
    if (!Number.isInteger(dispatchHour) || dispatchHour < 0 || dispatchHour > 23) {
        throw new Error('配信時刻（時）は0〜23の整数で入力してください');
    }
    if (!Number.isInteger(dispatchMinute) || dispatchMinute < 0 || dispatchMinute > 59) {
        throw new Error('配信時刻（分）は0〜59の整数で入力してください');
    }
    if (!dispatchTimezone) {
        throw new Error('タイムゾーンを入力してください');
    }

    return {
        group: [groupId, groupName],
        dispatch: [String(dispatchHour), String(dispatchMinute), dispatchTimezone],
        chat: [mentionAll ? 'true' : 'false'],
    };
}

function buildReminderCsvFields(payload, defaults, hasDayOfMonth) {
    const title = resolveWithDefault(payload.title, defaults.title);
    const bodyText = resolveWithDefault(payload.bodyText, defaults.bodyText);
    const deadlineText = resolveWithDefault(payload.deadlineText, defaults.deadlineText);
    const linkLabel = resolveWithDefault(payload.linkLabel, defaults.linkLabel);
    const linkUrl = resolveWithDefault(payload.linkUrl, defaults.linkUrl);
    const enabled = payload.enabled === true || payload.enabled === 'true';

    if (!title) {
        throw new Error('リマインドのタイトルを入力してください');
    }
    if (!bodyText) {
        throw new Error('送信する本文を入力してください');
    }
    if (!deadlineText) {
        throw new Error('期限の表示文を入力してください');
    }
    if (!linkLabel) {
        throw new Error('リンクの表示名を入力してください');
    }
    if (!linkUrl) {
        throw new Error('リンクのURLを入力してください');
    }

    const fields = [
        enabled ? 'true' : 'false',
        title,
        bodyText,
    ];

    if (hasDayOfMonth) {
        const rawDay = payload.dayOfMonth;
        const dayOfMonth = rawDay === '' || rawDay === null || rawDay === undefined
            ? Number(defaults.dayOfMonth)
            : Number(rawDay);

        if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
            throw new Error('毎月の送信日は1〜31の整数で入力してください');
        }
        fields.push(String(dayOfMonth));
    }

    fields.push(deadlineText, linkLabel, linkUrl);
    return fields;
}

function preparationUiGetBootstrapData() {
    const defaultsConfig = getPrepConfigDefaults();
    const activeConfig = getAppConfig();
    const props = PropertiesService.getScriptProperties();
    const schemas = getPrepConfigSchemas();

    const systemDefaults = pickSystemEditorFields(defaultsConfig);
    const systemValues = pickSystemEditorFields(activeConfig);

    const reminders = buildReminderBootstrapItems();

    return {
        webhookUrl: props.getProperty(SCRIPT_PROPERTY_KEYS.CHAT_WEBHOOK_URL) || '',
        system: {
            defaults: systemDefaults,
            values: systemValues,
            hasOverride: hasPrepSystemProperty(),
            propertyKeys: {
                group: schemas.group.propertyKey,
                dispatch: schemas.dispatch.propertyKey,
                chat: schemas.chat.propertyKey,
            },
        },
        reminders: reminders,
        triggers: getDispatchTriggerUiStatus(),
    };
}

function preparationUiSaveWebhookUrl(webhookUrl) {
    const value = String(webhookUrl || '').trim();

    if (!value) {
        throw new Error('Webhook URLを入力してください');
    }

    const parsed = parseChatWebhookUrl(value);
    if (!parsed) {
        throw new Error('Incoming Webhook URLを入力してください（chat.googleapis.com/v1/spaces/.../messages）');
    }

    const props = PropertiesService.getScriptProperties();
    props.setProperty(SCRIPT_PROPERTY_KEYS.CHAT_WEBHOOK_URL, value);
    props.setProperty(SCRIPT_PROPERTY_KEYS.CHAT_SPACE_ID, parsed.spaceName);

    return {
        webhookUrl: value,
        spaceId: parsed.spaceName,
        saved: true,
    };
}

function preparationUiSavePrepSystemSettings(payload) {
    payload = payload || {};

    const defaultsConfig = getPrepConfigDefaults();
    const defaults = pickSystemEditorFields(defaultsConfig);
    const csvFields = buildSystemCsvFields(payload, defaults);
    const schemas = getPrepConfigSchemas();

    savePrepConfigGroup(schemas.group.propertyKey, csvFields.group);
    savePrepConfigGroup(schemas.dispatch.propertyKey, csvFields.dispatch);
    savePrepConfigGroup(schemas.chat.propertyKey, csvFields.chat);

    return {
        values: pickSystemEditorFields(getAppConfig()),
        saved: true,
        hasOverride: true,
    };
}

function preparationUiSavePrepReminderSettings(payload) {
    payload = payload || {};

    const reminderId = String(payload.reminderId || '').trim();
    const row = PREPARATION_REMINDER_ROWS.find(function (item) {
        return item.reminderId === reminderId;
    });

    if (!row) {
        throw new Error('不明なreminderIdです: ' + reminderId);
    }

    const defaultsConfig = getPrepConfigDefaults();
    const defaults = pickReminderEditorFields(defaultsConfig.reminders[reminderId] || {});
    const fields = buildReminderCsvFields(payload, defaults, row.hasDayOfMonth);
    const schema = getPrepConfigSchemas().reminders[reminderId];

    savePrepConfigGroup(schema.propertyKey, fields);

    return {
        reminderId: reminderId,
        values: pickReminderEditorFields(getAppConfig().reminders[reminderId] || {}),
        saved: true,
        hasOverride: true,
    };
}

function saveAllPrepSettingsFromPayload(payload) {
    payload = payload || {};

    const defaultsConfig = getPrepConfigDefaults();
    const systemDefaults = pickSystemEditorFields(defaultsConfig);
    const csvSystem = buildSystemCsvFields(payload.system || {}, systemDefaults);
    const schemas = getPrepConfigSchemas();

    savePrepConfigGroup(schemas.group.propertyKey, csvSystem.group);
    savePrepConfigGroup(schemas.dispatch.propertyKey, csvSystem.dispatch);
    savePrepConfigGroup(schemas.chat.propertyKey, csvSystem.chat);

    const reminders = Array.isArray(payload.reminders) ? payload.reminders : [];
    reminders.forEach(function (reminderPayload) {
        const reminderId = String(reminderPayload.reminderId || '').trim();
        const row = PREPARATION_REMINDER_ROWS.find(function (item) {
            return item.reminderId === reminderId;
        });

        if (!row) {
            throw new Error('不明なリマインド設定です: ' + reminderId);
        }

        const defaults = pickReminderEditorFields(defaultsConfig.reminders[reminderId] || {});
        const fields = buildReminderCsvFields(reminderPayload, defaults, row.hasDayOfMonth);
        const schema = schemas.reminders[reminderId];
        savePrepConfigGroup(schema.propertyKey, fields);
    });
}

function buildReminderBootstrapItems() {
    const defaultsConfig = getPrepConfigDefaults();
    const activeConfig = getAppConfig();
    const schemas = getPrepConfigSchemas();

    return PREPARATION_REMINDER_ROWS.map(function (row) {
        return {
            reminderId: row.reminderId,
            label: row.label,
            hasDayOfMonth: row.hasDayOfMonth,
            defaults: pickReminderEditorFields(defaultsConfig.reminders[row.reminderId] || {}),
            values: pickReminderEditorFields(activeConfig.reminders[row.reminderId] || {}),
            hasOverride: hasPrepReminderProperty(row.reminderId),
            propertyKey: schemas.reminders[row.reminderId].propertyKey,
        };
    });
}

function preparationUiSaveAllSettingsAndEnableDispatch(payload) {
    saveAllPrepSettingsFromPayload(payload);
    removeDispatchTriggers();
    setupDispatchTrigger();

    const activeConfig = getAppConfig();

    return {
        saved: true,
        triggers: getDispatchTriggerUiStatus(),
        system: {
            values: pickSystemEditorFields(activeConfig),
            hasOverride: hasPrepSystemProperty(),
        },
        reminders: buildReminderBootstrapItems(),
    };
}

function preparationUiSetupDispatchTrigger() {
    return preparationUiSaveAllSettingsAndEnableDispatch({
        system: pickSystemEditorFields(getAppConfig()),
        reminders: buildReminderBootstrapItems().map(function (item) {
            return Object.assign({ reminderId: item.reminderId }, item.values);
        }),
    });
}

function preparationUiCreateThread(payload) {
    payload = payload || {};

    const text = payload.messageText ? String(payload.messageText).trim() : '';
    const announcementText = text || DEFAULT_THREAD_ANNOUNCEMENT_TEXT;

    const saveToProperties = payload.saveToProperties !== false;
    const result = createThreadAndGetId(announcementText, {
        saveToProperties: saveToProperties,
    });

    const threadName = String(result.threadName || '').trim();

    return {
        threadName: threadName,
        threadId: threadName,
        shortId: extractShortThreadId(threadName),
        displayName: announcementText.split('\n')[0] || '（無題）',
        savedToProperties: saveToProperties,
    };
}
