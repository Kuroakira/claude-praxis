---
name: implement
description: >-
  Implement from Design Doc — Axes Table, per-axis evaluation, TDD per task, graduated review.
  TRIGGER when: (1) user asks to implement or build a feature, (2) user asks to create an
  implementation plan from a Design Doc, (3) user asks to work through or execute a Design Doc.
  BLOCKING REQUIREMENT: invoke this skill BEFORE writing any plan document, analysis, or code.
  Do NOT create plan documents or claudedocs files directly — Phase 1 of this skill generates
  the plan with mandatory Axes Table and per-axis evaluation.
  NOT the same as /plan — /plan is lightweight and skips Axes Table and per-axis evaluation.
disable-model-invocation: false
---

Orchestrate the **Implementation Workflow**.

This is an end-to-end workflow. Execute all phases sequentially. Human input is requested at specific points marked below.

## Phase 1: Planning

Planning creates an implementation-specific plan distinct from the Design Doc's phase/task structure. Even if the Design Doc already defines phases and tasks, this planning step is required because:
- The Design Doc defines WHAT to build. The implementation plan defines HOW (file paths, test ordering, verification steps)
- Final Review must be an explicit task in every plan — the Design Doc does not include this
- The plan must be presented to the human for approval before execution begins

### Step 1: Gather Context

1. **Read the Design Doc**: Understand the full scope and design decisions. If no Design Doc exists (direct implementation request), read the codebase to understand scope and create the plan from the user's intent
2. **Scout the codebase**: Invoke `workflow-planner` for codebase exploration:

   Invoke `workflow-planner` with:

   | Parameter | Value |
   |-----------|-------|
   | `task` | Plan implementation of [Design Doc topic] |
   | `domain` | implement |
   | `domain_context` | Task decomposition (PR-sized ~500 lines), dependency analysis, TDD. Security-sensitive change → add security-perf to per-task review. Internal refactor → code-quality only. External dependency/infra → add error-resilience. Change that extends or modifies existing architecture → add structural-fitness to assess whether incremental modification or broader refactoring is appropriate. The mandatory Implementation Axes Table in Step 1 structurally prevents conflating Design Doc clarity with implementation approach clarity. Axes marked "Requires exploration" trigger Independent Axis Evaluation (per-axis parallel agents) — see workflow-planner. |
   | `constraints` | (1) TDD mandatory for all tasks. (2) Final review mandatory with 3+ reviewers including devils-advocate. (3) Each task produces a reviewable, self-contained change (~500 lines). (4) Scout findings are required input for the plan. (5) Context gathering must produce an Implementation Axes Table — every implementation decision with multiple valid approaches must be enumerated with verdict (Clear winner / Requires exploration). (6) If Implementation Axes Table has "Requires exploration" axes, planner executes Independent Axis Evaluation to resolve them before plan creation. |
   | `catalog_scope` | Reviewers: spec-compliance, code-quality, simplicity, security-perf, structural-fitness, error-resilience, devils-advocate. Researchers: codebase-scout, best-practices, axis-evaluator. |

   The planner will dispatch `codebase-scout` (and optionally `best-practices` for unfamiliar patterns) to explore the codebase.

   - **Skip criteria**: Scout may be skipped ONLY when: (a) the change targets a single file explicitly specified by the user with no cross-module integration points, or (b) a Scout was dispatched in the immediately preceding task covering the same codebase area. When skipping, state the specific reason in the plan header. Generic reasons ("scope is clear", "straightforward change") are not sufficient — name the file and explain why no unknown patterns exist.

3. **Check learnings before starting**: Invoke `check-past-learnings` (role: implementation)

4. **Enumerate implementation axes (MANDATORY)** — after context gathering, produce an Implementation Axes Table covering every implementation decision where multiple valid approaches exist. This step CANNOT be skipped. Even when the Design Doc clearly defines "How" at the design level, multiple valid implementation approaches may exist for test strategy, integration ordering, refactoring scope, and dependency management.

### Implementation Axes Table (Required Context Output)

Every context gathering MUST produce this table. If the table has zero "Requires exploration" axes, state the justification explicitly — "no axes require exploration because [reason]."

| Axis | Choices | Verdict | Rationale |
|------|---------|---------|-----------|
| [implementation decision] | A: [option] / B: [option] | Clear winner (A) / Requires exploration | [why A is clearly better, OR why both are viable with genuine trade-offs] |

**Rules**:
- Every implementation decision from the context gathering must appear as an axis
- **"Requires exploration"** = both choices have genuine trade-offs that affect the implementation approach (not just cosmetic differences)
- **"Clear winner"** = one choice is objectively better with stated rationale
- A verdict of "0 axes require exploration" needs explicit justification — this conclusion cannot be reached by default
- Common axes to check (not exhaustive): test strategy (integration-heavy vs unit-heavy), implementation ordering (data layer first vs UI first), refactoring scope (minimal change vs surrounding improvement), dependency management (existing libraries vs new introduction), error handling approach

This table is a **required input** for Independent Axis Evaluation. Axes marked "Requires exploration" are resolved through per-axis parallel evaluation before Step 2.

### Step 2: Create Plan

By this point, all axes are resolved — either "Clear winner" from initial analysis or resolved through Independent Axis Evaluation. Create a single plan:

