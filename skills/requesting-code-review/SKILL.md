---
name: requesting-code-review
description: Use after completing any coding task — implementation, bug fix, refactor. Always suggest a code review before moving on.
---

# Requesting Code Review

After completing implementation, dispatch a code reviewer before moving on.

## When to Request

- After completing a task in the implementation plan
- After a batch of related changes
- Before merging or marking a phase as done

## Process

1. **Verify your work first** (follow `rules/verification.md`)
2. **Prepare the review request** with the template below
3. **Dispatch a reviewer agent** (Task tool with a fresh subagent)
4. **Wait for the review** — do not proceed until review is complete
5. **Address feedback** using `receiving-code-review` skill

## Review Request Template

```
## Code Review Request

### What Changed
[Brief summary of changes]

### Requirements / Spec
[What the code should do — from the plan or Design Doc]

### Changed Files
[List of files with brief description of changes per file]

### How to Verify
```bash
[Commands to run: test, build, etc.]
```

### Specific Concerns
[Any areas you're unsure about or want extra attention on]
```

## Reviewer Focus Areas

The reviewer should check:

1. **Plan alignment** — Does implementation match the spec?
2. **Code quality** — Follows project patterns? No quality rule violations?
3. **Test quality** — Specific assertions? TDD followed?
4. **Edge cases** — Error handling? Boundary conditions?
5. **Architecture** — Fits the existing design? No unnecessary complexity?

## Issue Severity

| Level | Meaning | Action |
|-------|---------|--------|
| **Critical** | Breaks functionality or violates absolute rules | Must fix before proceeding |
| **Important** | Quality concern or missing edge case | Should fix before proceeding |
| **Minor** | Style, naming, or small improvement | Fix if time allows |

## Integration

- Requires `rules/verification.md` — verify before requesting review
- Pairs with `receiving-code-review` — how to handle the feedback
- Used by `subagent-driven-development` — review is built into the pipeline
