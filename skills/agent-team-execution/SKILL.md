---
name: agent-team-execution
description: Use when a task benefits from parallel exploration with multiple independent perspectives — research, code review, or debugging.
---

# Agent Team Execution

Coordinate multiple Claude Code sessions to explore problems from independent angles, challenge each other's findings, and converge on stronger conclusions.

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

## Cost Awareness

Agent teams use significantly more tokens than a single session. Each teammate is a full Claude instance.

| Approach | Relative Cost | Use When |
|----------|--------------|----------|
| Single session | 1x | Simple tasks |
| Subagent | 2-3x | Focused tasks, result-only |
| Agent team (3) | 4-6x | Parallel exploration needed |
| Agent team (5) | 7-10x | Complex debugging only |

Start with 3 teammates. Only go to 5 for debugging with many plausible hypotheses.

## Integration

- Research output feeds into `/design` phase (getting-started workflow)
- Review output follows `requesting-code-review` format (severity ratings)
- Debugging output feeds into fix implementation via `subagent-driven-development`
- **Never use for implementation** — use `subagent-driven-development` instead
