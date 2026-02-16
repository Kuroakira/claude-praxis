---
name: praxis:debug
description: Investigate a problem systematically — reproduce, isolate, diagnose, document findings
disable-model-invocation: true
---

Invoke the skill `systematic-debugging`, then orchestrate the **Investigation Workflow**.

This workflow investigates and documents a problem. It does NOT fix it — the fix is handled by `/praxis:implement` based on the investigation findings.

Unlike `/praxis:design`, this workflow is **interactive throughout**. Problems often change shape during investigation — what looks like a frontend bug may turn out to be a backend issue, and the human's input between phases helps keep the investigation on track.

## Phase 0: Check Past Learnings

Before starting investigation, check if past knowledge is relevant to this problem.

1. Read `.claude/context/learnings.md` and `~/.claude/learnings/global-learnings.md` if they exist
2. When a past learning is relevant, carry it forward as a hypothesis or constraint:
   > "Previously we saw [similar problem] caused by [root cause]. Could the same mechanism be at play here?"

## Phase 1: Reproduce

Establish a reliable way to trigger the problem.

1. **Clarify the problem**: What is happening vs. what should be happening? Get specific symptoms, error messages, and reproduction steps from the user
2. **Reproduce the problem**: Run the reproduction steps. Does the problem actually occur?
3. If not reproducible → gather more context (logs, environment, recent changes), don't guess
4. **Document the reproduction**: exact command, input, expected vs actual output

**PAUSE**: Present reproduction results to the human. Confirm this is the correct problem before investigating further.

## Phase 2: Isolate

Narrow down to the smallest scope that still fails.

1. **Identify the scope**: Which component, module, or layer is responsible?
2. **Eliminate irrelevant factors**: Remove unrelated code/config, simplify the input
3. **Check recent changes**: git log, git diff — what changed since the last known good state?
4. **Find the boundary**: What's the minimal reproduction case?

**PAUSE**: Present isolation findings. The problem may look different after isolation — confirm the investigation direction with the human.

## Phase 3: Diagnose

Form hypotheses and test them with evidence.

1. **List plausible hypotheses** (minimum 2 — there are always at least two possible causes)
2. For each hypothesis, define:
   - What evidence would PROVE it
   - What evidence would DISPROVE it
3. **Gather evidence**: Read code, add logging, inspect state, check dependencies
4. **Eliminate hypotheses** that contradict evidence
5. The surviving hypothesis is the diagnosis

For complex problems with 3+ plausible hypotheses, consider using `agent-team-execution` (Competing Hypothesis Debugging) to test hypotheses in parallel.

**PAUSE**: Present the diagnosis with supporting evidence. The human may have additional context that changes the diagnosis.

**Record to progress.md**: Append an entry with the root cause and why it was hard to find.

```markdown
## [timestamp] — /praxis:debug: Diagnosis complete
- Decision: [root cause identified]
- Rationale: [why this was hard to find, what made it non-obvious]
- Domain: [topic tag for future matching]
```

## Phase 4: Document Findings

Create an Investigation Report summarizing the investigation.

```markdown
# Investigation Report: [Problem Title]

## Problem
What was reported and how to reproduce it.

## Root Cause
What is actually causing the problem, with evidence.
- Evidence: [what was observed that proves this]
- Why it happens: [the mechanism behind the bug]

## Affected Scope
What else might be impacted by this root cause.
- Direct impact: [the reported symptoms]
- Potential side effects: [other areas that share the same root cause]

## Recommended Fix
The approach to fix the problem (not the code itself — that is `/praxis:implement`'s job).
- What needs to change and why
- What tests should verify the fix
- What to watch out for during implementation

## Alternative Approaches
Other ways to address the problem, if applicable.
| Approach | Trade-off |
|----------|-----------|
| [approach A] | [pros/cons] |
| [approach B] | [pros/cons] |
```

**Save the Investigation Report to file**: Write the report to `.claude/context/investigation-[name].md` (kebab-case name derived from the problem title). This ensures the report survives context compact.

## Phase 5: Present for Human Review

Present the Investigation Report to the human with:

1. The full Investigation Report
2. Explicit next step: "Investigation complete. Ready for /praxis:implement to fix based on these findings?"

If the human has questions or disagrees with the diagnosis, return to Phase 3 with the new information.
