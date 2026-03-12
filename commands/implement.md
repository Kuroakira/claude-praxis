---
name: implement
description: >-
  Implement from Design Doc — Axes Table, per-axis evaluation, TDD per task, graduated review.
  TRIGGER when: (1) user asks to implement or build a feature, (2) user asks to create an
  implementation plan from a Design Doc, (3) user asks to work through or execute a Design Doc.
  BLOCKING REQUIREMENT: invoke this command BEFORE writing any plan document, analysis, or code.
  Do NOT create plan documents or claudedocs files directly — Phase 1 of this command generates
  the plan with mandatory Axes Table and per-axis evaluation.
  NOT the same as /plan — /plan is lightweight and skips Axes Table and per-axis evaluation.
disable-model-invocation: false
---

Orchestrate the **Implementation Workflow** using Phase Group Subagents.

This is an end-to-end workflow. The orchestrator dispatches phase groups as isolated Task subagents, communicating via durable files. Execute groups sequentially — each group's output feeds the next group's input. Human input is requested at specific points marked below.

## Phase Group Architecture

The workflow splits into 4 groups (G0-G3) and 1 in-context execution zone (Phase 2). G0 and G3 run **in the orchestrator's context** (lightweight, require direct human interaction). G1 and G2 run as **Task subagents** with isolated context windows. Phase 2 runs in the orchestrator's context as a task loop controller.

```mermaid
graph TD
    O[Orchestrator] -->|in-context| G0[G0: Init + Learnings]
    G0 -->|learnings context| O
    O -->|dispatch + learnings| G1[G1: Full Phase 1<br/>Planning Pipeline]
    G1 -->|plan file, axes-table,<br/>analysis report,<br/>reasoning-log-g1| O
    O -->|read plan file| PAUSE[PAUSE: Human<br/>Approves Plan]
    PAUSE -->|plan file path| P2[Phase 2: Task Loop<br/>in-context]
    P2 -->|changed-files list| O
    O -->|dispatch +<br/>changed-files path| G2[G2: Final Review]
    G2 -->|review-findings,<br/>reasoning-log-g2| O
    O -->|in-context| G3[G3: Present +<br/>Completion Report]
```

**Orchestrator principles**:
- Pass **file paths**, not file contents, between groups
- Do NOT read full file contents — structural validation only (file existence + section headers). Exception: PAUSE reads the plan file to present to the human
- Write progress.md entries after each group completes (subagents do not write progress.md)
- The orchestrator manages reasoning-log lifecycle: delete reasoning-log-g1 after G2 succeeds
- All intermediate files (`reasoning-log-g1.md`, `reasoning-log-g2.md`, `review-findings.md`, `changed-files.md`) are written to `claudedocs/plans/wip/`. This directory is created at G0 and cleaned up at G3. Permanent artifacts (plan file, axes-table, analysis report) go to their standard locations

## G0: Check Past Learnings + Workspace Init (in-context)

Runs in the orchestrator's context. Two responsibilities: initialize the workspace and check past learnings.

**Workspace initialization**: Create the working directory `claudedocs/plans/wip/`. If it already exists (from a previous run), delete its contents to ensure a clean workspace.

**Learnings check**: Invoke `check-past-learnings` (role: implementation). Carry relevant learnings forward into G1's dispatch prompt as constraints or starting points.

## Plan Detection (after G0)

After G0 completes, check whether a plan file already exists:

**Skip condition**: A plan file path is provided as input to `/implement` AND the user has indicated familiarity with the plan (e.g., explicitly asked to implement from a specific plan, or read the plan in the current conversation before invoking `/implement`).

