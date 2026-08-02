# chatbot-hiroshi-it

Google Chat定期リマインドBot（Google Apps Script + `app.config.html` 設定）

## ディレクトリ構成

| ディレクトリ | 用途 |
|-------------|------|
| [`src/`](src/README.md) | GASソースコード（clasp push対象） |
| [`config/`](config/FIELDS.md) | `app.config.html` 項目定義・改行の書き方 |
| [`docs/architecture/PATH.md`](docs/architecture/PATH.md) | ディレクトリ構成 |
| [`docs/design/详细设计文档.md`](docs/design/详细设计文档.md) | 詳細設計（中国語） |

## クイックスタート

1. `src/core/app.config.html` で文案・日程・配信時刻を編集する
2. 本番環境では Script Properties に `CHAT_WEBHOOK_URL` を設定する
3. `clasp push` を実行する
4. GAS 上で `setupDispatchTrigger()` を実行し、Trigger を登録する
5. `dryRunDispatch()` で設定と送信対象を確認する
6. 必要に応じて `sendTestToSpace()` または `sendTestToThread()` で送信確認を行う

## アーキテクチャ概要

```text
app.config.html（全設定）
+ Script Properties（環境依存値・機密情報）
        ↓
ConfigBuilder
        ↓
runtime config
        ↓
dailyReminderDispatcher
        ↓
Google Chat
```

## 設定の役割分担

### JSON — `src/core/app.config.html`

**単一JSON設定ファイル**です。
拡張子は `.html` ですが、GAS 実行時に読み込むための都合であり、中身は JSON として扱います。

| 区分 | 項目 | 説明 |
| ---- | ---- | ---- |
| グループ | groupId, groupName | 識別情報 |
| 配信 | dispatch.hour, dispatch.minute, dispatch.timezone | 毎日の判定時刻 |
| Chat | chat.threadName, chat.mentionAll | Chat 送信のデフォルト（Webhook は Script Properties） |
| 各 reminder | enabled, description, bodyText, deadlineText, dayOfMonth, linkUrl, linkLabel | reminder ごとの文案・日程 |

本番環境の `CHAT_WEBHOOK_URL` は Script Properties で管理します。
Git 管理対象の JSON には本番 Webhook URL を記載しません。

週報の送信曜日（金曜）はコード固定（`WEEKLY_REPORT_DAY_OF_WEEK`）で、JSON からは変更できません。

#### 改行（`bodyText` など）

JSON 文字列内の **`\n`** は、パース後に実際の改行文字になる。

- **`bodyText`**：`parseBodyTextLines` で行分割され、Google Chat で複数行表示される（推奨）
- **`linkLabel` / `deadlineText`**：1 行想定。`\n` ではリンク表示名の改行にはならない

詳細は [`config/FIELDS.md`](config/FIELDS.md) を参照。

### Script Properties

環境依存値および機密情報は Script Properties で管理します。

| キー | 説明 |
| ---- | ---- |
| `CHAT_WEBHOOK_URL` | Google Chat Webhook URL |
| `CHAT_THREAD_NAME` | 返信先 threadName。必要な場合のみ設定 |

## 実行フロー

```text
dailyReminderDispatcher
  → loadRuntimeConfig
  → validateConfig
  → filterDueToday
  → sendReminderItem
  → sendChatMessage
```

## 補足

### イメージ

```mermaid
flowchart LR
  JSON["app.config.html<br/>全設定"]
  PROPS["Script Properties"]
  BUILDER["ConfigBuilder"]
  CONFIG["runtime config"]
  PIPELINE["DispatchPipeline"]
  CHAT["ChatService"]

  JSON --> BUILDER
  BUILDER --> CONFIG
  CONFIG --> PIPELINE
  PIPELINE --> CHAT
  PROPS -->|"CHAT_WEBHOOK_URL<br/>CHAT_THREAD_NAME"| CHAT
  CHAT --> SPACE["Google Chat"]
```

### 全体構成図

