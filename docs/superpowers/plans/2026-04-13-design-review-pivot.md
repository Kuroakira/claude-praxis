# Design & Review Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refocus claude-praxis to design+review by removing implementation skills/commands, adding brainstorm-style dialogue to `/feature-spec` and `/design`, creating `/eval`, and updating `/plan` granularity.

**Architecture:** Delete 6 skills + 2 commands, update 6 hook source files + tests, create 1 new command, rewrite 2 existing commands, update 1 command, update cross-references in remaining skills + CLAUDE.md + README.md.

**Tech Stack:** TypeScript (hooks), Markdown (commands/skills/docs), Vitest (tests)

**Design Doc:** `claudedocs/design-docs/2026-04-12-praxis-design-review-pivot.md`

---

### Task 1: Delete skills and commands

Remove the 6 skills and 2 commands identified for deletion. Clean removal — no migration logic needed here (cross-references updated in later tasks).

**Why:** These are the implementation-phase artifacts being delegated to superpowers. Removing them first makes the scope of remaining work clear and prevents accidentally referencing deleted files.

**Files:**
- Delete: `skills/tdd-cycle/SKILL.md` (entire directory)
- Delete: `skills/subagent-driven-development/SKILL.md` (entire directory)
- Delete: `skills/milestone-review/SKILL.md` (entire directory)
- Delete: `skills/rule-evolution/SKILL.md` (entire directory)
- Delete: `skills/requesting-code-review/SKILL.md` (entire directory)
- Delete: `skills/receiving-code-review/SKILL.md` (entire directory)
- Delete: `commands/implement.md`
- Delete: `commands/compound.md`

- [ ] **Step 1: Delete the 6 skill directories**

```bash
rm -rf skills/tdd-cycle
rm -rf skills/subagent-driven-development
rm -rf skills/milestone-review
rm -rf skills/rule-evolution
rm -rf skills/requesting-code-review
rm -rf skills/receiving-code-review
```

- [ ] **Step 2: Verify skill directories are gone**

Run: `ls skills/`
Expected: 9 remaining directories:
```
agent-team-execution/
architecture-analysis/
check-past-learnings/
context-persistence/
dispatch-reviewers/
guide-generation/
systematic-debugging/
understanding-check/
workflow-planner/
```

- [ ] **Step 3: Delete the 2 command files**

```bash
rm commands/implement.md
rm commands/compound.md
```

- [ ] **Step 4: Verify command files**

Run: `ls commands/`
Expected: 11 remaining files:
```
analyze.md
compare.md
design.md
feature-spec.md
guide.md
investigate.md
plan.md
research.md
review-guide.md
review.md
understanding-check.md
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove implementation-phase skills and commands

Delete 6 skills (tdd-cycle, subagent-driven-development, milestone-review,
rule-evolution, requesting-code-review, receiving-code-review) and 2 commands
(implement, compound) as part of design+review pivot.

Implementation responsibilities delegated to superpowers."
```

---

### Task 2: Update hooks — phase-patterns.ts and phase-learnings.ts

Remove implement and compound phase detection, add eval phase. These are the core routing files that determine which command gets suggested.

**Why:** Phase detection must match the available commands. Suggesting deleted commands would confuse users. The eval phase needs detection for the new command.

**Files:**
- Modify: `hooks/src/lib/phase-patterns.ts`
- Modify: `hooks/src/lib/phase-learnings.ts`
- Modify: `tests/unit/phase-detect.test.ts`
- Modify: `tests/unit/phase-learnings.test.ts`

- [ ] **Step 1: Write failing tests for phase-patterns changes**

In `tests/unit/phase-detect.test.ts`, add new test cases and update existing ones:

```typescript
// ADD this new describe block after existing blocks:
describe("design-review pivot: implement/compound removed, eval added", () => {
  it("no longer detects implement phase from keyword", () => {
    const result = detectPhase("実装して");
    // "implement" patterns removed — should match plan (via プラン) or no match
    expect(result).not.toContain("Phase detected: implement");
  });

  it("no longer detects /implement slash command", () => {
    const result = detectPhase("/implement");
    expect(result).not.toContain("Phase detected: implement");
  });

  it("no longer detects compound phase", () => {
    const result = detectPhase("Let's do a retrospective");
    expect(result).not.toContain("Phase detected: compound");
  });

  it("no longer detects /compound slash command", () => {
    const result = detectPhase("/compound");
    expect(result).not.toContain("Phase detected: compound");
  });

  it("detects eval phase from English keyword", () => {
    const result = detectPhase("Let's evaluate the last command");
    expect(result).toContain("Phase detected: eval");
    expect(result).toContain("/claude-praxis:eval");
  });

  it("detects eval phase from Japanese keyword", () => {
    const result = detectPhase("スキルを改善して");
    expect(result).toContain("Phase detected: eval");
  });

  it("detects /eval slash command", () => {
    const result = detectPhase("/eval");
    expect(result).toContain("Phase detected: eval");
  });

  it("implementation keywords now route to plan phase", () => {
    // "build", "create", "add feature" should suggest /plan instead of /implement
    const result = detectPhase("build a new authentication feature");
    expect(result).toContain("Phase detected: plan");
  });
});
```

Also **update existing tests** that reference implement/compound:

