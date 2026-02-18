# Claude Code公式機能調査 — claude-praxis改善計画

## このドキュメントの目的

claude-praxisの既知の課題（スキル遵守の信頼性、完了検証の強制力不足、コンテキスト消費量）に対して、Claude Codeの公式機能のうち未活用のものを特定し、改善方針を定める。

調査日: 2026-02-18

## 調査の背景

claude-praxis v0.4.0は、hooks・skills・commandsを組み合わせてAI支援開発のワークフローを構造化している。本ドキュメント作成時点では以下の課題があった。

1. **完了検証ゲートに強制力がない** — `verification-before-completion`はテキスト指示のみで、証拠なしの完了宣言をブロックできない
2. **サブエージェントがスキルを読まない** — Task toolで起動されるサブエージェントに品質ルールが届かない
3. ~~**PreToolUseフックのgrep検出が脆弱** — トランスクリプトJSONLのフォーマット前提が実際の構造と不一致~~ → **解決済み**（セッションマーカー方式に全面移行。後述）
4. **コンテキスト消費量が大きい** — 大量の指示がCRITICALルールを希釈している

## 制約条件

claude-praxisはプラグインとして独立配布される。プラグインが配布できるのは以下のディレクトリのみ。

- `skills/` — スキル定義
- `commands/` — コマンド定義
- `agents/` — カスタムサブエージェント定義
- `hooks/hooks.json` — フック設定

プロジェクトローカル機能（`.claude/rules/`、`.claude/settings.json`など）はプラグインに含められないため、改善手段から除外する。

---

## 調査結果: 未活用のClaude Code公式機能

### Hook System（現在4種 → 最大14種利用可能）

claude-praxisが現在使用しているフックは4つ（SessionStart、PreCompact、PreToolUse、PostToolUse）。公式には14種類のイベントが存在する。

| フックイベント | 現状 | 活用可能性 |
|---|---|---|
| SessionStart | 使用中（getting-started注入 + マーカークリーンアップ） | — |
| PreCompact | 使用中 | — |
| PreToolUse | 使用中（ファイルタイプ別スキルゲート） | Prompt Hook化でさらに信頼性向上の余地あり |
| PostToolUse | **使用中（Skill呼び出し記録）** | バックグラウンド品質チェック追加も可能 |
| **Stop** | 未使用 | 完了検証ゲートの強制 |
| **TaskCompleted** | 未使用 | タスク完了時の自動検証 |
| **SubagentStart** | 未使用 | サブエージェントへのルール注入 |
| **PostToolUseFailure** | 未使用 | テスト失敗時のデバッグ提案 |
| **UserPromptSubmit** | 未使用 | Phase Detection自動化 |
| SubagentStop | 未使用 | 低優先度（結果検証） |
| Notification | 未使用 | 適用場面なし |
| PermissionRequest | 未使用 | 適用場面なし |
| TeammateIdle | 未使用 | Agent Teams安定後に検討 |
| SessionEnd | 未使用 | コンテキスト永続化の強化に検討 |

### Hook Types（現在1種 → 3種利用可能）

claude-praxisの全フックは`type: "command"`（シェルスクリプト実行）のみを使用している。公式には3種類のフックタイプが存在する。

| Hookタイプ | 説明 | 現状 |
|---|---|---|
| `type: "command"` | シェルスクリプト実行 | 使用中（全フックがこれ） |
| `type: "prompt"` | LLMにyes/no判断をさせる | **未使用** |
| `type: "agent"` | サブエージェントを起動して検証 | **未使用** |

Prompt Hookはセマンティックな判断が可能。「このコード編集前にTDDプロセスに従っているか？」のような質問をLLMに投げ、yes/noで判定する。grepベースの文字列マッチングより信頼性が高いが、LLM呼び出しのコストとレイテンシが発生する。

Agent Hookはサブエージェントを起動して検証を行う。PostToolUseでのコードレビュー自動実行などに使える。

### Async Hooks

`async: true`を指定するとフックがバックグラウンドで実行され、メインフローをブロックしない。PostToolUseでlint/typecheckを非同期実行する用途に適する。

### Custom Subagents（`agents/`ディレクトリ）

プラグインの`agents/`ディレクトリでカスタムサブエージェントを配布できる。YAML frontmatterで以下を定義する。

- `skills` — プリロードするスキル（コンテキストに自動注入）
- `model` — 使用モデル（sonnet/opus/haiku/inherit）
- `tools` / `disallowedTools` — 使用可能ツールの制限
- `permissionMode` — 権限モード
- `maxTurns` — 最大ターン数
- `hooks` — エージェント固有のフック

スキルのプリロードにより、「検出してブロック」ではなく「構造的にスキップ不可能」な品質ルール適用が実現する。

