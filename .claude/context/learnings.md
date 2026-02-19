# Project Learnings — claude-praxis

Project-specific knowledge accumulated through /claude-praxis:compound.

## `unknown` + runtime extractors for parsing untyped input (hooks pattern)

- **Learning**: When parsing stdin JSON in hooks, `readStdin()` returns `unknown` and callers use `getString()`, `getBoolean()`, `getRecord()` helpers from `hooks/src/lib/types.ts` for type-safe field extraction. This is safer than generics (`readStdin<T>()`) which disguise `as` assertions.
- **Context**: Code review caught `readStdin<T>()` as a disguised `as T`. The fix required architectural change: return `unknown`, force validation at each use-site. Same pattern applies to integration test helpers — `isExecError()` type guard instead of `catch (e) { (e as ExecError) }`.
- **Implication**: Any new hook entry point should follow this pattern. Never introduce generics that bypass runtime validation.

## Test isolation via env var overrides (HOME, CLAUDE_PRAXIS_MARKER_DIR)

- **Learning**: Integration tests use `CLAUDE_PRAXIS_MARKER_DIR` env var to isolate marker file operations to a temp directory. session-start tests additionally override `HOME` to prevent real `~/.claude/learnings/global-learnings.md` from affecting test output.
- **Context**: session-start tests failed on machines where `global-learnings.md` existed — the persistence section appeared unexpectedly. `getMarkerDir()` checks `process.env.CLAUDE_PRAXIS_MARKER_DIR` with fallback to `/tmp/claude-praxis-markers`.
- **Implication**: Any hook that reads files relative to `$HOME` or fixed paths needs env var override support for testability.

## Inline phase lists must stay in sync with Detection Rules table

- **Learning**: The First Response Gate and Suggestion Behavior sections contain inline phase lists that duplicate information from the Detection Rules table. When a new phase is added to Detection Rules, all inline lists must be updated too.
- **Context**: FeatureSpec review found First Response Gate missing the `feature-spec` phase. The inline list and Detection Rules serve different audiences (quick checklist vs. detailed rules) but must contain the same phases.
- **Implication**: When adding a new phase/command, search for all inline phase enumerations (not just Detection Rules) and update them.

## PreToolUse hook enforces skill invocation with deny-by-default

- **Learning**: `PreToolUse` hook matching `Edit|Write|MultiEdit` checks session marker files (written by PostToolUse on Skill invocations) to verify required skills were invoked. If the marker is missing, it returns `permissionDecision: "deny"`. Error paths (JSON parse failure, empty session_id) return `exit 2` with stderr guidance — deny-by-default, not silent allow.
- **Context**: Originally used transcript grep, then migrated to marker files for reliability. Deny-by-default (exit 2) was added in gate-system-v2 because exit 0 on errors meant "the gate breaks, edits pass through unchecked." Stderr includes "Disable the claude-praxis plugin temporarily" as recovery guidance.
- **Implication**: Any new gate hook should follow deny-by-default: if the check mechanism itself fails, block and make the failure visible.

## code-session marker bridges PreToolUse and Stop hooks

- **Learning**: check-skill-gate.sh writes a `$SESSION_ID-code-session` marker when a code file edit is allowed. The Stop hook checks this marker: present = code session (require verification), absent = non-code session (skip verification).
- **Context**: Added in gate-system-v2 to solve "brainstorm sessions blocked by Stop hook." The marker is a side effect of the PreToolUse gate, not a separate mechanism.
- **Implication**: If the definition of "code change" needs to expand (e.g., Notebook edits, config changes), update the extension map in `hooks/src/lib/file-type.ts` (migrated from check-skill-gate.sh in the Node.js hook migration).

## Stop hook: marker-based gating > counter-based gating

- **Learning**: Stop hook uses `code-session` marker + `verification-before-completion` skill marker to decide whether to block. This replaced a counter-based approach (block N times, then allow).
- **Context**: Counter approach had two flaws: (1) blocked non-code sessions, (2) eventually allowed without verification (just counting blocks, not checking if verification was done). Marker approach is deterministic — checks facts (code edited? verification invoked?) not counts.
- **Implication**: `stop_hook_active` flag in stdin provides loop prevention. Marker-based gating is the pattern for all future gate hooks.

## UserPromptSubmit `type: "prompt"` enables semantic phase detection