- Remove the test `"detects /implement slash command"` from the "slash command detection" block
- Remove `"detects compound phase"` from the "existing keyword detection" block
- Update `"prioritizes slash command over keyword patterns"` to use a non-implement example (e.g., `/design this plan`)
- Update the compound override tests in "DD4: compound pattern detection" — remove tests that expect implement phase from "design doc + implementation intent" patterns. Replace with tests showing those patterns now route to plan or design.
- Update "DD5: advisory message" tests — remove implement-specific description tests, add eval description test.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/akirashirahama/workspace/claude-praxis && npx vitest run tests/unit/phase-detect.test.ts`
Expected: FAIL — new tests fail because implement/compound still exist, eval doesn't exist yet.

- [ ] **Step 3: Update phase-patterns.ts**

In `hooks/src/lib/phase-patterns.ts`:

**a) Remove the implement compound override** (lines 22-29). Replace the entire `COMPOUND_OVERRIDES` array with just the design override:

```typescript
const COMPOUND_OVERRIDES: CompoundOverride[] = [
  {
    // "design/設計" + creation intent → design (prevents plan's /create/ from stealing)
    condition: (msg) =>
      (/\bdesign\b/i.test(msg) || /設計/.test(msg)) &&
      (/\bcreate\b/i.test(msg) || /作成/.test(msg)),
    phase: "design",
  },
];
```

**b) Remove the implement phase entry** (lines 60-67) and the compound phase entry (lines 106-113) from `PHASE_PATTERNS`.

**c) Update the plan phase entry** to absorb implementation-intent keywords (build, create, add feature, 実装, 作って, 追加):

```typescript
  {
    phase: "plan",
    command: "/claude-praxis:plan",
    description: "thorough implementation plan with Axes Table and architecture analysis",
    patterns: [
      /\bplan\b/i, /\bbreak\s*down/i, /\bstrateg/i,
      /\bimplement/i, /\bbuild\b/i, /\bcreate\b/i, /\badd\b.*\b(feature|function|component)\b/i,
      /計画/, /分解/, /ステップ/, /段階/,
      /実装/, /作って/, /追加/,
    ],
  },
```

**d) Add the eval phase entry** (after review, before the end of the array):

```typescript
  {
    phase: "eval",
    command: "/claude-praxis:eval",
    description: "evaluate and improve framework skills from recent execution",
    patterns: [
      /\beval\b/i, /\bevaluat/i, /\bimprove\s+(skill|command|rule)/i,
      /改善/, /スキル.*改善/, /振り返.*改善/,
    ],
  },
```

**e) Update the SLASH_COMMAND_RE** to remove implement/compound and add eval:

```typescript
const SLASH_COMMAND_RE =
  /^\s*\/(design|investigate|feature-spec|research|plan|review|eval)\b/i;
```

**f) Remove the comment** on line 59 (`// DD4: implement BEFORE design...`) and the comment on lines 16-21 about override ordering (no longer applicable with single override).

- [ ] **Step 4: Update phase-learnings.ts**

In `hooks/src/lib/phase-learnings.ts`:

Remove `implement` and `compound` entries from `PHASE_LEARNINGS_MAP`. Add `eval` entry:

```typescript
export const PHASE_LEARNINGS_MAP: Record<string, LearningsLevel[]> = {
  "feature-spec": ["feature-spec"],
  design: ["feature-spec", "design"],
  investigate: ["coding"],
  review: ["design", "coding"],
  research: ALL_FILES,
  plan: ["design", "coding"],
  eval: ALL_FILES,
};
```

- [ ] **Step 5: Write failing test for phase-learnings changes**

In `tests/unit/phase-learnings.test.ts`, add:

```typescript
it("does not have implement entry", () => {
  expect(PHASE_LEARNINGS_MAP).not.toHaveProperty("implement");
});

it("does not have compound entry", () => {
  expect(PHASE_LEARNINGS_MAP).not.toHaveProperty("compound");
});

it("has eval entry mapping to all files", () => {
  expect(getLearningsForPhase("eval")).toEqual([
    "learnings-feature-spec.md",
    "learnings-design.md",
    "learnings-coding.md",
  ]);
});
```

And remove any existing tests that reference implement or compound entries directly.

- [ ] **Step 6: Run all tests to verify they pass**

Run: `npx vitest run tests/unit/phase-detect.test.ts tests/unit/phase-learnings.test.ts`
Expected: PASS

- [ ] **Step 7: Build and verify**

Run: `npm run build && npm run typecheck`
Expected: PASS — no type errors from the changes.

- [ ] **Step 8: Commit**

```bash
git add hooks/src/lib/phase-patterns.ts hooks/src/lib/phase-learnings.ts tests/unit/phase-detect.test.ts tests/unit/phase-learnings.test.ts
git commit -m "refactor: update phase detection — remove implement/compound, add eval

Phase-patterns: remove implement phase entry, compound phase entry, and
implement compound override. Absorb implementation-intent keywords into
plan phase. Add eval phase detection.

Phase-learnings: remove implement/compound mappings, add eval mapping."
```

---

### Task 3: Update hooks — stop-verification-gate.ts, session-start.ts, pre-compact.ts, context-pressure-check.ts

Remove all references to `/implement` final-review gate, `/compound` suggestions, and compound-last-run checks.

