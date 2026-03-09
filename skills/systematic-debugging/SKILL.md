---
name: systematic-debugging
description: Use when investigating bugs, errors, unexpected behavior, reviewing or analyzing bug investigations, re-investigating causes, or when asked "why doesn't this work?"
user-invokable: false
---

# Systematic Debugging

Diagnose root causes through evidence, not guesswork. Never jump to a fix without understanding why.

## The Iron Law

```
NO FIX WITHOUT A PROVEN DIAGNOSIS
```

## 3-Phase Process

### Phase 1: Reproduce

Establish a reliable way to trigger the bug.

```
1. Get reproduction steps (from user, logs, or error report)
2. Run them. Does the bug actually happen?
3. If not reproducible → gather more context, don't guess
4. Document: exact command, input, expected vs actual output
```

**Exit criteria**: You can trigger the bug on demand.

### Phase 2: Isolate

Narrow down to the smallest scope that still fails.

```
1. Remove unrelated code/config changes
2. Simplify the input
3. Identify the last known good state (git log, git bisect)
4. Find the minimal reproduction case
```

**Exit criteria**: You know which component/function/line is responsible.

### Phase 3: Diagnose

Form hypotheses and test them with parallel adversarial investigation.

```
1. List plausible hypotheses (minimum 2), each with prove/disprove criteria
2. Dispatch one hypothesis-investigator per hypothesis (parallel Task tool calls)
   - Each investigator gathers evidence FOR their hypothesis and AGAINST alternatives
   - Uses reproduction info from Phase 1 and isolation findings from Phase 2
3. Synthesize findings: score each hypothesis as supported/weakened/refuted
4. The hypothesis with strongest evidence and least contradiction is the diagnosis
5. If all hypotheses are refuted, reframe the problem and return to step 1
```

**Exit criteria**: One hypothesis survives with supporting evidence and documented elimination of alternatives.

## Red Flags

- "I think I know what's wrong" before Phase 1 is complete
- Jumping from Phase 1 to Phase 3 (skipping Isolate)
- Only one hypothesis considered in Phase 3
- Jumping to a fix without completing diagnosis

## Common Rationalizations

| Excuse | Response |
|--------|----------|
| "It's obvious, no need to reproduce" | Obvious bugs have hidden causes. Reproduce first. |
| "I'll just try this quick fix" | That's guessing, not debugging. Diagnose first. |
| "There's only one possible cause" | There are always at least two. List them. |
| "No time for a test" | A bug without a test will come back. Write the test. |
| "It works now after my change" | Correlation is not causation. Explain WHY it works. |

## Integration

- **Parallel hypothesis investigation**: Phase 3 dispatches `hypothesis-investigator` agents (see `catalog/researchers.md`) via Task tool — one per hypothesis, always parallel
- **`/claude-praxis:debug` command**: Orchestrates this skill's 3 phases and produces an Investigation Report
- **`/claude-praxis:implement` command**: After diagnosis, the fix is implemented via `/claude-praxis:implement` with TDD + review
