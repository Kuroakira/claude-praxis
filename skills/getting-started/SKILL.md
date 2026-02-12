---
name: getting-started
description: Use when starting a new session, resuming after compact/clear, or beginning a new implementation task.
---

# Claude Praxis

AI as a mirror — articulate "why" at every step, accumulate knowledge across projects.

## Core Philosophy

1. **Understand, not just build** - Every phase forces you to articulate WHY: why this design, why this approach, why not alternatives
2. **You own it** - AI implements and ensures quality. But the deliverables are yours to explain. "AI said so" is not an answer
3. **Compound growth** - Knowledge from each project accumulates as learnings, making the next project's decisions sharper
4. **Self-evolving rules** - Quality standards grow from real experience, captured as explicit rules

## Skills

| Skill | When to Use |
|-------|-------------|
| `code-quality-rules` | Always during implementation. Enforces and evolves quality rules. |
| `systematic-debugging` | When investigating bugs, errors, or unexpected behavior. 4-phase root cause analysis. |
| `context-persistence` | When preserving state across compact/clear. Write auto, read manual. |
| `design-doc-format` | When creating Design Docs. Notion-compatible format. |
| `incremental-review` | During implementation. Show small changes with reasoning. |

## Core Workflow

```
┌─────────────────────────────────────────────────────┐
│ 1. Research Phase (/research)                       │
│    - Understand the problem space and prior art     │
│    - Ask "why" before deciding "what"               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. Design Phase (/design)                           │
│    - Articulate your design rationale               │
│    - Document alternatives and WHY you chose this   │
│    - Submit for review                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. Planning Phase (/plan)                           │
│    - Break into steps you can explain               │
│    - Each step has a clear purpose                  │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. Implementation Phase (/implement)                │
│    - Build with TDD and quality rules               │
│    - Issue found → understand why → update rules    │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 5. Compound Phase (/compound)                       │
│    - Extract what you learned                       │
│    - Carry it forward to the next project           │
└─────────────────────────────────────────────────────┘
```

## Feedback Loop During Implementation

```
Issue found ──→ Discuss with human ──→ Decide direction
    ↓                                      ↓
    └──────────────────────────────────────┤
                                           ↓
                                   Update Doc first
                                           ↓
                                   Re-implement
                                           ↓
                                   Propose rule addition?
                                       ↓      ↓
                                      Yes     No
                                       ↓      ↓
                                 Update SKILL.md  Move on
```

## Phase Detection & Suggestion

**You must proactively detect the appropriate phase and suggest it.** Users should not need to remember commands.

### Detection Rules

When the user starts a conversation or gives a new task, detect the context and suggest the matching command:

| Signal | Suggest | Example |
|--------|---------|---------|
| New feature/project request, exploring options, "how should we...", "what's the best approach" | `/research` | "Let me investigate best practices first. Starting /research." |
| Research is done, user is committing to an approach, "let's design...", "I think we should..." | `/design` | "We have enough research. Ready to write a Design Doc? I'll start /design." |
| Design Doc exists and is approved, "let's break this down", "what are the steps" | `/plan` | "Design is approved. Let me break it into tasks with /plan." |
| Plan exists, "let's build", "start coding", implementation request | `/implement` | "Plan is ready. Starting implementation with /implement." |
| Implementation done, tests passing, ready for feedback | `/review` | "Implementation complete. Want to run /review for a code review?" |
| Significant work completed, session winding down, context getting full | `/compound` | "Good stopping point. Want to run /compound to capture what we learned?" |
| Bug report, error investigation, "why isn't this working", debugging | `systematic-debugging` skill | "This looks like a bug. Let me use the systematic debugging approach." |

### Suggestion Behavior

