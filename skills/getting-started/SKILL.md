---
name: getting-started
description: Use when starting a new session, resuming after compact/clear, or beginning a new implementation task.
---

# Claude Praxis

AI as a mirror — articulate "why" at every step, accumulate knowledge across projects.

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

### Available Skills

| Trigger | Skill | Enforcement |
|---------|-------|-------------|
| Bug, error, test failure, unexpected behavior, "why doesn't this work" | `systematic-debugging` | 🟡 Contextual |
| **ANY task that writes, edits, or modifies code** — features, fixes, refactors, tests, scripts | `code-quality-rules` | 🔴 **Gate** — no code without this |
| Implementation plan with 3+ independent tasks, OR tasks needing isolated agent context | `subagent-driven-development` | 🟡 Contextual |
| Research needing multiple perspectives, OR problem with 3+ possible root causes | `agent-team-execution` | 🟡 Contextual |
| **About to claim "done", report success, or mark a task complete** | `verification-before-completion` | 🔴 **Gate** — no completion claims without this |
| TodoWrite with 5+ items, OR task spans 3+ phases, OR user mentions context/state preservation | `context-persistence` | 🟡 Contextual |
| **After completing a coding task or batch of tasks** | `requesting-code-review` | 🟡 Contextual — always suggest |
| Received code review feedback, corrections, or change requests | `receiving-code-review` | 🟡 Contextual |
| **Creating, updating, or adding rules to skills** — "change this skill", "add a rule" | `writing-skills` | 🔴 **Gate** — no skill edits without this |

### Skill Priority

When multiple skills apply:

1. **Process skills first**: systematic-debugging, agent-team-execution
2. **Then implementation skills**: code-quality-rules, subagent-driven-development
3. **Then verification**: verification-before-completion

### Non-Negotiable

Treating skills as "optional guidance" is fundamentally wrong. They are structured workflows that prevent inefficient improvisation. **Invoke them.**

## Phase Detection & Suggestion

**You must proactively detect the appropriate phase and suggest it.** Users should not need to remember commands.

### Detection Rules

When the user starts a conversation or gives a new task, detect the context and suggest the matching command:

| Signal | Suggest | Example |
|--------|---------|---------|
| New feature/project request, exploring options, "how should we...", "what's the best approach" | `/research` | "Let me investigate best practices first. Starting /research." |
| **"Create a Design Doc" — but no research has been done yet** | `/research` first | "A good Design Doc needs alternatives comparison. Let me start with /research first." |
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

## In-Flight Process Improvement

During any phase, if you notice a better way to work (research, design, implement, debug), **propose the improvement immediately** — don't wait for /compound.

> "I noticed that [current approach] could be improved by [suggestion]. Want me to update [skill/command] to reflect this?"

This applies to:
- A better way to structure research
- A missing consideration in Design Doc format
- A more effective debugging pattern
- An implementation practice that should be standard

### Feedback-Driven Improvement

When the human corrects, adds to, or adjusts your output, treat it as a potential skill improvement signal:

```
You produce output (research, design doc, implementation, etc.)
    ↓
Human gives feedback ("add more Why", "compare alternatives", "check security")
    ↓
You fix the current work
    ↓
Ask: "This seems like it should always apply. Want me to update [skill/command]?"
    ↓
Human approves → edit the skill/command directly
```

**Every repeated correction is a missing rule.** If the human has to say the same thing twice, the framework should have caught it the first time.

The human approves → edit the skill/command directly. This is how the framework evolves in real-time from real experience.

## Core Philosophy

1. **Understand, not just build** - Every phase forces you to articulate WHY
2. **You own it** - The deliverables are yours to explain. "AI said so" is not an answer
3. **Compound growth** - Knowledge accumulates as learnings across projects
4. **Self-evolving framework** - Not just quality rules, but research methods, design practices, and workflows grow from real experience

## Session Start Checklist

When starting a new session:

1. **Check current state**
   - Any tasks in progress?
   - Does a Design Doc exist?
   - Which Phase is complete?

2. **Restore context**
   - Read necessary documents
   - Identify previous interruption point

3. **Implementation gate** (if task involves writing/editing code)
   - **MUST invoke** `claude-praxis:code-quality-rules` skill — not "read", invoke
   - Confirm TDD approach before writing any code
   - This is a 🔴 CRITICAL gate. No code changes until this skill is loaded

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
