---
name: debug
description: Investigate a problem systematically — reproduce, isolate, diagnose, document findings
disable-model-invocation: false
---

Invoke the skill `systematic-debugging`, then orchestrate the **Investigation Workflow**.

This workflow investigates and documents a problem. It does NOT fix it — the fix is handled by `/claude-praxis:implement` based on the investigation findings.

Unlike `/claude-praxis:design`, this workflow is **interactive throughout**. Problems often change shape during investigation — what looks like a frontend bug may turn out to be a backend issue, and the human's input between phases helps keep the investigation on track.

## Phase 0: Check Past Learnings

Invoke `check-past-learnings` (role: investigation). Carry relevant learnings forward as hypotheses or constraints.

## Phase 1: Reproduce

Establish a reliable way to trigger the problem.

1. **Clarify the problem**: What is happening vs. what should be happening? Get specific symptoms, error messages, and reproduction steps from the user
2. **Reproduce the problem**: Run the reproduction steps. Does the problem actually occur?

   **When `--play` is specified**: Use Playwright MCP to reproduce the problem in the browser. Navigate to the relevant page, interact with UI elements to trigger the bug, take screenshots at each step, and collect console logs and network request errors. When encountering login gates, 2FA, CAPTCHA, or other steps requiring human credentials, **PAUSE** and ask the human to complete the step manually before continuing. Keep the browser session open for reuse in Phase 2.

3. If not reproducible → gather more context (logs, environment, recent changes), don't guess
4. **Document the reproduction**: exact command, input, expected vs actual output

**PAUSE**: Present reproduction results to the human. Confirm this is the correct problem before investigating further.

## Phase 2: Isolate

Narrow down to the smallest scope that still fails.

1. **Identify the scope**: Which component, module, or layer is responsible?
2. **Eliminate irrelevant factors**: Remove unrelated code/config, simplify the input

   **When `--play` is specified**: Test different scenarios in the browser to narrow down the trigger — different inputs, routes, application states. Take screenshots at each step to document visual state. Check console logs and network requests for errors at each scenario. Compare behavior across scenarios to identify the minimal conditions that reproduce the bug.

3. **Check recent changes**: git log, git diff — what changed since the last known good state?
4. **Find the boundary**: What's the minimal reproduction case?

**PAUSE**: Present isolation findings. The problem may look different after isolation — confirm the investigation direction with the human.

## Phase 3: Diagnose

Form hypotheses, then test ALL of them in parallel with adversarial investigators.

### Step 1: Hypothesis Formation

1. **List plausible hypotheses** (minimum 2 — there are always at least two possible causes)
2. For each hypothesis, define:
   - What evidence would PROVE it
   - What evidence would DISPROVE it
3. Assign each hypothesis an identifier (H1, H2, H3...)

### Step 2: Parallel Investigation Dispatch

> **Note**: The investigator dispatch procedure below is defined inline because `debug.md` dispatches investigators directly via Task tool without invoking `systematic-debugging` for Phase 3. The skill handles Phases 1-2 procedure definition; the command adds the parallel dispatch model.

Dispatch one `hypothesis-investigator` (see `catalog/researchers.md`) per hypothesis using the Task tool. All investigators launch in **parallel** (single message with multiple Task tool calls).

Each investigator receives:

| Field | Content |
|-------|---------|
| **Assigned hypothesis** | The hypothesis statement + its prove/disprove criteria |
| **Alternative hypotheses** | The other hypotheses (for adversarial disproval) |
| **Reproduction info** | Exact reproduction steps, commands, expected vs actual output from Phase 1 |
| **Isolation findings** | Affected component, minimal reproduction case, recent changes from Phase 2 |

**Investigator prompt template**:

```
You are Investigator [N] in a parallel bug investigation.

## Your Hypothesis
[H{N}]: [hypothesis statement]
- Evidence that would PROVE this: [prove criteria]
- Evidence that would DISPROVE this: [disprove criteria]

## Alternative Hypotheses (gather evidence AGAINST these)
[For each other hypothesis: identifier + statement]

## Bug Reproduction (from Phase 1)
[Exact reproduction steps, commands, expected vs actual output]

## Isolation Findings (from Phase 2)
[Affected component/module, minimal reproduction case, recent changes (git log/diff)]

## Your Task
1. Investigate your hypothesis. Read relevant code, inspect state, check logs, examine git history.
2. Gather evidence that SUPPORTS your hypothesis — cite specific files, lines, commits.
3. Gather evidence that DISPROVES your hypothesis — be honest if the evidence is weak.
4. Gather evidence AGAINST each alternative hypothesis.
5. Rate your confidence: strong (clear evidence), moderate (suggestive but not conclusive), weak (plausible but unsupported).

## Report Format
### Evidence FOR [H{N}]
- [evidence with file:line or commit citation]

### Evidence AGAINST [H{N}]
- [evidence with citation, or "None found"]

### Evidence AGAINST alternatives
- [H{other}]: [evidence with citation, or "No contradicting evidence found"]

### Confidence: [strong/moderate/weak]
[Justification for confidence level]
```

**Dispatch rules**:
- Investigator count = hypothesis count (one agent per hypothesis, no sharing)
- All investigators launch in a single message (parallel Task tool calls)
- No investigator sees another investigator's findings until synthesis
- Agent type: `claude-praxis:researcher` (haiku, lightweight)

### Step 3: Synthesis

After all investigators return:

1. **Collect evidence**: For each hypothesis, aggregate the evidence FOR (from its investigator) and evidence AGAINST (from other investigators)
2. **Score hypotheses**:
   - **Supported**: Strong evidence FOR, no contradicting evidence AGAINST
   - **Weakened**: Some evidence FOR, but also evidence AGAINST
   - **Refuted**: Clear evidence AGAINST, or investigator's own confidence is weak
3. **Select diagnosis**: The hypothesis with the strongest support and least contradiction is the diagnosis. If multiple survive with similar strength, state the ambiguity explicitly
4. **Document elimination**: For each refuted hypothesis, state what evidence eliminated it
5. **Handle no-survivor case**: If all hypotheses are refuted, the problem needs reframing. Return to Step 1 with new information from the investigation

**Synthesis output format**:

```markdown
## Hypothesis Investigation Results

| Hypothesis | Evidence FOR | Evidence AGAINST | Verdict |
|------------|-------------|-----------------|---------|
| H1: [statement] | [summary] | [summary] | Supported / Weakened / Refuted |
| H2: [statement] | [summary] | [summary] | Supported / Weakened / Refuted |

## Diagnosis
[The surviving hypothesis with strongest evidence]
[Why the alternatives were eliminated]
[Remaining uncertainties, if any]
```

**PAUSE**: Present the diagnosis with the full hypothesis investigation results to the human. The human may have additional context that changes the diagnosis.

**Record to `.claude/context/progress.md`**: Append an entry with the root cause and why it was hard to find. Include hypothesis adoption/rejection decisions with evidence — these entries serve as comparison material for `/understanding-check`.

```markdown
## [timestamp] — /claude-praxis:debug: Diagnosis complete
- Decision: [root cause identified]
- Rationale: [why this was hard to find, what made it non-obvious]
- Hypotheses tested: [H1: verdict, H2: verdict, ...]
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
The approach to fix the problem (not the code itself — that is `/claude-praxis:implement`'s job).
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
2. Explicit next step: "Investigation complete. Ready for /claude-praxis:implement to fix based on these findings?"

If the human has questions or disagrees with the diagnosis, return to Phase 3 with the new information.
