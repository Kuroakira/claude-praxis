---
name: agent-team-execution
description: Use when a task benefits from parallel exploration with multiple independent perspectives — research, code review, or debugging.
---

# Agent Team Execution

Multiple perspectives, your synthesis. Agent teams explore in parallel — you integrate the findings into your own understanding.

Requires: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` enabled in settings.json.

## When to Use Agent Teams

| Use Case | Agent Teams? | Why |
|----------|-------------|-----|
| Research (multiple angles) | **Yes** | Parallel exploration + mutual challenge prevents single-perspective bias |
| Code review (multi-focus) | **Yes** | Independent reviewers catch different categories of issues |
| Debugging (competing hypotheses) | **Yes** | Adversarial hypothesis testing finds root cause faster |
| Implementation | **No** | Cognitive load for reviewing parallel changes is too high |
| Sequential / dependent tasks | **No** | Coordination overhead exceeds benefit |
| Simple / small tasks | **No** | Single session or subagent is sufficient |

**Implementation stays in subagent-driven-development.** Agent teams are for exploration, not production.

## 1. Parallel Research

Use during the Research Phase to explore a problem from multiple independent angles.

### Team Structure

```
Lead (coordinator)
├── Researcher A: Best practices + official documentation
├── Researcher B: Similar OSS implementations + real-world usage
└── Researcher C: Risks, anti-patterns, and devil's advocate
```

### Prompt Template

```
Create an agent team to research [topic]. Spawn 3 teammates:
- Teammate 1: Research best practices and official documentation for [topic].
  Cite all sources with URLs.
- Teammate 2: Find similar OSS implementations of [topic]. Compare approaches,
  trade-offs, and adoption.
- Teammate 3: Play devil's advocate. Find risks, anti-patterns, failure cases,
  and reasons NOT to do [topic].

After research, teammates should share findings with each other and challenge
weak claims. Then synthesize into a single recommendation with cited sources.
```

### Key Rules

- Every claim must have a source URL (Research Policy)
- Devil's advocate is mandatory — prevents groupthink
- Lead synthesizes after teammates challenge each other, not before

### Your Role After Research

Agents deliver findings. **You write the Design Doc.** Translating research into your own design rationale is where understanding happens. Don't copy-paste — articulate why YOU chose this approach based on the findings.

## 2. Adversarial Code Review

Use after implementation to get thorough, multi-focus review.

### Team Structure

```
Lead (synthesizer)
├── Reviewer A: Security focus
├── Reviewer B: Performance focus
└── Reviewer C: Spec compliance + test coverage
```

### Prompt Template

```
Create an agent team to review [changes/PR]. Spawn 3 reviewers:
- Reviewer 1: Focus on security — auth, input validation, injection,
  data exposure. Severity-rate each finding.
- Reviewer 2: Focus on performance — algorithmic complexity, unnecessary
  allocations, N+1 queries, bundle size impact.
- Reviewer 3: Focus on spec compliance and test quality — does the code
  match the requirements? Are tests specific (no lazy assertions)?
  Was TDD followed?

Reviewers should share findings and challenge each other's assessments.
A finding rated "Minor" by one reviewer may be "Critical" from another
perspective. Synthesize into a unified review with agreed severity ratings.
```

### Key Rules

- Reviewers must verify independently (verification-before-completion)
- Cross-challenge is mandatory — a security issue may also be a perf issue
- Lead produces unified report with final severity ratings

### Your Role After Review

Read the findings. For each issue, understand **why** it's a problem, not just that it is one. When you fix an issue, you should be able to explain the vulnerability/bottleneck to a teammate. Issues you didn't understand become `/compound` candidates.

## 3. Competing Hypothesis Debugging

Use when root cause is unclear and multiple theories are plausible.

### Team Structure

```
Lead (judge)
├── Investigator 1: Hypothesis A
├── Investigator 2: Hypothesis B
├── Investigator 3: Hypothesis C
└── (optional) Investigator 4-5: Additional hypotheses
```

### Prompt Template

```
Users report [problem description]. Create an agent team to debug this.

Spawn [N] investigators, each testing a different hypothesis:
- Investigator 1: [Hypothesis A — e.g., "race condition in auth middleware"]
- Investigator 2: [Hypothesis B — e.g., "stale cache after deployment"]
- Investigator 3: [Hypothesis C — e.g., "upstream API timeout changes"]

Rules:
1. Each investigator must gather evidence FOR their hypothesis
2. Each investigator must actively try to DISPROVE other hypotheses
3. Investigators should message each other with contradicting evidence
4. The hypothesis that survives adversarial testing is most likely correct

