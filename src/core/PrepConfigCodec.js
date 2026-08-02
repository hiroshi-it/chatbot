/**
 * Thread事前準備 UI 用の CSV 形式 Properties 编解码。
 */

const PREP_NL_TOKEN = '{{NL}}';

const PREP_REMINDER_IDS = Object.freeze([
    'weeklyReport',
    'documentEarly',
    'documentFinal',
    'reportEarly',
    'reportFinal',
]);

/**
 * @returns {Object}
 */
function getPrepConfigSchemas() {
    return {
        group: {
            propertyKey: SCRIPT_PROPERTY_KEYS.PREP_GROUP,
            fields: ['groupId', 'groupName'],
        },
        dispatch: {
            propertyKey: SCRIPT_PROPERTY_KEYS.PREP_DISPATCH,
            fields: ['hour', 'minute', 'timezone'],
        },
        chat: {
            propertyKey: SCRIPT_PROPERTY_KEYS.PREP_CHAT,
            fields: ['mentionAll'],
        },
        reminders: {
            weeklyReport: {
                propertyKey: SCRIPT_PROPERTY_KEYS.PREP_REMINDER_WEEKLY_REPORT,
                fields: ['enabled', 'title', 'bodyText', 'deadlineText', 'linkLabel', 'linkUrl'],
            },
            documentEarly: {
                propertyKey: SCRIPT_PROPERTY_KEYS.PREP_REMINDER_DOCUMENT_EARLY,
                fields: ['enabled', 'title', 'bodyText', 'dayOfMonth', 'deadlineText', 'linkLabel', 'linkUrl'],
            },
            documentFinal: {
                propertyKey: SCRIPT_PROPERTY_KEYS.PREP_REMINDER_DOCUMENT_FINAL,
                fields: ['enabled', 'title', 'bodyText', 'dayOfMonth', 'deadlineText', 'linkLabel', 'linkUrl'],
            },
            reportEarly: {
                propertyKey: SCRIPT_PROPERTY_KEYS.PREP_REMINDER_REPORT_EARLY,
                fields: ['enabled', 'title', 'bodyText', 'dayOfMonth', 'deadlineText', 'linkLabel', 'linkUrl'],
            },
            reportFinal: {
                propertyKey: SCRIPT_PROPERTY_KEYS.PREP_REMINDER_REPORT_FINAL,
                fields: ['enabled', 'title', 'bodyText', 'deadlineText', 'linkLabel', 'linkUrl'],
            },
        },
    };
}

/**
 * @param {string} reminderId
 * @returns {string}
 */
function buildReminderPropertyKey(reminderId) {
    const schemas = getPrepConfigSchemas().reminders;
    const schema = schemas[reminderId];
    if (!schema) {
        throw new Error('不明なreminderIdです: ' + reminderId);
    }
    return schema.propertyKey;
}

/**
 * @param {*} value
 * @returns {string}
 */
function encodePrepField(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/\r\n/g, '\n')
        .replace(/\n/g, PREP_NL_TOKEN);
}

/**
 * @param {*} value
 * @returns {string}
 */
function decodePrepField(value) {
    return String(value === undefined || value === null ? '' : value)
        .split(PREP_NL_TOKEN)
        .join('\n');
}

/**
 * @param {string[]} fields
 */
function assertNoCommaInPrepFields(fields) {
    fields.forEach(function (field, index) {
        const text = String(field === undefined || field === null ? '' : field);
        if (text.indexOf(',') !== -1) {
            throw new Error('入力値にカンマ（,）は使用できません（項目' + (index + 1) + '）');
        }
    });
}

/**
 * @param {string[]} fields
 * @returns {string}
 */
function serializePrepCsvRow(fields) {
    assertNoCommaInPrepFields(fields);
    return fields.map(function (field) {
        return encodePrepField(field);
    }).join(',');
}

/**
 * @param {string} raw
 * @param {number} expectedCount
 * @returns {string[]}
 */
function parsePrepCsvRow(raw, expectedCount) {
    const text = String(raw || '').trim();
    if (!text) {
        throw new Error('Properties の値が空です');
    }

    const parts = text.split(',');
    if (parts.length !== expectedCount) {
        throw new Error('Properties の項目数が不正です（期待: ' + expectedCount + ' / 実際: ' + parts.length + '）');
    }

    return parts.map(function (part) {
        return decodePrepField(part);
    });
}

/**
 * @param {boolean|string} value
 * @returns {boolean}
 */
function parsePrepBool(value) {
    const text = String(value).trim().toLowerCase();
    return text === 'true' || text === '1' || text === 'yes';
}
