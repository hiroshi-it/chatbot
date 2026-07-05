/**
 * 配信パイプラインの入口関数。
 *
 * GASTriggerおよび手動実行からrunDispatchPipelineを呼び出す。
 * ビジネスロジックはDispatchPipeline側に集約する。
 */

/**
 * Trigger入口（正式送信）。
 *
 * 時間主導型Triggerはこの関数にバインドする。
 * dryRun=falseのため、送信対象がある場合はGoogle Chatへ実際に送信する。
 */
function dailyReminderDispatcher() {
    runDispatchPipeline({dryRun: false});
}

/**
 * 手動実行用の正式送信入口。
 *
 * dailyReminderDispatcherの別名。GASエディタから手動で本番送信する場合に使用する。
 */
function runDailyDispatch() {
    dailyReminderDispatcher();
}

/**
 * ドライラン入口。
 *
 * 設定読込・日付判定・メッセージ組み立てまで実行し、Google Chatへの送信は行わない。
 */
function dryRunDispatch() {
    runDispatchPipeline({dryRun: true});
}

/**
 * 即時テスト入口（送信なし）。
 *
 * dryRunDispatchと同様、誤送信を避けるためdryRun=trueとする。
 * 実際に送信する場合はrunDailyDispatch()を使用する。
 */
function testDispatchNow() {
    runDispatchPipeline({dryRun: true});
}