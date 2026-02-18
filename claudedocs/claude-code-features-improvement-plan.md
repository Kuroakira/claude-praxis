# Claude Code公式機能調査 — claude-praxis改善計画

## このドキュメントの目的

claude-praxisの既知の課題（スキル遵守の信頼性、完了検証の強制力不足、コンテキスト消費量）に対して、Claude Codeの公式機能のうち未活用のものを特定し、改善方針を定める。

調査日: 2026-02-18

## 調査の背景

claude-praxis v0.4.0は、hooks・skills・commandsを組み合わせてAI支援開発のワークフローを構造化している。しかし、以下の課題が残っている。

1. **完了検証ゲートに強制力がない** — `verification-before-completion`はテキスト指示のみで、証拠なしの完了宣言をブロックできない
2. **サブエージェントがスキルを読まない** — Task toolで起動されるサブエージェントに品質ルールが届かない
3. **PreToolUseフックのgrep検出が脆弱** — トランスクリプトJSONLのフォーマット前提が実際の構造と不一致（本調査中に実証。後述）
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

### Hook System（現在3種 → 最大14種利用可能）

claude-praxisが現在使用しているフックは3つ（SessionStart、PreCompact、PreToolUse）。公式には14種類のイベントが存在する。

| フックイベント | 現状 | 活用可能性 |
|---|---|---|
| SessionStart | 使用中 | — |
| PreCompact | 使用中 | — |
| PreToolUse | 使用中 | Prompt Hook化で信頼性向上 |
| **Stop** | 未使用 | 完了検証ゲートの強制 |
| **TaskCompleted** | 未使用 | タスク完了時の自動検証 |
| **SubagentStart** | 未使用 | サブエージェントへのルール注入 |
| **PostToolUse** | 未使用 | 変更後のバックグラウンド品質チェック |
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

## 調査中に発見した問題: トランスクリプト検出の不具合

本調査の過程で、`check-skill-gate.sh`のSkill呼び出し検出が**常に失敗する**不具合を実証・修正した。

**原因**: スクリプトはトランスクリプトJSONLのトップレベルに`content`フィールドがあると仮定していたが、実際の構造は`message.content`にネストされていた。

```
想定: obj["content"][*]["type"] == "tool_use"
実際: obj["message"]["content"][*]["type"] == "tool_use"
```

**修正内容**: `obj.get("content", [])` を `obj.get("message", {}).get("content", [])` に変更。

**教訓**: Claude Codeのトランスクリプト形式は内部仕様であり、バージョンアップで変更される可能性がある。外部フォーマットに依存する検出は本質的に脆弱であり、Prompt Hook（LLMベースのセマンティック判断）への移行が根本対策となる。

---

## 改善方針

### 方針1: Stop Hookによる完了検証ゲートの強制 — 最優先

**解決する課題**: 証拠なしの完了宣言がブロックされない

**方針**: Stop Hookに`type: "prompt"`を設定し、Claudeのレスポンスが「タスク完了」を主張しているのに検証証拠（テスト出力、lint結果、ビルド出力）を含まない場合にブロックする。

**検討事項**:
- Prompt Hookのタイムアウトはデフォルト60秒 — 十分か検証が必要
- 全レスポンスに対して発火するため、完了宣言でないレスポンスを素早くスルーするプロンプト設計が重要
- コスト（LLM呼び出し1回/レスポンス）とのトレードオフ

**代替案**: `type: "command"`でレスポンスのJSONをパースしキーワード検出する方法。LLMコストは不要だが、今回発見したトランスクリプト検出と同じ脆弱性を持つ。

### 方針2: Custom Subagentsによる構造的スキル遵守 — 最優先

**解決する課題**: サブエージェントがスキルを読まずに動作する

**方針**: プラグインの`agents/`ディレクトリに専用エージェントを定義し、`skills`フィールドでcode-quality-rulesなどをプリロードする。

想定するエージェント:
- **implementer** — `skills: [code-quality-rules, verification-before-completion]`をプリロード
- **reviewer** — `skills: [code-quality-rules]`をプリロード
- **researcher** — `model: haiku`で軽量リサーチ。品質スキル不要

**検討事項**:
- 既存の`subagent-driven-development`と`requesting-code-review`のスキル内容をエージェント定義と整合させる必要がある
- Task toolの`subagent_type`パラメータでカスタムエージェントを指定できるか確認が必要

### 方針3: PreToolUseフックのPrompt Hook化 — 高優先

**解決する課題**: grepベースのスキル検出が脆弱（本調査で実証済み）

**方針**: `check-skill-gate.sh`（`type: "command"`）を`type: "prompt"`に置き換える。LLMが「このファイル編集前に適切な品質スキルが読み込まれているか」をセマンティックに判断する。

**検討事項**:
- 全Edit/Write/MultiEditに対してLLM呼び出しが発生する — コスト増
- 現在のcommand hookはコストゼロで高速 — Prompt Hookのレイテンシとコストが許容範囲か検証が必要
- ハイブリッド案: command hookでの粗いチェックを残し、通過した場合のみprompt hookで精密チェック（ただしcommand hook自体がフォーマット依存なので根本解決にならない）

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

## 着手順序

```
Phase 1（最優先 — 構造的ゲート強化）
├── 方針1: Stop Hook（完了検証ゲート）
└── 方針2: Custom Subagents（スキルプリロード）

Phase 2（高優先 — 検出精度向上）
├── 方針3: PreToolUse Prompt Hook化（or ハイブリッド）
└── 方針4: TaskCompleted Hook（タスク完了検証）

Phase 3（中優先 — 補完的改善）
├── 方針5: SubagentStart Hook（方針2の結果次第）
├── 方針6: Async Hooks（バックグラウンドチェック）
└── 方針7: UserPromptSubmit Hook（Phase Detection）

将来（Agent Teams安定後）
└── agent-team-executionのネイティブAgent Teams移行
```

## 次のアクション

1. Stop HookとCustom Subagentsの公式ドキュメントを精読し、プラグインでの制約を確認する
2. 方針1・2のプロトタイプを実装し、動作検証する
3. 検証結果を踏まえてPhase 2の方針を確定する
