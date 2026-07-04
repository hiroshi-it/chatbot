/**
 * オブジェクト内の「_」で始まるメタキーを再帰的に除去する。
 *
 * JSONは標準仕様上コメントを持てないため、設定ファイル内では
 * 「_comment」や「_memo」のようなキーを説明用メタ情報として使用する。
 * この関数は、実行時設定として不要なメタ情報を取り除くために使用する。
 *
 * @param {*} value 任意の値
 * @returns {*} 「_」で始まるメタキーを除去した値
 */
function stripMetaKeys(value) {
  if (Array.isArray(value)) {
    return value.map(stripMetaKeys);
  }
  if (value !== null && typeof value === 'object') {
    const result = {};
    Object.keys(value).forEach(function (key) {
      if (key.charAt(0) === '_') {
        return;
      }
      result[key] = stripMetaKeys(value[key]);
    });
    return result;
  }
  return value;
}

/**
 * 本文テキストを行単位に分割する。
 *
 * 空文字、null、undefinedの場合は空配列を返す。
 * 各行は前後の空白を除去し、空行は除外する。
 *
 * Google Chatのカード本文やテキスト本文を生成する際に、
 * 複数行のbodyTextを扱いやすくするために使用する。
 *
 * @param {string} [bodyText] 本文テキスト
 * @returns {string[]} 空行を除外した本文行配列
 */
function parseBodyTextLines(bodyText) {
  if (bodyText === undefined || bodyText === '') {
    return [];
  }
  return String(bodyText)
    .split('\n')
    .map(function (line) {
      return String(line).trim();
    })
    .filter(function (line) {
      return line !== '';
    });
}
