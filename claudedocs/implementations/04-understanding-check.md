# Implementation Plan: Understanding Check

Design Doc: `claudedocs/design-docs/understanding-check.md`

## Overview

Understanding Check は、AI 生成成果物に対するエンジニアの「理解したつもり」を承認前に検証する opt-in 機能。Explain-Compare-Discover の3段構造で、事前記録された rationale との比較を通じてギャップを発見する。

**Changes:**
- New skill: `skills/understanding-check/SKILL.md` — Core procedure (Explain-Compare-Discover)
- New command: `commands/understanding-check.md` — Standalone execution
- Hook modification: `hooks/src/stop-verification-gate.ts` — Non-blocking UC advisory
- Rule update: `rules/verification.md` — Optional Understanding Status field
- Upstream command updates: 4 commands に recording frequency 増加の注記追加
- CLAUDE.md update: Supporting Commands + file structure に追加

**Total estimated lines:** ~450 across 10 files

## Prerequisites

- Design Doc approved: `claudedocs/design-docs/understanding-check.md`
- Existing patterns understood: tdd-cycle, receiving-code-review, stop-verification-gate

## Past Learnings Applied

- **因果的依存 > compliance handshake** — progress.md rationale が質問生成の因果的入力 (Design Doc line 85 で取り込み済み)
- **Hook出力形式** — UC advisory = non-blocking = `additionalContext`
- **graceful degradation (non-blocking path)** — 素材不足時はスキップ
- **暗黙操作は明示操作に昇格** — UC skill の全ユーザー操作を明示的に

---

## Task 1: Create Understanding Check Skill

**Goal:** Explain-Compare-Discover のコア手順を定義する。全タスクの基盤。

### Files to Create

1. **`skills/understanding-check/SKILL.md`** (~200-250 lines)

   Frontmatter:
   - name: `understanding-check`
   - description: Use when verifying understanding of AI-generated artifacts — provides Explain-Compare-Discover procedure with pre-recorded rationale comparison.

   Content structure:
   - **Iron Law**: "EXPLAIN FIRST, COMPARE SECOND — NEVER SHOW RATIONALE BEFORE THE HUMAN EXPLAINS"
   - **Parameters**: mode (workflow-proposal | standalone), progress entries, artifacts
   - **Prerequisites**: progress.md に事前記録された Decision/Rationale エントリが存在すること。不十分な場合のスキップ基準
   - **Phase 1: Explain** — 質問生成 + PAUSE (human answers)
     - Question Design principles: 推論型質問 (なぜ/どのように), 3-5問, selection criteria
     - Adaptive quality: rich materials → 代替案質問, thin → 文脈質問, insufficient → スキップ
     - Selection criteria: (1) 代替案却下判断を優先, (2) decision point 関与判断は優先度下げ, (3) 複数ステップにまたがる判断を優先
   - **Phase 2: Compare** — 構造化テーブル出力 (判断 | あなたの説明 | AI の rationale | 差分)
     - Anti-sycophancy: receiving-code-review パターン適用 (欠落観点の明示的指摘, 表面的一致に基づく肯定の禁止)
     - 差分カテゴリ: 欠落 / 相違 / 一致
     - AI rationale が間違っている場合の扱い: 差分は「理解不足」と「AI の限界」の両方を含むことを明示
   - **Phase 3: Discover** — ギャップ記録
     - progress.md 記録フォーマット: `Gap: [topic] — [説明できなかった内容]。Rationale: [AI の事前記録済み rationale]`
     - Understanding Status 生成: 「主要判断X件中Y件を説明可能、Z件にギャップ発見」
   - **Integration**: invoked-by (commands/understanding-check.md), related skills (receiving-code-review, check-past-learnings), rules (verification.md)

### Patterns to Follow (Scout Findings)

- YAML metadata format: `tdd-cycle/SKILL.md` lines 1-3
- Iron Law format: `tdd-cycle/SKILL.md` line 8 — bold header + code block
- Integration section format: `tdd-cycle/SKILL.md` lines 56-61
- Anti-sycophancy patterns: `receiving-code-review/SKILL.md` lines 10-24

### Dependencies

None — this is the foundation.

### Verification

- SKILL.md follows existing skill format (YAML, Iron Law, Procedure, Integration)
- Design Doc の3つの Design Decisions が全て反映されている
- Question Design section が Design Doc lines 112-120 と整合
- Anti-sycophancy patterns が receiving-code-review から正しく適用されている

### Review

- **Tier**: Light
- **Reviewers**: `code-quality` — pattern consistency with existing skills
- **Omitted**: spec-compliance (reserved for final), security-perf (no security changes)

---

## Task 2: Create Understanding Check Command

