# 設定項目 — `src/core/app.config.html`

すべての reminder 設定（文案・日程・期限）はこの JSON ファイルで管理する。

## 共通

| 区分 | 項目 | 説明 |
| ---- | ---- | ---- |
| グループ | groupId, groupName | 識別情報 |
| 配信 | dispatch.hour, minute, timezone | 毎日の判定時刻（例: 19:00 JST） |
| Chat | chat.webhookUrl, threadName, mentionAll | 本番 Webhook は Script Properties `CHAT_WEBHOOK_URL` を優先 |

## 各 reminder（`reminders` オブジェクト）

| reminderId | scheduleType | 必須項目 |
| ---------- | ------------ | -------- |
| weeklyReport | weekly（送信曜日はコード固定・金曜） | description, bodyText, deadlineText, enabled, linkUrl, linkLabel |
| documentEarly / documentFinal / reportEarly | monthly | description, bodyText, dayOfMonth, deadlineText, enabled, linkUrl, linkLabel |
| reportFinal | lastDayOfMonth | description, bodyText, deadlineText, enabled, linkUrl, linkLabel |

送信本文の優先順位：**bodyText → description**（bodyText が空のとき description を本文に使う）

## 改行の書き方（JSON）

JSON の文字列内では、**実際の改行（Enter）をそのまま入れられない**。改行したい場合は **`\n`** を使う。

| フィールド | `\n` の効果 | 推奨 |
| ---------- | ----------- | ---- |
| `bodyText` | **有効**。`parseBodyTextLines` で行に分割され、Chat メッセージで複数行になる | 複数行本文は `\n` で区切る |
| `deadlineText` | 1 行として扱われる。`\n` はそのまま文字として送られる可能性あり | 1 行で書く |
| `linkLabel` | リンク表示名は `<URL\|表示名>` の 1 行。`\n` では見た目の改行にならない | 1 行で書く |

例（`bodyText` で 2 行）:

```json
"bodyText": "月次シフト表の提出をお願いします。\n期限前にご確認ください。"
```

`linkLabel` に長い説明を入れたい場合は、改行せず 1 行にまとめるか、説明は `bodyText` 側に書く。

## Script Properties（機密・環境依存のみ）

| キー | 説明 |
| ---- | ---- |
| `CHAT_WEBHOOK_URL` | Google Chat Webhook URL |
| `CHAT_THREAD_NAME` | 返信先 threadName（任意） |

## 入力例

`src/core/app.config.html` を参照。