**When skip condition is met**:
1. **Validate the existing plan structurally**: Check the plan file exists, contains task definitions with file paths, and includes "Final Review" as the last task
2. **Verify topic alignment**: Confirm the plan's topic matches the current implementation request. If the plan targets a different feature or Design Doc, the skip condition is NOT met — proceed to G1
3. **Skip G1 entirely** — no architecture analysis, no scout, no axes enumeration, no plan review
4. **Skip PAUSE** — the user has already seen and approved the plan
5. **Check per-task review plans**: Verify that each task in the plan contains a per-task review specification (e.g., `### Per-Task Review` with reviewer IDs and tier). If any tasks lack per-task review plans, warn the human: "Plan lacks per-task review specifications for [N] tasks. Phase 2 Step C will apply baseline reviewers (code-quality + simplicity + general-review + devils-advocate)." Proceed — the Step C fallback handles missing review specs
6. If an axes-table file exists alongside the plan, delete it (it would normally be deleted after PAUSE approval)
7. Proceed directly to **Phase 2**

**Freshness note**: The skip path assumes the codebase has not changed significantly since the plan was created. If the plan references files that no longer exist or patterns that have changed, tasks will fail during Phase 2 — at which point the orchestrator should surface the failure and suggest re-planning (re-dispatch G1).

**When skip condition is NOT met**: Proceed to G1 as normal.

This skip path exists because planning is the most context-intensive phase. When the user has already invested effort in reading and approving a plan, re-running the planning pipeline wastes context and time without adding value.

## G1: Full Phase 1 Planning Pipeline (subagent)

The most context-intensive group. Executes the entire planning pipeline — architecture analysis, codebase scouting, axes enumeration, plan creation, and plan review — within a single isolated subagent. This includes architecture-analysis internally (unlike `/design` which separates it as G2) because `/implement`'s planning forms a tightly coupled pipeline: analysis→scout→axes→plan.

### Dispatch

Dispatch a `general-purpose` Task subagent with the following task prompt. The prompt must be **self-contained** — the subagent starts with a clean context and has no access to the orchestrator's conversation history.

**Input** (embedded in task prompt):
- Topic: The implementation topic from the user's request
- Design Doc path: Path to the Design Doc (if exists)
- Learnings context: Output from G0 (relevant past learnings, carried as text)
- Rules constraints: Reference to `rules/code-quality.md` for code quality rules

**Task prompt template**:

