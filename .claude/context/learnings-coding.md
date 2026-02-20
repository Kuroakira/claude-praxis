# Learnings — Coding Level

実装パターン・品質ルールの学び。implement, debug, review, planフェーズで参照される。

## SessionStart経路はgraceful degradation、gate経路はdeny-by-default

- **Learning**: パース失敗時のエラー戦略は経路の性質で使い分ける。SessionStartのようなnon-blocking経路ではgraceful degradation（失敗→デフォルト値→続行）、PreToolUseのようなgate経路ではdeny-by-default（失敗→ブロック→可視化）
- **Context**: confidence-parserの`parseConfirmed`は不正フォーマットでnullを返し、呼び出し元は確認回数0として扱う。SessionStart通知が中断するとセッション全体が影響を受けるため。一方、check-skill-gate.shではJSON parse失敗時にexit 2（deny）を返す
- **Implication**: 新しいhook機能を追加する際、その経路がblocking（gate）かnon-blocking（通知）かで、エラー戦略を判断する
- **Confirmed**: 2回 | 2026-02-20 | implement

## Type guardはインターフェースの全フィールドを検証する（ネスト含む）

- **Learning**: TypeScriptのtype guardは、対象インターフェースが宣言する全フィールドを検証しなければならない。トップレベルのプリミティブだけ検証してネストされたオブジェクトを省略すると、guardを通過した後のプロパティアクセスで実行時エラーになる
- **Context**: `isLastCompact`が`timestamp`と`compoundRun`だけ検証し、`progressSummary`と`confidenceSummary`を省略していた。破損ファイルがguardを通過し、`session-start.ts`で`progressSummary.recentHeadings`にアクセスして実行時エラーの可能性があった。修正: `isRecord(data.progressSummary)`でネストオブジェクトの存在と型を検証
- **Implication**: type guardを書く際のチェックリスト: (1) 全トップレベルフィールドの型チェック (2) ネストされたオブジェクトは`isRecord`で存在確認 (3) ネスト内の必須フィールドも型チェック

## Claude Code hookの出力形式: blockingは`decision: "block"`, non-blockingは`additionalContext`

- **Learning**: Claude Code hookシステムでは、blocking出力（`{ decision: "block", reason: "..." }`）とnon-blocking advisory（`{ hookSpecificOutput: { additionalContext: "..." } }`）は明確に異なる出力形式。同一hookスクリプト内で両方を使う場合、パスを分離して混在させない
- **Context**: stop-verification-gateで検証ゲート（blocking）と/compound提案（non-blocking）を1スクリプトに実装。最初にblocking判定を行い`process.exit(0)`で終了、その後にnon-blocking advisoryを判定する構造にした。blockingパスを通過した場合のみadvisoryに到達する
- **Implication**: 1つのhookスクリプトに複数の責務を持たせる場合、blocking判定を先に配置し早期exitで分離する。non-blocking advisoryはblockingを通過した後にのみ実行される