### CLAUDE_ENV_FILE

SessionStartフックで環境変数を`CLAUDE_ENV_FILE`に書き出すと、後続の全フックで参照可能。フック間の状態共有に使える。

### Skill Frontmatter: `context: fork`

スキルを独立したサブエージェントコンテキストで実行する設定。`compound`（学習抽出）のようなメインコンテキストを汚染したくない処理に適する。

### Agent Teams（experimental）

ネイティブのマルチエージェント協調機能。リード/ワーカーモデル、メールボックスシステム、共有タスクリストがビルトイン。現在は`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`が必要。`agent-team-execution`スキルの将来的な移行先候補。

---

## 調査中に発見した問題とその解決: トランスクリプト検出の不具合

本調査の過程で、`check-skill-gate.sh`のSkill呼び出し検出が**常に失敗する**不具合を実証した。

**原因**: スクリプトはトランスクリプトJSONLのトップレベルに`content`フィールドがあると仮定していたが、実際の構造は`message.content`にネストされていた。

**教訓**: Claude Codeのトランスクリプト形式は内部仕様であり、バージョンアップで変更される可能性がある。外部フォーマットに依存する検出は本質的に脆弱。

### 解決策: セッションマーカー方式への全面移行（実装済み）

トランスクリプトJSONLへの依存を完全に排除し、以下の方式に移行した。

1. **PostToolUse hook（`mark-skill-invoked.sh`）**: Skill tool呼び出し後に`/tmp/claude-praxis-markers/$SESSION_ID`にスキル名を記録
2. **PreToolUse hook（`check-skill-gate.sh`）**: Edit/Write/MultiEdit前にマーカーファイルを確認し、必要なスキルが呼び出し済みか検証
3. **SessionStart hook（`session-start.sh`）**: セッション開始時にマーカーファイルをクリーンアップ

さらに、スキルゲートを**ファイルタイプ別**に拡張した:
- **コードファイル**（.ts, .py, .shなど） → `code-quality-rules`が必須
- **ドキュメントファイル**（.md, .txtなど） → `document-quality-rules`が必須
- **設定/データファイル**（.json, .yaml, .tomlなど） → ゲートなし（許可）

この方式により、トランスクリプト形式への依存がゼロになり、Claude Codeのバージョンアップによる破壊リスクが解消された。

---

## 改善方針

### ~~方針1: Stop Hookによる完了検証ゲートの強制~~ — 実装済み

**解決する課題**: 証拠なしの完了宣言がブロックされない

**採用した方式**: `type: "prompt"`ではなく、`type: "command"`のカウンター方式を採用。

当初はPrompt Hook（LLMによるセマンティック判断）を検討したが、Stop hookのstdinにはレスポンス本文が含まれないため、LLMが証拠の有無を判定できない。`type: "agent"`ならトランスクリプトをReadで読めるが、毎回60秒のサブエージェント起動はコストが重い。

そこでカウンター方式を採用した。セッションマーカーファイル（`$SESSION_ID-stop-blocks`）でブロック回数を管理し、最大2回ブロック後に安全弁として許可する。

**実装内容**:
- `hooks/stop-verification-gate.sh`: カウンター方式のStop hook（1回目: 「検証を実行してください」、2回目: 「まだ証拠がありません」、3回目以降: 許可）
- `hooks/hooks.json`: Stopイベントの定義追加
- `hooks/session-start.sh`: セッション開始時にカウンターをクリーンアップ
- `tests/stop-verification-gate.test.sh`: 7テスト16アサーション、全パス

### ~~方針2: Custom Subagentsによる構造的スキル遵守~~ — 実装済み

**解決する課題**: サブエージェントがスキルを読まずに動作する

**採用した方式**: `agents/`ディレクトリに3つの専用エージェントを定義。`skills`フィールドでスキル全文をコンテキストにプリロードする。

**実装したエージェント**:

| エージェント | skills | model | 特徴 |
|---|---|---|---|
| **implementer** | code-quality-rules, verification-before-completion | inherit | TDD必須、Write/Edit可、Task不可（ネスト防止） |
| **reviewer** | code-quality-rules | inherit | 読み取り専用（Write/Edit/MultiEdit禁止） |
| **researcher** | なし | haiku | 軽量リサーチ、読み取り専用 |

**設計判断**:
- `skills`フィールドはスキル全文をコンテキストに注入する（参照ではなく完全注入）。これにより「スキルを読み飛ばす」リスクがゼロになる
- サブエージェントはサブエージェントを起動できない（Claude Code制約）ため、全エージェントで`Task`を`disallowedTools`に指定
- `subagent-driven-development`スキルの「コントローラーがTask toolでサブエージェントを起動する」フローはそのまま維持。エージェント定義がそのサブエージェントの品質を構造的に保証する