**Why:** These hooks reference deleted commands. The implement final-review gate would block session end for a workflow that no longer exists. Compound suggestions would direct users to a deleted command.

**Files:**
- Modify: `hooks/src/stop-verification-gate.ts`
- Modify: `hooks/src/session-start.ts`
- Modify: `hooks/src/pre-compact.ts`
- Modify: `hooks/src/context-pressure-check.ts`
- Modify: `tests/integration/stop-verification-gate.test.ts`

- [ ] **Step 1: Write failing test for stop-verification-gate changes**

In `tests/integration/stop-verification-gate.test.ts`, add test cases that verify:
- The implement final-review gate no longer exists (invoking implement skill should not trigger warnings)
- The compound suggestion is no longer emitted
- The `workflowSkills` array no longer includes "implement"

Read the existing test file first to understand the test patterns, then add:

```typescript
it("does not warn about implement final review", async () => {
  // Create implement skill marker
  // Run stop-verification-gate
  // Expect NO warning about final review
});

it("does not suggest compound", async () => {
  // Create progress.md with entries
  // Run stop-verification-gate
  // Expect NO compound suggestion
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/stop-verification-gate.test.ts`
Expected: FAIL — new tests fail because implement gate and compound suggestion still exist.

- [ ] **Step 3: Update stop-verification-gate.ts**

**a) Remove the implement final-review gate** (lines 37-48):
Delete the entire block from `if (hasSkill(markerDir, sessionId, "implement"))` through its closing brace.

**b) Remove "implement" from workflowSkills** (line 60):

```typescript
const workflowSkills = ["feature-spec", "design", "investigate"];
```

**c) Remove compound suggestion logic**:
- Remove the `shouldSuggestCompound` function (lines 10-18)
- Remove the `suggestCompound` variable (line 67)
- Remove the compound advisory push (lines 75-78)
- Remove the `getProgressSummary` and `readCompoundLastRun` imports if they become unused
- Remove the `contextDir` variable if it becomes unused

The resulting advisory section should only handle the UC suggestion:

```typescript
const advisories: string[] = [];
if (suggestUC) {
  advisories.push(
    "/understanding-check is available to verify your understanding of the key decisions made during this session.",
  );
}
if (advisories.length > 0) {
  writeJson({
    hookSpecificOutput: {
      additionalContext: advisories.join("\n\n"),
    },
  });
  process.exit(0);
}
```

- [ ] **Step 4: Update session-start.ts**

Remove compound-related logic from compact recovery messaging:

- Remove the `compoundRun` destructuring and its conditional (lines 56-67 area)
- The compact recovery message should no longer mention `/compound`. Replace with a simpler message:

```typescript
// Replace compound-based branching with single message:
sections.push(
  `## Compact Recovery\nCompact occurred. Read persistence files to resume.`,
);
```

Read the full file first to understand the exact lines to change.

- [ ] **Step 5: Update pre-compact.ts**

Remove compound-last-run logic:

- Remove the `readCompoundLastRun` import
- Remove the `compoundLastRun` variable and its conditional block (lines 31-40 area)
- Remove `compoundRun` from the output object (line 73 area)
- The `compoundRun` field should no longer be written to `last-compact.json`

Read the full file first to understand the exact lines to change.

- [ ] **Step 6: Update context-pressure-check.ts**

Remove compound suggestion from context pressure messages:

- Line 29: Replace `/claude-praxis:compound` mention with a neutral message about preserving context
- Line 41: Same replacement

Read the full file first. Replace compound references like:
```
// Before:
"Run /claude-praxis:compound to preserve knowledge before compact occurs."
// After:
"Consider saving important context before compact occurs."
```

- [ ] **Step 7: Run all tests**

Run: `npx vitest run`
Expected: PASS — all tests pass including the new ones.

- [ ] **Step 8: Build and typecheck**

Run: `npm run build && npm run typecheck`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add hooks/src/stop-verification-gate.ts hooks/src/session-start.ts hooks/src/pre-compact.ts hooks/src/context-pressure-check.ts tests/
git commit -m "refactor: remove implement/compound references from hooks

Stop-verification-gate: remove implement final-review gate and compound
suggestion. Session-start: remove compound recovery branching.
Pre-compact: remove compound-last-run tracking. Context-pressure-check:
remove compound command suggestion."
```

---

### Task 4: Create `/eval` command

A new command that analyzes the most recent command execution and proposes improvements to the framework's own skill/command/rule/catalog files.

**Why:** `/eval` is the successor to `/compound` and `rule-evolution`. Instead of accumulating knowledge separately, it directly improves the framework files — the framework gets better each time it's used.

**Files:**
- Create: `commands/eval.md`

- [ ] **Step 1: Create commands/eval.md**

