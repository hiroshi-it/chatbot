# 設定の役割分担



## JSON — `config/app.config.json`

**インフラ設定と、Sheet では表現できない固定項目のみ。**

| 区分 | 項目 | 説明 |
| ---- | ---- | ---- |
| グループ | groupId, groupName | 識別情報 |
| 配信 | dispatch.hour, minute, timezone | 毎日 19:00 に判定 |
| Chat | chat.webhookUrl, threadName, mentionAll | Webhook / Thread / @all |
| 各 reminder | enabled, bodyText, linkUrl, linkLabel | 本文・提出リンク |



## Sheet — 3 タブ

| タブ | 列 | 対応 reminder |
| ---- | -- | ------------- |
| `weekly` | description, deadlineText | weeklyReport |
| `monthly` | reminderId, description, dayOfMonth, deadlineText | documentEarly / documentFinal / reportEarly |
| `lastDayOfMonth` | description, deadlineText | reportFinal |


