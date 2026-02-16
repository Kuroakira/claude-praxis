---
name: systematic-debugging
description: Use when investigating bugs, errors, unexpected behavior, reviewing or analyzing bug investigations, re-investigating causes, or when asked "why doesn't this work?"
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

Form hypotheses and test them with evidence.

```
1. List plausible hypotheses (minimum 2)
2. For each hypothesis, define:
   - What evidence would PROVE it
   - What evidence would DISPROVE it
3. Gather evidence (read code, add logging, inspect state)
4. Eliminate hypotheses that contradict evidence
5. The surviving hypothesis is your diagnosis
```

**For complex bugs with 3+ plausible hypotheses**: Use `agent-team-execution` (Competing Hypothesis Debugging) to test hypotheses in parallel.

**Exit criteria**: One hypothesis survives with supporting evidence.

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

- **agent-team-execution**: Phase 3 escalation for competing hypothesis debugging
- **`/praxis:debug` command**: Orchestrates this skill's 3 phases and produces an Investigation Report
- **`/praxis:implement` command**: After diagnosis, the fix is implemented via `/praxis:implement` with TDD + review
