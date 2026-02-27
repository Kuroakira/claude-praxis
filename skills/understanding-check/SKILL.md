---
name: understanding-check
description: Use when verifying understanding of AI-generated artifacts — provides Explain-Compare-Discover procedure with pre-recorded rationale comparison.
---

# Understanding Check

Verify that you can explain the key decisions in AI-generated work — before approving it.

## The Iron Law

```
EXPLAIN FIRST, COMPARE SECOND — NEVER SHOW RATIONALE BEFORE THE HUMAN EXPLAINS
```

Showing the AI's rationale before the human explains creates anchoring — the human's explanation becomes "regeneration" of what they just read, not genuine understanding. The temporal order is the mechanism.

## Prerequisites

This skill requires **pre-recorded rationale** in progress.md. Each upstream command (`/design`, `/implement`, `/feature-spec`, `/debug`) records Decision/Rationale entries during execution. Understanding Check consumes these entries as comparison material.

**Material sufficiency check** — before generating questions, assess the available progress.md entries:

| Material Level | Indicator | Action |
|---------------|-----------|--------|
| **Rich** | Entries include rejected alternatives, trade-off analysis, constraint reasoning | Generate full 3-5 questions including "why X not Y" |
| **Thin** | Entries have Decision/Rationale but no alternatives or trade-offs | Generate 2-3 questions focused on context and constraints |
| **Insufficient** | Fewer than 2 entries, or entries lack rationale | Skip with explicit message: "Insufficient decision records in progress.md — skipping Understanding Check" |

Do NOT generate degraded questions from insufficient material. Weak questions train compliance, not understanding.

## Procedure

### Phase 1: Explain

Generate questions from the pre-recorded rationale, then **PAUSE** for the human to answer.

**Question generation rules:**

1. **Focus on "why" and "how"** — reasoning questions ("Why this architecture?", "Why was the alternative rejected?") produce 2x+ knowledge transfer compared to definitional or factual questions (Chi et al., 1994)
2. **Generate 3-5 questions** — fewer is insufficient coverage; more causes fatigue and quality degradation
3. **Derive from actual rationale, not templates** — each question must reference a specific Decision/Rationale entry in progress.md

**Question selection criteria** (when more than 5 candidate questions exist):

1. **Prioritize decisions where alternatives were rejected** — "Why X not Y?" questions probe the deepest understanding
2. **Deprioritize decisions where the human directly participated** (decision points in `/implement`) — the human already engaged with these choices
3. **Prioritize cross-step decisions** — decisions that span multiple workflow phases have wider impact and are more likely to be misunderstood

**Workflow-specific material adaptation:**

| Workflow | Primary Material | Question Character |
|----------|-----------------|-------------------|
| `/design` | Design Doc (Alternatives Considered, design decisions) | "Why this design over alternatives?" |
| `/implement` | progress.md entries + code diff | "What constraint drove this implementation choice?" |
| `/feature-spec` | FeatureSpec (In/Out Scope, Problem Statement) | "Why was X scoped out?" |
| `/debug` | Investigation Report (hypotheses, evidence) | "Why was this hypothesis retained over others?" |

**Present questions to the human:**

> Here are [N] questions about the key decisions in this work. Explain each in your own words — I'll compare with the recorded rationale afterward.
>
> 1. [Question derived from progress.md entry]
> 2. [Question derived from progress.md entry]
> ...

**PAUSE**: Wait for the human to answer all questions before proceeding.

### Phase 2: Compare

After the human answers, present a structured comparison using the pre-recorded rationale.

**Output format** — this structure constrains AI discretion and prevents sycophantic elision of differences:

| Decision | Your Explanation | AI's Rationale | Difference |
|----------|-----------------|----------------|------------|
| [Decision 1] | [Summary of human's answer] | [Summary of pre-recorded rationale] | [Missing / Divergent / Aligned] |
| [Decision 2] | ... | ... | ... |

**Difference categories:**

- **Missing**: The human's explanation omitted key aspects present in the rationale (e.g., rejected alternatives, constraints, trade-offs)
- **Divergent**: The human's reasoning differs from the recorded rationale — this may indicate a gap OR may indicate the AI's rationale was wrong
- **Aligned**: The human's explanation covers the essential reasoning

**Anti-sycophancy rules** (adapted from `receiving-code-review`):

- **Never** use softening language: "You mostly captured it, but...", "That's nearly correct, just one addition..."
- **Explicitly state** what the human's explanation omitted — do not hint or imply
- **Do not affirm surface-level matches** — if the human used similar words but different reasoning, that is Divergent, not Aligned
- **When in doubt, classify as Missing or Divergent** — false Aligned is worse than false Missing (false Aligned reinforces illusion of understanding)

**When the AI's rationale may be wrong:**

Differences do not always mean the human is wrong. The AI's recorded rationale may have been suboptimal. When the human's explanation reveals a perspective the AI didn't consider:

1. Acknowledge this explicitly: "This difference may reflect a limitation in the AI's original reasoning, not a gap in your understanding"
2. Record it as a gap anyway — both "domain learning" and "when to question AI" are valuable for `/compound`

### Phase 3: Discover

Synthesize the comparison into actionable output.

**Gap recording** — for each Missing or Divergent item, append to progress.md:

```markdown
## [timestamp] — /understanding-check: Gap discovered
- Gap: [topic] — [what the human couldn't explain]
- Rationale: [AI's pre-recorded rationale for this decision]
- Domain: [topic tag for future matching]
```

**Understanding Status** — generate a summary for the completion report:

```
Understanding Check: [Y] of [X] key decisions explained, [Z] gaps discovered
```

This status is included in the completion report **only when Understanding Check was executed**. When not executed, the field is omitted entirely — displaying "未実施" would create passive social pressure contrary to the opt-in design.

**Next step suggestion:**

> Gaps have been recorded in progress.md. Run `/claude-praxis:compound` to promote these learnings for future sessions.

## Context Window Management

Understanding Check often runs when context is most constrained (after a long workflow). Minimize context consumption:

- **3-5 questions maximum** — hard limit
- **Standalone mode recommended** especially after `/implement` — separate session has no context constraint + spacing effect
- **Skip on insufficient material** — do not generate filler questions to hit the minimum

## Integration

- **Invoked by**: `commands/understanding-check.md`
- **Consumes**: progress.md Decision/Rationale entries (pre-recorded by upstream commands)
- **Produces**: progress.md Gap entries, Understanding Status for completion report
- **Anti-sycophancy source**: `receiving-code-review` skill patterns
- **Downstream**: `/compound` promotes Gap entries to learnings files
- **Rule**: `rules/verification.md` defines the Understanding Status field in completion report