> You are executing Phase Group G1 of the `/implement` workflow: **Full Phase 1 Planning Pipeline**.
>
> **Topic**: [topic]
>
> **Design Doc**: [Design Doc path, or "No Design Doc — implement from user's intent"]
>
> **Past learnings context**: [learnings from G0, or "No relevant learnings found"]
>
> Execute the following steps:
>
> **Step 1: Read the Design Doc**
>
> If a Design Doc path is provided, read it to understand the full scope and design decisions. If no Design Doc exists, understand scope from the topic description and create the plan from the user's intent.
>
> **Step 2: Analyze Architecture**
>
> Invoke `architecture-analysis` with:
> - `scope`: Derived from the Design Doc's affected areas (or from the topic if no Design Doc)
> - `anticipated_changes`: From the Design Doc's proposal (or from the topic description)
>
> The skill handles registry lookup internally — if a recent analysis of the same scope exists, it returns the existing report without re-running the full analysis. The analysis produces a durable report at `claudedocs/analysis/[scope-name].md`.
>
> **Step 3: Scout the Codebase**
>
> Invoke `workflow-planner` for codebase exploration:
>
> | Parameter | Value |
> |-----------|-------|
> | `task` | Plan implementation of [topic] |
> | `domain` | implement |
> | `domain_context` | Task decomposition (PR-sized ~500 lines), dependency analysis, TDD. Security-sensitive change → add security-perf to per-task review. Internal refactor → code-quality only. External dependency/infra → add error-resilience. Change that extends or modifies existing architecture → add structural-fitness. The mandatory Implementation Axes Table structurally prevents conflating Design Doc clarity with implementation approach clarity. Axes marked "Requires exploration" trigger Independent Axis Evaluation (per-axis parallel agents) — see workflow-planner. |
> | `constraints` | (1) TDD mandatory for all tasks. (2) Final review mandatory with 3+ reviewers including devils-advocate. (3) Each task produces a reviewable, self-contained change (~500 lines). (4) Scout findings are required input for the plan. (5) Context gathering must produce an Implementation Axes Table — every implementation decision with multiple valid approaches must be enumerated with verdict (Clear winner / Requires exploration). (6) If Implementation Axes Table has "Requires exploration" axes, planner executes Independent Axis Evaluation to resolve them before plan creation. |
> | `catalog_scope` | Reviewers: spec-compliance, code-quality, simplicity, general-review, security-perf, structural-fitness, axes-coherence, error-resilience, devils-advocate. Researchers: codebase-scout, best-practices, axis-evaluator. |
>
> The planner will dispatch `codebase-scout` (and optionally `best-practices` for unfamiliar patterns) to explore the codebase.
>
> **Skip criteria**: Scout may be skipped ONLY when: (a) the change targets a single file explicitly specified with no cross-module integration points, or (b) a Scout was dispatched in the immediately preceding task covering the same codebase area. When skipping, state the specific reason in the plan header. Generic reasons ("scope is clear", "straightforward change") are not sufficient — name the file and explain why no unknown patterns exist.
>
> **Step 4: Enumerate Implementation Axes (MANDATORY)**
>
> After context gathering, produce an Implementation Axes Table covering every implementation decision where multiple valid approaches exist. This step CANNOT be skipped.
>
> | Axis | Choices | Verdict | Rationale |
> |------|---------|---------|-----------|
> | [implementation decision] | A: [option] / B: [option] | Clear winner (A) / Requires exploration | [why A is clearly better, OR why both are viable] |
>
> Rules:
> - Every implementation decision from the context gathering must appear as an axis
> - "Requires exploration" = both choices have genuine trade-offs that affect the implementation approach
> - "Clear winner" = one choice is objectively better with stated rationale
> - A verdict of "0 axes require exploration" needs explicit justification
> - Common axes: test strategy, implementation ordering, refactoring scope, dependency management, error handling approach
>
> If any axes require exploration, the planner will execute Independent Axis Evaluation (per-axis parallel agents) to resolve them.
>
> **Step 5: Create Plan**
>
> By this point, all axes are resolved. Create a single plan:
>
> 1. Break into steps sized for ~500-line PRs — each produces a reviewable, self-contained change
> 2. For each step specify: exact file paths, existing patterns (cite Scout findings), tests to write FIRST (TDD), expected line count, verification steps, dependencies, per-task review plan
> 3. Per-task review plan selection (all tasks get **thorough** tier):
>    - Baseline (ALL tasks): `code-quality` + `simplicity` + `general-review` + `devils-advocate`
>    - API change / auth → add `security-perf`
>    - External dependency / infra → add `error-resilience`
>    - `simplicity`, `general-review`, and `devils-advocate` are included in ALL per-task reviews
> 4. TDD ordering: list test files before implementation files within each step
> 5. Dependency analysis: identify sequential vs parallel tasks. If 3+ independent: evaluate `subagent-driven-development`. If 1-2: note "sequential execution"
> 6. Always include "Final Review (dispatch-reviewers, thorough)" as the last task
>
> **Step 6: Plan Review**
>
> Save the plan to `claudedocs/plans/[name]-plan.md` and the resolved Axes Table to `claudedocs/plans/[name]-axes-table.md`.
>
> Invoke `dispatch-reviewers` with:
> - **Reviewers**: `axes-coherence` + `simplicity` + `devils-advocate` + `spec-compliance` (if Design Doc exists) + `structural-fitness` (if the plan involves extending or restructuring existing architecture)
> - **Tier**: thorough
> - **Target**: both file paths (plan + axes table)
>
> If the review flags critical or important issues — axes contradictions, over-engineered decomposition, missing Design Doc coverage, questionable fundamental direction, or structural fitness concerns — revise the plan and update the Axes Table before proceeding.
>
> **Write output files**:
>
> 1. Plan file at `claudedocs/plans/[name]-plan.md` — the reviewed and revised plan
> 2. Axes Table file at `claudedocs/plans/[name]-axes-table.md` — the resolved axes
> 3. Analysis report at `claudedocs/analysis/[scope-name].md` (saved by `architecture-analysis` skill)
> 4. `reasoning-log-g1.md` at `claudedocs/plans/wip/` — Must contain:
>    - `## Key Decisions` — What was decided during planning
>    - `## Alternatives Considered` — Approaches rejected and why
>    - `## Rationale` — The reasoning chain for the chosen plan structure
>
> Do NOT write to progress.md — the orchestrator handles that.

