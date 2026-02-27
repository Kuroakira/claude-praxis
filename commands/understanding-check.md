---
name: understanding-check
description: Verify your understanding of AI-generated work — explain key decisions, compare with AI rationale, discover gaps
disable-model-invocation: false
---

Begin the **Understanding Check**.

This is a standalone command. Run it after completing a workflow (`/feature-spec`, `/design`, `/implement`, `/debug`) to verify you can explain the key decisions — not just approve them.

**Recommended**: Run in a **separate session** from the original workflow. This frees context window constraints and activates spacing effect (testing recall, not short-term memory).

## When to Use

- After completing any of the four main workflows
- Before approving a Design Doc, FeatureSpec, or implementation
- When you want to verify you could explain the work to a teammate without saying "AI said so"

## When Not to Use

- After trivial changes (single-line fixes, config updates) where no design decisions were made
- When progress.md has no Decision/Rationale entries from the preceding workflow
- During a workflow (wait until the workflow completes)

## Phase 0: Check Past Learnings

Invoke `check-past-learnings` (role: investigation). Carry relevant learnings forward — especially prior gaps from previous Understanding Checks that may apply to the same domain.

## Phase 1: Context Restoration

Restore the context of the completed work:

1. **Read progress.md** — identify Decision/Rationale entries from the preceding workflow. These are the pre-recorded rationale that Understanding Check will use for comparison
2. **Read the artifact** — the primary output of the workflow:
   - `/design` → Design Doc (`claudedocs/design-docs/[name].md`)
   - `/feature-spec` → FeatureSpec (`feature-specs/[name].md`)
   - `/debug` → Investigation Report (`.claude/context/investigation-[name].md`)
   - `/implement` → `git diff` of the implementation changes
3. **Assess material sufficiency** — if progress.md lacks sufficient Decision/Rationale entries, inform the human and skip (do not generate degraded questions)

If material is sufficient, proceed to Phase 2. If insufficient, explain why — the remedy is running the original workflow with more explicit decision recording, not `/compound` (which promotes existing knowledge but does not generate new decision records).

## Phase 2: Understanding Check

Invoke the `understanding-check` skill.

The skill will:
1. **Generate questions** from progress.md rationale (3-5 questions)
2. **PAUSE** — present questions and wait for the human to explain each decision in their own words
3. **Compare** — present structured table comparing human's explanation with pre-recorded rationale
4. **Discover** — identify gaps (Missing/Divergent) and record them to progress.md

## Phase 3: Record and Next Phase

After the Understanding Check completes:

1. **Verify gap recording** — confirm all discovered gaps have been appended to progress.md in the prescribed format
2. **Present Understanding Status** — include in the completion report:

```markdown
## Completion Report

### Understanding Status
Understanding Check: [Y] of [X] key decisions explained, [Z] gaps discovered

### Summary
[What was checked and key findings]

### Next Phase
→ Run /claude-praxis:compound to capture learnings?
```

**Record to progress.md**:

```markdown
## [timestamp] — /claude-praxis:understanding-check: Check complete
- Decision: [summary of understanding status and key gaps]
- Rationale: [what the gaps reveal about understanding depth]
- Domain: [topic tag for future matching]
```
