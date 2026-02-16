---
name: praxis:implement
description: Implement from Design Doc — plan, TDD per task, auto-review per task, final review
disable-model-invocation: true
---

Invoke skills `code-quality-rules` and `verification-before-completion`, then orchestrate the **Implementation Workflow**.

This is an end-to-end workflow. Execute all phases sequentially. Human input is requested at specific points marked below.

## Phase 1: Planning

Break the Design Doc into an implementation plan.

1. **Read the Design Doc**: Understand the full scope and design decisions. If no Design Doc exists (direct implementation request), read the codebase to understand scope and create the plan from the user's intent
2. **Check learnings before starting**: Read `learnings.md` and `global-learnings.md` if they exist. When a past learning is relevant, present it with its original context:
   > "Previously we chose [X] because [rationale]. Does the same assumption hold here, or has the context changed?"
3. **Break into steps sized for ~500-line PRs**: Each step produces a reviewable, self-contained change. If a step would exceed ~500 lines, split further
4. For each step, specify:
   - Exact file paths to create or modify
   - What tests to write FIRST (TDD — RED before GREEN)
   - Expected line count estimate
   - Verification steps (typecheck, lint, test, build)
   - Dependencies on other steps
5. **TDD ordering**: Within each step, list test files before implementation files
6. For plans with 3+ independent tasks, consider using `subagent-driven-development`

**PAUSE**: Present the plan to the human for approval before proceeding.

## Phase 2: Task Execution (repeat per task)

For each task in the approved plan, execute this cycle:

### Step A: Implement with TDD

1. **RED**: Write a failing test that defines the expected behavior
2. **GREEN**: Write minimal code to make the test pass
3. **REFACTOR**: Clean up while keeping tests green
4. **Consult on decision points**: When multiple valid approaches exist (library choice, data structure, error handling strategy, API design), do NOT decide silently. Present options with trade-offs:
   > "Two approaches here: A (simpler, less flexible) vs B (more setup, but extensible). Which fits better?"

### Step B: Verify

Run the full verification suite after each task:

```bash
npm run typecheck
npm run lint
npm run test
npm run build       # if applicable
```

All four must pass before proceeding.

### Step C: Auto-Review

After verification passes, self-review the task's changes:

| Check | Question |
|-------|----------|
| Plan alignment | Does the implementation match the spec from the plan? |
| TDD compliance | Were tests written BEFORE implementation code? |
| Code quality | No `as` assertions, no eslint-disable, no lazy assertions? |
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

### Verification
- typecheck: PASS
- lint: PASS
- test: PASS (X tests)
- build: PASS
```

If issues are found during the auto-review, propose rule additions via `code-quality-rules` self-evolution protocol.

Proceed to the next task. Do NOT wait for human approval between tasks unless a decision point (Step A.4) requires input.

## Phase 3: Final Review

After ALL tasks are complete:

1. Run the full verification suite one final time across the entire changeset
2. **Code review is mandatory** — invoke `/praxis:review` (dispatch a reviewer agent). This is NOT skippable
3. Address all Critical and Important review findings before declaring implementation complete
4. Present the final completion report using the `verification-before-completion` Completion Report template
