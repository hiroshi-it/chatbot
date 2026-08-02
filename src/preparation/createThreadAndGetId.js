/**
 * 事前準備: Webhook URL から Space 名を取得する。
 *
 * @param {string} webhookUrl Incoming Webhook URL
 * @returns {{spaceName:string,webhookUrl:string}|null}
 */
function parseChatWebhookUrl(webhookUrl) {
    if (!webhookUrl) {
        return null;
    }

    const url = String(webhookUrl).trim();
    const spaceMatch = url.match(/\/v1\/(spaces\/[^/]+)\//);

    if (!spaceMatch) {
        return null;
    }

    return {
        spaceName: spaceMatch[1],
        webhookUrl: url,
    };
}

/**
 * 入力文字列から Space リソース名（spaces/xxx）を抽出する。
 *
 * @param {string} input URL・Webhook・spaces/xxx・IDのみ
 * @returns {string}
 */
function extractSpaceIdFromInput(input) {
    const raw = String(input || '').trim();

    if (!raw) {
        throw new Error('入力が空です');
    }

    const webhookParsed = parseChatWebhookUrl(raw);
    if (webhookParsed && webhookParsed.spaceName) {
        return webhookParsed.spaceName;
    }

    const spacesMatch = raw.match(/spaces\/([A-Za-z0-9_-]+)/);
    if (spacesMatch) {
        return 'spaces/' + spacesMatch[1];
    }

    const hashSpaceMatch = raw.match(/(?:#|\/)chat\/space\/([A-Za-z0-9_-]+)/);
    if (hashSpaceMatch) {
        return 'spaces/' + hashSpaceMatch[1];
    }

    const roomMatch = raw.match(/\/room\/([A-Za-z0-9_-]+)/);
    if (roomMatch) {
        return 'spaces/' + roomMatch[1];
    }

    if (/^spaces\/[A-Za-z0-9_-]+$/.test(raw)) {
        return raw;
    }

    if (/^[A-Za-z0-9_-]+$/.test(raw)) {
        return 'spaces/' + raw;
    }

    throw new Error('Space IDを抽出できませんでした。URLまたはSpace IDを確認してください');
}

/**
 * Thread 作成時のデフォルト投稿文書。
 */
const DEFAULT_THREAD_ANNOUNCEMENT_TEXT =
    '# 周知\n週報 / シフト表 / 勤務表\n============================';

/**
 * Chat API レスポンスから threadName を取り出す。
 *
 * @param {Object} body create レスポンス JSON
 * @returns {string}
 */
function extractThreadNameFromChatResponse(body) {
    if (!body) {
        throw new Error('Chat API レスポンスが空です');
    }

    if (body.thread && body.thread.name) {
        return String(body.thread.name).trim();
    }

    throw new Error('レスポンスに thread.name が含まれていません: ' + JSON.stringify(body));
}

/**
 * 事前準備: Space に新規 Thread を作成し threadName を取得する。
 *
 * @param {string} [text] 作成時に投稿する本文
 * @param {Object} [options] オプション
 * @param {boolean} [options.saveToProperties=false] true のとき CHAT_THREAD_NAME に保存
 * @returns {{threadName:string,message:Object}}
 */
function createThreadAndGetId(text, options) {
    options = options || {};

    const announcementText =
        text && String(text).trim() ? String(text).trim() : DEFAULT_THREAD_ANNOUNCEMENT_TEXT;

    const config = getActiveConfig();
    const chatConfig = config.chat || {};
    const webhookUrl = resolveWebhookUrl(chatConfig);

    if (!webhookUrl) {
        throw new Error('Webhook URL が未設定です（CHAT_WEBHOOK_URL）');
    }

    const response = sendChatMessage(announcementText, {
        webhookUrl: webhookUrl,
        threadName: '',
    });

    const body = JSON.parse(response.getContentText());
    const threadName = extractThreadNameFromChatResponse(body);

    Logger.log('[Preparation] threadName: ' + threadName);

    if (options.saveToProperties === true) {
        PropertiesService.getScriptProperties().setProperty(
            SCRIPT_PROPERTY_KEYS.CHAT_THREAD_NAME,
            threadName
        );
        Logger.log('[Preparation] Script Properties CHAT_THREAD_NAME に保存しました');
    } else {
        Logger.log('[Preparation] Script Properties CHAT_THREAD_NAME に設定してください');
    }

    return {
        threadName: threadName,
        message: body,
    };
}