Report: surviving hypothesis with evidence, disproven hypotheses with reasons.
```

### Key Rules

- Adversarial structure is the point — this is a scientific debate
- If 3+ hypotheses are disproven and none survive, the problem needs reframing
- Lead does NOT pick a winner prematurely — let evidence decide

### Your Role After Debugging

Understand the surviving hypothesis. You should be able to explain: what caused the bug, why the other hypotheses were wrong, and what to watch for in the future. This understanding feeds into `/compound` as a learning.

## 4. Parallel Review Teams

> **Note**: The operational reviewer prompts and configurations live in `parallel-review-team` skill. This section explains the principles (why teams beat checklists, selection principle, Devil's Advocate rationale). For actual reviewer dispatch, invoke `parallel-review-team` with a type parameter.

Use at every review point in workflows — code review, document review, or spec review.

### Why Teams Beat Checklists

A single reviewer checking "spec compliance AND quality AND security AND edge cases" suffers from attention resource competition — while focused on one concern, others get overlooked. Splitting by independent verification source eliminates this structural weakness.

### Selection Principle

**Each reviewer's judgment must be verifiable against a source that is independent of other reviewers' reasoning.** If two reviewers would use the same evidence to reach conclusions, they should be merged into one.

### Team Compositions

**Code Review** (used in `/implement` Final Review):

| Reviewer | Focus | Verification Source |
|----------|-------|-------------------|
| A | Spec Compliance | Design Doc / Plan |
| B | Code Quality | code-quality-rules, project conventions |
| C | Security + Performance | OWASP Top 10, profiling patterns |
| D | Devil's Advocate | Bug patterns, production incidents |

**Document Review** (used in `/design` Auto-Review):

| Reviewer | Focus | Verification Source |
|----------|-------|-------------------|
| A | Architecture | Design principles, OSS patterns |
| B | User Impact | UX heuristics, accessibility standards |
| C | Writing Quality | document-quality-rules, design-doc-format |
| D | Devil's Advocate | Architecture failure case studies |

**Spec Review** (used in `/feature-spec` Draft Review):

| Reviewer | Focus | Verification Source |
|----------|-------|-------------------|
| A | Requirements Completeness | Product patterns, user journey maps |
| B | Technical Feasibility | Codebase constraints, platform specs |
| C | Writing Quality | document-quality-rules |
| D | Devil's Advocate | Requirements anti-patterns, competitor failures |

### Devil's Advocate is Mandatory

Every review team includes a Devil's Advocate. Their verification source is "counter-evidence to the current proposal" — inherently independent from "does it meet criteria X." This prevents groupthink where all reviewers converge on "looks good."

### Prompt Template

```
Dispatch 4 parallel reviewers for [target]:

- Reviewer A: [Focus] — Check [specific items]. Verification source: [source].
- Reviewer B: [Focus] — Check [specific items]. Verification source: [source].
- Reviewer C: [Focus] — Check [specific items]. Verification source: [source].
- Reviewer D (Devil's Advocate): Challenge the [target]. [specific challenge questions].
  Verification source: [source].

After all return: synthesize into unified report. For conflicting opinions,
state which was adopted and why. Address Critical/Important before proceeding.
```

### Your Role After Review

Read the synthesized findings. For each issue, understand **why** it's a problem. When you fix issues, you should be able to explain the underlying concern to a teammate. Patterns you didn't anticipate become `/compound` candidates.

## Cost Awareness

Agent teams use significantly more tokens than a single session. Each teammate is a full Claude instance.

| Approach | Relative Cost | Use When |
|----------|--------------|----------|
| Single session | 1x | Simple tasks |
| Subagent | 2-3x | Focused tasks, result-only |
| Agent team (3) | 4-6x | Parallel exploration needed |
| Review team (4) | 5-8x | Review points in workflows |
| Agent team (5) | 7-10x | Complex debugging only |

Start with 3 teammates. Only go to 5 for debugging with many plausible hypotheses.

## Integration

- Research output feeds into `/design` phase — **you** write the Design Doc from findings
- Review teams are used at every workflow review point: `/feature-spec` Draft Review, `/design` Auto-Review, `/implement` Final Review
- Review output follows `requesting-code-review` format (severity ratings)
- Debugging output feeds into fix implementation via `subagent-driven-development`
- All outputs feed into `/compound` — extract learnings from what agents discovered
- **Never use for implementation** — use `subagent-driven-development` instead
