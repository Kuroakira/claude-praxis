# Project Learnings — claude-praxis

Project-specific knowledge accumulated through /claude-praxis:compound.

## PreToolUse hook can enforce skill invocation mechanically

- **Learning**: `PreToolUse` hook matching `Edit|Write` can grep the session transcript (via `transcript_path` in hook input) for evidence of Skill tool invocations. If `code-quality-rules` was not invoked, the hook returns `permissionDecision: "deny"` to block the file edit.
- **Context**: This is the chosen approach for 施策1 in the skill-invocation-reliability design doc. Transcript grep with `grep -m 1` is sufficient for performance. The hook is plugin-scoped (only fires when claude-praxis is enabled).
- **Implication**: This pattern can be extended to other gate skills (e.g., `verification-before-completion` could be checked before Stop events).

## Framework improvements tracked in design doc

- **Learning**: Three structural issues identified — rule duplication dilutes authority (7 locations → consolidate to 1), instruction volume dilutes critical rules (~65KB → target ~45KB), and `disable-model-invocation: true` creates a single point of failure for the skill chain.
- **Context**: Documented in `claudedocs/skill-invocation-reliability.md` as 施策3 (First Response Gate), 施策4 (instruction volume reduction), 施策5 (deduplication), and 施策2 (auto-invocable). Implementation pending approval.
- **Implication**: After implementation, re-evaluate whether the changes actually improve skill invocation rates in real sessions.

## agents/*.md で skills プリロード → スキル呼び忘れが構造的に不可能

- **Learning**: `agents/*.md` のフロントマターで `skills` を指定すると、エージェント起動時にスキル全文が事前注入される。レビューエージェントに `code-quality-rules` をプリロードすれば、スキル呼び忘れが**構造的に不可能**になる。
- **Context**: 現在の PreToolUse hook による transcript grep は「呼び忘れ検出 → ブロック」。agents/ の skills プリロードは「呼び忘れ自体が発生しない」。防御の深さが異なる。
- **Implication**: 優先度2の施策。`agents/reviewer.md` を新設し、`skills: [code-quality-rules]` を指定する。既存の agent-team-execution スキルとの統合が必要。
- **Next Action**: `/claude-praxis:design` で agents/ ディレクトリ設計 → `/claude-praxis:implement` で実装

## Stop hook (prompt/agent型) で完了宣言前に verification gate を強制可能

- **Learning**: Stop イベントの hook で `type: "prompt"` または `type: "agent"` を使うと、Claude が完了宣言する前に「verification-before-completion が呼ばれたか？」をLLM/エージェントが判定し、呼ばれていなければブロックできる。
- **Context**: 現在 verification-before-completion はテキスト指示のみで強制力がない。Stop hook で機械的に強制すれば、PreToolUse hook と同様の確実性が得られる。最優先施策。
- **Implication**: prompt 型は単一LLM呼び出しで軽量。agent 型は transcript を Read/Grep して検証可能。transcript grep の実績があるため agent 型が適切。
- **Next Action**: `/claude-praxis:design` で Stop hook 設計 → `/claude-praxis:implement` で実装

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

- **Learning**: 7つの施策を優先度順に整理: (1) Stop hook で verification gate (2) カスタムエージェント定義 (3) TaskCompleted hook (4) user-invocable: false (5) PostToolUse async lint (6) rules/ ディレクトリ (7) Agent Memory
- **Context**: 全て Claude Code の既存メカニズムで実現可能。優先度は「品質ゲートの機械化」→「構造的なスキル注入」→「自動化の拡大」の順。
- **Implication**: 各施策は独立して実装可能。`/claude-praxis:design` → `/claude-praxis:implement` の通常ワークフローで順次実施。
