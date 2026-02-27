---
name: dispatch-reviewers
description: Dispatch reviewers from the shared catalog by ID list. Accepts dynamic reviewer selection and review tiers. Invoked by workflow-planner or directly by commands.
---

# Dispatch Reviewers

Dispatch reviewers from the shared catalog (`catalog/reviewers.md`). Accepts a dynamic list of reviewer IDs and a review tier — replacing the fixed 4-reviewer dispatch.

## The Iron Law

```
INDEPENDENT VERIFICATION SOURCES — IF TWO REVIEWERS USE THE SAME EVIDENCE, MERGE THEM
```

## Parameters

This skill is invoked with:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `reviewers` | Yes | List of catalog IDs (e.g., `[code-quality, security-perf, devils-advocate]`) |
| `tier` | Yes | `light` (1-2 reviewers) or `thorough` (3-4 reviewers) |
| `target` | Yes | What is being reviewed (description or file reference) |
| `reasoning` | No | Why this tier and these reviewers were chosen (from planner) |

## Review Tiers

| Tier | Reviewers | Devil's Advocate | Use When |
|------|-----------|-----------------|----------|
| **light** | 1-2 | Optional | Drafts, outlines, low-risk intermediate steps |
| **thorough** | 3-4 | **Mandatory** | Final outputs, high-risk decisions, human-facing deliverables |

### Structural Floor (thorough tier)

Thorough reviews require **3+ reviewers including `devils-advocate`**. This is a non-negotiable constraint — neither the planner nor the calling command can override it.

If the `reviewers` list for a thorough review has fewer than 3 entries or omits `devils-advocate`, warn:

> ⚠️ Thorough review requires 3+ reviewers including devils-advocate. Received: [list]. Adding devils-advocate and proceeding.

## Dispatch Procedure

1. **Validate reviewer IDs**: Check each ID against `catalog/reviewers.md`. If an ID is not found, warn:
   > ⚠️ Unknown reviewer ID '[id]' — skipping. Available: architecture, spec-compliance, document-quality, code-quality, security-perf, error-resilience, devils-advocate, requirements, feasibility, user-impact

2. **Enforce structural floor**: For thorough tier, ensure 3+ reviewers and devils-advocate presence

3. **Build reviewer prompts**: For each valid ID, construct a Task tool call:
   - subagent_type: `claude-praxis:reviewer`
   - Prompt: Use the `Prompt` field from the catalog entry, substituting `[topic]` with the `target` parameter
   - Include the reviewer's verification source in the prompt

4. **Launch all reviewers in parallel**: Use Task tool with all reviewer calls in a single message

5. **If reasoning was provided**: Display it before dispatching:
   > **Review plan**: [tier] tier — [reviewer IDs]. Reasoning: [reasoning]

## Apply Findings

After all reviewers return:

1. **Critical/Important issues** — fix before proceeding (revise code or document)
2. **Minor issues** — note in the completion report for human judgment
3. **Conflicting opinions** — resolve explicitly (state which opinion was adopted and why)
4. If revision is needed, re-run only the affected reviewer(s), not the full team

## Integration

- **Invoked by**: `workflow-planner` skill, commands (directly or via planner)
- **Catalog**: `catalog/reviewers.md` (source of reviewer definitions)
- **Replaces**: Direct reviewer dispatch in commands. `parallel-review-team` delegates to this skill during migration
- **Reviewer agent**: All reviewers use subagent_type `claude-praxis:reviewer` (read-only)
