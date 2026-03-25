---
name: milestone-review
description: Use when a milestone boundary is reached within a task — provides the cross-milestone consistency self-review procedure.
user-invocable: false
---

# Milestone Review

A lightweight self-review at milestone boundaries within a task. Catches cross-cycle consistency issues that are invisible within a single TDD cycle and should not wait until Per-Task Review (Step C).

VERIFY checks per-cycle latent bugs. Per-Task Review provides external judgment. This skill checks what only becomes visible as milestones accumulate: cross-milestone consistency.

## When to Invoke

Invoked by the implement.md Phase 2 task loop after each milestone's TDD cycles complete. Not invoked within the TDD cycle itself — the TDD cycle runs identically every cycle.

## The Review Procedure

Evaluate the just-completed milestone against three categories. For each, produce a disposition:
- **"N/A: [reason]"** — the category does not apply (e.g., no cross-milestone interfaces in this milestone)
- **"Finding: [issue] → Action: [fix]"** — a concrete issue was found and addressed

| # | Category | Evaluation Scope | Disposition |
|---|----------|-----------------|-------------|
| 1 | **Interface and integration consistency** | Do the type signatures, function contracts, data shapes, and behavioral interfaces across milestone boundaries match? Does the just-completed milestone correctly implement or consume what prior milestones defined? | |
| 2 | **Accumulated state** | Does state management across milestones remain coherent (no leaked state, no conflicting assumptions)? | |
| 3 | **Test coverage delta** | Does the accumulated test suite cover the interactions between milestones, not just within them? | |

## Output Format

The disposition table above is the output artifact. This artifact feeds forward: the next milestone's context includes this review output. This creates the causal chain — findings from milestone N inform what to watch for in milestone N+1.

A missing disposition table at a milestone boundary leaves a structurally visible gap — the next milestone's input context lacks the expected review output.

## Integration

- **Invoked by**: `commands/implement.md` Phase 2 milestone loop
- **Does NOT modify**: `skills/tdd-cycle/SKILL.md` (tdd-cycle runs identically per cycle)
- **Does NOT provide input to**: Per-Task Review (Step C) prompts — Step C reviewers read code independently under the Context Isolation Rule (see `catalog/reviewers.md`)
- **Enforcement**: Output-slot dependency — next milestone references this output
