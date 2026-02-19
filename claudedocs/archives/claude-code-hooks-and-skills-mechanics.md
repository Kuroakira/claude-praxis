# Claude Code Hooks & Skills メカニズム詳細

## このドキュメントの目的

Claude Codeのhooksとskillsがどのように動作するかを、公式ドキュメントに基づいて正確に記録する。claude-praxisのゲートシステム設計・改善の判断基盤として使う。

調査日: 2026-02-18
ソース: [Hooks reference](https://code.claude.com/docs/en/hooks), [Skills reference](https://code.claude.com/docs/en/skills)

---

## Part 1: Hooks

Hooksは、Claude Codeのライフサイクルイベントに応じてカスタム処理を実行する仕組み。イベント発火 → マッチング → ハンドラ実行 → 結果反映というパイプラインで動作する。

### 1.1 イベントの全体像

Claude Codeには14種類のフックイベントがある。各イベントは発火タイミングとブロック可否が異なる。

| イベント | 発火タイミング | exit 2でブロック可能か |
|---|---|---|
| **SessionStart** | セッション開始（起動/再開/クリア/コンパクト） | ✗（stderrをユーザーに表示のみ） |
| **SessionEnd** | セッション終了 | ✗ |
| **UserPromptSubmit** | ユーザーがプロンプトを送信した直後 | ✓（プロンプトをブロック・消去） |
| **PreToolUse** | ツール実行の直前 | ✓（ツール呼び出しをブロック） |
| **PostToolUse** | ツール実行の直後（成功時） | ✗（stderrをユーザーに表示のみ） |
| **PostToolUseFailure** | ツール実行の直後（失敗時） | ✗ |
| **PermissionRequest** | 権限確認プロンプトの前 | ✓（権限を拒否） |
| **Stop** | Claudeが応答を終了しようとする時 | ✓（終了を阻止、続行を強制） |
| **SubagentStart** | サブエージェント起動時 | ✗ |
| **SubagentStop** | サブエージェント終了時 | ✓（終了を阻止） |
| **TaskCompleted** | TodoWriteでタスクが完了マークされた時 | ✓（完了をブロック） |
| **TeammateIdle** | Agent Teamsでチームメイトがアイドル状態 | ✓ |
| **PreCompact** | コンテキスト圧縮の直前 | ✗ |
| **Notification** | 通知イベント発生時 | ✗ |

ブロック可能なイベント（PreToolUse, UserPromptSubmit, PermissionRequest, Stop, SubagentStop, TaskCompleted, TeammateIdle）は、ゲートの実装に使える。それ以外はモニタリングやコンテキスト注入に適する。

### 1.2 フックの入力データ（stdin JSON）

すべてのフックイベントは、stdinにJSON形式でデータを受け取る。

#### 共通フィールド（全イベント）

```json
{
  "session_id": "string — セッション識別子",
  "transcript_path": "string — conversation.jsonlのパス",
  "cwd": "string — カレントワーキングディレクトリ",
  "permission_mode": "string — default|plan|acceptEdits|dontAsk|bypassPermissions",
  "hook_event_name": "string — イベント名"
}
```

#### イベント固有フィールド

**SessionStart** — `source`（起動理由: startup, resume, clear, compact）、`model`、`agent_type`（任意）

**UserPromptSubmit** — `prompt`（ユーザーが入力したテキスト）

**PreToolUse / PostToolUse** — `tool_name`、`tool_input`（ツール固有のパラメータ）、`tool_use_id`

**PostToolUse追加** — `tool_response`（ツールの実行結果）

**PostToolUseFailure追加** — `error`、`is_interrupt`（任意）

**Stop / SubagentStop** — `stop_hook_active`（boolean — trueならStop hookのループ内にいる）

**SubagentStart / SubagentStop** — `agent_id`、`agent_type`

**TaskCompleted** — `task_id`、`task_subject`、`task_description`（任意）、`teammate_name`、`team_name`

**PreCompact** — `trigger`（manual | auto）、`custom_instructions`

**PermissionRequest** — `tool_name`、`tool_input`、`permission_suggestions`（任意）

### 1.3 Exit codeの意味

フックの戻り値はexit codeで決まる。**これはClaude Codeの仕様であり、一般的なUnixの慣例（0=成功、非0=失敗）とは異なる意味を持つ。**

| Exit code | 意味 | stdoutの扱い | stderrの扱い |
|---|---|---|---|
| **0** | 成功 | **JSONとして解析される** | 無視 |
| **2** | ブロック | 無視 | **Claudeまたはユーザーにフィードバック** |
| **その他（1, 3, ...）** | 非ブロッキングエラー | 無視 | verboseモードでのみ表示 |

重要な帰結:
- **exit 1はブロックにならない** — エラーが起きても実行は続行する
- **exit 2のstderrはJSON解析されない** — 生テキストがそのままClaudeに渡される
- **exit 0のstdoutだけがJSON解析される** — 構造化された出力（`hookSpecificOutput`など）を返すにはexit 0が必要

### 1.4 JSON出力の構造

exit 0でstdoutにJSONを返す場合、以下のフィールドが利用可能。

#### 全イベント共通

```json
{
  "continue": false,           // falseでClaudeを完全停止
  "stopReason": "string",      // ユーザーに表示（Claudeには見えない）
  "suppressOutput": false,     // trueでverbose出力を抑制
  "systemMessage": "string"    // ユーザーへの警告表示
}
```

#### PreToolUseの`hookSpecificOutput`

PreToolUseは最も柔軟な出力を持つ。ツール呼び出しの許可/拒否だけでなく、入力の書き換えやコンテキスト注入もできる。

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow | deny | ask",
    "permissionDecisionReason": "string — ユーザーに表示される理由",
    "updatedInput": { "field": "new_value" },
    "additionalContext": "string — Claudeのコンテキストに追加"
  }
}
```

| フィールド | 用途 |
|---|---|
| `permissionDecision` | `"allow"` = 許可、`"deny"` = 拒否、`"ask"` = ユーザーに確認 |
| `permissionDecisionReason` | 拒否時にユーザーに表示される理由 |
| `updatedInput` | ツールのパラメータを書き換える（例: Bashコマンドの変更） |
| `additionalContext` | Claudeのコンテキストにテキストを追加（ブロックせずにリマインド） |

**設計上の重要ポイント**: `permissionDecision: "deny"`はexit 0で返す。exit 2によるブロックとは異なり、JSON構造で理由やコンテキストも同時に返せる。

#### SessionStartの`hookSpecificOutput`

```json
{
  "hookSpecificOutput": {
    "additionalContext": "string — セッション開始時にClaudeに注入するコンテキスト"
  }
}
```

#### Stop / UserPromptSubmitの決定パターン

```json
{
  "decision": "block",
  "reason": "string — Claudeにフィードバックされる理由"
}
```

#### PostToolUseの`hookSpecificOutput`

```json
{
  "hookSpecificOutput": {
    "additionalContext": "string",
    "updatedMCPToolOutput": "string — MCPツール出力の書き換え"
  }
}
```

### 1.5 ハンドラのタイプ

フックには3つのハンドラタイプがある。目的に応じて使い分ける。

#### Command Hook（`type: "command"`）

シェルコマンドを実行する。最もシンプルで低コスト。

```json
{
  "type": "command",
  "command": "bash hooks/my-hook.sh",
  "timeout": 600,
  "statusMessage": "Checking...",
  "async": false
}
```

- stdinにJSON入力、exit codeとstdout/stderrで結果を返す
- `async: true`でバックグラウンド実行可能（**command hookのみ**）
- デフォルトタイムアウト: 600秒

#### Prompt Hook（`type: "prompt"`）

LLMにyes/no判断をさせる。セマンティックな条件判定に適する。

```json
{
  "type": "prompt",
  "prompt": "The following tool call is about to be made: $ARGUMENTS\n\nDoes this follow TDD? Answer {ok: true/false, reason: '...'}",
  "timeout": 30
}
```

- `$ARGUMENTS`プレースホルダにフック入力JSONが展開される
- LLMが`{ "ok": true|false, "reason": "string" }`を返す
- `ok: false`の場合、`reason`がClaudeにフィードバックされる
- 対応イベント: PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, UserPromptSubmit, Stop, SubagentStop, TaskCompleted
- デフォルトタイムアウト: 30秒
- **毎回LLM呼び出しが発生する**（コスト・レイテンシに注意）

#### Agent Hook（`type: "agent"`）

サブエージェントを起動して検証する。Read/Grep/Globなどのツールを使えるため、コードベースを読んで判断できる。

```json
{
  "type": "agent",
  "prompt": "Check if tests exist for the file being edited: $ARGUMENTS",
  "timeout": 60
}
```

- 最大50ターンの多段検証が可能
- Prompt Hookと同じレスポンススキーマ: `{ "ok": true|false, "reason": "..." }`
- デフォルトタイムアウト: 60秒
- **最もコストが高い**（サブエージェント起動 + ツール実行）

#### 使い分けの指針

| 判断条件 | 適切なタイプ |
|---|---|
| 文字列マッチ、ファイル存在確認、マーカーチェック | command |
| 「TDDに従っているか」「コード変更があったか」 | prompt |
| 「テストファイルが存在するか確認して判断」 | agent |

### 1.6 マッチャー

マッチャーは、どのツール/イベントに対してフックを発火させるかをフィルタリングする。

| イベント | マッチ対象 | 例 |
|---|---|---|
| PreToolUse, PostToolUse等 | `tool_name`（正規表現） | `"Bash"`, `"Edit\|Write"`, `"mcp__.*"` |
| SessionStart | `source` | `"startup"`, `"resume"`, `"compact"` |
| SessionEnd | `reason` | `"clear"`, `"logout"` |
| SubagentStart/Stop | `agent_type` | `"Explore"`, `"implementer"` |
| PreCompact | `trigger` | `"manual"`, `"auto"` |
| **UserPromptSubmit, Stop, TaskCompleted, TeammateIdle** | **マッチャー非対応** | **常に発火** |

UserPromptSubmit, Stop, TaskCompleted, TeammateIdleはマッチャーで絞り込めない。これらのイベントでフィルタリングが必要な場合は、ハンドラ内部で条件分岐する必要がある。

### 1.7 Async Hooks

`async: true`を指定すると、フックがバックグラウンドで実行される。**command hookのみ対応。**

```json
{
  "type": "command",
  "command": "bash hooks/background-lint.sh",
  "async": true
}
```

動作の流れ:
1. フックプロセスが起動される
2. Claude Codeは**即座に続行**（結果を待たない）
3. フックが完了すると、`systemMessage`や`additionalContext`があれば**次のターン**で配信される
4. セッションがアイドルの場合、次のユーザー操作まで結果は待機

重要な制約:
- **ブロック不可** — アクションは既に実行済み
- **結果は非同期配信** — 即座にフィードバックできない
- **重複排除なし** — 同じフックが複数回発火すると、すべて並列実行される

### 1.8 環境変数

#### `CLAUDE_ENV_FILE`（SessionStartのみ）

SessionStartフック内でのみ利用可能。ここに書き込んだ環境変数は、セッション中の全Bashコマンドで参照できる。

```bash
echo 'export PROJECT_TYPE=typescript' >> "$CLAUDE_ENV_FILE"
echo 'export LINT_CMD="npm run lint"' >> "$CLAUDE_ENV_FILE"
```

フック間の状態共有には使えない（Bashコマンドのみ）。フック間の状態共有にはファイルシステム（マーカーファイル等）を使う。

#### `CLAUDE_PROJECT_DIR`

プロジェクトルートのパス。全フックで利用可能。

#### `CLAUDE_PLUGIN_ROOT`

プラグインのルートディレクトリ。プラグイン内のスクリプトを参照する際に使う。

### 1.9 フックの配置とスコープ

フックは複数の場所に配置でき、すべてが並列に実行される。

| 配置場所 | パス | スコープ |
|---|---|---|
| Enterprise | 管理ポリシー | 組織全体（上書き不可） |
| ユーザー | `~/.claude/settings.json` | 全プロジェクト |
| プロジェクト | `.claude/settings.json` | 単一プロジェクト |
| ローカル | `.claude/settings.local.json` | 単一プロジェクト（gitignored） |
| プラグイン | `<plugin>/hooks/hooks.json` | プラグイン有効時 |
| スキル/エージェント | frontmatter内 | コンポーネント実行中のみ |

**マージ動作**: 異なるソースのフックは**並列に**実行される。優先順位による上書きではなく、すべてが発火する。同一ハンドラの重複は自動排除される。

---

## Part 2: Skills

Skillsは、Claude Codeに専門知識やワークフローを追加する仕組み。フックが「イベント駆動の自動処理」であるのに対し、スキルは「コンテキストの構造化された注入」。

### 2.1 スキルのライフサイクル

スキルは「発見」「記述ロード」「呼び出し」「全文ロード」の4段階で機能する。

```
1. 発見      — Claude Codeが起動時にスキルディレクトリをスキャン
2. 記述ロード — description（またはSKILL.mdの最初の段落）をシステムプロンプトに注入
3. 呼び出し   — ユーザー（/skill-name）またはClaudeがSkill toolで呼び出す
4. 全文ロード — SKILL.mdの全文がコンテキストに注入される
```

重要: **記述は常にロードされる**（`disable-model-invocation: true`の場合を除く）。全文は呼び出し時のみロード。この2段階ロードにより、コンテキスト消費を抑えつつ、Claudeがスキルの存在を認識できる。

### 2.2 スキルの発見場所

| 場所 | パス | スコープ |
|---|---|---|
| プロジェクト | `.claude/skills/<name>/SKILL.md` | 単一プロジェクト |
| ユーザー | `~/.claude/skills/<name>/SKILL.md` | 全プロジェクト |
| Enterprise | 管理ポリシー | 組織全体 |
| プラグイン | `<plugin>/skills/<name>/SKILL.md` | プラグイン有効時 |
| ネスト | 子ディレクトリ内の`.claude/skills/` | モノレポ対応 |

スキル記述のコンテキスト予算: **コンテキストウィンドウの2%**（最低16,000文字）。予算を超えるスキルは除外され、警告が表示される。

### 2.3 Frontmatterフィールド

SKILL.mdのYAML frontmatterで動作を制御する。全フィールドはオプション。

| フィールド | 型 | 説明 | デフォルト |
|---|---|---|---|
| `name` | string | 表示名（`/slash-command`になる） | ディレクトリ名 |
| `description` | string | いつこのスキルを使うか（Claudeの判断基準） | SKILL.mdの最初の段落 |
| `disable-model-invocation` | boolean | trueならClaude自身は呼び出せない | false |
| `user-invocable` | boolean | falseならユーザーのスラッシュメニューに表示しない | true |
| `argument-hint` | string | オートコンプリート時のヒント | なし |
| `allowed-tools` | string[] | 使用可能なツールを制限 | すべて |
| `model` | string | スキル実行中に使うモデル | デフォルト |
| `context` | string | `fork`でサブエージェント実行 | main |
| `agent` | string | `context: fork`時のエージェントタイプ | general-purpose |
| `hooks` | object | スキルスコープのフック定義 | なし |

### 2.4 呼び出し制御の3パターン

| 設定 | Claudeの呼び出し | ユーザーの呼び出し | 記述のコンテキスト注入 |
|---|---|---|---|
| デフォルト（両方省略） | ✓ | ✓ | ✓ |
| `disable-model-invocation: true` | ✗ | ✓ | ✗ |
| `user-invocable: false` | ✓ | ✗ | ✓ |

- **`disable-model-invocation: true`**: デプロイ、コミット送信など、タイミングをユーザーが制御したい操作に使う。記述がコンテキストに入らないため、Claudeはスキルの存在を知らない
- **`user-invocable: false`**: レガシーシステムのコンテキストなど、Claudeが必要に応じて参照する背景知識に使う

### 2.5 引数の扱い

```
ユーザー入力: /fix-issue 123 456