```markdown
---
name: eval
description: Evaluate and improve framework skills from recent execution. Analyzes the most recent command run and proposes concrete improvements to skill, command, rule, or catalog files.
---

# /eval

Analyze the most recent command execution in this session and improve the framework files that produced it.

## Scope

**Target of analysis**: The most recent praxis command execution in the current session. If the user specifies a different target, use that instead.

**Improvable files** (in order of likelihood):
- Command files (`commands/*.md`)
- Skill files (`skills/*/SKILL.md`)
- Rule files (`rules/*.md`)
- Catalog files (`catalog/*.md`)

## Procedure

### Phase 1: Analyze Recent Execution

1. Identify the most recent praxis command that was run in this session
2. Review the full execution: what happened, what the user said, where friction occurred
3. Identify **specific, actionable improvements** — not vague observations

Focus on:
- Steps where the user had to correct or redirect
- Unnecessary questions or redundant steps
- Missing context that caused suboptimal output
- Overly rigid procedures that didn't fit the situation
- Missing procedures that would have helped

### Phase 2: Propose Improvements

Present improvements as a table:

```
| # | File | Change | Rationale |
|---|------|--------|-----------|
| 1 | [exact file path] | [specific change description] | [why this improves the next run] |
```

**Rules for proposals**:
- Each change must reference an exact file and describe a specific edit
- "Add more detail" is not a proposal. "Add a skip-condition for single-file scope to step 3 of the codebase-scout phase" is
- Changes must be grounded in what actually happened during execution, not hypothetical improvements
- Prefer small, targeted changes over rewrites
- Respect the layer architecture: constraints → `rules/`, procedures → `skills/`, phase ordering → `commands/`

### Phase 3: PAUSE — User Approval

Present the proposals. Wait for the user to approve, modify, or reject each one.

### Phase 4: Apply Changes

For each approved proposal:
1. Read the target file
2. Make the specific edit
3. Verify the edit doesn't break the file's structure

### Phase 5: Verify and Commit

1. If TypeScript files were changed: run `npm run typecheck && npm run lint && npm run test && npm run build`
2. If only markdown files were changed: verify structure is intact (no broken references)
3. Commit with message: `chore(eval): improve [file-names] — [one-line summary]`

## Constraints

- **One session's execution only** — don't analyze across sessions
- **No speculative improvements** — every change must trace to observed friction
- **Respect existing patterns** — don't restructure; improve within the current architecture
- **Small changes preferred** — a one-line addition to a skip-condition is better than rewriting a phase
```

- [ ] **Step 2: Verify the file is well-formed**

Run: `wc -l commands/eval.md && head -5 commands/eval.md`
Expected: ~70 lines, starts with frontmatter `---`

- [ ] **Step 3: Commit**

```bash
git add commands/eval.md
git commit -m "feat: add /eval command for framework self-improvement

/eval analyzes the most recent command execution and proposes specific
improvements to skill, command, rule, or catalog files. Successor to
/compound and rule-evolution — directly improves framework behavior
instead of accumulating separate knowledge."
```

---

### Task 5: Redesign `/feature-spec` command

Replace the current planner-driven flow with a brainstorm-style dialogue flow. The key change: instead of AI drafting in isolation and presenting for approval, the AI asks questions one at a time and builds the FeatureSpec incrementally with the user.

**Why:** The current flow has minimal user interaction (approval gates only). This creates a "vibe design" problem parallel to vibe coding — the user OKs without deeply engaging. Brainstorm-style dialogue forces the user to articulate their thinking at each step.

**Files:**
- Modify: `commands/feature-spec.md`

- [ ] **Step 1: Read current feature-spec.md fully**

Run: Read `commands/feature-spec.md`
Understand the current 7-phase structure, FeatureSpec template, and skip criteria.

- [ ] **Step 2: Rewrite commands/feature-spec.md**

Preserve:
- Frontmatter (name, description)
- FeatureSpec template structure (Problem Statement, User Stories, Scope, Purpose, Risks, References)
- Phase 0 (check past learnings) — unchanged
- Skip criteria (skip to design if requirements clear)

Replace the Phase 1-6 flow with the brainstorm-based flow from the design doc:

```markdown
## Procedure

### Phase 0: Check Past Learnings

Invoke `check-past-learnings` skill with role `feature-spec`.

### Phase 1: Context Exploration

1. Explore the project: read relevant files, docs, recent commits
2. Summarize what you understand about the project context
3. State what the user has described so far and what's still unclear

### Phase 2: Dialogue — One Question at a Time

Ask questions to fill gaps in the FeatureSpec. **One question per message.** Prefer questions with concrete choices:

```
**Question 2/5: Scope boundary**

This feature could include:
- A) Only the API layer (frontend unchanged)
- B) API + frontend components
- C) Full stack including data migration

Which scope fits your intent? Or describe a different boundary.
```

Question areas (in order, skip if already clear):
1. **Purpose** — What problem does this solve? Who benefits?
2. **Constraints** — Time, technical, organizational constraints?
3. **Success criteria** — How do you know it's done?
4. **Scope boundary** — What's explicitly out of scope?
5. **Risks** — What could go wrong?

Stop asking when all FeatureSpec sections have enough input to draft.

### Phase 3: Proposals

Present 2-3 approaches for the feature with trade-offs and a recommendation:

```
**Approach A: [name]** — [one sentence]
- Pro: ...
- Con: ...

**Approach B: [name]** — [one sentence]
- Pro: ...
- Con: ...

**Recommendation**: Approach A because [reason].
```

Wait for user selection or modification.

### Phase 4: Incremental Section Presentation

Present the FeatureSpec **section by section**, not as a complete document:

1. Present Problem Statement → user approves or edits
2. Present User Stories → user approves or edits
3. Present Scope (In/Out) → user approves or edits
4. Present Purpose → user approves or edits
5. Present Risks → user approves or edits

Each section builds on approved prior sections.

### Phase 5: Write FeatureSpec

1. Assemble approved sections into the full FeatureSpec
2. Save to `claudedocs/feature-specs/[name]-feature-spec.md`

### Phase 6: Self-Review

Check the completed FeatureSpec for:
- [ ] No placeholders or TBD items
- [ ] Internal consistency (scope matches stories, risks match scope)
- [ ] No HOW content (implementation details belong in Design Doc)
- [ ] Scope is bounded (explicit out-of-scope items)
- [ ] Each section could be understood by someone unfamiliar with the project

If issues found, fix them and note what was fixed.

### Phase 7: Next Step Suggestion

Suggest the appropriate next phase based on the FeatureSpec:
- If approach is clear → "Ready for `/design`"
- If approach needs research → "Ready for `/research` then `/design`"
```

The full file should also include:
- The FeatureSpec template (preserved from current version)
- Skip criteria (preserved)
- Constraints section noting "How is explicitly excluded — Design Doc owns How"

- [ ] **Step 3: Verify structure**

Run: `head -3 commands/feature-spec.md && grep -c "^###" commands/feature-spec.md`
Expected: Frontmatter present, ~8-10 h3 headings (phases + template + constraints)

- [ ] **Step 4: Commit**

```bash
git add commands/feature-spec.md
git commit -m "refactor: redesign /feature-spec with brainstorm-style dialogue

Replace planner-driven draft+approve flow with one-question-at-a-time
dialogue. Add incremental section presentation (approve each section
individually). Add 2-3 proposals phase with trade-offs.

User now articulates decisions at each step instead of OKing a complete
draft."
```

---

### Task 6: Redesign `/design` command

Replace the planner-driven subagent pipeline (G0-G6) with a brainstorm-style dialogue flow focused on "How" decisions. Preserve the research capability but make the user an active participant in design decisions.

**Why:** The current 7-group pipeline produces a Design Doc with minimal user input. The user approves but doesn't deeply engage with architectural trade-offs. Brainstorm-style dialogue ensures the user articulates WHY they chose each architectural direction.

**Files:**
- Modify: `commands/design.md`

- [ ] **Step 1: Read current design.md fully**

Run: Read `commands/design.md`
Understand the current G0-G6 pipeline, subagent orchestration, data flow, and cleanup procedures.

- [ ] **Step 2: Rewrite commands/design.md**

Preserve:
- Frontmatter (name, description)
- Design Doc format reference (`rules/design-doc-format.md`)
- Output location (`claudedocs/design-docs/`)
- Architecture analysis capability (can still invoke `architecture-analysis` skill)
- Reviewer dispatch for final review

Replace the G0-G6 subagent pipeline with:

```markdown
## Procedure

### Phase 0: Init

1. Check past learnings: invoke `check-past-learnings` skill with role `design`
2. If a FeatureSpec exists: read it. Confirm What/Why are settled — these are NOT re-discussed

### Phase 1: Context Exploration

1. Read the FeatureSpec (if exists)
2. Explore related code, existing patterns, architectural constraints
3. Summarize what you understand about the design space
4. Identify the key design decisions that need to be made

### Phase 2: Dialogue — Architecture Decisions

For each key design decision, ask **one question at a time** with concrete choices:

```
**Decision 2/4: Data storage approach**

Given [context from FeatureSpec], the options are:
- A) Extend existing PostgreSQL schema — simple, consistent with current patterns
- B) Add Redis cache layer — faster reads, more operational complexity
- C) Event-sourced with projection — full audit trail, significant implementation effort

Which approach fits? Or describe a different option.
```

Decision areas (adapt to the specific design):
1. **Architecture pattern** — How does this fit into the existing system?
2. **Key technical choices** — Storage, protocols, frameworks
3. **Integration boundaries** — Where does this connect to existing code?
4. **Trade-offs the user must own** — Performance vs simplicity, flexibility vs speed

Confirmed decisions from FeatureSpec are NOT re-asked. Only How questions.

### Phase 3: Architecture Proposals

Present 2-3 architectural approaches with trade-offs and a recommendation:

```
**Approach A: [name]**
[mermaid diagram showing structure]
- Pro: ...
- Con: ...
- When to reconsider: ...

**Approach B: [name]**
[mermaid diagram showing structure]
- Pro: ...
- Con: ...
- When to reconsider: ...

**Recommendation**: Approach A because [reason].
```

Wait for user selection. If the user wants deeper analysis on specific approaches, perform targeted research (web search, Context7 docs lookup, codebase exploration).

### Phase 4: Incremental Section Presentation

Present the Design Doc **section by section**:

1. Present Overview → user approves or edits
2. Present Context and Scope → user approves or edits
3. Present Goals / Non-Goals → user approves or edits
4. Present Proposal (with mermaid diagrams) → user approves or edits
5. Present Alternatives Considered → user approves or edits
6. Present Concerns → user approves or edits

Each section builds on approved prior sections. Diagrams follow `rules/design-doc-format.md` (≤15 nodes, one abstraction level per diagram).

### Phase 5: Write Design Doc

1. Assemble approved sections into the full Design Doc
2. Save to `claudedocs/design-docs/[name].md`

### Phase 6: Self-Review

Check the completed Design Doc against `rules/design-doc-format.md`:
- [ ] WHY generously, HOW sparingly
- [ ] Every mermaid diagram ≤15 nodes
- [ ] No local file links
- [ ] No h4 or deeper
- [ ] Alternatives Considered section present with "when to reconsider"
- [ ] Timeless voice (no temporal expressions)
- [ ] No references to intermediate artifacts

If issues found, fix them and note what was fixed.

### Phase 7: Final Review (Optional)

If the design is complex (4+ key decisions, cross-module impact), dispatch reviewers:
- Invoke `dispatch-reviewers` with tier `thorough`
- Reviewers: `architecture` + `document-quality` + `devils-advocate`
- Present findings to user, incorporate approved feedback

### Phase 8: Next Step Suggestion

Suggest: "Ready for `/plan`" or "Ready for `/plan` with specific areas to research first"
```

The full file should also include:
- Constraints section noting the FeatureSpec → Design Doc boundary
- Note that research is demand-driven (user requests it during Phase 3) rather than upfront mandatory
- Cleanup section (only intermediate files if any were created)

- [ ] **Step 3: Verify structure**

Run: `head -3 commands/design.md && grep -c "^###" commands/design.md`
Expected: Frontmatter present, ~10-12 h3 headings

- [ ] **Step 4: Commit**

```bash
git add commands/design.md
git commit -m "refactor: redesign /design with brainstorm-style dialogue

Replace G0-G6 subagent pipeline with interactive dialogue flow.
Architecture decisions made through one-question-at-a-time dialogue
with concrete choices. Incremental section approval replaces batch
presentation. Research is demand-driven, not upfront mandatory."
```

---

### Task 7: Update `/plan` with granularity contract

Add the Plan Granularity Contract and superpowers handoff guidance. Update to reflect that `/plan` is now the bridge between praxis design and superpowers implementation.

**Why:** With `/implement` removed, `/plan` becomes the handoff point to superpowers. The granularity contract ensures plans are at the right level — detailed enough for superpowers to execute, not so detailed they duplicate superpowers' micro-step generation.

**Files:**
- Modify: `commands/plan.md`

- [ ] **Step 1: Read current plan.md fully**

Run: Read `commands/plan.md`
Understand the current G0-G1 pipeline, canonical planning pipeline, and output format.

- [ ] **Step 2: Add Plan Granularity Contract section**

Add a new section after the existing plan creation rules (within the planning pipeline). This goes inside the plan creation step, not as a separate phase:

```markdown
## Plan Granularity Contract

| Item | Standard |
|---|---|
| Size | 100-200 lines, readable in 30 minutes |
| Task count | 4-8 tasks |
| Include | Function names, file paths, task ordering, TDD order instructions, out-of-scope items, risks, per-task review plan |
| Exclude | Actual code blocks, line-by-line changes, micro-steps (2-5 min granularity) |
| Per-task required fields | Why, changed files, estimated size, test targets |

**Reference**: The `darius/section-full-containment-plan.md` (139 lines, 4 tasks) represents this granularity standard.

## superpowers Handoff

Each task in the plan is designed to serve as spec input for `superpowers:writing-plans`. One praxis task = one superpowers plan.

To execute the plan:
1. Pass the plan file to `superpowers:writing-plans` (one task at a time, or the full plan)
2. superpowers generates micro-step plans with actual code
3. Execute via `superpowers:subagent-driven-development` or `superpowers:executing-plans`
```

- [ ] **Step 3: Remove /implement references in plan.md**

Search for any references to `/implement` or `/claude-praxis:implement` in the plan.md and update them to reference the superpowers handoff instead.

- [ ] **Step 4: Add TDD order instruction requirement**

In the per-task fields section, add a note that each task must specify TDD order:

```markdown
- **TDD order**: Which tests to write first, what behavior each test validates (execution handled by superpowers)
```

- [ ] **Step 5: Verify structure**

Run: `grep -c "Granularity Contract\|superpowers Handoff\|TDD order" commands/plan.md`
Expected: 3+ matches

- [ ] **Step 6: Commit**

```bash
git add commands/plan.md
git commit -m "feat: add Plan Granularity Contract and superpowers handoff

Define plan size/granularity standards (100-200 lines, 4-8 tasks).
Add superpowers handoff guidance — each praxis task maps to one
superpowers plan. Add TDD order as per-task required field."
```

---

### Task 8: Update cross-references in remaining skills

Update skills that reference deleted commands/skills to point to the correct replacements.

**Why:** Remaining skills reference `/implement`, `/compound`, `tdd-cycle`, `subagent-driven-development`, etc. These dangling references would confuse both users and AI agents executing the skills.

**Files:**
- Modify: `skills/check-past-learnings/SKILL.md`
- Modify: `skills/systematic-debugging/SKILL.md`
- Modify: `skills/agent-team-execution/SKILL.md`
- Modify: `skills/workflow-planner/SKILL.md`
- Modify: `skills/dispatch-reviewers/SKILL.md`

- [ ] **Step 1: Update check-past-learnings/SKILL.md**

- Remove `commands/implement.md` from the "Invoked by" list (line 69 area)
- Remove `/compound` from the "Reads files from" description (line 70 area)
- Update to: `Invoked by: commands/design.md, commands/feature-spec.md, commands/investigate.md, commands/plan.md`

- [ ] **Step 2: Update systematic-debugging/SKILL.md**

- Line 119 area: Replace `/claude-praxis:implement` reference with guidance to use superpowers or `/plan` for the fix:

```markdown
- After diagnosis, create a fix plan via `/claude-praxis:plan` and execute with superpowers
```

- [ ] **Step 3: Update agent-team-execution/SKILL.md**

- Remove references to `subagent-driven-development` (lines 149, 188, 192 area)
- Replace `/compound` references with `/eval` (lines 106, 149, 190 area)
- Remove "Never use for implementation — use `subagent-driven-development` instead" (line 192 area) — replace with "Never use for implementation — use superpowers for implementation tasks"
- Line 186: Remove `/implement` from the workflow review point list

- [ ] **Step 4: Update workflow-planner/SKILL.md**

- Remove `implement` from the `domain` parameter accepted values (line 24 area)
- Update to: `domain: feature-spec, design, investigate, plan`

- [ ] **Step 5: Update dispatch-reviewers/SKILL.md**

- Remove any references to `/implement` review dispatch if present
- No major changes expected — verify and update if needed

- [ ] **Step 6: Verify no remaining dangling references**

Run: `grep -r "implement\|compound\|tdd-cycle\|subagent-driven-development\|milestone-review\|rule-evolution\|requesting-code-review\|receiving-code-review" skills/ --include="*.md" -l`
Expected: No matches (or only legitimate uses like the word "implement" in prose, not command references)

- [ ] **Step 7: Commit**

```bash
git add skills/
git commit -m "refactor: update cross-references in remaining skills

Remove references to deleted commands (/implement, /compound) and
deleted skills (tdd-cycle, subagent-driven-development, etc.) from
check-past-learnings, systematic-debugging, agent-team-execution,
workflow-planner, and dispatch-reviewers."
```

---

### Task 9: Update CLAUDE.md and README.md

Update the project documentation to reflect the new command/skill set and the design+review focus.

**Why:** CLAUDE.md is loaded every session — stale references would mislead every interaction. README.md is the public face of the project and must accurately describe available commands.

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Update CLAUDE.md file structure section**

In the file structure tree (lines 8-78 area):

- Remove `implement.md` and `compound.md` from commands list
- Add `eval.md` to commands list
- Remove the 6 deleted skills from skills list
- Update skill count comment (15 → 9 skills)
- Remove `implementation records` from claudedocs description
- Update hooks description if it mentions implement

The commands section should show:
```
├── commands/
│   ├── feature-spec.md          # /feature-spec — brainstorm-driven interview to capture requirements
│   ├── design.md                # /design — brainstorm-driven architecture → Design Doc
│   ├── plan.md                  # /plan — implementation plan with Granularity Contract
│   ├── eval.md                  # /eval — evaluate and improve framework from recent execution
│   ├── investigate.md           # /investigate — reproduce + diagnose + document
│   ├── analyze.md               # /analyze — codebase architecture analysis + durable report
│   ├── guide.md                 # /guide — codebase walkthrough guide for human understanding
│   ├── compare.md               # /compare — structured multi-option comparison
│   ├── research.md              # /research — standalone research
│   ├── review.md                # /review — standalone code review
│   ├── review-guide.md          # /review-guide — self-review guide for AI-generated code
│   └── understanding-check.md   # /understanding-check — verify understanding of AI-generated work
```

The skills section should show:
```
├── skills/
│   ├── workflow-planner/        # Analyze task, select agents from catalogs, generate execution plan
│   ├── dispatch-reviewers/      # Dispatch reviewers by catalog ID with graduated tiers
│   ├── architecture-analysis/   # Multi-pass codebase analysis with durable reports + quantitative health scoring
│   ├── guide-generation/        # Multi-pass codebase exploration + single-narrator guide writing
│   ├── check-past-learnings/    # Recall relevant learnings before starting work
│   ├── systematic-debugging/    # 3-phase root cause analysis (reproduce, isolate, diagnose)
│   ├── context-persistence/     # Stock/Flow memory model for context survival
│   ├── understanding-check/     # Explain-Compare-Discover for understanding verification
│   └── agent-team-execution/    # Parallel exploration: research, review teams, debugging
```

- [ ] **Step 2: Update CLAUDE.md design decisions section**

Update the design decisions list (line 152 area):

- Remove: "Quality rules live in `rules/` as always-on constraints; procedural skills (`tdd-cycle`, `rule-evolution`) handle the "how""
- Replace with: "Quality rules live in `rules/` as always-on constraints; `/eval` improves the framework from observed execution friction"
- Update the four orchestrating workflows line: remove `/claude-praxis:implement`, note superpowers delegation
- Add: "`/eval` directly improves framework files instead of accumulating separate knowledge — `/compound` and `rule-evolution` successor"

- [ ] **Step 3: Update CLAUDE.md workflows section**

Update the Workflows section to mention superpowers handoff:

```markdown
## Workflows

See `README.md` for workflow details, installation, and feature list. Commands are loaded on-demand when invoked. Quality rules are loaded via `@import` above.

### superpowers Integration

Implementation is delegated to superpowers. The handoff: `/plan` produces a plan → superpowers `writing-plans` generates micro-step plans → superpowers executes with TDD.
```

- [ ] **Step 4: Update CLAUDE.md Sekko-arch integration note**

Remove the `/implement` reference from the Sekko-arch integration comment (if present in the Sekko-arch section). The `implement` command's `session_start`/`session_end` usage is no longer applicable.

- [ ] **Step 5: Update README.md main workflows table**

Replace the `/implement` row and add `/eval`:

```markdown
### Main Workflows

| Workflow | What Happens | What You Do |
|----------|-------------|-------------|
| `/feature-spec [feature]` | Brainstorm-driven interview: one question at a time, 2-3 proposals, incremental section approval → FeatureSpec | Answer questions, choose proposals, approve each section |
| `/design [topic]` | Brainstorm-driven architecture dialogue: key decisions with concrete choices, incremental section approval → Design Doc | Make architecture decisions, approve each section |
| `/plan [topic] [design-doc-path]` | Implementation plan with Axes Table, architecture analysis, Granularity Contract → plan for superpowers | Review plan, then hand off to superpowers for execution |
| `/investigate [problem]` | Reproduces, isolates, diagnoses — for complex problems, planner dispatches parallel investigation agents | Provide context between phases, review the diagnosis |
```

- [ ] **Step 6: Update README.md supporting commands table**

Remove `/compound`, add `/eval`:

```markdown
| `/eval` | Evaluate the most recent command execution and improve framework skills/commands/rules |
```

Remove `/compound` row entirely. Keep all other supporting commands.

- [ ] **Step 7: Update README.md skills table**

Remove the 6 deleted skills. Add note about superpowers delegation:

```markdown
## Skills

| Skill | Description |
|-------|-------------|
| `workflow-planner` | Analyze task content, select agents from shared catalogs, generate execution plan |
| `dispatch-reviewers` | Dispatch reviewers by catalog ID with graduated tiers |
| `agent-team-execution` | Parallel exploration (research, review teams, debugging) with independent verification sources |
| `architecture-analysis` | Multi-pass codebase analysis with durable Markdown+mermaid reports and quantitative health scoring (TypeScript) |
| `guide-generation` | Multi-pass codebase exploration + single-narrator guide as HTML book |
| `systematic-debugging` | 3-phase root cause analysis (reproduce, isolate, diagnose) |
| `context-persistence` | Stock/Flow memory model for context survival across compact/clear |
| `check-past-learnings` | Recall relevant learnings at the start of any workflow phase |
| `understanding-check` | Explain-Compare-Discover procedure for verifying understanding |
```

- [ ] **Step 8: Update README.md commands table**

Remove `/implement` and `/compound`. Add `/eval`. Update `/feature-spec` and `/design` descriptions. Update `/plan` description to mention superpowers handoff.

- [ ] **Step 9: Update README.md command options reference**

Remove `[plan-path]` option for `/implement`. Add eval to the commands list if it has options.

- [ ] **Step 10: Update README.md key mechanisms section**

- Replace "Self-Evolving Quality Rules" with "`/eval` Framework Self-Improvement — evaluate recent execution and improve framework files directly"
- Replace "Compound Learning" with "superpowers Integration — `/plan` produces plans at the right granularity for superpowers execution"

- [ ] **Step 11: Verify no remaining stale references**

Run: `grep -n "implement\|compound\|tdd-cycle\|subagent-driven\|milestone-review\|rule-evolution\|requesting-code-review\|receiving-code-review" CLAUDE.md README.md`
Expected: No matches for deleted items (legitimate prose uses of "implement" are OK — check each match)

- [ ] **Step 12: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update CLAUDE.md and README.md for design+review pivot

Remove references to deleted commands and skills. Add /eval command
docs. Update /feature-spec and /design descriptions to reflect
brainstorm-style dialogue. Add superpowers integration guidance.
Update skills table, commands table, and key mechanisms."
```

---

### Task 10: Update agents/implementer.md and final verification

Update the implementer agent definition (still used by superpowers, but should not reference praxis-specific workflows). Run full verification suite.

**Why:** The implementer agent is still valid for subagent dispatch but its description shouldn't reference praxis `/implement` workflow. Final verification ensures all changes are consistent and nothing is broken.

**Files:**
- Modify: `agents/implementer.md` (if praxis-specific references exist)
- Verify: all project files

- [ ] **Step 1: Check and update agents/implementer.md**

Read the full file. If it references `/implement`, `tdd-cycle` skill, or other deleted items, update the references. The agent itself is still valid — it just shouldn't mention praxis-specific orchestration.

- [ ] **Step 2: Run full verification suite**

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Expected: All PASS

- [ ] **Step 3: Run comprehensive stale reference check**

```bash
# Check all files for references to deleted items
grep -rn "\/implement\b\|\/compound\b\|tdd-cycle\|subagent-driven-development\|milestone-review\|rule-evolution\|requesting-code-review\|receiving-code-review" \
  --include="*.md" --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git \
  --exclude="*design-review-pivot*" --exclude="*2026-04-13*" \
  . || echo "No stale references found"
```

Expected: No matches (excluding the design doc itself and this plan)

- [ ] **Step 4: Review git log for coherent history**

```bash
git log --oneline -10
```

Expected: 8-10 clean commits telling the story of the pivot.

- [ ] **Step 5: Commit any final fixes**

If Step 2 or 3 revealed issues, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve remaining stale references from design+review pivot"
```

- [ ] **Step 6: Final status check**

```bash
git status
git diff --stat main
```

Expected: Clean working tree, all changes committed.
