---
name: requesting-code-review
description: Use after completing any coding task — implementation, bug fix, refactor. Always suggest a code review before moving on.
user-invokable: false
---

# Requesting Code Review

After completing implementation, suggest dispatching a code review before moving on.

## When to Suggest

- After completing a task in the implementation plan
- After a batch of related changes
- Before merging or marking a phase as done

## Process

1. **Verify your work first** (follow `rules/verification.md`)
2. **Collect changed file paths** — these become the `target` for `dispatch-reviewers`
3. **Assess scope** to determine tier and reviewer selection:
   - 1-3 files, single module → light: `code-quality` + `devils-advocate`
   - 4+ files, cross-module, or security-sensitive → thorough: `code-quality` + `security-perf` + `devils-advocate`
4. **Dispatch via `dispatch-reviewers`** with file paths only as target
5. **Wait for the review** — do not proceed until review is complete
6. **Address feedback** using `receiving-code-review` skill

## Controller Notes (NOT sent to reviewers)

Before dispatching, note internally:
- **Changed files**: List of file paths (becomes `target`)
- **Specific concerns**: Areas you want extra attention on (use to select reviewer IDs, NOT passed to reviewers)
- **Verification commands**: How to run tests/build (for your own reference)

## Issue Severity

| Level | Meaning | Action |
|-------|---------|--------|
| **Critical** | Breaks functionality or violates absolute rules | Must fix before proceeding |
| **Important** | Quality concern or missing edge case | Should fix before proceeding |
| **Minor** | Style, naming, or small improvement | Fix if time allows |

## Integration

- Requires `rules/verification.md` — verify before requesting review
- Dispatches via `dispatch-reviewers` — graduated tier with context isolation
- Pairs with `receiving-code-review` — how to handle the feedback
- Used by `subagent-driven-development` — review is built into the pipeline
