# 設定の役割分担

## JSON — `src/core/app.config.html`

**単一 JSON ファイル**（中身は JSON。拡張子 `.html` は GAS 実行時読み込み用）。

**インフラ設定と、Sheet では表現できない固定項目のみ。**

| 区分 | 項目 | 説明 |
| ---- | ---- | ---- |
| グループ | groupId, groupName | 識別情報 |
| 配信 | dispatch.hour, minute, timezone | 毎日 19:00 に判定 |
| Chat | chat.webhookUrl, threadName, mentionAll | Webhook / Thread / @all |
| 各 reminder | enabled, bodyText, linkUrl, linkLabel | 本文・提出リンク |

`merge-config` 等のビルドステップは不要。編集後そのまま `clasp push`。

## Sheet — 3 タブ

| タブ | 列 | 対応 reminder |
| ---- | -- | ------------- |
| `weekly` | description, deadlineText | weeklyReport |
| `monthly` | reminderId, description, dayOfMonth, deadlineText | documentEarly / documentFinal / reportEarly |
| `lastDayOfMonth` | description, deadlineText | reportFinal |
