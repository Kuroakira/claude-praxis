---
name: compare
description: >-
  Structured multi-option comparison — generate genuinely different approaches,
  evaluate in parallel, human selects. Use when facing a decision with 2+ viable
  options: architecture choices, library selection, refactoring strategies, API design,
  bug fix approaches, or any decision that benefits from systematic option analysis.
disable-model-invocation: false
---

Begin the **Structured Comparison Workflow**.

The goal is NOT to find "the right answer" — it's to make trade-offs visible so the human can make an informed selection.

## Phase 1: Frame the Decision

1. **Clarify the decision topic**: What are we choosing between? What problem does the selection solve?
2. **Identify constraints**: Non-negotiable requirements (performance, compatibility, team familiarity, timeline, etc.)
3. **Identify constraint axes**: The dimensions along which options can differ (e.g., for a caching decision: storage location × invalidation strategy × consistency model)
4. **Determine depth**:
   - **Quick** (default): Parallel agents evaluate in-context using available knowledge and codebase
   - **Deep** (explicit request or high-stakes decision): Parallel agents additionally perform web research — suggest when: unfamiliar technology, external dependency selection, irreversible architectural choice

If the user has already provided specific options, carry them into Phase 2. If not, generate options in Phase 2.

## Phase 2: Generate Option Briefs

Produce 2-4 option briefs using **constraint-axis branching**. This step stays single-agent because seeing all axes at once helps create genuinely divergent options.

1. Generate each option by taking a different position on the constraint axes
2. **Minimum divergence validation**: Each option MUST differ on 2+ constraint axes. Surface-level variations (same approach with minor parameter tweaks) are not genuine options

Each brief (kept lightweight — detail is the parallel agents' job):
- **Name**: Short descriptive label
- **Core idea**: 1-2 sentences describing the approach
- **Constraint position**: Which position this option takes on each axis
- **Key assumption**: What must be true for this option to work well

If the user provided options, still check minimum divergence. If options are too similar, note this and suggest how to branch them further.

## Phase 3: Parallel Option Evaluation

Dispatch one agent per option. Each agent independently develops and evaluates their assigned option. **Agents do NOT see other options** — this prevents anchoring bias where the first option frames evaluation of the rest.

### Agent Dispatch

For each option, spawn a parallel agent (Task tool) with:

**Shared context** (same for all agents):
- Decision topic and problem statement
- Constraints from Phase 1
- Constraint axes identified in Phase 1

**Per-agent context** (unique to each agent):
- The single option brief assigned to this agent
- Explicit instruction: "You are evaluating ONE option. Do not speculate about alternatives."

**Agent task**: Develop this option brief into a full evaluation:
1. **Detailed description**: Expand the brief — how would this approach work concretely?
2. **Strengths**: Where does this option excel given the constraints? Be specific.
3. **Weaknesses**: Where does it struggle? What problems does it NOT solve?
4. **Risks**: What could go wrong? What is the cost of being wrong?
5. **Fit**: How well does it match each stated constraint? (assess per constraint)
6. **When to choose this**: Under what circumstances is this the best option?
7. **When NOT to choose this**: What conditions make this option a bad fit?

### Depth Configuration

| Depth | Agent type | Model | Research | Max turns |
|-------|-----------|-------|----------|-----------|
| Quick | claude-praxis:researcher | haiku | Codebase + in-context knowledge only | 5 |
| Deep | claude-praxis:researcher | sonnet | Web research + codebase | 10 |

### Dispatch Rules

- All option agents launch in **parallel** (single message with multiple Task tool calls)
- Agent count = option count (one agent per option, no sharing)
- No agent sees another agent's option brief or evaluation
- If an agent finds that its assigned option is fundamentally infeasible, it should say so with evidence — not pivot to a different option

## Phase 4: Synthesize and Compare

After all parallel agents return, the controller (you) synthesizes their independent evaluations.

1. **Read all evaluations** — look for inconsistencies in how different agents interpreted the same constraints
2. **Normalize assessments** — agents may use different scales or specificity levels; align them for fair comparison
3. **Build the Comparison Table**:

| Axis | Option A: [name] | Option B: [name] | Option C: [name] |
|------|-------------------|-------------------|-------------------|
| [constraint 1] | [assessment] | [assessment] | [assessment] |
| [constraint 2] | [assessment] | [assessment] | [assessment] |
| ... | ... | ... | ... |
| **When to choose** | [from agent A] | [from agent B] | [from agent C] |
| **When NOT to choose** | [from agent A] | [from agent B] | [from agent C] |

**Rules**:
- Every constraint from Phase 1 must appear as a row
- Assessments must be specific, not generic ("handles 10K concurrent connections" not "good performance")
- "When to choose" and "When NOT to choose" rows are mandatory — they crystallize the trade-off
- If depth is Deep, cite research evidence in assessments
- If an agent found its option infeasible, include it in the table with the infeasibility noted — don't silently drop it

### Recommendation

After the table:
1. **Recommended option**: Which and why (1-2 sentences)
2. **Runner-up**: Which would be second choice and under what changed assumption
3. **When to reconsider**: Conditions that would invalidate this recommendation

**The recommendation is advisory. The human makes the final selection.**

## Phase 5: Human Selection

**PAUSE**: Present the comparison table and recommendation to the human.

```
Comparison complete. [N] options evaluated in parallel against [M] axes.

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
