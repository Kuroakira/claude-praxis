---
name: subagent-driven-development
description: Use when executing an implementation plan with multiple independent tasks that benefit from isolated context per task.
---

# Subagent-Driven Development

AI ensures quality. You ensure understanding.

Dispatch a fresh subagent per task, review in two stages for quality, then receive a briefing on key decisions so you understand what was built and why.

## Why Fresh Subagents?

- **No context pollution** — each task starts clean, no leftover assumptions
- **Parallel execution** — independent tasks can run simultaneously
- **Focused attention** — one task, one agent, full context budget

## The Pipeline

```
Controller (you)
    │
    ├── Read plan once, extract all tasks with full text
    │
    ├── Per task:
    │   ├── 1. Dispatch implementer (Task agent)
    │   │      - Provide: full task description, relevant file paths, constraints
    │   │      - Implementer can ask questions before starting
    │   │      - Implementer does self-review before reporting
    │   │
    │   ├── 2. Stage 1: Spec compliance review (AI)
    │   │      - Reviewer reads code independently
    │   │      - Does NOT trust implementer's report
    │   │      - Checks: does the code match the spec?
    │   │      - If issues → implementer fixes → re-review
    │   │
    │   ├── 3. Stage 2: Code quality review (AI)
    │   │      - Only runs after spec compliance passes
    │   │      - Checks: code quality, patterns, tests, edge cases
    │   │      - If issues → implementer fixes → re-review
    │   │
    │   └── 4. Key Decisions Briefing (→ Human)
    │          - Summarize: what was implemented and WHY
    │          - Highlight: key design decisions made during implementation
    │          - Flag: anything surprising, non-obvious, or worth understanding
    │          - Human reviews code, asks questions if needed
    │
    └── After all tasks: parallel review team (see agent-team-execution § Parallel Review Teams)
```

## Key Decisions Briefing

After AI reviews pass, present the human with:

```
## Implementation Briefing: [task name]

### What Was Built
[1-2 sentence summary]

### Key Decisions
1. [Decision]: [what was chosen] — because [why]
2. [Decision]: [what was chosen] — because [why]

### Worth Noting
- [Anything surprising, non-obvious, or worth understanding for future work]

### Files Changed
- [file list for human review]
```

The human reads the briefing, reviews the code, and asks questions if anything is unclear. This is not a gate — it's a learning opportunity.

## Controller Responsibilities

1. **Read the plan once** — extract every task with full text
2. **Dispatch one agent per task** — provide complete context in the prompt
3. **Never let subagents read the plan file** — you provide the task text
4. **Run reviews after each task** — not at the end
5. **Present briefing to human** — key decisions and rationale
6. **Track progress** — use TodoWrite to show status

## Implementer Prompt Template

When dispatching a task agent, include:

```
## Task
[Full task description from plan]

## Context
- Project: [project description]
- Relevant files: [file paths]
- Dependencies: [what this task depends on]
- Constraints: [quality rules, patterns to follow]

## Requirements
1. Follow TDD (RED → GREEN → REFACTOR)
2. Run verification before reporting (typecheck, lint, test)
3. Do a self-review before reporting back
4. Report: what you did, key decisions you made and WHY, verification output
```

## Spec Review Prompt Template

```
## Review Task
Review the implementation of: [task description]

## Changed Files
[list of files changed]

## Instructions
- Read the code independently — do NOT trust the implementer's report
- The implementer may have finished quickly. Their report may be incomplete or optimistic.
- Check: Does the code match the spec exactly?
- Check: Are there missing edge cases?
- Check: Were tests written BEFORE implementation (TDD)?
- Report: PASS or FAIL with specific issues
```

## Code Quality Review Prompt Template

```
## Review Task
Code quality review for: [task description]

## Changed Files
[list of files changed]

## Instructions
- Spec compliance already verified — focus on code quality only
- Check: No `as` type assertions, no eslint-disable, no lazy assertions
- Check: Code follows existing project patterns
- Check: No unnecessary complexity (YAGNI)
- Check: Error handling is appropriate
- Report: PASS or FAIL with specific issues
```

## Choosing the Right Execution Model

| Task Type | Best Approach | Why |
|-----------|--------------|-----|
| Implementation (3+ tasks) | **Subagent (SDD)** | Focused execution + sequential review is manageable |
| Research (multiple angles) | **Agent Teams** | Parallel exploration + mutual challenge |
| Code review (per-task) | **Subagent (SDD Stage 1-2)** | Lightweight, team overhead exceeds benefit |
| Code review (final) | **Parallel Review Team** | Independent verification sources, no attention competition |
| Debugging (unclear root cause) | **Agent Teams** | Competing hypotheses, adversarial testing |
| Single task | **Direct** | No orchestration overhead needed |
| Dependent/sequential tasks | **Direct** | Coordination overhead exceeds benefit |

**Rule**: Use SDD for implementation. Use `agent-team-execution` for exploration (research, review, debugging).

## Integration

- Requires `code-quality-rules` — all implementers must follow quality rules
- Requires `verification-before-completion` — reviewers must verify independently
- Requires `test-driven-development` from code-quality-rules — RED/GREEN/REFACTOR per task
- Final review uses `agent-team-execution` § Parallel Review Teams — 4 parallel reviewers with independent verification sources
- Key Decisions Briefing feeds into `/compound` — learnings from implementation decisions
- See `agent-team-execution` for parallel exploration tasks (research, review, debugging)