1. **On task start**: Detect context and suggest the appropriate command. If the user agrees (or doesn't object), invoke it.
2. **On phase completion**: Always suggest the next logical step. Example: after /research completes, suggest /design.
3. **Commands remain available**: Users can always invoke commands directly to jump to any phase.
4. **Don't force the flow**: If the user's task doesn't fit the full workflow (e.g., a quick bug fix), skip phases that don't apply. Not every task needs all 6 phases.
5. **Be concise**: Suggest in one line, don't explain the framework every time.

### Phase Completion Signals

| Phase | Completion Signal | Next Suggestion |
|-------|------------------|-----------------|
| /research | Findings summarized, recommendations clear | "Research done. Ready for /design?" |
| /design | Design Doc written, human approved | "Design approved. Break it down with /plan?" |
| /plan | Tasks defined with file paths and tests | "Plan ready. Start /implement?" |
| /implement | All tasks done, checks passing | "All green. Run /review?" |
| /review | Review feedback addressed | "Review done. Capture learnings with /compound?" |
| /compound | Learnings promoted | Session complete or next task |

## Contextual Recall of Past Learnings

When learnings files exist (`learnings.md`, `global-learnings.md`), and a current task touches a similar domain or decision, do NOT silently apply the past learning. Instead, present it with its original context and ask the human to judge:

**Pattern**: Present the past decision with its rationale, then ask if the same assumptions hold.

> "In a previous project, we chose [X] because [rationale]. Does the same context apply here, or is this situation different?"

**Rules**:
1. Always include the **original rationale** — not just the conclusion
2. Ask whether the **assumptions still hold**, not whether they remember it
3. If the human says "same situation", apply the learning. If they say "different", explore the new context together
4. Do NOT quiz the human ("Do you remember?"). The goal is judgment, not memorization

**When NOT to recall**: Trivial or universal rules (e.g., "don't use eval") should be applied silently. Contextual recall is for decisions that depend on project context, trade-offs, or architectural choices.

## Mandatory Skill Invocation

**Skills are NOT optional. They are mandatory workflows.**

### The Iron Rule

```
If you think there is even a 1% chance a skill might apply,
you ABSOLUTELY MUST invoke the skill.
```

### Timing

Skills must be checked **BEFORE** any response, clarification, or action — even before asking clarifying questions.

```
User gives task
    ↓
Check available skills (FIRST)
    ↓
Invoke matching skill(s)
    ↓
THEN respond/act
```

### Red Flags — You Are Rationalizing

If you catch yourself thinking any of these, STOP and invoke the skill:

| Rationalization | Reality |
|-----------------|---------|
| "This is just a simple question" | Simple questions often hide complexity. Invoke the skill. |
| "I need more context first" | The skill will help you gather context properly. Invoke the skill. |
| "The skill is overkill for this" | Skills prevent improvisation. Invoke the skill. |
| "I already know how to do this" | Your knowledge may be incomplete. Invoke the skill. |
| "It will slow us down" | Skipping skills causes rework. Invoke the skill. |

### Skill Priority

When multiple skills apply:

1. **Process skills first**: systematic-debugging, agent-team-execution
2. **Then implementation skills**: code-quality-rules, subagent-driven-development
3. **Then verification**: verification-before-completion

### Available Skills

| Trigger | Skill | Description |
|---------|-------|-------------|
| Bug, error, "why doesn't this work" | `systematic-debugging` | 4-phase root cause analysis |
| Implementation task | `code-quality-rules` | TDD, quality enforcement |
| Multi-step task, parallel exploration | `subagent-driven-development` | Fresh agent per task |
| Research, analysis, multiple perspectives | `agent-team-execution` | Parallel hypothesis testing |
| Task completion, claiming "done" | `verification-before-completion` | Evidence before claims |
| Long task, context preservation | `context-persistence` | State survival across compact |
| Code review needed | `requesting-code-review` | Dispatch reviewer |
| Received feedback | `receiving-code-review` | Handle feedback properly |

### Non-Negotiable

Treating skills as "optional guidance" is fundamentally wrong. They are structured workflows that prevent inefficient improvisation. **Invoke them.**

## Session Start Checklist

When starting a new session:

1. **Check current state**
   - Any tasks in progress?
   - Does a Design Doc exist?
   - Which Phase is complete?

2. **Restore context**
   - Read necessary documents
   - Identify previous interruption point

3. **Review quality rules**
   - Read the `code-quality-rules` skill
   - Check project-specific rules

## Recovery from compact/clear

When context is lost, check persistence files first:

```
1. Check if .claude/context/ files exist (SessionStart notifies this)
2. If task_plan.md exists → read it for current task state
3. If progress.md exists → read recent entries for context
4. If neither exists → ask the human for file paths
5. Read the Design Doc and implementation plan
6. Resume from the identified point
```
