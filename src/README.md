# src — GASソースコード

`clasp push` の対象ディレクトリ（`.clasp.json` → `rootDir: src`）

## レイヤー構成

| レイヤー | ディレクトリ | 役割 |
|----|------|------|
| **core** | `core/` | Script Propertiesキー名、reminderId定義、JSON設定読込、共通ユーティリティ |
| **domain** | `domain/` | 日付判定、メッセージ組み立て（外部IOなし） |
| **infrastructure** | `infrastructure/` | JSONからruntime config生成、Google Chat送信 |
| **pipeline** | `pipeline/` | Trigger入口、共通実行パス、設定検証、手動運用 |

## ファイル一覧

### core/

| ファイル | 説明 |
|------|------|
| `ScriptPropertyKeys.js` | `CHAT_WEBHOOK_URL` などの Script Properties キー名 |
| `constants/ReminderTypes.js` | reminderId + scheduleType定義 |
| `AppConfig.js` | `app.config.html`を読み込み、JSON設定として返す |
| `app.config.html` | 全設定（文書・日程・dispatch・chat デフォルト。本番 Webhook は Script Properties） |
| `utils/ConfigUtils.js` | 設定関連の共通ユーティリティ |
| `utils/DateUtils.js` | 日付関連の共通ユーティリティ |

### domain/

| ファイル | 説明 |
|------|------|
| `schedule/ScheduleMatcher.js` | 今日がscheduleに該当するかを判定 |
| `message/MessageBuilder.js` | Google Chat送信用本文を組み立て |

### infrastructure/

| ファイル | 説明 |
|------|------|
| `config/ConfigBuilder.js` | `app.config.html` → runtime config |
| `chat/ChatService.js` | Google Chat Webhook送信 |

### pipeline/

| ファイル | 説明 |
|------|------|
| `DispatchPipeline.js` | 共通実行パス READ→VALIDATE→JUDGE→SEND |
| `DispatchEntry.js` | `dailyReminderDispatcher`（Trigger入口） |
| `ConfigValidator.js` | runtime config検証 |
| `TriggerSetup.js` | Trigger登録・再作成 |
| `ManualOps.js` | 手動テスト、補足送信、dryRun |

### ルート

| ファイル | 説明 |
|------|------|
| `appsscript.json` | GASプロジェクトmanifest |

## 関連ドキュメント

| パス | 説明 |
|------|------|
| `../config/FIELDS.md` | `app.config.html` 項目定義・改行の書き方 |
| `../docs/architecture/PATH.md` | ディレクトリ構成とデータフロー |
| `../docs/design/详细设计文档.md` | 詳細設計（中国語） |

## 設定メモ

- 文案・日程はすべて `core/app.config.html` で管理する
- `bodyText` の複数行は JSON 内で `\n` を使う（`linkLabel` では改行にならない）
