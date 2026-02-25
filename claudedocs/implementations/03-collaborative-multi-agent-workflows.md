# Implementation Plan: Collaborative Multi-Agent Workflows

Design Doc: `claudedocs/design-docs/collaborative-multi-agent-workflows.md`

## Prerequisites

- Claude Code with Task tool support
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` enabled (for Research Team — Review Teams use Task tool directly)

## Overview

5 changes across 3 commands, 1 new agent, and 2 skill updates. The core pattern: every review point gets a parallel review team with independent verification sources, and `/design` Research becomes a parallel research team.

**Changes by command:**
- `/feature-spec`: Phase 3 Draft Review → Parallel Review Team (Change 4)
- `/design`: Phase 1 Research → Parallel Research Team (Change 1) + Phase 5 Auto-Review → Parallel Review Team (Change 5)
- `/implement`: Phase 1 Scout addition (Change 3) + Phase 3 Final Review → Parallel Review Team (Change 2)

**New agent:** `agents/scout.md` (Change 3)

**Skill updates:** `agent-team-execution` + `subagent-driven-development`

---

## Step 1: Scout Agent Definition

**Goal:** Create the Scout Agent — a codebase exploration specialist reused by `/design` Research Team and `/implement` Planning phase.

### Files to Create

1. **`agents/scout.md`**

   Frontmatter:
   - name: `scout`
   - description: Codebase exploration — project structure, existing patterns, integration points, impact analysis. Read-only.
   - model: `haiku`
   - tools: `Read, Bash, Grep, Glob`
   - disallowedTools: `Write, Edit, MultiEdit, Task`
   - maxTurns: `20`

   Agent body covers:
   - Role: Explore codebase structure, identify existing patterns, find integration points, assess impact scope
   - Process: Understand scope → Map structure → Find patterns → Identify integration points → Report
   - Report format with sections: Project Structure, Existing Patterns, Integration Points, Constraints, Files to Modify
   - Constraints: Read-only, stay within maxTurns, focus on structure over deep content reading

### Dependencies

None — this is the foundation step.

### Verification

- Agent file exists with valid frontmatter
- Tools are read-only (no Write/Edit/MultiEdit)
- maxTurns is 20

---

## Step 2: /design Phase 1 — Parallel Research Team

**Goal:** Replace single-agent sequential research with 4 parallel specialized agents. Main Claude delegates entirely and synthesizes only.

### Files to Modify

1. **`commands/design.md`** — Rewrite Phase 1

   Phase 0 (Past Learnings) stays unchanged.

   New Phase 1 replaces the current single-agent research (lines 19-41). Main Claude dispatches 4 agents via Task tool in parallel and does NOT perform research itself:

   - **Agent 1 — Problem Space Researcher** (subagent_type: `claude-praxis:researcher`): Prior art, similar implementations, known challenges. Verification source: external docs, blog posts, GitHub repos.
   - **Agent 2 — Scout** (subagent_type: `claude-praxis:scout`): Project structure, existing patterns, integration points, constraints. No web search. Verification source: source code.
   - **Agent 3 — Best Practices Researcher** (subagent_type: `claude-praxis:researcher`): Ideal architecture, industry standards, well-designed OSS. Verification source: official docs, standards specs.
   - **Agent 4 — Devil's Advocate** (subagent_type: `claude-praxis:researcher`): Failure cases, anti-patterns, risks, reasons NOT to pursue proposed approaches. Verification source: postmortems, issue trackers, failure case studies.

   After all agents return, Main Claude synthesizes:
   1. Reconcile Researcher A/B recommendations against Devil's Advocate challenges
   2. Resolve contradictions explicitly
   3. Identify 2-3 candidate approaches with trade-offs
   4. Carry synthesis into Phase 2 (not raw agent outputs)

   "Record to progress.md" section stays, appended after synthesis.

### Dependencies

Step 1 (Scout agent definition exists for reference, though Phase 1 dispatches via Task tool prompt).

### Verification

- 4 parallel Task tool calls specified in Phase 1
- Main Claude does not perform web searches directly
- Synthesis step produces structured output for Phase 2
- Past learnings check (Phase 0) unchanged

---

## Step 3: /feature-spec Phase 3 — Parallel Review Team

**Goal:** Add parallel review team between draft creation and human presentation in `/feature-spec`. The human sees a draft that has already been reviewed from 4 independent perspectives.

### Files to Modify

1. **`commands/feature-spec.md`** — Split Phase 3, renumber subsequent phases

   Current Phase 3 ("Draft and Iterate") handles draft + present + iterate in one phase.

   New structure:
   - **Phase 3: Draft** — Write the draft following the template. Do NOT present yet.
   - **Phase 4: Draft Review (Parallel Review Team)** — 4 parallel reviewers check the draft before human sees it.
   - **Phase 5: Present and Iterate** — Present improved draft to human, iterate on feedback.
   - **Phase 6: Suggest Next Phase** — (renumbered from current Phase 4)

   Phase 4 reviewer composition:
   - **Reviewer A — Requirements Completeness**: User story coverage, edge cases, acceptance criteria. Verification source: product patterns, user journey maps.
   - **Reviewer B — Technical Feasibility**: Achievability within existing system, dependencies, integration points. Verification source: codebase constraints, platform specs.
   - **Reviewer C — Writing Quality**: Abstract-to-concrete structure, terminology consistency, document-quality-rules compliance. Verification source: document-quality-rules.
   - **Reviewer D — Devil's Advocate**: Scope realism, problem definition accuracy, In/Out of Scope validity. Verification source: competitor failures, requirements anti-patterns.

   After reviewers return:
   1. Incorporate Critical/Important findings into draft
   2. Note Minor findings for human judgment
   3. Then present to human in Phase 5

### Dependencies

None — independent of Steps 1-2.

### Verification

- 4 parallel Task tool calls before human presentation
- Human sees improved draft (not raw reviewer outputs)
- Phase numbering consistent throughout the file
- Save and record-to-progress steps preserved

---

## Step 4: /design Phase 5 — Parallel Review Team

**Goal:** Replace the checklist-based self-review with 4 parallel reviewers. The old checklist items are absorbed into Writing Quality reviewer.

### Files to Modify

1. **`commands/design.md`** — Rewrite Phase 5

   Current Phase 5 (lines 99-114) is a checklist table with self-review.

   New Phase 5 reviewer composition:
   - **Reviewer A — Architecture**: Design decision validity, scalability, maintainability, pattern consistency, future extensibility. Verification source: design principles, architecture patterns, well-designed OSS.
   - **Reviewer B — User Impact**: UI/UX implications, backward compatibility, migration path, user experience changes. Verification source: UX heuristics, accessibility standards, user flow impact.
   - **Reviewer C — Writing Quality**: Abstract-to-concrete structure, terminology consistency, WHY-over-HOW balance, no h4+, no ASCII diagrams, mermaid format. Verification source: design-doc-format + document-quality-rules.
   - **Reviewer D — Devil's Advocate**: Failure scenarios, assumption fragility, rejected alternative validity, missing cross-cutting concerns. Verification source: architecture failures, postmortems, over-engineering examples.

   After reviewers return:
   1. Fix Critical/Important issues before presenting to human
   2. Note Minor issues in the presentation
   3. Resolve conflicting reviewer opinions explicitly

   Old checklist items (h4+ check, ASCII diagrams, no local file links, etc.) are covered by Reviewer C's prompt. Phase 6 (Present for Human Approval) stays unchanged.

### Dependencies

None — independent of Steps 1-3.

### Verification

- 4 parallel Task tool calls in Phase 5
- All old checklist items covered by reviewer prompts (especially Reviewer C)
- Critical/Important issues fixed before human sees the doc
- Phase 6 unchanged

---

## Step 5: /implement Phase 1 + Phase 3 — Scout and Parallel Review Team

**Goal:** Add Scout dispatch to Planning phase. Replace single reviewer with parallel review team in Final Review.

### Files to Modify

1. **`commands/implement.md`** — Modify Phase 1 and rewrite Phase 3

   **Phase 1 addition:** After "Read the Design Doc" (step 1) and before "Check learnings" (step 2), insert a Scout dispatch step:
   - Dispatch a Scout agent (Task tool, subagent_type: `claude-praxis:scout`) to explore the codebase for structure, patterns, integration points, and constraints relevant to this implementation
   - Use Scout findings to inform the plan

   **Phase 3 rewrite:** Replace current single reviewer dispatch (lines 104-118) with parallel review team:
   - **Reviewer A — Spec Compliance**: Code matches Design Doc/Plan, all requirements addressed. Verification source: Design Doc and Plan.
   - **Reviewer B — Code Quality**: code-quality-rules compliance, pattern consistency, test quality, YAGNI. Verification source: code-quality-rules and project conventions.
   - **Reviewer C — Security + Performance**: OWASP Top 10, input validation, injection risks, algorithmic complexity, N+1 queries, bundle size. Verification source: OWASP Top 10, profiling patterns.
   - **Reviewer D — Devil's Advocate**: Missing edge cases, production failure points, hidden technical debt. Verification source: bug patterns, regression examples, incident case studies.

   After reviewers return:
   1. Synthesize unified review report
   2. Address all Critical/Important findings
   3. Present final completion report via `verification-before-completion` template

   Phase 2 (Task Execution with SDD) stays completely unchanged.

### Dependencies

Step 1 (Scout agent definition for reference).

### Verification

- Phase 1 includes Scout dispatch before planning
- Phase 3 dispatches 4 parallel reviewers
- Phase 2 (SDD task execution) untouched
- Critical/Important issues addressed before completion claim

---

## Step 6: Update agent-team-execution Skill

**Goal:** Add "Parallel Review Teams" section documenting the standardized review team pattern used across all workflows.

### Files to Modify

1. **`skills/agent-team-execution/SKILL.md`** — Add section 4

   New section "4. Parallel Review Teams" after section 3 (Competing Hypothesis Debugging):
   - Explains why teams beat checklists (attention resource competition)
   - Documents 3 team compositions: Code Review, Document Review, Spec Review (as tables)
   - States the independent verification source principle
   - Explains Devil's Advocate mandatory inclusion
   - Adds prompt template for dispatching a review team

   Update the Integration section to reference the new review team patterns.

   Update the Cost Awareness table to include review teams.

### Dependencies

Steps 2-5 (patterns are documented from those implementations).

### Verification

- New section documents all 3 review team compositions
- Independent verification source principle is explicit
- Integration and Cost sections updated

---

## Step 7: Update subagent-driven-development Skill

**Goal:** Update SDD to reference parallel review teams for Final Review instead of single reviewer.

### Files to Modify

1. **`skills/subagent-driven-development/SKILL.md`**

   Changes:
   - Pipeline diagram: "After all tasks" references parallel review team instead of single integration review
   - "Choosing the Right Execution Model" table: update Code review row to reference Parallel Review Team
   - Integration section: add reference to `agent-team-execution` § Parallel Review Teams

   Per-task reviews (Stage 1 Spec Compliance + Stage 2 Code Quality) stay unchanged — the design doc explicitly states per-task review is lightweight and team overhead would exceed benefit.

### Dependencies

Step 6 (references the new agent-team-execution section).

### Verification

- SDD references parallel review team for final review
- Per-task reviews unchanged
- No contradiction with agent-team-execution skill

---

## Implementation Order and Dependencies

```
Step 1: Scout Agent              ← foundation, no dependencies
  ↓
Step 2: /design Research Team    ← uses Scout concept
Step 3: /feature-spec Review     ← independent
Step 4: /design Review Team      ← independent
Step 5: /implement Scout+Review  ← uses Scout concept
  ↓
Step 6: agent-team-execution     ← documents patterns from Steps 2-5
  ↓
Step 7: SDD update               ← references Step 6
```

**Parallelizable groups:**
- Group A: Step 1 (must complete first)
- Group B: Steps 2, 3, 4, 5 (all parallel after Step 1)
- Group C: Steps 6, 7 (sequential, after Group B)

## Backward Compatibility

- External interfaces unchanged: human approval points, output formats, file save locations all stay the same
- If `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is disabled: Research Team falls back to single researcher. Review Teams use standard Task tool parallel calls (no flag needed)
- Per-task SDD reviews unchanged — only the Final Review becomes team-based

## Cost Impact

| Workflow | Before | After | When |
|----------|--------|-------|------|
| `/feature-spec` | 1x | ~5-8x | Draft Review only (1 round) |
| `/design` Research | 1x | ~5-8x | Research phase only |
| `/design` Auto-Review | 1x (self) | ~5-8x | Auto-Review only (1 round) |
| `/implement` Final Review | ~2-3x | ~5-8x | Final Review only |