スキル内での展開:
- $ARGUMENTS     = "123 456"
- $0             = "123"
- $1             = "456"
```

スキルが`$ARGUMENTS`プレースホルダを含まない場合、Claudeが末尾に`ARGUMENTS: 123 456`を自動追加する。

### 2.6 動的コンテキスト注入（`!`command``構文）

SKILL.md内で`` !`command` ``構文を使うと、スキルロード時にシェルコマンドが実行され、その出力がスキルコンテンツに埋め込まれる。

```markdown
## 現在のgit状態
!`git status --short`

## 最近のコミット
!`git log --oneline -5`
```

これはClaudeが実行するのではなく、**スキルロード時にClaude Codeが実行する**。Claudeには実行結果のみが見える。

### 2.7 `context: fork`の現状

`context: fork`を指定すると、スキルがメインコンテキストではなくサブエージェントで実行されるはず。しかし**現在のClaude Codeでは、Skill tool経由の呼び出しで`context: fork`は無視される（既知の問題）**。スキルは常にメインコンテキストで実行される。

### 2.8 スキルのディレクトリ構造

```
skill-name/
├── SKILL.md              # 必須 — エントリポイント
├── reference.md          # 任意 — 必要に応じてClaudeが読む
├── examples.md           # 任意 — 使用例
├── templates/            # 任意 — テンプレートファイル
└── scripts/              # 任意 — 実行可能スクリプト
```

SKILL.md以外のファイルは**自動ロードされない**。SKILL.md内でファイルの存在を記述しておくと、Claudeが必要に応じて読みに行く。

---

## Part 3: プラグインシステム

プラグインは、hooks・skills・commands・agentsをパッケージとして配布する仕組み。claude-praxisはこのプラグインシステムで配布されている。

### 3.1 プラグインが配布できるもの

| ディレクトリ | 内容 |
|---|---|
| `skills/` | スキル定義 |
| `commands/` | コマンド定義 |
| `agents/` | カスタムサブエージェント定義 |
| `hooks/hooks.json` | フック設定 |

**配布できないもの**: `.claude/rules/`、`.claude/settings.json`、プロジェクトレベルの設定ファイル。これらはプラグインのスコープ外。

### 3.2 カスタムサブエージェント

`agents/`ディレクトリにYAML frontmatterを持つMarkdownファイルを配置すると、Task toolの`subagent_type`で指定できるカスタムサブエージェントになる。

```yaml
---
model: inherit
skills:
  - code-quality-rules
  - verification-before-completion
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
disallowedTools:
  - Task
