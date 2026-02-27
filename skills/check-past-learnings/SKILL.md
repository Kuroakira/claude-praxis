---
name: check-past-learnings
description: Use when a task needs to recall and evaluate past project decisions before starting work — invoked by commands with a role parameter.
---

# Check Past Learnings

Recall past decisions with their rationale. Let the human judge whether the same assumptions hold.

## The Iron Law

```
PRESENT RATIONALE, NOT CONCLUSIONS — THE HUMAN JUDGES WHETHER CONTEXT HAS CHANGED
```

## Role-Based File Mapping

Commands invoke this skill with a role that determines which learnings files to read. All roles also read `~/.claude/learnings/global-learnings.md` if it exists.

| Role | Files (under `.claude/context/`) | Recall Angle |
|------|-------|-------------|
| requirements | `learnings-feature-spec.md` | Does the same context apply? |
| design | `learnings-feature-spec.md`, `learnings-design.md` | Does the same assumption hold? |
| implementation | `learnings-design.md`, `learnings-coding.md` | Does the same assumption hold? |
| investigation | `learnings-coding.md` | Could the same mechanism be at play? |

If the role is not recognized, read all learnings files as a safe fallback.

## Recall Procedure

1. **Read** the learnings files for the given role (skip files that don't exist)
2. **Filter** — only present entries relevant to the current task's domain. Trivial or universal rules (e.g., "don't use eval") that don't depend on project context should be applied silently without presenting to the human
3. **Prioritize** — prefer entries with higher confirmation counts and more diverse confirmed phases. Do NOT exclude low-confidence entries; present them with their metadata
4. **Present** each relevant entry using the role's Recall Angle from the mapping table to frame the question. The Presentation Patterns below are templates — substitute the role's specific angle
5. **Act on response** — if the human says "same situation", apply the learning as a constraint or starting point. If "different", explore the new context together

## Presentation Patterns

### Without confidence metadata

> "Previously we chose [X] because [rationale]. Does the same assumption hold here, or has the context changed?"

### With confidence metadata

When a learning has a `- **Confirmed**:` field, include all three dimensions (count, date, phases):

> "Previously we chose [X] because [rationale]. (Confirmed [N] times, last confirmed [date], verified in [phases].) Does the same assumption hold here?"

## Recall Rules

1. Always include the **original rationale** — not just the conclusion
2. Ask whether the **assumptions still hold**, not whether they remember it
3. Do NOT quiz the human ("Do you remember?"). The goal is judgment, not memorization
4. When no learnings files exist or none are relevant, state so briefly and proceed
5. Carry relevant learnings forward as constraints or starting points for the current phase

## When NOT to Present for Human Judgment

These should be applied silently (used but not surfaced for recall):

- Trivial or universal rules (e.g., "don't use eval", "validate input")
- Standard language constructs or framework conventions

Contextual recall is for decisions that depend on project context, trade-offs, or architectural choices.

## Integration

- **Invoked by**: `commands/implement.md`, `commands/design.md`, `commands/feature-spec.md`, `commands/debug.md`
- **Reads files from**: `.claude/context/` (project-level learnings written by `/compound`)
- **Related**: `context-persistence` (manages the Stock/Flow files this skill reads)
