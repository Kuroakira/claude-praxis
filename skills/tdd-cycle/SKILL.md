---
name: tdd-cycle
description: Use when implementing code within a task — provides the RED-GREEN-REFACTOR procedure and decision point consultation pattern.
user-invocable: false
---

# TDD Cycle

The concrete procedure for test-driven development. The constraint "TDD Required — delete and redo" lives in `rules/code-quality.md`. This skill provides the HOW.

## Mini-Catalog Loading (once per implementation session)

Before the first TDD cycle in this session, read:
- `catalog/red-phase-test-patterns.md` — test design prompts for the RED phase
- `catalog/post-green-bug-patterns.md` — latent bug patterns for the VERIFY phase

These provide context for the trigger questions and VERIFY dispositions below. Read once — not per cycle.

## The Cycle

### RED: Write a Failing Test

Define the expected behavior as a test BEFORE writing any production code.

**Trigger Questions**: Before writing the test, evaluate each pattern below. These cover the highest-frequency patterns; the full set (including data flow and null safety patterns) is in `catalog/red-phase-test-patterns.md`. For each, produce a disposition:
- **"N/A: [reason]"** — the pattern does not apply to this task
- **"Test added: [description]"** — a test case was added to cover this pattern

| # | Pattern | Disposition |
|---|---------|-------------|
| 1 | Will this code need to handle empty collections (array, Map, Set)? | |
| 2 | Will this code have first/last logic that must work for single-element collections? | |
| 3 | Can any index become negative (from indexOf -1, arithmetic)? | |
| 4 | Are there type utilities that need edge case tests (any, never, unknown, union)? | |
| 5 | Will state be reused across sequential operations? Test for leakage. | |
| 6 | Will closures be created inside loops or repeated operations? | |
| 7 | Will this operation update state that drives a subsequent decision? | |
| 8 | Will this function be called repeatedly? Test for accumulated side effects. | |
| 9 | Will concurrent async operations share mutable state? | |
| 10 | Will preconditions be checked before an await that could invalidate them? | |

After completing the trigger question dispositions, write the test:

1. Write a test that describes what the code should do
2. Run the test — it MUST fail (if it passes, the test is wrong or the behavior already exists)
3. The test failure message should clearly describe the gap

### GREEN: Write Minimal Code

Write the smallest amount of code that makes the test pass.

1. Do NOT write more than needed — resist the urge to "complete" the feature
2. Run the test — it MUST pass
3. If it doesn't pass, fix the code (not the test, unless the test was wrong)

### VERIFY: Check for Latent Bug Patterns

Before refactoring, scan the code you just wrote for latent bugs — patterns where tests pass but hidden issues exist. For each pattern below, produce a disposition:
- **"N/A: [reason]"** — the pattern does not apply to this code
- **"Finding: [issue] → Action: [fix]"** — an issue was found and addressed

| # | Pattern | Disposition |
|---|---------|-------------|
| 1 | Is decision-driving state updated after the action it triggers? | |
| 2 | Can a lifecycle event fire during an in-progress async operation? | |
| 3 | Are side effects (listeners, timers, entries) cleaned up? | |
| 4 | Does a debounced/throttled callback read a ref that goes stale under rapid calls? | |
| 5 | Does a single handler both end one operation and start another (compound transition)? | |
| 6 | Is the try-catch scope limited to the error source (not wrapping business logic too)? | |
| 7 | Does a catch block discriminate by error type (not swallowing all errors)? | |
| 8 | Does the external API actually throw on error, or report via redirect/return/callback? | |
| 9 | Are resources (handles, connections, temp files) released on error paths? | |
| 10 | Are async callbacks on event listeners/emitters guarded with .catch()? | |
| 11 | Is every async call's return value awaited (not silently discarded)? | |
| 12 | Is the Promise chain's error path complete (.then with .catch, no empty handlers)? | |
| 13 | Does a guard clause make downstream branch conditions always true/false? | |
| 14 | Are values preserved through the transformation pipeline (no silent drops)? | |
| 15 | Is the return value of called functions used (not ignored when it carries error info)? | |
| 16 | Are stubs/placeholders unreachable from production code paths? | |

### REFACTOR: Clean Up

Review the VERIFY dispositions for any findings that should inform cleanup decisions.

Improve the code while keeping all tests green.

1. Remove duplication
2. Improve naming
3. Simplify structure
4. Run tests after each change — they must stay green

### Structural Friction Check

After REFACTOR, before committing, evaluate whether the implementation is fighting the existing structure. This recreates the feedback loop that hand-coding naturally provides — where friction signals "the architecture needs rethinking."

**Quantitative friction check**: When Serena is available, use `find_referencing_symbols` on the key symbols you changed to measure coupling metrics — reference count (callers), coupled module count. When unavailable, use Grep to count references. High numbers relative to the feature's conceptual complexity confirm structural friction objectively.

**Friction signals** (any one warrants a PAUSE):
- This task touched more files than the feature's complexity warrants
- You added conditionals or branches to accommodate the new behavior instead of the structure naturally supporting it
- Tests required extensive mocking or setup because components are tightly coupled
- You duplicated a pattern that already exists elsewhere (the structure doesn't allow reuse)
- The "simplest implementation" still feels complex
- Reference data (Serena or Grep) shows high cross-module coupling on the changed symbols

**When friction is detected**: PAUSE and present to the human:

> "Structural friction detected: [describe what happened]. This suggests the surrounding structure may not be a good fit for this feature. Options:
> A) Continue as-is — the friction is acceptable for this scope
> B) Restructure [specific area] first, then re-implement this task on the cleaner foundation"

The human decides. Do not silently power through structural friction.

### Commit

After REFACTOR (and structural friction check), commit the working code + passing tests together.

## Decision Point Consultation

When multiple valid approaches exist during implementation (library choice, data structure, error handling strategy, API design), do NOT decide silently. Present options with trade-offs:

> "Two approaches here: A (simpler, less flexible) vs B (more setup, but extensible). Which fits better?"

This applies to:
- Library or dependency choices
- Data structure or algorithm selection
- Error handling strategy (throw vs return vs Result type)
- API design (REST conventions, naming, response shape)
- Architecture patterns (when the Design Doc doesn't prescribe one)

The human decides. This is where engineering judgment grows.

## Integration

- **Semantic tools**: Serena MCP (`find_referencing_symbols`) for quantitative coupling metrics in Structural Friction Check
- **Mini-catalogs**: `catalog/red-phase-test-patterns.md` (RED trigger question context), `catalog/post-green-bug-patterns.md` (VERIFY disposition context)
- **Constraint**: `rules/code-quality.md` — "TDD Required. Delete and redo."
- **Invoked by**: `commands/implement.md` Phase 2 Step A
- **Referenced by**: `subagent-driven-development` Implementer Prompt Template
