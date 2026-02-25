---
name: implement
description: Implement from Design Doc — plan, TDD per task, auto-review per task, final review
disable-model-invocation: false
---

Invoke skills `code-quality-rules` and `verification-before-completion`, then orchestrate the **Implementation Workflow**.

This is an end-to-end workflow. Execute all phases sequentially. Human input is requested at specific points marked below.

## Phase 1: Planning

Break the Design Doc into an implementation plan.

1. **Read the Design Doc**: Understand the full scope and design decisions. If no Design Doc exists (direct implementation request), read the codebase to understand scope and create the plan from the user's intent
2. **Scout the codebase**: Dispatch a Scout agent (Task tool, subagent_type: `claude-praxis:scout`) to explore the codebase for project structure, existing patterns, integration points, and constraints relevant to this implementation. Use the Scout's findings to inform the plan
3. **Check learnings before starting**: Read `.claude/context/learnings-design.md`, `.claude/context/learnings-coding.md`, and `~/.claude/learnings/global-learnings.md` if they exist. When a past learning is relevant, present it with its original context:
   > "Previously we chose [X] because [rationale]. Does the same assumption hold here, or has the context changed?"
4. **Break into steps sized for ~500-line PRs**: Each step produces a reviewable, self-contained change. If a step would exceed ~500 lines, split further
5. For each step, specify:
   - Exact file paths to create or modify
   - What tests to write FIRST (TDD — RED before GREEN)
   - Expected line count estimate
   - Verification steps (typecheck, lint, test, build)
   - Dependencies on other steps
6. **TDD ordering**: Within each step, list test files before implementation files
7. For plans with 3+ independent tasks, consider using `subagent-driven-development`

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

**Record to progress.md**: Append an entry with decisions made during this task.

```markdown
## [timestamp] — /claude-praxis:implement: Task [N] complete — [task name]
- Decision: [key implementation decisions]
- Rationale: [why — the reasoning behind the choice]
- Domain: [topic tag for future matching]
```

Proceed to the next task. Do NOT wait for human approval between tasks unless a decision point (Step A.4) requires input.

## Phase 3: Final Review (Parallel Review Team)

After ALL tasks are complete:

1. Run the full verification suite one final time across the entire changeset
2. Dispatch 4 parallel reviewers to check the implementation from independent perspectives:

**Reviewer A — Spec Compliance** (subagent_type: `claude-praxis:reviewer`)
> Review this implementation for spec compliance. Does the code match the Design Doc/Plan exactly? Are all requirements addressed? Are there deviations from the spec? Report any gaps or mismatches.

Verification source: Design Doc and implementation Plan.

**Reviewer B — Code Quality** (subagent_type: `claude-praxis:reviewer`)
> Review this implementation for code quality. Check: code-quality-rules compliance, pattern consistency with existing project, test quality (no lazy assertions, TDD followed), YAGNI adherence, appropriate error handling.

Verification source: code-quality-rules and project conventions.

**Reviewer C — Security + Performance** (subagent_type: `claude-praxis:reviewer`)
> Review this implementation for security and performance. Check: OWASP Top 10 vulnerabilities, input validation at boundaries, injection risks, data exposure, algorithmic complexity, unnecessary allocations, N+1 queries, bundle size impact. Severity-rate each finding.

Verification source: OWASP Top 10, performance profiling patterns.

**Reviewer D — Devil's Advocate (Edge Cases + Risks)** (subagent_type: `claude-praxis:reviewer`)
> Challenge this implementation. What edge cases are missing? Where will this break first in production? What hidden technical debt is being introduced? Even if other reviews pass, what could still go wrong?

Verification source: Bug report patterns, regression examples, production incident case studies.

3. Synthesize all review findings into a unified report with final severity ratings
4. Address all Critical and Important findings before declaring implementation complete
5. Present the final completion report using the `verification-before-completion` Completion Report template

**Record to progress.md**: Append an entry summarizing review findings worth remembering.

```markdown
## [timestamp] — /claude-praxis:implement: Final review complete
- Decision: [review findings and actions taken]
- Rationale: [what was learned during review]
- Domain: [topic tag for future matching]
```
