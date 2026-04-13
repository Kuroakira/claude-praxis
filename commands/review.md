---
name: review
description: Request a code review for completed work
disable-model-invocation: false
---

Orchestrate a **standalone code review** with graduated tier selection.

## Options

- `--full`: Skip tier determination and dispatch all **code-oriented** reviewers (quality + correctness + devils-advocate + security-perf + ts-patterns when TypeScript). Domain-specific reviewers like `architecture`, `spec-compliance`, and `structural-fitness` are still only added when their trigger conditions apply. Use when maximum code coverage is needed regardless of diff size.

## Step 1: Verify

Run the full verification suite before requesting review:

```bash
npm run typecheck
npm run lint
npm run test
npm run build       # if applicable
```

All must pass before proceeding.

## Step 2: Assess Scope

Identify all changed files (use `git diff --name-only` against the base branch or last clean commit). Count:
- Number of changed files
- Approximate lines changed
- Whether changes touch external APIs, auth, or security-sensitive code
- Whether changes span multiple modules/features

## Step 3: Determine Tier and Select Reviewers

**If `--full` was specified**, skip tier determination and use all reviewers:
- **Tier**: `thorough`
- **Reviewers**: `quality` + `correctness` + `devils-advocate` + `security-perf` + `ts-patterns` (if TypeScript)
- Proceed directly to Step 4.

**Otherwise**, apply the graduated tier model:

| Condition | Tier | Reviewers |
|-----------|------|-----------|
| 1-3 files, single module, no security | **light** | `quality` + `correctness` |
| 4+ files, or cross-module, or new feature | **thorough** | `quality` + `correctness` + `devils-advocate` (+ `security-perf` if auth/security, + `ts-patterns` if TypeScript) |
| Security-sensitive (auth, input validation, secrets) | **thorough** | `quality` + `correctness` + `devils-advocate` + `security-perf` (+ `ts-patterns` if TypeScript) |

Adjust based on the specific changes:
- API changes → add `spec-compliance`
- Architecture changes → add `architecture`
- New hook/utility patterns → add `structural-fitness`

## Step 4: Dispatch

Invoke `dispatch-reviewers` with:
- `reviewers`: selected reviewer IDs from Step 3
- `tier`: determined tier from Step 3
- `target`: **changed file paths only** (from Step 2)
- `diff`: output of `git diff` against the base branch or last clean commit — required so `correctness` can perform regression detection
- `reasoning`: brief rationale for tier and reviewer selection (human-facing only)

## Step 5: Address Feedback

Handle review results:
1. **Critical/Important issues** — fix before proceeding
2. **Minor issues** — note for human judgment
3. **Conflicting opinions** — resolve explicitly (state which adopted and why)
4. If fixes were needed, re-verify (Step 1) and re-run only affected reviewers
