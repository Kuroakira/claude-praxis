---
name: review
description: Request a code review for completed work
disable-model-invocation: false
---

Orchestrate a **standalone code review** with graduated tier selection.

## Options

- `--full`: Skip tier determination and dispatch **all** reviewers. Use when maximum coverage is needed regardless of diff size.

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
- **Reviewers**: `code-quality` + `simplicity` + `general-review` + `security-perf` + `beyond-diff` + `error-resilience` + `readability` + `devils-advocate` + `ts-patterns` (if TypeScript) + `regression-check`
- Proceed directly to Step 4.

**Otherwise**, apply the graduated tier model:

| Condition | Tier | Typical Reviewers |
|-----------|------|-------------------|
| 1-3 files, single module, no security | **light** | `code-quality` + `readability` + `devils-advocate` |
| 4+ files, or cross-module, or new feature | **thorough** | `code-quality` + `simplicity` + `general-review` + `security-perf` + `beyond-diff` + `readability` + `devils-advocate` (+ `error-resilience` if external deps or recursive-graph data or malformed-data risk) |
| Security-sensitive (auth, input validation, secrets) | **thorough** | `code-quality` + `simplicity` + `general-review` + `security-perf` + `beyond-diff` + `readability` + `devils-advocate` |

### Light tier: add `beyond-diff` when diff contains external interaction signals

Scan the diff for these patterns. If **any** match, add `beyond-diff` to the light tier:
- HTTP calls: `fetch`, `axios`, `got`, `request`, `ky`, `ofetch`, `$fetch`
- Auth/session: `signIn`, `signOut`, `token`, `session`, `refresh`, `credential`, `auth`, `JWT`, `OAuth`
- State across requests: `expiry`, `expire`, `ttl`, `cache`, `retry`, `poll`
- External SDK calls: API client method invocations (e.g., `stripe.`, `supabase.`, `prisma.`)

Adjust based on the specific changes:
- API changes → add `spec-compliance`
- Architecture changes → add `architecture`
- New hook/utility patterns → add `structural-fitness`
- Complex conditional logic (scattered type-dispatching, state-dependent branching, responsibility mixing) → add `structural-patterns`
- **TypeScript project** (tsconfig.json exists) → add `ts-patterns` to ALL tiers

## Step 4: Dispatch

Invoke `dispatch-reviewers` with:
- `reviewers`: selected reviewer IDs from Step 3
- `tier`: determined tier from Step 3
- `target`: **changed file paths only** (from Step 2)
- `reasoning`: brief rationale for tier and reviewer selection (human-facing only)

## Step 5: Address Feedback

Handle review results using `receiving-code-review` skill:
1. **Critical/Important issues** — fix before proceeding
2. **Minor issues** — note for human judgment
3. **Conflicting opinions** — resolve explicitly (state which adopted and why)
4. If fixes were needed, re-verify (Step 1) and re-run only affected reviewers