**Goal:** Standalone 実行のフェーズ順序と PAUSE ポイントを定義する。

### Files to Create

1. **`commands/understanding-check.md`** (~80-120 lines)

   Frontmatter:
   - name: `understanding-check`
   - description: Verify your understanding of AI-generated work — explain key decisions, compare with AI rationale, discover gaps.
   - disable-model-invocation: false

   Content structure:
   - **When to Use**: ワークフロー完了後、成果物の承認前。特に別セッションでの実行を推奨 (間隔効果 + コンテキスト解放)
   - **When Not to Use**: 小さなバグ修正、設定変更、progress.md に判断記録がない場合
   - **Phase 0: Check Past Learnings** — invoke `check-past-learnings` (role: investigation)
   - **Phase 1: Context Restoration** — progress.md + 成果物 (Design Doc / FeatureSpec / Investigation Report / code diff) から文脈復元。Standalone Mode では git diff も参照
   - **Phase 2: Understanding Check** — invoke `understanding-check` skill。PAUSE: エンジニアが質問に回答
   - **Phase 3: Record and Next Phase** — ギャップを progress.md に記録。完了レポートに Understanding Status を含める。Next Phase → /compound

### Patterns to Follow (Scout Findings)

- Standalone command format: `commands/research.md` lines 1-5 (YAML) + flat phase structure
- Phase 0 (check-past-learnings) pattern: `commands/design.md` lines 11-13
- Progress recording format: existing `## [timestamp] —` pattern
- Next Phase suggestion: `commands/feature-spec.md` lines 124-131

### Dependencies

Task 1 — command invokes the understanding-check skill.

### Verification

- Command follows existing standalone command pattern (YAML metadata, phase numbering)
- PAUSE points are correctly placed (Phase 2 — human answers questions)
- progress.md recording instruction uses existing format
- Next Phase suggests /compound

### Review

- **Tier**: Light
- **Reviewers**: `code-quality` — pattern consistency with existing commands
- **Omitted**: spec-compliance (reserved for final)

---

## Task 3: Update Stop Hook + Tests (TDD)

**Goal:** ワークフロー完了後に UC の存在を非ブロッキングでリマインドする。

### Files to Modify

1. **`hooks/src/stop-verification-gate.ts`** (~15 lines added)

   Insert **before** compound advisory (line 59) — Design Doc line 213: UC → compound order:

   ```typescript
   // Understanding Check advisory (non-blocking)
   if (
     !hasSkill(markerDir, sessionId, "understanding-check") &&
     (hasSkill(markerDir, sessionId, "feature-spec") ||
       hasSkill(markerDir, sessionId, "design") ||
       hasSkill(markerDir, sessionId, "implement") ||
       hasSkill(markerDir, sessionId, "debug"))
   ) {
     writeJson({
       hookSpecificOutput: {
         additionalContext:
           "/understanding-check is available to verify your understanding of the key decisions made during this session.",
       },
     });
     process.exit(0);
   }
   ```

2. **`tests/integration/stop-verification-gate.test.ts`** (~60 lines added)

   New `describe("understanding-check advisory")` block:
   - UC advisory shows when workflow invoked (e.g., "implement" skill marker present)
   - UC advisory hidden when understanding-check already invoked
   - UC advisory hidden when no workflow skill invoked
   - UC advisory takes precedence over compound advisory (mutual exclusion — first match exits)
   - UC advisory works with prefixed skill names (claude-praxis:implement)

### Patterns to Follow (Scout Findings)

- Test pattern: existing `stop-verification-gate.test.ts` — `describe` blocks with `runHook` helper
- Advisory output: `writeJson({ hookSpecificOutput: { additionalContext: "..." } })` + `process.exit(0)`
- Insertion point: between implement final-review gate (line 48) and compound advisory (line 59)
- hasSkill pattern: `hasSkill(markerDir, sessionId, "skillName")` — String.includes() based

### Dependencies

None — hook modification is independent of skill/command creation.

### TDD Ordering

1. Write failing tests first (RED)
2. Implement hook change (GREEN)
3. Build hooks (`npm run build`)
4. Run full verification

### Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### Review

- **Tier**: Light
- **Reviewers**: `code-quality` — TDD compliance, hook output pattern
- **Omitted**: error-resilience (follows established graceful degradation)

---

## Task 4: Update Rules, Upstream Commands, and CLAUDE.md

**Goal:** 既存ファイルの軽微なテキスト追加で UC の統合ポイントを完成する。

### Files to Modify