4. **Break into steps sized for ~500-line PRs**: Each step produces a reviewable, self-contained change. If a step would exceed ~500 lines, split further
5. For each step, specify:
   - Exact file paths to create or modify
   - Existing patterns and integration points (cite specific Scout findings or investigation source)
   - What tests to write FIRST (TDD — RED before GREEN)
   - Expected line count estimate
   - Verification steps (typecheck, lint, test, build)
   - Dependencies on other steps
   - **Per-task review plan**: The planner selects reviewers for each task based on content:
     - Internal refactor → Light: `code-quality` + `simplicity`
     - API change / auth → Light-Thorough: `code-quality` + `simplicity` + `security-perf`
     - External dependency / infra → Light-Thorough: `code-quality` + `simplicity` + `error-resilience`
     - `simplicity` is included in ALL per-task reviews — AI-generated code consistently trends toward unnecessary complexity
6. **TDD ordering**: Within each step, list test files before implementation files
7. **Dependency analysis and parallelization evaluation**: After defining all tasks, analyze inter-task dependencies:
   - List which tasks depend on which (shared files, output→input relationships)
   - Count the number of independent tasks (no mutual dependencies)
   - If 3+ independent tasks: evaluate `subagent-driven-development` (for implementation) or `agent-team-execution` (for research/review) and record the decision with rationale in the plan
   - If 1-2 tasks: note "sequential execution" — one line is sufficient
8. **Always include Final Review as the last task in the plan**: The plan must end with "Final Review (dispatch-reviewers, thorough)" as an explicit task. This ensures Phase 3 is visible in the plan and not skipped — especially when implementing phase-by-phase or when context is compacted during long implementations
9. For axes that went through per-axis evaluation: reference the resolved decision and rationale in the relevant task descriptions

**PAUSE**: Present the plan to the human for approval before proceeding. Include the planner's agent selection rationale (which reviewers selected for each task and why). If per-axis evaluation was executed, include the resolved axes and evaluation summary.

## Phase 2: Task Execution (repeat per task)

Before executing any task, verify that the plan includes "Final Review" as the last task. If it does not, return to Phase 1 and complete planning before proceeding.

For each task in the approved plan, execute this cycle:

### Step A: Implement with TDD

Invoke `tdd-cycle` for the RED-GREEN-REFACTOR procedure and decision point consultation pattern.

### Step B: Verify

Run the full verification suite after each task:

```bash
npm run typecheck
npm run lint
npm run test
npm run build       # if applicable
```

All four must pass before proceeding.

### Step C: Per-Task Review

After verification passes, execute the planner's per-task review plan:

- **If review tier is None**: Self-review only (check plan alignment, TDD compliance, code quality, pattern consistency, edge cases). Fix issues internally.
- **If review tier is Light or Thorough**: Invoke `dispatch-reviewers` with the planner's selected reviewers, tier, and the **changed file paths** as target (e.g., `[src/auth.ts, src/auth.test.ts]`). Do NOT include task descriptions or implementation rationale — reviewers read the files independently.

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

### Review
- tier: [none | light | thorough]
- reviewers: [catalog IDs used]

### Verification
- typecheck: PASS
- lint: PASS
- test: PASS (X tests)
- build: PASS
```

If issues are found during the auto-review, propose rule additions via `rule-evolution` skill.

**Record to progress.md**: Append an entry with decisions made during this task. Include choices made at decision points (Step A) — these entries serve as comparison material for `/understanding-check`.

```markdown
## [timestamp] — /claude-praxis:implement: Task [N] complete — [task name]
- Decision: [key implementation decisions]
- Rationale: [why — the reasoning behind the choice]
- Domain: [topic tag for future matching]
```

Proceed to the next task. Do NOT wait for human approval between tasks unless a decision point (Step A.4) requires input.

## Phase 3: Final Review (Thorough)

After ALL tasks are complete, run the full verification suite one final time across the entire changeset:

```bash
npm run typecheck
npm run lint
npm run test
npm run build       # if applicable
```

All must pass before dispatching the review team.

Invoke `dispatch-reviewers` with the planner's final review selection, using **all changed file paths** across the implementation as target. Structural floor applies: 3+ reviewers including `devils-advocate`. Typical final review: `spec-compliance` + `code-quality` + `simplicity` + `security-perf` + `devils-advocate` (+ `error-resilience` if the implementation touches external dependencies). `simplicity` is mandatory in final reviews — it catches accumulated over-engineering across tasks.

Present the final completion report using the `rules/verification.md` Completion Report template. Include the **review trace**: which reviewers were selected at each task and at the final review, and why.

**Record to progress.md**: Append an entry summarizing review findings worth remembering.

```markdown
## [timestamp] — /claude-praxis:implement: Final review complete
- Decision: [review findings and actions taken]
- Rationale: [what was learned during review]
- Domain: [topic tag for future matching]
```

**Mark Final Review complete**: After recording to progress.md, touch the Final Review marker to satisfy the Stop hook gate:

```bash
touch "/tmp/claude-praxis-markers/${sessionId}-implement-final-review"
```

where `${sessionId}` is the current session ID. This marker signals that Phase 3 completed. The Stop hook will block termination if `/implement` was invoked but this marker is absent.
