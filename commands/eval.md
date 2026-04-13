---
name: eval
description: Evaluate and improve framework skills from recent execution. Analyzes the most recent command run and proposes concrete improvements to skill, command, rule, or catalog files.
---

# /eval

Analyze the most recent command execution in this session and improve the framework files that produced it.

## Scope

**Target of analysis**: The most recent praxis command execution in the current session. If the user specifies a different target, use that instead.

**Improvable files** (in order of likelihood):
- Command files (`commands/*.md`)
- Skill files (`skills/*/SKILL.md`)
- Rule files (`rules/*.md`)
- Catalog files (`catalog/*.md`)

## Procedure

### Phase 1: Analyze Recent Execution

1. Identify the most recent praxis command that was run in this session
2. Review the full execution: what happened, what the user said, where friction occurred
3. Identify **specific, actionable improvements** — not vague observations

Focus on:
- Steps where the user had to correct or redirect
- Unnecessary questions or redundant steps
- Missing context that caused suboptimal output
- Overly rigid procedures that didn't fit the situation
- Missing procedures that would have helped

### Phase 2: Propose Improvements

Present improvements as a table:

| # | File | Change | Rationale |
|---|------|--------|-----------|
| 1 | [exact file path] | [specific change description] | [why this improves the next run] |

**Rules for proposals**:
- Each change must reference an exact file and describe a specific edit
- "Add more detail" is not a proposal. "Add a skip-condition for single-file scope to step 3 of the codebase-scout phase" is
- Changes must be grounded in what actually happened during execution, not hypothetical improvements
- Prefer small, targeted changes over rewrites
- Respect the layer architecture: constraints → `rules/`, procedures → `skills/`, phase ordering → `commands/`

### Phase 3: PAUSE — User Approval

Present the proposals. Wait for the user to approve, modify, or reject each one.

### Phase 4: Apply Changes

For each approved proposal:
1. Read the target file
2. Make the specific edit
3. Verify the edit doesn't break the file's structure

### Phase 5: Verify and Commit

1. If TypeScript files were changed: run `npm run typecheck && npm run lint && npm run test && npm run build`
2. If only markdown files were changed: verify structure is intact (no broken references)
3. Commit with message: `chore(eval): improve [file-names] — [one-line summary]`

## Constraints

- **One session's execution only** — don't analyze across sessions
- **No speculative improvements** — every change must trace to observed friction
- **Respect existing patterns** — don't restructure; improve within the current architecture
- **Small changes preferred** — a one-line addition to a skip-condition is better than rewriting a phase
