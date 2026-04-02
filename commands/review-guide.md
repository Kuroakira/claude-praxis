---
name: review-guide
description: >-
  Generate a self-review guide for AI-generated code — test-first reading order
  with attention points and design rationale. Use after vibe coding to understand
  what was built.
disable-model-invocation: false
---

Generate a **Self-Review Guide** for the current changes.

The goal is NOT to find bugs — it's to help you **understand what was built** so you can review it with informed eyes. The guide provides a reading order (tests first, then production code), attention points for each file, and design rationale from FeatureSpec/Design Doc when available.

## Options

- `--base <branch>`: Override the base branch for diff detection (default: auto-detect merge-base with main)
- `--doc <path>`: Specify a FeatureSpec or Design Doc path for design context (default: auto-discover from `claudedocs/`)

## Step 1: Detect Changed Files

1. Determine the base branch:
   - If `--base` is specified, use that branch
   - Otherwise, auto-detect the merge-base with `main`
2. Run `git diff --name-only <base>...HEAD` to list all changed files
3. Classify each file:
   - **Test files**: `*.test.ts`, `*.spec.ts`, files under `__tests__/`, `tests/`
   - **Production code**: `*.ts`, `*.js`, `*.tsx`, `*.jsx` (excluding test files)
   - **Config/non-code**: `*.json`, `*.md`, `*.yml`, `*.yaml`, `*.css`, etc.
4. Count total files and approximate lines changed (`git diff --stat`)
5. If no changes detected, inform the user and stop

## Step 2: Discover Design Context

Search for FeatureSpec and Design Doc that relate to the current changes:

1. Search `claudedocs/feature-specs/` and `claudedocs/design-docs/` for documents matching the current branch name or topic keywords
2. If `--doc` is specified, use that path directly
3. **If found**: Read the document and extract:
   - Goals and non-goals
   - Key design decisions and their rationale
   - Alternatives that were considered and rejected
4. **If not found**: Note the absence. In Step 4, infer design intent from commit messages and code structure. Mark all inferences explicitly

## Step 3: Map Tests to Production Code

Build a mapping between test files and the production files they verify:

1. **Convention-based mapping** (try first):
   - `foo.test.ts` → `foo.ts`
   - `__tests__/foo.test.ts` → `foo.ts`
   - `tests/foo.test.ts` → `src/foo.ts` (or matching source directory)
2. **Import-graph fallback** (for non-standard names or integration tests):
   - Read the test file's import statements
   - Identify which production files are imported and tested
3. Produce a mapping table:
   ```
   Test File              → Production File(s)
   auth.test.ts           → auth.ts
   integration/flow.test.ts → auth.ts, session.ts
   ```
4. Flag:
   - **Unmapped tests**: Test files whose production counterpart is not in the diff
   - **Untested production files**: Production files with no corresponding test in the diff

## Step 4: Generate Reading Guide

Construct the guide following these principles:
- **Test first**: For each group, read tests before production code
- **Grouped by concern**: Organize by logical feature/change, not alphabetically
- **Brief and scannable**: Each step is a few lines — enough to orient, not to explain everything
- **Design rationale included**: Why this approach was chosen, not just what it does

### Structure

**For small diffs (under 20 files)**:

Output a single guide with this structure per group:

```
### [Group Name]: [Brief description of what this group of changes does]

**Design rationale**: [Why this approach — from FeatureSpec/Design Doc, or inferred from commits]

**Reading order**:

1. **[test-file.test.ts]** — [What this test verifies, in plain language]
   - Attention: [What to look for — e.g., "edge case handling for empty input"]

2. **[production-file.ts]** — [What this file does in this change]
   - Attention: [What to look for — e.g., "the retry logic in handleError()"]
```

**For large diffs (20+ files)**:

Output an overview map first (hub), then per-group detail (spokes):

```
## Overview

This change spans [N] files across [M] groups:

1. **[Group A]** — [one-line summary] ([N] files)
2. **[Group B]** — [one-line summary] ([N] files)
...

---

## Group A: [name]
[detailed reading order as above]
```

**For mixed changes (refactor + feature + bugfix)**:

Separate into distinct sections by change type:

```
## Refactoring Changes
[reading order for refactoring files]

## New Feature: [name]
[reading order for feature files]
```

**For config/non-code files**:

Separate section at the end:

```
## Configuration Changes
- `tsconfig.json` — [what changed and why]
- `package.json` — [dependency added/updated]
```

These formats compose: a large mixed diff uses the hub-and-spoke structure with groups separated by change type.

### Attention Points

Attention points are context-sensitive — derived from reading the actual code, not a generic checklist. Examples of good attention points:

- "This function has 3 early returns for error cases — verify each maps to a test"
- "The retry count is hardcoded to 3 — check if this should be configurable"
- "This import pulls in the entire module — check if a selective import is better"

### Design Rationale

For each group, include a brief "why" explanation:

- **When FeatureSpec/Design Doc exists**: Quote or summarize the relevant decision and its rationale
- **When no design context exists**: Infer intent from commit messages and code patterns. Always mark inferences:
  > *Inferred*: This appears to handle rate limiting based on the retry pattern and error codes used.

### Closing Section

End the guide with suggested follow-up questions:

```
## Questions to Explore

If anything in this guide is unclear, ask about it. Some starting points:

- "Why does [file] use [pattern] instead of [alternative]?"
- "What happens if [edge case] occurs in [function]?"
- "How does [component A] interact with [component B]?"
```

## Step 5: Output

Output the complete guide to chat. Include a summary header:

```
# Review Guide: [branch name or topic]

**Files**: [N] changed ([X] test, [Y] production, [Z] config)
**Groups**: [M] logical groups
**Design context**: [Found: feature-spec-name.md | Not found — inferences marked]
```

No files are saved. The guide is ephemeral — it serves as a reading companion for this review session.

## Edge Case Summary

| Situation | Behavior |
|-----------|----------|
| No test files in diff | Skip test-first ordering. Note "No test files in this change" at the top |
| Test-only changes | Show test reading order with references to the production code being tested |
| 20+ files | Overview map (hub) + per-group detail (spokes) |
| Mixed change types | Separate sections by type (refactor / feature / bugfix) |
| No FeatureSpec/Design Doc | Infer from commits and code, mark as "*Inferred*" |
| Config-only changes | Single section listing config files with brief explanations |