maxTurns: 50
---

# Implementation Agent

You are a code implementation agent...
```

重要な特性:
- **`skills`フィールド**: 指定したスキルの**全文がコンテキストに自動注入**される。「検出してブロック」ではなく「構造的にスキップ不可能」な品質ルール適用を実現する
- **サブエージェントはサブエージェントを起動できない**（Claude Code制約）ため、`Task`を`disallowedTools`に指定するのが慣例
- SubagentStartフックで`agent_type`マッチャーを使えば、エージェント起動時に追加のコンテキストを注入できる

---

## Part 4: claude-praxisの設計への示唆

上記のメカニズムを踏まえ、現行のゲートシステムに関連する設計上のポイントを整理する。

### 4.1 deny-by-defaultの実装方法

現行のcheck-skill-gate.shは、エラー時に`exit 0`（silent allow）を返している。deny-by-defaultにするには、エラーパスで`exit 2`を返す。

ただし**exit 2のstderrはJSON解析されない**ため、構造化されたフィードバック（`additionalContext`等）を同時に返したい場合は、exit 0 + `permissionDecision: "deny"`のJSON出力を使う。

### 4.2 カウンター方式の代替

Stop hookの入力には`stop_hook_active`フラグがある。これがtrueの場合、既にStop hookのループ内にいることを意味する。このフラグを使えば、ファイルベースのカウンターなしで無限ループを防止できる。

ただし、`stop_hook_active`だけでは「証拠があるか」の判断はできない。証拠の有無を判断するには:
- **マーカーファイル**: verification-before-completionスキルが呼ばれたらマーカーを書く
- **Prompt Hook**: LLMに「このセッションでコード変更があったか」を判断させる
- **Agent Hook**: サブエージェントでトランスクリプトを読んで証拠を確認（コスト大）

### 4.3 ブロック vs コンテキスト注入

PreToolUseには2つのアプローチがある:

| アプローチ | 方法 | 効果 |
|---|---|---|
| **ブロック** | `permissionDecision: "deny"` or exit 2 | ツール実行を阻止、Claudeに理由をフィードバック |
| **リマインド** | `permissionDecision: "allow"` + `additionalContext` | ツール実行を許可しつつ、コンテキストにリマインドを注入 |

「壁」（ブロック）と「道案内」（コンテキスト注入）の使い分けが可能。

### 4.4 Async Hooksの活用余地

PostToolUseに`async: true`のフックを追加すれば、コード変更後にバックグラウンドでlint/typecheckを実行し、結果を次のターンでフィードバックできる。メインフローをブロックしない。

ただし、結果が即座に反映されないため、「次のツール呼び出し前に結果を確認」はできない。フィードバックは次のユーザー操作時に配信される。

### 4.5 UserPromptSubmitの活用余地

UserPromptSubmitはマッチャー非対応（常に発火）で、ユーザーのプロンプトを受け取る。Phase Detection（「このタスクはどのフェーズか」の判断）を自動化する入口として使える。

`type: "prompt"`ならLLMがフェーズを判断できるが、**毎プロンプトごとにLLM呼び出しが発生する**。`type: "command"`でキーワードベースの粗い分類をする方がコスト効率は高い。

### 4.6 SubagentStartの活用余地

SubagentStartは`agent_type`マッチャーに対応している。特定のエージェントタイプ起動時にのみコンテキストを注入できる。

カスタムサブエージェント（agents/）の`skills`プリロードと組み合わせれば、「エージェント定義で構造的にルールを注入 + 起動時に動的コンテキストを追加」が実現できる。

---

## ソース

- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks)
- [Extend Claude with skills — Claude Code Docs](https://code.claude.com/docs/en/skills)
- [Claude Code Hooks: Complete Guide to All 12 Lifecycle Events](https://claudefa.st/blog/tools/hooks/hooks-guide)
- [Inside Claude Code Skills: Structure, prompts, invocation — Mikhail Shilkov](https://mikhail.io/2025/10/claude-code-skills/)
