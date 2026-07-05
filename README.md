# chatbot-hiroshi-it

Google Chat定期リマインドBot（Google Apps Script + Google Sheet設定）

## ディレクトリ構成

| ディレクトリ | 用途 |
|-------------|------|
| [`src/`](src/README.md) | GASソースコード（clasp push対象） |
| [`config/sheet-schema/`](config/sheet-schema/FIELDS.md) | Sheet項目定義と入力例 |
| [`docs/design/`](docs/design/详细设计文档.md) | 設計ドキュメント |

## クイックスタート

1. `config/sheet-schema/FIELDS.md`に従ってGoogle Sheetを作成する
2. `src/core/app.config.html`で固定設定を編集する
3. Script Propertiesに`CONFIG_SHEET_ID`を設定する
4. 本番環境ではScript Propertiesに`CHAT_WEBHOOK_URL`を設定する
5. `clasp push`を実行する
6. GAS上で`setupDispatchTrigger()`を実行し、Triggerを登録する
7. `dryRunDispatch()`で設定と送信対象を確認する
8. 必要に応じて`sendTestToSpace()`または`sendTestToThread()`で送信確認を行う

## アーキテクチャ概要

```text
app.config.html（JSON固定設定）
+ Google Sheet（運用設定）
+ Script Properties（環境依存値・機密情報）
        ↓
ConfigBuilder
        ↓
runtime config
        ↓
dailyReminderDispatcher
        ↓
Google Chat
````

## 設定の役割分担

### JSON — `src/core/app.config.html`

**単一JSON設定ファイル**です。
拡張子は`.html`ですが、GAS実行時に読み込むための都合であり、中身はJSONとして扱います。

JSON側では、Git管理してよい固定設定を管理します。

| 区分        | 項目                                                 | 説明              |
| --------- | -------------------------------------------------- | --------------- |
| グループ      | groupId, groupName                                 | 識別情報            |
| 配信        | dispatch.hour, dispatch.minute, dispatch.timezone  | 毎日の判定時刻         |
| Chat      | chat.threadName, chat.mentionAll                   | Chat送信のデフォルト設定  |
| 各reminder | enabled, bodyText, linkEnabled, linkUrl, linkLabel | reminderごとの固定設定 |

本番環境の`CHAT_WEBHOOK_URL`はScript Propertiesで管理します。
Git管理対象のJSONには本番Webhook URLを記載しません。

### Sheet — 3タブ

Sheet側では、運用時に変更される項目のみを管理します。

| タブ               | 列                                                 | 対応reminder                                  |
| ---------------- | ------------------------------------------------- | ------------------------------------------- |
| `weekly`         | description, deadlineText                         | weeklyReport                                |
| `monthly`        | reminderId, description, dayOfMonth, deadlineText | documentEarly / documentFinal / reportEarly |
| `lastDayOfMonth` | description, deadlineText                         | reportFinal                                 |

### Script Properties

環境依存値および機密情報はScript Propertiesで管理します。

| キー                 | 説明                      |
| ------------------ | ----------------------- |
| `CONFIG_SHEET_ID`  | 設定用Google SheetのID      |
| `CHAT_WEBHOOK_URL` | Google Chat Webhook URL |
| `CHAT_THREAD_NAME` | 返信先threadName。必要な場合のみ設定 |

## 実行フロー

```text
dailyReminderDispatcher
  → loadRuntimeConfig
  → validateConfig
  → filterDueToday
  → composeMessage
  → sendChatMessage
```

## 補足

### イメージ

```mermaid
flowchart LR
  JSON["app.config.html<br/>固定設定"]
  SHEET["Google Sheet<br/>運用設定"]
  PROPS["Script Properties"]
  BUILDER["ConfigBuilder"]
  CONFIG["runtime config"]
  PIPELINE["DispatchPipeline"]
  CHAT["ChatService"]

  JSON --> BUILDER
  SHEET --> BUILDER
  PROPS -->|"CONFIG_SHEET_ID"| BUILDER
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
    APP_CONFIG["app.config.html<br/>JSON固定設定"]
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

  subgraph SHEET["Google Sheet"]
    WEEKLY["weekly"]
    MONTHLY["monthly"]
    LASTDAY["lastDayOfMonth"]
  end

  subgraph PROPS["Script Properties"]
    SHEET_ID["CONFIG_SHEET_ID"]
    WEBHOOK["CHAT_WEBHOOK_URL"]
    THREAD["CHAT_THREAD_NAME"]
  end

  CHAT_SPACE["Google Chat Space"]

  SRC --> GAS
  APP_CONFIG --> BUILDER
  SHEET_ID --> BUILDER
  WEEKLY --> BUILDER
  MONTHLY --> BUILDER
  LASTDAY --> BUILDER

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
  participant Sheet as SheetReader
  participant Validator as ConfigValidator
  participant Matcher as ScheduleMatcher
  participant Chat as ChatService
  participant Message as MessageBuilder
  participant Space as Google Chat

  Trigger->>Entry: dailyReminderDispatcher()
  Entry->>Pipeline: runDispatchPipeline({dryRun:false})

  Pipeline->>Builder: loadRuntimeConfig()
  Builder->>AppConfig: getAppConfig()
  AppConfig-->>Builder: JSON固定設定
  Builder->>Sheet: loadSheetOverrides()
  Note over Sheet: CONFIG_SHEET_ID を Script Properties から参照
  Sheet-->>Builder: Sheet運用設定
  Builder->>Builder: mergeAppConfigWithSheet()
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

### 設定合成イメージ

```mermaid
flowchart TD
  JSON["app.config.html<br/>group / dispatch / chat / bodyText / link / enabled"]
  SHEET["Google Sheet<br/>description / deadlineText / dayOfMonth"]
  PROPS["Script Properties<br/>CONFIG_SHEET_ID"]

  READER["SheetReader"]
  BUILDER["ConfigBuilder"]
  RUNTIME["runtime config<br/>reminders[]"]

  JSON --> BUILDER
  PROPS --> READER
  SHEET --> READER
  READER --> BUILDER
  BUILDER --> RUNTIME

  RUNTIME --> FILTER["filterDueToday"]
  FILTER --> SEND["sendReminderItem"]
  SEND --> MSG["composeMessage"]
  SEND --> HOOK["resolveWebhookUrl / resolveThreadName"]
  HOOK --> POST["sendChatMessage"]
```
