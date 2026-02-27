---
name: parallel-review-team
description: Use when a workflow reaches a review point — dispatches 4 parallel reviewers with independent verification sources. Invoked by commands with a type parameter.
---

# Parallel Review Team

> **Migration note**: This skill is a backward-compatible wrapper. It maps legacy type names to catalog IDs and delegates to `dispatch-reviewers`. New code should invoke `dispatch-reviewers` directly with catalog IDs.

Four independent reviewers, each verifiable against a different source. Delegate review — do NOT self-review with a checklist.

## The Iron Law

```
INDEPENDENT VERIFICATION SOURCES — IF TWO REVIEWERS USE THE SAME EVIDENCE, MERGE THEM
```

## Review Types

Commands invoke this skill with a type that determines the reviewer configuration.

| Type | Catalog IDs | Tier |
|------|-------------|------|
| `code-review` | `spec-compliance`, `code-quality`, `security-perf`, `devils-advocate` | thorough |
| `document-review` | `architecture`, `user-impact`, `document-quality`, `devils-advocate` | thorough |
| `spec-review` | `requirements`, `feasibility`, `document-quality`, `devils-advocate` | thorough |

If the type is not recognized, warn the user ("⚠️ Unrecognized review type '[type]' — falling back to code-review") and use code-review as the default.

## Dispatch

Map the type to catalog IDs using the table above, then invoke `dispatch-reviewers` with:
- `reviewers`: the mapped catalog ID list
- `tier`: thorough
- `target`: the review target (code, Design Doc, or FeatureSpec)

## Apply Findings

Apply findings per `dispatch-reviewers` procedure (see `dispatch-reviewers` skill, "Apply Findings" section).

## Integration

- **Invoked by**: `commands/implement.md`, `commands/design.md`, `commands/feature-spec.md` (legacy invocations)
- **Delegates to**: `dispatch-reviewers` skill (catalog-based dispatch)
- **Catalog**: `catalog/reviewers.md` (source of reviewer definitions)
- **Selection principle**: See `catalog/reviewers.md` for independent verification sources per reviewer
- **Devil's Advocate is mandatory**: Every review type includes one. Prevents groupthink by verifying against counter-evidence