```mermaid
flowchart TD
  subgraph Git["Git管理"]
    SRC["src/<br/>GASソースコード"]
    APP_CONFIG["app.config.html<br/>全設定"]
    REMINDER_TYPES["ReminderTypes.js<br/>reminderId定義（参照用）"]
  end

  subgraph GAS["Google Apps Script"]
    TRIGGER["TriggerSetup<br/>setupDispatchTrigger"]
    ENTRY["DispatchEntry<br/>dailyReminderDispatcher"]
    PIPELINE["DispatchPipeline<br/>READ→VALIDATE→JUDGE→SEND"]
    BUILDER["ConfigBuilder"]
    VALIDATOR["ConfigValidator"]
    MATCHER["ScheduleMatcher"]
    MESSAGE["MessageBuilder"]
    CHAT["ChatService"]
  end

  subgraph PROPS["Script Properties"]
    WEBHOOK["CHAT_WEBHOOK_URL"]
    THREAD["CHAT_THREAD_NAME"]
  end

  CHAT_SPACE["Google Chat Space"]

  SRC --> GAS
  APP_CONFIG --> BUILDER

  TRIGGER -->|"毎日実行"| ENTRY
  ENTRY --> PIPELINE
  PIPELINE --> BUILDER
  BUILDER --> VALIDATOR
  VALIDATOR --> MATCHER
  MATCHER --> CHAT
  CHAT --> MESSAGE
  WEBHOOK --> CHAT
  THREAD --> CHAT
  CHAT --> CHAT_SPACE
```

### 配信処理シーケンス

```mermaid
sequenceDiagram
  autonumber

  participant Trigger as 時間主導型Trigger
  participant Entry as DispatchEntry
  participant Pipeline as DispatchPipeline
  participant Builder as ConfigBuilder
  participant AppConfig as AppConfig
  participant Validator as ConfigValidator
  participant Matcher as ScheduleMatcher
  participant Chat as ChatService
  participant Message as MessageBuilder
  participant Space as Google Chat

  Trigger->>Entry: dailyReminderDispatcher()
  Entry->>Pipeline: runDispatchPipeline({dryRun:false})

  Pipeline->>Builder: loadRuntimeConfig()
  Builder->>AppConfig: getAppConfig()
  AppConfig-->>Builder: app.config.html
  Builder->>Builder: buildRuntimeConfigFromApp()
  Builder-->>Pipeline: runtime config

  Pipeline->>Validator: validateConfig(config)
  Validator-->>Pipeline: errors[]

  alt 設定エラーあり
    Pipeline-->>Entry: {ok:false, errors}
  else 設定正常
    Pipeline->>Matcher: filterDueToday(config, today)
    Matcher-->>Pipeline: dueList

    alt 送信対象なし
      Pipeline-->>Entry: {ok:true, dueCount:0}
    else 送信対象あり
      loop dueList
        alt dryRun=true
          Pipeline->>Message: composeMessage(item, config)
          Message-->>Pipeline: text
          Pipeline->>Pipeline: Logger.log(text)
        else dryRun=false
          Pipeline->>Chat: sendReminderItem(item, config)
          Chat->>Message: composeMessage(item, config)
          Message-->>Chat: text
          Note over Chat: resolveWebhookUrl / resolveThreadName
          Chat->>Space: sendChatMessage()
          Space-->>Chat: HTTP 2xx
          Chat-->>Pipeline: response
        end
      end

      Pipeline-->>Entry: {ok, dueCount, successCount, failedCount}
    end
  end
```

### 設定生成イメージ

```mermaid
flowchart TD
  JSON["app.config.html<br/>group / dispatch / chat / reminders"]
  BUILDER["ConfigBuilder"]
  RUNTIME["runtime config<br/>reminders[]"]

  JSON --> BUILDER
  BUILDER --> RUNTIME

  RUNTIME --> FILTER["filterDueToday"]
  FILTER --> SEND["sendReminderItem"]
  SEND --> MSG["composeMessage"]
  SEND --> HOOK["resolveWebhookUrl / resolveThreadName"]
  HOOK --> POST["sendChatMessage"]
```