### Orchestrator post-G1

After G1 completes:
1. **Validate** output per the Validation Protocol (check plan file, axes-table file, analysis report, and reasoning-log-g1.md)
2. **Record to progress.md**:

```markdown
## [timestamp] — /claude-praxis:implement: G1 complete — Planning Pipeline
- Decision: [key plan structure decisions, from subagent return summary]
- Rationale: [why certain approaches were selected]
- Domain: [topic tag for future matching]
```

3. Proceed to PAUSE

## PAUSE: Human Approves Plan

**This is where the workflow pauses for human input on the plan.**

Read the plan file — this is the one exception where the orchestrator reads full file content, because presentation to the human requires it. Present to the human with:

1. The full implementation plan
2. The planner's agent selection rationale (which reviewers selected for each task and why)
3. If per-axis evaluation was executed, the resolved axes and evaluation summary
4. If axes-coherence flagged issues, what was revised and why
5. Explicit request for approval: "Implementation plan ready for review. Approve to proceed, or share feedback for revision."

**If the human requests changes**: Clean up G1's output files from `claudedocs/plans/wip/` (reasoning-log-g1.md) before re-dispatching. Re-dispatch G1 with revision context describing what to change. Validate and present the revised plan.

**After approval**: Delete the axes-table file (`claudedocs/plans/[name]-axes-table.md`). Proceed to Phase 2.

## Phase 2: Task Execution Loop (in-context)

The orchestrator runs as the task loop controller in its own context. This zone stays in-context to preserve tdd-cycle's human interaction points (Decision Point Consultation, Structural Friction Check).

Before executing any task, verify that the plan includes "Final Review" as the last task. If it does not, return to G1 and complete planning before proceeding.

If the plan contains only the Final Review task (zero implementation tasks), create an empty `claudedocs/plans/wip/changed-files.md` and proceed directly to G2.

For each task in the approved plan (excluding the Final Review task, which is handled by G2+G3), execute this cycle:

### Step A: Implement with TDD

Invoke `tdd-cycle` for the RED-GREEN-REFACTOR procedure and decision point consultation pattern.

For independent tasks (no mutual dependencies with other pending tasks), evaluate `subagent-driven-development` for parallel execution. For dependent tasks, execute in-context sequentially.

### Step B: Verify

Run the full verification suite after each task:

```bash
npm run typecheck
npm run lint
npm run test
npm run build       # if applicable
```

All four must pass before proceeding.

### Step C: Per-Task Review (MANDATORY)

After verification passes, invoke the per-task review. This step cannot be skipped regardless of whether the plan specifies per-task reviewers.

**Determine reviewers**: Read the task's per-task review plan from the plan file (typically a `### Per-Task Review` section within each task). If the plan specifies reviewers, use them. If the plan does not specify per-task reviewers for this task, apply the baseline:

- Baseline (ALL tasks): `code-quality` + `simplicity` + `general-review` + `devils-advocate`
- API change / auth → add `security-perf`
- External dependency / infra → add `error-resilience`