- **Learning**: UserPromptSubmit hook with `type: "prompt"` calls a fast LLM to classify each user message into a development phase (implement, design, debug, research, plan, review, compound, none). Returns `additionalContext` (advisory), not `decision: "block"`.
- **Context**: Phase Detection was previously text instructions in getting-started, which Claude skipped under execution pressure. `type: "command"` (keyword matching) can't handle ambiguity ("investigate the implementation of undo" = research, not implement). `type: "prompt"` provides semantic understanding.
- **Implication**: Every prompt incurs 1-3s LLM latency. If this becomes problematic, consider fallback to `type: "command"` or making the hook optional.

## Framework improvements tracked in design doc

- **Learning**: Three structural issues identified — rule duplication dilutes authority (7 locations → consolidate to 1), instruction volume dilutes critical rules (~65KB → target ~45KB), and `disable-model-invocation: true` creates a single point of failure for the skill chain.
- **Context**: Documented in `claudedocs/skill-invocation-reliability.md` as 施策3 (First Response Gate), 施策4 (instruction volume reduction), 施策5 (deduplication), and 施策2 (auto-invocable). Implementation pending approval.
- **Implication**: After implementation, re-evaluate whether the changes actually improve skill invocation rates in real sessions.

## agents/*.md で skills プリロード → スキル呼び忘れが構造的に不可能

- **Learning**: `agents/*.md` のフロントマターで `skills` を指定すると、エージェント起動時にスキル全文が事前注入される。レビューエージェントに `code-quality-rules` をプリロードすれば、スキル呼び忘れが**構造的に不可能**になる。
- **Context**: PreToolUse hook によるマーカーチェックは「呼び忘れ検出 → ブロック」。agents/ の skills プリロードは「呼び忘れ自体が発生しない」。防御の深さが異なる。
- **Implication**: `agents/reviewer.md` を新設し、`skills: [code-quality-rules]` を指定する。既存の agent-team-execution スキルとの統合が必要。

## TaskCompleted hook でタスク完了マーク前にテスト通過を強制

- **Learning**: `TaskCompleted` イベントの hook を使うと、TodoWrite の completed マーク前にテスト通過を機械的に保証できる。ブロック可能（`Yes`）。
- **Context**: 現在はテキスト指示「Run after every file change」のみ。TaskCompleted hook で自動化すれば、タスク完了 = テスト通過が保証される。
- **Implication**: 優先度3の施策。テストコマンドはプロジェクトごとに異なるため、設定可能にする必要あり。

## `user-invocable: false` で内部スキルを / メニューから隠せる

- **Learning**: スキルフロントマターに `user-invocable: false` を指定すると、そのスキルは `/` メニュー（ユーザー向けスキル一覧）に表示されなくなる。Claude からの Skill() 呼び出しは引き続き可能。
- **Context**: `code-quality-rules`, `verification-before-completion` 等の内部ゲートスキルは、ユーザーが直接呼ぶ必要がない。/ メニューのノイズ削減に有効。
- **Implication**: 低コストで即座に適用可能。既存スキルのフロントマターに1行追加するだけ。

## Agent Teams は実験的機能（複数セッションが直接通信）

- **Learning**: Agent Teams は複数の独立した Claude Code セッションがタスクリストとメッセージで連携する実験的機能。サブエージェントとの違いは「メンバー同士が直接通信可能」な点。
- **Context**: `agent-team-execution` スキルの自然な進化先。並列レビュー（security / performance / readability）等に適するが、現時点ではデフォルト無効の実験的機能。
- **Implication**: 機能が安定したら agent-team-execution スキルを Agent Teams ベースに移行検討。現時点では記録のみ。

## UX改善ロードマップ（優先度順）

- **Learning**: 7つの施策を優先度順に整理: (1) ~~Stop hook で verification gate~~ **実装済み (v2)** (2) ~~カスタムエージェント定義~~ **実装済み** (3) TaskCompleted hook (4) user-invocable: false (5) PostToolUse async lint (6) rules/ ディレクトリ (7) Agent Memory
- **Context**: 全て Claude Code の既存メカニズムで実現可能。優先度は「品質ゲートの機械化」→「構造的なスキル注入」→「自動化の拡大」の順。
- **Implication**: 各施策は独立して実装可能。次の優先は (3) TaskCompleted hook または (4) user-invocable: false。
