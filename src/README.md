# src — GASソースコード

`clasp push` の対象ディレクトリ（`.clasp.json` → `rootDir: src`）

## レイヤー構成

| レイヤー | ディレクトリ | 役割 |
|----|------|------|
| **core** | `core/` | Script Propertiesキー名、reminderId定義、JSON固定設定読込、共通ユーティリティ |
| **domain** | `domain/` | 日付判定、メッセージ組み立て（外部IOなし） |
| **infrastructure** | `infrastructure/` | Google Sheet読込、JSON+Sheet合成、Google Chat送信 |
| **pipeline** | `pipeline/` | Trigger入口、共通実行パス、設定検証、手動運用 |

## ファイル一覧

### core/

| ファイル | 説明 |
|------|------|
| `ScriptPropertyKeys.js` | `CONFIG_SHEET_ID`、`CHAT_WEBHOOK_URL`などのScript Propertiesキー名 |
| `constants/ReminderTypes.js` | reminderId + scheduleType定義 |
| `AppConfig.js` | `app.config.html`を読み込み、JSON固定設定として返す |
| `app.config.html` | 固定JSON設定（bodyText、dispatch、chatデフォルト値など。本番WebhookはScript Properties） |
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
| `sheet/SheetReader.js` | weekly / monthly / lastDayOfMonthを読み込み |
| `sheet/ConfigBuilder.js` | JSON固定設定 + Sheet運用設定 → runtime config |
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

## 関連設定ドキュメント

| パス | 説明 |
|------|------|
| `../config/sheet-schema/FIELDS.md` | Sheet項目定義 |
| `../config/sheet-schema/examples/*.csv` | Sheet入力例 |