1. **`rules/verification.md`** (~10 lines)

   - Completion Report template に optional Understanding Status field を追加:
     ```markdown
     ### Understanding Status (optional — only when /understanding-check was executed)
     Understanding Check: [主要判断X件中Y件を説明可能、Z件にギャップ発見]
     ```
   - Next Phase Lookup table に行追加:
     ```
     | /claude-praxis:understanding-check | → Run /claude-praxis:compound to capture learnings? |
     ```

2. **`commands/design.md`** (~8 lines)

   Phase 4 (Write Full Design Doc) の recording instruction 付近に追記:
   - Alternatives Considered の各設計判断について、Decision/Rationale を progress.md に記録する注記

3. **`commands/implement.md`** (~8 lines)

   Phase 2 Step D (Report and Proceed) の recording instruction に追記:
   - decision point consultation での選択も Decision/Rationale として記録する注記

4. **`commands/feature-spec.md`** (~8 lines)

   Phase 5 (Present and Iterate) の recording instruction に追記:
   - Phase 2 Gap-Filling でのスコープ判断 (In/Out Scope の選択理由) も記録する注記

5. **`commands/debug.md`** (~8 lines)

   Phase 3 (Diagnose) の recording instruction に追記:
   - 仮説の採用/棄却の判断と証拠も記録する注記

6. **`CLAUDE.md`** (~10 lines)

   - Supporting Commands セクション (line 147-152) に `/understanding-check` を追加
   - File Structure の skills/ セクションに `understanding-check/` を追加
   - File Structure の commands/ セクションに `understanding-check.md` を追加

### Patterns to Follow (Scout Findings)

- Recording instruction format: existing `**Record to progress.md**:` + code block pattern
- CLAUDE.md Supporting Commands: existing `/research`, `/plan`, `/review`, `/compound` の並び
- verification.md Next Phase table: existing `| /claude-praxis:review | → ... |` format

### Dependencies

None — text updates are independent.

### Verification

- Design Doc の Upstream Recording Burden table (lines 219-226) と整合
- Design Doc の Integration Points section (lines 122-131) と整合
- 既存の Decision/Rationale/Domain フォーマットは変更なし (頻度増加のみ)

### Review

- **Tier**: Light
- **Reviewers**: `spec-compliance` — alignment with Design Doc integration points
- **Omitted**: code-quality (text-only changes, no code)

---

## Task 5: Final Review (Thorough)

**Goal:** 全変更を包括的にレビューし、Design Doc との整合性を検証する。

### Procedure

1. Full verification suite:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```

2. Invoke `dispatch-reviewers`:
   - **Tier**: Thorough
   - **Reviewers**: `spec-compliance` + `code-quality` + `devils-advocate`
   - **Target**: All changes from Tasks 1-4

3. Present Completion Report (verification.md template)

### Reviewer Selection Rationale

| Reviewer | Why Selected |
|----------|-------------|
| `spec-compliance` | Design Doc has detailed specifications for 3 design decisions, integration points, and cross-cutting concerns. Must verify all are correctly implemented |
| `code-quality` | TypeScript hook code + markdown skill/command must follow project patterns. TDD compliance for hook changes |
| `devils-advocate` | Mandatory (structural floor). Challenge sycophancy mitigation effectiveness, question quality assumptions, adoption risk |

| Reviewer | Why Omitted |
|----------|-------------|
| `security-perf` | No security-sensitive changes. UC is opt-in, no user input handling, no new data persistence |
| `error-resilience` | Hook modification follows established graceful degradation. No external dependencies |

### Dependencies

Tasks 1-4 complete + full verification pass.

---

## Dependency Graph

```
Task 1 (skill) ──→ Task 2 (command) ──→ Task 5 (final review)
Task 3 (hook+tests) ─────────────────→ Task 5
Task 4 (rules/upstream) ─────────────→ Task 5
```

## Parallelization Decision

**Independent tasks**: 3 (Tasks 1, 3, 4)

**Decision**: Sequential execution (1 → 2 → 3 → 4 → 5)

**Rationale**: Total scope ~450 lines — within single-session capacity. Markdown authoring (Tasks 1, 2, 4) benefits from consistent voice/terminology by single author. Task 3 is small (~75 lines). Subagent isolation overhead would exceed parallelization gains.

## Execution Order

1 → 2 → 3 → 4 → 5

## Review Trace

| Task | Tier | Reviewers | Rationale |
|------|------|-----------|-----------|
| 1 (skill) | Light | code-quality | Pattern consistency with existing skills |
| 2 (command) | Light | code-quality | Pattern consistency with existing commands |
| 3 (hook) | Light | code-quality | TDD compliance, hook output patterns |
| 4 (rules/upstream) | Light | spec-compliance | Alignment with Design Doc integration points |
| 5 (final) | Thorough | spec-compliance + code-quality + devils-advocate | Structural floor (3+ including DA) |
