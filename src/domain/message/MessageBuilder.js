/**
 * メッセージ組み立て処理。
 *
 * 引数にはConfigBuilderが生成した実行時reminder項目を渡す。
 * message.bodyLines/message.linkはConfigBuilder側で正規化済みであること。
 */

/**
 * リンク行を表示するかどうかを判定する。
 *
 * link.enabledがtrueかつlink.urlが空でない場合のみ表示する。
 *
 * @param {Object|null|undefined} link リンク設定
 * @returns {boolean}
 */
function needsLinkLine(link) {
  if (!link || link.enabled === false) {
    return false;
  }

  const url = link.url ? String(link.url).trim() : '';

  return link.enabled === true && url !== '';
}

/**
 * Google Chat用のリンク行を生成する。
 *
 * @param {Object} link リンク設定
 * @returns {string}
 */
function buildLinkLine(link) {
  const url = String(link.url).trim();
  const label = link.label && String(link.label).trim() ? String(link.label).trim() : url;
  const prefix = link.prefix && String(link.prefix).trim() ? String(link.prefix).trim() : '提出先: ';

  return prefix + '<' + url + '|' + label + '>';
}

/**
 * reminder項目からメッセージ情報を取得する。
 *
 * @param {Object} item reminder項目
 * @returns {{bodyLines:string[],deadlineText:string,link:Object|null}}
 */
function resolveMessage(item) {
  const message = item.message || {};

  return {
    bodyLines: Array.isArray(message.bodyLines) ? message.bodyLines : [],
    deadlineText: message.deadlineText ? String(message.deadlineText).trim() : '',
    link: message.link || null,
  };
}

/**
 * Google Chatに送信する本文を組み立てる。
 *
 * mentionAllはitem.chat.mentionAllを優先し、未設定時はconfig.chat.mentionAllを使用する。
 *
 * @param {Object} item reminder項目
 * @param {Object} config 実行時設定
 * @returns {string}
 */
function composeMessage(item, config) {
  const chatConfig = config.chat || {};
  const content = resolveMessage(item);
  const blocks = [];

  const mentionAll =
      item.chat && typeof item.chat.mentionAll === 'boolean'
          ? item.chat.mentionAll
          : chatConfig.mentionAll;

  if (mentionAll) {
    blocks.push('<users/all>');
  }

  content.bodyLines.forEach(function (line) {
    const text = String(line).trim();

    if (text) {
      blocks.push(text);
    }
  });

  if (content.deadlineText) {
    blocks.push('*期限：' + content.deadlineText + '*');
  }

  if (needsLinkLine(content.link)) {
    blocks.push(buildLinkLine(content.link));
  }

  const text = blocks.join('\n').trim();

  if (!text) {
    throw new Error('送信メッセージが空です。reminderId=' + (item.reminderId || ''));
  }

  return text;
}