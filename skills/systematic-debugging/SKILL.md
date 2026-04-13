---
name: systematic-debugging
description: Use when investigating bugs, errors, unexpected behavior, reviewing or analyzing bug investigations, re-investigating causes, or when asked "why doesn't this work?"
user-invocable: false
---

# Systematic Debugging

Diagnose root causes through evidence, not guesswork. Never jump to a fix without understanding why.

## The Iron Law

```
NO FIX WITHOUT A PROVEN DIAGNOSIS
```

## Pre-step: Session Cache (Optional)

If the `session-cache:session-cache-protocol` skill is available, invoke it before starting file reads. This reduces redundant file reads when the same files have been read during earlier investigation in the session. If unavailable, proceed without — this step is an optimization, not a requirement.

## 3-Phase Process

### Phase 1: Reproduce

Establish a reliable way to trigger the bug.

```
1. Get reproduction steps (from user, logs, or error report)
2. Run them. Does the bug actually happen?
3. If not reproducible → gather more context, don't guess
4. Document: exact command, input, expected vs actual output
```

**Browser-based reproduction (when `--play` is specified)**:

1. Navigate to the relevant page and take a screenshot to establish the initial state
2. Interact with UI elements to trigger the bug — click, fill forms, navigate routes
3. Collect console logs and network request errors at each step
4. Take screenshots before and after the bug-triggering action to capture the visual change
5. When encountering login gates, 2FA, CAPTCHA, or other auth barriers, PAUSE for human to complete manually

Keep the browser session open for reuse in Phase 2.

**Exit criteria**: You can trigger the bug on demand.

### Phase 2: Isolate

Narrow down to the smallest scope that still fails.

**Semantic tracing (when Serena is available)**:

1. Use `find_symbol` to locate the suspected function/class/method by name
2. Use `find_referencing_symbols` on the located symbol to trace the call chain — who calls it, what it calls
3. Follow the reference chain to narrow the scope: from module → file → function → line
4. If the error involves multiple interacting components, use `get_symbols_overview` on the relevant directory to see the full symbol hierarchy

If Serena is unavailable, use Grep to search for function/class definitions and their references across the codebase.

**Supplementary isolation**:

5. Remove unrelated code/config changes
6. Simplify the input
7. Identify the last known good state (git log, git bisect)
8. Find the minimal reproduction case

**Browser-based isolation (when `--play` is specified)**:

1. Test different scenarios in the browser — vary inputs, routes, and application state
2. Take screenshots at each scenario to document visual differences
3. Check console logs and network requests for errors specific to failing scenarios
4. Compare passing vs failing scenarios to identify the minimal trigger conditions
5. Correlate browser observations with code findings from Serena or Grep

Playwright-based isolation complements Serena's code-side tracing — Serena identifies which code is involved, Playwright confirms which user-visible behavior changes.

**Exit criteria**: You know which component/function/line is responsible, with reference chain evidence (from Serena or Grep).

### Phase 3: Diagnose

Form hypotheses and test them with parallel adversarial investigation.

```
1. List plausible hypotheses (minimum 2), each with prove/disprove criteria
2. Dispatch one hypothesis-investigator per hypothesis (parallel Task tool calls)
   - Each investigator gathers evidence FOR their hypothesis and AGAINST alternatives
   - Uses reproduction info from Phase 1 and isolation findings from Phase 2
   - Investigators use Serena semantic tools for precise symbol tracing (via scout agent capabilities)
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

- **Semantic tools**: Serena MCP (`find_symbol`, `find_referencing_symbols`, `get_symbols_overview`) for precise call chain tracing and scope isolation in Phase 2
- **Session cache**: `session-cache:session-cache-protocol` skill (optional) — reduces redundant file reads during investigation
- **Playwright MCP**: Browser automation for frontend debugging (when `--play` is specified) — reproduction via navigation, screenshots, console logs in Phase 1; scenario-based isolation in Phase 2
- **Parallel hypothesis investigation**: Phase 3 dispatches `hypothesis-investigator` agents (see `catalog/researchers.md`) via Task tool — one per hypothesis, always parallel
- **`/claude-praxis:investigate` command**: Orchestrates this skill's 3 phases and produces an Investigation Report
- **After diagnosis**: Create a fix plan via `/claude-praxis:plan` and execute with superpowers