Invoke `dispatch-reviewers` with the determined reviewers, tier (**thorough** for all tasks), and the **changed file paths** as target (e.g., `[src/auth.ts, src/auth.test.ts]`). Do NOT include task descriptions or implementation rationale — reviewers read the files independently.

Self-review checklist (applies regardless of tier):

| Check | Question |
|-------|----------|
| Plan alignment | Does the implementation match the spec from the plan? |
| TDD compliance | Were tests written BEFORE implementation code? |
| Code quality | No `as` assertions, no eslint-disable, no lazy assertions? |
| Simplicity | Could any abstraction, wrapper, or indirection be removed without losing functionality? Are functions short and flat (guard clauses over nesting)? |
| Pattern consistency | Does the code follow existing project patterns? |
| Edge cases | Are boundary conditions and error paths handled? |

If issues are found, fix them (return to Step A), re-verify (Step B), then re-review.

### Step D: Report and Proceed

Present a brief task completion report:

```markdown
## Task [N] Complete: [task name]

### Changes
- [file list with brief description]

### Key Decisions
- [decision]: [choice] — because [reason]

### Review (MANDATORY — Step C must have run)
- tier: [thorough]
- reviewers: [catalog IDs used]
- source: [plan-specified | baseline-fallback]

### Verification
- typecheck: PASS
- lint: PASS
- test: PASS (X tests)
- build: PASS
```

The `### Review` section is mandatory — it records which reviewers ran and at what tier. If Step C applied the baseline fallback (plan lacked per-task review specs), record `source: baseline-fallback`. If the plan specified reviewers, record `source: plan-specified`. A task completion report without a `### Review` section indicates Step C was skipped — this is a workflow violation.

If issues are found during the auto-review, propose rule additions via `rule-evolution` skill.

**Update changed-files list**: Append this task's changed file paths to `claudedocs/plans/wip/changed-files.md`:

```markdown
## Task [N]: [task name]
- [file path] — [brief description]
```

**Record to progress.md**: Append an entry with decisions made during this task. Include choices made at decision points (Step A) — these entries serve as comparison material for `/understanding-check`.

```markdown
## [timestamp] — /claude-praxis:implement: Task [N] complete — [task name]
- Decision: [key implementation decisions]
- Rationale: [why — the reasoning behind the choice]
- Domain: [topic tag for future matching]
```

**Update plan document**: Mark the completed task in the plan file (`claudedocs/plans/[name]-plan.md`). Prepend `[DONE]` to the task heading and append the completion timestamp. This keeps the plan as a living document that reflects actual progress:

```markdown
## [DONE] Task 1: Setup project structure (completed 2025-01-15T10:30)
```

**PAUSE after every task**: Present the task completion report and wait for the human to acknowledge before proceeding to the next task:

> "Task [N] complete. Ready to continue to Task [N+1], or do you want to review the changes first?"

Always wait for the human's response. Do NOT proceed to the next task automatically. This gate exists because large implementations benefit from incremental human review — the human can inspect changes while context is fresh, catch issues early, and steer direction before more code is built on top.

## G2: Final Review (subagent)

Dispatches 3+ reviewers against all changed files. The reviewers read the files independently and form fresh judgment in a clean context window.

### Pre-dispatch Verification

Before dispatching, run the full verification suite one final time across the entire changeset:

```bash
npm run typecheck
npm run lint
npm run test
npm run build       # if applicable
```

All must pass before dispatching the review team.

### Dispatch

Dispatch a `general-purpose` Task subagent.

**Input** (as file path in task prompt):
- Changed-files list path: `claudedocs/plans/wip/changed-files.md`

**Task prompt template**:

> You are executing Phase Group G2 of the `/implement` workflow: **Final Review**.
>
> **Input file**: Changed-files list at `[changed-files.md path]`
>
> **Execute**:
>
> Read the changed-files list to identify all files that were modified during implementation.
>
> This is a **thorough** review — structural floor applies (3+ reviewers including `devils-advocate`).
>
> Invoke `dispatch-reviewers` with:
> - **Reviewers**: `spec-compliance` + `code-quality` + `simplicity` + `general-review` + `devils-advocate` (+ `security-perf` if the implementation touches auth/security, + `error-resilience` if external dependencies)
> - **Tier**: thorough
> - **Target**: All changed file paths from the changed-files list
>
> `simplicity` is mandatory in final reviews — it catches accumulated over-engineering across tasks.
>
> Do NOT include summaries or implementation rationale in the reviewer dispatch — reviewers read the files independently.
>
> **Write output files**:
>
> 1. `review-findings.md` at `claudedocs/plans/wip/` — Consolidated review results. Include:
>    - Each reviewer's findings (pass/fail with specifics)
>    - Severity ratings per finding
>    - Whether any critical or important issues require revision
>
> 2. `reasoning-log-g2.md` at `claudedocs/plans/wip/` — Must contain:
>    - `## Key Decisions` — Reviewer selection rationale
>    - `## Alternatives Considered` — Other reviewer combinations considered
>    - `## Rationale` — Why this reviewer set for this implementation
>
> Do NOT write to progress.md — the orchestrator handles that.

### Orchestrator post-G2

After G2 completes:
1. **Validate** — Check `review-findings.md` and `reasoning-log-g2.md` exist in `claudedocs/plans/wip/`
2. **Delete** `reasoning-log-g1.md` from `claudedocs/plans/wip/` (G1's reasoning-log — G2 has succeeded, so G1's log is no longer needed). If already deleted or G1 was skipped, skip this step
3. **Record to progress.md**:

```markdown
## [timestamp] — /claude-praxis:implement: G2 complete — Final Review
- Decision: [review outcome — pass or issues found]
- Rationale: [summary of reviewer findings]
- Domain: [topic tag]
```

4. Proceed to G3

## G3: Present + Completion Report (in-context)

Runs in the orchestrator's context. Read `review-findings.md` and the plan file. This is the final presentation phase.

1. **Present review findings**: Read `claudedocs/plans/wip/review-findings.md` and present to the human with:
   - Summary of review findings
   - Any critical issues that need attention
   - **Review trace**: Which reviewers were selected at each task and at the final review, and why

2. **Re-run verification**: Run the full verification suite to produce fresh evidence for the Completion Report (per `rules/verification.md` Iron Law — no claims without fresh evidence):

```bash
npm run typecheck
npm run lint
npm run test
npm run build       # if applicable
```

3. **Completion Report**: Present using the `rules/verification.md` template:

```markdown
## Completion Report

### Verification
- typecheck: [PASS/FAIL + key output]
- lint: [PASS/FAIL + key output]
- test: [PASS/FAIL + count]
- build: [PASS/FAIL or N/A]

### Summary
[What was changed and why]

### Next Phase
→ [Next phase suggestion per verification.md lookup table]
```

4. **Record to progress.md**:

```markdown
## [timestamp] — /claude-praxis:implement: Final review complete
- Decision: [review findings and actions taken]
- Rationale: [what was learned during review]
- Domain: [topic tag for future matching]
```

5. **Mark Final Review complete**: Touch the marker file:

```bash
touch "/tmp/claude-praxis-markers/${sessionId}-implement-final-review"
```

where `${sessionId}` is the current session ID. This marker signals that Phase 3 completed. The Stop hook will block termination if `/implement` was invoked but this marker is absent.

6. **Cleanup**: Delete the `claudedocs/plans/wip/` directory and its contents (reasoning-logs, review-findings, changed-files list). Permanent artifacts remain: plan file in `claudedocs/plans/`, analysis report in `claudedocs/analysis/`.

---

## Data Contracts

