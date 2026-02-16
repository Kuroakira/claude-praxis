---
name: praxis:compound
description: Promote valuable knowledge from Flow to Stock — curate learnings from recent work
disable-model-invocation: true
---

Invoke skill `context-persistence`, then execute **Flow → Stock Promotion**:

1. Read `.claude/context/progress.md` (recent work log)
2. For each entry, evaluate: does this contain reusable knowledge?
3. **Present a routing proposal to the human** — do NOT write directly:

```
📋 /compound — Knowledge Promotion Proposal

From progress.md, I found the following promotable learnings:

| # | Learning | Context / Rationale | Proposed Destination |
|---|----------|--------------------|--------------------|
| 1 | "JWT chosen over session-based auth" | "Stateless requirement, multiple API consumers" | project learnings |
| 2 | "CORS middleware must come before auth" | "Auth middleware rejects preflight requests otherwise" | global learnings |
| 3 | "Never use eval()" | "Arbitrary code execution risk" | code-quality-rules |
| 4 | "Design Docs should focus on WHY, not HOW" | "HOW becomes outdated when implementation changes" | framework improvement → design-doc-format |
| 5 | "Fixed typo in line 42" | — | discard |

Adjust any routing? (or "OK" to proceed)
```

**Important**: Every learning MUST include its context/rationale — the WHY behind the decision or discovery. This context is what makes the learning reusable: when a similar situation arises later, we can ask "does the same rationale still apply?" instead of blindly repeating the same choice.

4. Wait for human confirmation or adjustments before writing
5. For quality rule candidates, follow the Rule Evolution Protocol in `code-quality-rules`:
   - Propose the rule to the human
   - If approved, add to SKILL.md with examples
6. After confirmation, write to destinations and clean up promoted entries from `progress.md`
7. Report final results

| Destination | Criteria | Example |
|-------------|----------|---------|
| `.claude/context/learnings.md` | Project-specific knowledge | "This API rate-limits at 100req/min" |
| `~/.claude/learnings/global-learnings.md` | Cross-project knowledge | "CORS middleware must come before auth" |
| `code-quality-rules` (self-evolution) | Universal quality rule | "Never use eval()" |
| framework improvement → `[skill or command]` | Better way to research, design, implement, debug, etc. | "Design Docs should focus on WHY" → update design-doc-format |
| discard | Not reusable, ephemeral detail | "Fixed typo in line 42" |

### Framework Improvement Process

When a learning is about **how to work** (not what to build), route it to the relevant skill or command:

1. Identify which skill/command should be updated (e.g., `design-doc-format`, `research.md`, `systematic-debugging`)
2. Propose a specific edit to the human: what to add/change and why
3. If approved, apply the edit directly to the skill or command file
4. This is how the framework evolves from experience — not just code quality rules, but research methods, design practices, implementation workflows, and debugging approaches
