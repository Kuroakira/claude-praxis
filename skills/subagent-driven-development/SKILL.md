---
name: subagent-driven-development
description: Use when executing an implementation plan with multiple independent tasks that benefit from isolated context per task.
user-invocable: false
---

# Subagent-Driven Development

AI ensures quality. You ensure understanding.

Dispatch a fresh subagent per task, review in two stages for quality, then receive a briefing on key decisions so you understand what was built and why.

## Why Fresh Subagents?

- **No context pollution** — each task starts clean, no leftover assumptions
- **Parallel execution** — independent tasks can run simultaneously
- **Focused attention** — one task, one agent, full context budget

## Pre-step: Session Cache (Optional)

If the `session-cache:session-cache-protocol` skill is available, invoke it before reading shared files. This reduces redundant file reads when the same files have been read earlier in the session. If unavailable, proceed without — this step is an optimization, not a requirement.

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
2. **Identify shared files** — extract file lists from each task, compute set intersection to find files referenced by 2+ tasks. These are shared files. Read them once (subject to the 30,000-token budget in Shared Context Token Budget below) and embed their content in each relevant subagent's prompt via the `## Shared Context` section
3. **Dispatch one agent per task** — provide complete context in the prompt
4. **Never let subagents read the plan file** — you provide the task text
5. **Run reviews after each task** — not at the end
6. **Present briefing to human** — key decisions and rationale
7. **Track progress** — use TodoWrite to show status

## Implementer Prompt Template

When dispatching a task agent, include:

```
## Task
[Full task description from plan]

## Structural Fitness Context
[Include the resolved structural fitness axis verdict from the Axes Table.
If "Restructure first" was decided, state: "Plan verdict: Restructure [area] before implementing. This task must follow that decision."
If "Extend current structure" was decided, state: "Plan verdict: Current structure supports this change. Extend incrementally."
If no Axes Table exists (inline breakdown), state: "No plan-level structural fitness evaluation. Evaluate before implementing: does the existing structure naturally support this task, or would restructuring first make it simpler? If restructuring is warranted, stop and report to the controller."]

## Shared Context
Files referenced by multiple tasks, pre-read by the Controller.

### [file path]
[full file content]

### [file path]
[full file content]

## Context
- Project: [project description]
- Relevant files: [task-specific file paths only — shared files are already in Shared Context above]
- Dependencies: [what this task depends on]
- Constraints: [quality rules, patterns to follow]

## Requirements
1. Follow TDD (RED → GREEN → REFACTOR)
2. Evaluate structural fitness BEFORE writing code — do not patch around structural problems
3. Run verification before reporting (typecheck, lint, test)
4. Do a self-review before reporting back
5. Report: what you did, key decisions you made and WHY, verification output
```

## Shared Context Token Budget

Upper limit: **30,000 tokens** for all shared file content combined.

**Priority ordering**: Files referenced by more tasks have higher priority.

**When total shared content exceeds the budget**: Include highest-priority files that fit within the 30,000 token budget. Remaining shared files fall back to path references listed alongside task-specific files in the `## Context` section.

This budget is a safety valve for edge cases (e.g., a plan where many large files overlap). In most plans, total shared content stays well under the limit and all shared files are embedded in full.

## Review Dispatch

After each task implementation, dispatch reviews using `dispatch-reviewers`:

- **Stage 1 (Spec compliance)**: Invoke `dispatch-reviewers` with `reviewers: [spec-compliance]`, `tier: light`, `target: [changed file paths]`
- **Stage 2 (Code quality)**: Only after Stage 1 passes. Invoke `dispatch-reviewers` with `reviewers: [code-quality]`, `tier: light`, `target: [changed file paths]`

Reviewers read files independently per the Context Isolation Rule in `catalog/reviewers.md`.

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

> **Note**: This execution model guidance is provided for reference within SDD. For command-level orchestration decisions, see the relevant command file.

## Integration

- Quality rules auto-applied via `rules/code-quality.md` (@import in CLAUDE.md)
- Verification rules auto-applied via `rules/verification.md`
- TDD procedure: `tdd-cycle` skill — RED/GREEN/REFACTOR per task
- Final review uses `dispatch-reviewers` (thorough tier) — reviewers selected from `catalog/reviewers.md`
- Key Decisions Briefing feeds into `/compound` — learnings from implementation decisions
- **Session cache**: `session-cache:session-cache-protocol` skill (optional) — reduces redundant file reads across agents when available
- See `agent-team-execution` for parallel exploration tasks (research, review, debugging)