### ~~方針3: PreToolUseフックのPrompt Hook化~~ — 解決済み

**解決する課題**: grepベースのスキル検出が脆弱（本調査で実証済み）

**解決方法**: Prompt Hook化ではなく、**セッションマーカー方式**で解決した。PostToolUseフック（`mark-skill-invoked.sh`）でスキル呼び出しをマーカーファイルに記録し、PreToolUseフック（`check-skill-gate.sh`）でマーカーを確認する方式に移行。

この方式のメリット:
- LLM呼び出しコストがゼロ（`type: "command"`のまま）
- トランスクリプト形式への依存がゼロ
- ファイルタイプ別ゲート（コード/ドキュメント/設定）も同時に実現

### 方針4: TaskCompleted Hookによるタスク完了時の自動検証 — 高優先

**解決する課題**: TodoWriteでタスク完了マーク後に検証が抜ける

**方針**: TaskCompletedフックで`type: "command"`のスクリプトを実行し、直近のtypecheck/lint/test結果が存在するか確認する。

**検討事項**:
- TaskCompletedフックのstdinに何が渡されるか確認が必要（タスク名、タスク内容など）
- 「テスト」タスクと「リサーチ」タスクで検証基準が異なる — タスク名に応じた分岐が必要か
- `type: "agent"`にしてサブエージェントに検証を委任する案もある

### 方針5: SubagentStart Hookによるルール注入 — 中優先

**解決する課題**: 方針2のCustom Subagentsでカバーできない場合の補完

**方針**: SubagentStartフックで、起動されるサブエージェントのadditionalContextにcode-quality-rulesの要約を注入する。

**検討事項**:
- Custom Subagentsの`skills`プリロードが機能すれば不要になる可能性がある
- 方針2の検証結果を見てから着手すべき

### 方針6: Async Hooksによるバックグラウンド品質チェック — 中優先

**解決する課題**: 品質チェックがメインフローをブロックする

**方針**: PostToolUseに`async: true`のフックを追加し、コード変更後にバックグラウンドでlint/typecheckを実行する。結果は`CLAUDE_ENV_FILE`経由で後続フックに渡す。

**注記**: PostToolUseフックは既に`mark-skill-invoked.sh`で使用開始している。同イベントに非同期の品質チェックフックを追加する形になる。

**検討事項**:
- 非同期結果をいつ・どうフィードバックするかの設計が必要
- プロジェクトごとにlint/typecheckコマンドが異なる — 汎用性の確保

### 方針7: UserPromptSubmit HookによるPhase Detection自動化 — 中優先

**解決する課題**: Phase Detectionがテキスト指示のみに依存

**方針**: UserPromptSubmitフックで、ユーザー入力を分析し適切な`/claude-praxis:`コマンドの提案をadditionalContextに注入する。

**検討事項**:
- `type: "prompt"`を使えばLLMがフェーズを判断できるが、コストが毎プロンプトに発生する
- `type: "command"`でキーワードベースの粗い分類をする方が現実的かもしれない
- getting-startedスキルのPhase Detection指示と重複しないよう整理が必要

---

## 着手順序（更新版）

```
✅ 完了
├── 方針3: PreToolUseスキルゲート → セッションマーカー方式で解決
├── PostToolUse hook追加（mark-skill-invoked.sh）
├── ファイルタイプ別ゲート（コード/ドキュメント/設定の分岐）
├── document-quality-rulesスキル新規作成
├── 方針1: Stop Hook → カウンター方式で実装（stop-verification-gate.sh）
└── 方針2: Custom Subagents → agents/に3エージェント定義（implementer, reviewer, researcher）

Phase 2（高優先 — タスク完了検証）
└── 方針4: TaskCompleted Hook（タスク完了検証）

Phase 3（中優先 — 補完的改善）
├── 方針5: SubagentStart Hook（方針2の結果次第）
├── 方針6: Async Hooks（バックグラウンドチェック）
└── 方針7: UserPromptSubmit Hook（Phase Detection）

将来（Agent Teams安定後）
└── agent-team-executionのネイティブAgent Teams移行
```

## 次のアクション

1. ~~Stop HookとCustom Subagentsの公式ドキュメントを精読し、プラグインでの制約を確認する~~ → 完了（両方プラグインで利用可能）
2. ~~方針1のプロトタイプを実装し、動作検証する~~ → 完了（カウンター方式で実装、テスト全パス）
3. ~~方針2（Custom Subagents）のエージェント定義を実装する~~ → 完了（3エージェント定義）
4. 実プロジェクトで動作検証し、Phase 2の方針を確定する
