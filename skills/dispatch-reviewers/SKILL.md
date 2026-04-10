---
name: dispatch-reviewers
description: Dispatch reviewers from the shared catalog by ID list. Accepts dynamic reviewer selection and review tiers. Invoked by workflow-planner or directly by commands.
user-invocable: false
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
| `reviewers` | Yes | List of catalog IDs (e.g., `[quality, correctness, devils-advocate]`) |
| `tier` | Yes | `light` (2 reviewers) or `thorough` (3+ reviewers) |
| `target` | Yes | **File paths only** — list of files to review (e.g., `[src/auth.ts, src/auth.test.ts]` or `claudedocs/design-docs/auth.md`). Do NOT include descriptions, rationale, or implementation context. Reviewers read the files themselves |
| `reasoning` | No | Why this tier and these reviewers were chosen (from planner). **Human-facing only** — displayed before dispatch but NOT included in reviewer prompts |
| `diff` | No | Git diff output (staged or branch diff). When provided, passed to `correctness` reviewer for regression detection analysis. Other reviewers never receive diff content |

## Review Tiers

| Tier | Reviewers | Devil's Advocate | Use When |
|------|-----------|-----------------|----------|
| **light** | 2 | No | Quick iterative checks — bug fixes, small changes |
| **thorough** | 3+ | **Mandatory** | Final outputs, high-risk decisions, cross-module changes |

### Structural Floor (thorough tier)

Thorough reviews require **3+ reviewers including `devils-advocate`**. This is a non-negotiable constraint — neither the planner nor the calling command can override it.

If the `reviewers` list for a thorough review has fewer than 3 entries or omits `devils-advocate`, warn:

> ⚠️ Thorough review requires 3+ reviewers including devils-advocate. Received: [list]. Adding devils-advocate and proceeding.

## Dispatch Procedure

1. **Validate reviewer IDs**: Check each ID against `catalog/reviewers.md`. If an ID is not found, warn:
   > ⚠️ Unknown reviewer ID '[id]' — skipping. Available: quality, correctness, security-perf, ts-patterns, devils-advocate, architecture, spec-compliance, document-quality, requirements, feasibility, user-impact, structural-fitness, axes-coherence

2. **Enforce structural floor**: For thorough tier, ensure 3+ reviewers and devils-advocate presence

3. **Display reasoning (human-facing only)**: If reasoning was provided, display it BEFORE building prompts:
   > **Review plan**: [tier] tier — [reviewer IDs]. Reasoning: [reasoning]

   This is for human transparency only. Reasoning is NOT passed to reviewers.

4. **Build reviewer prompts**: For each valid ID, construct a Task tool call:
   - subagent_type: `claude-praxis:reviewer`
   - Prompt structure (in this order):
     1. **Context Isolation preamble** (from `catalog/reviewers.md` Context Isolation Rule): "Evaluate based ONLY on the target files listed below and your verification source. Do NOT use or reference conversation history, implementation discussions, design rationale, or planner reasoning. Read the files yourself and form your own independent judgment."
     2. **Catalog Prompt**: The `Prompt` field from the catalog entry
     3. **Target files**: "Review the following files: [file path list from `target` parameter]"
     4. **Verification source**: The reviewer's verification source from the catalog
     5. **Unified Output Format** (checklist-based reviewers only): If the reviewer ID is one of `quality`, `correctness`, `security-perf`, `ts-patterns`, append the Unified Output Format from `catalog/reviewers.md`. Non-checklist reviewers (architecture, devils-advocate, spec-compliance, etc.) use free-form output.
   - Do NOT include: `reasoning`, implementation context, task descriptions, or any conversation-derived content
   - **Diff passthrough for `correctness`**: If the `diff` parameter is provided and `correctness` is in the reviewer list, append the diff content to the `correctness` reviewer's prompt: "Additionally, review the following diff for regression detection:\n```\n[diff parameter content]\n```". Other reviewers never receive diff content

5. **Launch all reviewers in parallel**: Use Task tool with all reviewer calls in a single message

## Apply Findings

After all reviewers return:

1. **Critical/Important issues** — fix before proceeding (revise code or document)
2. **Minor issues** — note in the completion report for human judgment
3. **Conflicting opinions** — resolve explicitly (state which opinion was adopted and why)
4. If revision is needed, re-run only the affected reviewer(s), not the full team

### Triage Anti-Patterns

When dismissing a reviewer finding, verify the dismissal reasoning against these known failure modes:

| Dismiss reasoning | Verification required |
|---|---|
| "Derived/effective state prevents the issue" | Derived state (`effectiveX = condition ? x : null`) masks values on **read**. Verify the original state is also **cleared on write** — when the condition flips back, the original value resurfaces. Masking ≠ clearing. |
| "Guard/check prevents the issue" | Trace all entry points — a guard on one path doesn't protect other paths. A disabled flag on a toolbar button doesn't prevent programmatic creation. |
| "Test passes so the behavior works" | Check whether the test uses `fireEvent.click()` or similar synthetic dispatch that bypasses browser layout. A test that passes because it dispatches events directly on an element doesn't prove user interaction reaches that element. |
| "Standard/well-known pattern" | A pattern being standard doesn't mean it's correctly applied in this context. `e.target === e.currentTarget` is a valid background-click pattern, but only when the parent has exposed clickable area. Verify preconditions for the pattern. |

**Rule**: When dismissing a finding, state not just why the issue appears safe, but also the specific condition under which the issue would reappear. If that condition is plausible (e.g., "safe unless the user re-enters the mode" — which they will), the finding is valid.

## Output Consolidation

After all reviewers return, merge their findings tables into a single consolidated table sorted by severity (Critical → Important → Minor). Deduplicate: if two reviewers flag the same location for the same issue, keep the one with more detail. Present the consolidated table to the caller.

## Integration

- **Invoked by**: `workflow-planner` skill, commands (directly or via planner)
- **Catalog**: `catalog/reviewers.md` (source of reviewer definitions)
- **Replaces**: Direct reviewer dispatch in commands
- **Reviewer agent**: All reviewers use subagent_type `claude-praxis:reviewer` (read-only)