| Group | Required Input | Required Output | Reasoning-Log |
|-------|---------------|-----------------|---------------|
| G0 (in-context) | Topic from user, Design Doc path (optional) | Learnings context (stays in orchestrator), `claudedocs/plans/wip/` directory | None |
| G1 (subagent) | Topic, learnings context, Design Doc path, rules constraints | Plan file (`claudedocs/plans/`), Axes Table file (`claudedocs/plans/`), analysis report (`claudedocs/analysis/`) | `reasoning-log-g1.md` |
| PAUSE (in-context) | Plan file path | Human approval or revision request | None |
| Phase 2 (in-context) | Plan file path | Changed files (filesystem), progress.md entries, changed-files list (`claudedocs/plans/wip/changed-files.md`) | None |
| G2 (subagent) | Changed-files list path | `review-findings.md` | `reasoning-log-g2.md` |
| G3 (in-context) | `review-findings.md` path, plan file path | Completion Report, Final Review marker | None |

Inputs are passed as **file paths** in the subagent's task description. Subagents read input files independently — the orchestrator does not embed file contents in dispatch prompts. Exception: G1 receives topic and learnings as text (G0 output is lightweight and stays in orchestrator context).

**Phase 2→G2 changed-files contract**: The orchestrator accumulates changed file paths to `claudedocs/plans/wip/changed-files.md` after each task in Phase 2. This file is G2's sole input — it replaces the implicit context-based handoff.

## Orchestrator Validation Protocol

After each subagent group (G1, G2) completes, the orchestrator performs structural validation before proceeding. The orchestrator does NOT evaluate content quality — that is handled by review tiers within each group.

### Validation checks

1. **File existence** — All required output files exist
2. **Section headers** — Output files contain required section headers (read only the first ~50 lines or use grep for `## ` headers, do NOT read full content)
3. **Non-empty** — Files are not empty or truncated (check file size > 0)

### Per-group required outputs

| Group | Required Files | Required Sections |
|-------|---------------|-------------------|
| G1 | Plan file in `claudedocs/plans/`, axes-table file in `claudedocs/plans/`, analysis report in `claudedocs/analysis/`, `reasoning-log-g1.md` in `claudedocs/plans/wip/` | Plan: task definitions with file paths. Axes Table: axis/choices/verdict/rationale columns |
| G2 | `review-findings.md` in `claudedocs/plans/wip/`, `reasoning-log-g2.md` in `claudedocs/plans/wip/` | review-findings.md: reviewer results with severity ratings |

If validation fails, follow the Error Recovery Protocol.

## Error Recovery Protocol

When a subagent group produces invalid output (missing files, missing sections, empty files):

1. **Clean up partial outputs**: Delete all output files from the failed group before re-dispatching. This prevents the new subagent instance from finding stale or partial files from the previous attempt
2. **First failure**: Re-dispatch the same group with the original input PLUS error context describing what was missing and why validation failed. The new subagent instance uses the error context to avoid the same failure
3. **Second failure** (same group fails twice): Escalate to the human. Present: which group failed, what was expected, what was produced, and the error context from both attempts. Do NOT attempt a third re-dispatch

The orchestrator cannot fix failures in-context — it lacks the phase-specific context that the subagent had. Re-dispatch is the only recovery mechanism.

## Reasoning-Log and progress.md Notes

**Reasoning-logs** are temporary files (`reasoning-log-g[N].md`) recording the judgment chain within each subagent. Format: `## Key Decisions`, `## Alternatives Considered`, `## Rationale`. Created by subagents in `claudedocs/plans/wip/`, deleted by the orchestrator after the downstream group succeeds:

- `reasoning-log-g1.md`: deleted after G2 succeeds (Orchestrator post-G2). Skipped if G1 was skipped via Plan Detection
- `reasoning-log-g2.md`: deleted during G3 cleanup (wip directory cleanup)
- Any remaining reasoning-logs are deleted during G3 cleanup

**progress.md** entries are written by the orchestrator (not subagents) after each group and each task completes. The format is shown in each group's "Orchestrator post-GN" and Phase 2 Step D sections.
