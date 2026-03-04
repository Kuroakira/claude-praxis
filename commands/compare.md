---
name: compare
description: >-
  Structured multi-option comparison — generate genuinely different approaches,
  evaluate against axes, human selects. Use when facing a decision with 2+ viable
  options: architecture choices, library selection, refactoring strategies, API design,
  bug fix approaches, or any decision that benefits from systematic option analysis.
disable-model-invocation: false
---

Begin the **Structured Comparison Workflow**.

The goal is NOT to find "the right answer" — it's to make trade-offs visible so the human can make an informed selection.

## Phase 1: Frame the Decision

1. **Clarify the decision topic**: What are we choosing between? What problem does the selection solve?
2. **Identify constraints**: Non-negotiable requirements (performance, compatibility, team familiarity, timeline, etc.)
3. **Determine scope**:
   - **Quick** (default): Evaluate in-context using available knowledge and codebase
   - **Deep** (explicit request or high-stakes decision): Dispatch researchers per option for thorough evaluation — suggest when: unfamiliar technology, external dependency selection, irreversible architectural choice

If the user has already provided specific options, carry them into Phase 2. If not, generate options in Phase 2.

## Phase 2: Generate Options

Produce 2-4 genuinely different approaches using **constraint-axis branching**:

1. Identify the key constraint axes for this decision (e.g., for a caching decision: storage location × invalidation strategy × consistency model)
2. Generate each option by taking a different position on the constraint axes
3. **Minimum divergence validation**: Each option MUST differ on 2+ constraint axes. Surface-level variations (same approach with minor parameter tweaks) are not genuine options

Each option:
- **Name**: Short descriptive label
- **Core idea**: 1-2 sentences describing the approach
- **Key assumption**: What must be true for this option to work well

If the user provided options, still check minimum divergence. If options are too similar, note this and suggest how to branch them further.

## Phase 3: Evaluate

### Quick Evaluation (default)

For each option, assess:
- **Strengths**: Where does this option excel?
- **Weaknesses**: Where does it struggle?
- **Risk**: What could go wrong? Cost of being wrong?
- **Fit**: How well does it match the stated constraints?

### Deep Evaluation (when selected in Phase 1)

Invoke `workflow-planner` with:

| Parameter | Value |
|-----------|-------|
| `task` | Evaluate [N] options for [decision topic] |
| `domain` | compare |
| `domain_context` | Per-option research evaluation. Each option needs independent viability assessment. Assign one researcher per option where possible. Options: [list option names and core ideas]. |
| `constraints` | (1) Each option evaluated independently — researchers should not know each other's assignments to avoid anchoring. (2) Evaluation covers: viability, major risks, implementation cost, maintenance burden. (3) Findings include concrete evidence (docs links, benchmark data, community metrics). |
| `catalog_scope` | Researchers: domain-research, oss-research, best-practices, counter-research (assign per option based on content). |

After researchers return, synthesize findings — reconcile conflicting evidence.

## Phase 4: Compare

Produce the **Comparison Table**:

| Axis | Option A: [name] | Option B: [name] | Option C: [name] |
|------|-------------------|-------------------|-------------------|
| [constraint/criterion] | [assessment] | [assessment] | [assessment] |
| ... | ... | ... | ... |
| **When to choose** | [circumstances] | [circumstances] | [circumstances] |
| **When NOT to choose** | [deal-breakers] | [deal-breakers] | [deal-breakers] |

**Rules**:
- Every constraint from Phase 1 must appear as a row
- Assessments must be specific, not generic ("handles 10K concurrent connections" not "good performance")
- "When to choose" and "When NOT to choose" rows are mandatory — they crystallize the trade-off
- If the evaluation is Deep, cite research evidence in assessments

### Recommendation

After the table:
1. **Recommended option**: Which and why (1-2 sentences)
2. **Runner-up**: Which would be second choice and under what changed assumption
3. **When to reconsider**: Conditions that would invalidate this recommendation

**The recommendation is advisory. The human makes the final selection.**

## Phase 5: Human Selection

**PAUSE**: Present the comparison table and recommendation to the human.

```
Comparison complete. [N] options evaluated against [M] axes.

[Comparison Table]

Recommendation: [Option X] — [one-sentence rationale]
Runner-up: [Option Y] — [when this would be preferred instead]

Which option do you want to proceed with?
```

## Phase 6: Decision Record

After human selection, save the decision to `claudedocs/decisions/[topic-name].md`:

```markdown
## Decision Record: [Topic]

**Date**: [date]
**Status**: Decided

### Context
[Why this decision was needed — 2-3 sentences]

### Options Considered
[Brief description of each option — 1-2 sentences each]

### Comparison
[The comparison table from Phase 4]

### Decision
**Selected**: [Option name]
**Rationale**: [Why — include the human's reasoning if stated]

### When to Reconsider
[Conditions that would invalidate this decision]
```

If the `claudedocs/decisions/` directory does not exist, create it.
