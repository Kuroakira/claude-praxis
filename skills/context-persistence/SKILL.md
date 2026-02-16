---
name: context-persistence
description: Use when starting a long task, needing to preserve context across compact/clear, or when explicitly asked to save state.
---

# Context Persistence

Survive compact/clear by writing state to files. Write automatically, read manually.

## The Iron Law

```
WRITE AUTO, READ MANUAL — NEVER AUTO-INJECT CONTENT INTO CONTEXT
```

## Stock vs Flow Model

| Type | File | Location | Lifecycle |
|------|------|----------|-----------|
| **Flow** | `task_plan.md` | `{repo}/.claude/context/` | Delete on task completion |
| **Flow** | `progress.md` | `{repo}/.claude/context/` | Keep last 10 entries, purge older |
| **Stock** | `learnings.md` | `{repo}/.claude/context/` | Permanent. Project-specific knowledge |
| **Stock** | `global-learnings.md` | `~/.claude/learnings/` | Permanent. Cross-project knowledge |

- **Flow** = volatile progress. Old entries lose value. Prune aggressively.
- **Stock** = accumulated knowledge. Patterns, pitfalls, decisions. Never delete.

## Write Rules

Record automatically during work:

### task_plan.md (Flow)
```markdown
# Current Task: [name]
## Phase: [current phase]
## Completed
- [x] Phase 1: ...
## In Progress
- [ ] Phase 2: step description
## Remaining
- [ ] Phase 3: ...
```

### progress.md (Flow)
```markdown
## [timestamp] — [what was done]
- Key change: ...
- Decision: ...
- Next: ...
```

Append new entries at the top. When entries exceed 10, delete the oldest.

### learnings.md (Stock)
```markdown
## [topic]
- **Learning**: [what was discovered]
- **Context**: [when/why this matters]
```

Only promote from progress.md when knowledge is reusable. Use `/praxis:compound` for deliberate promotion.

## Read Rules

**Never auto-inject file contents into context.** Instead:

1. SessionStart hook notifies file existence (names + metadata only)
2. Claude decides whether to read based on the current task
3. User can explicitly request: "read my progress" / "load context"

## File Placement

```
{repo}/.claude/context/         ← Add to .gitignore (recommended)
├── task_plan.md                ← Flow: current task
├── progress.md                 ← Flow: recent work log
└── learnings.md                ← Stock: project-specific knowledge

~/.claude/learnings/            ← Global, cross-project
└── global-learnings.md         ← Stock: universal knowledge
```

## PreCompact Hook

Fires automatically before compact (75-95% context). Performs mechanical cleanup only:

1. Trim `progress.md` to last 10 entries
2. Update timestamp in `task_plan.md`
3. Remove completed task details

**LLM-judged promotion (Flow → Stock) is NOT done here.** That is `/praxis:compound`'s job.

## Red Flags

- Auto-injecting file contents into SessionStart → context bloat (claude-mem lesson)
- Skipping writes because "this task is short" → context lost on unexpected compact
- Promoting everything to Stock → Stock becomes Flow
- Never reading persistence files → they exist for nothing

## Common Rationalizations

| Excuse | Response |
|--------|----------|
| "Context won't be lost" | Compact can happen at any time. Write now. |
| "I'll remember" | You won't after compact. The file will. |
| "Too much to record" | Record decisions and blockers, not every line change. |
| "Auto-inject saves time" | It costs context. claude-mem proved this. Read manually. |

## Integration

- **getting-started**: SessionStart notifies file existence
- **compound-learning** (`/praxis:compound`): Promotes Flow → Stock with LLM judgment
- **code-quality-rules**: Universal quality learnings route to self-evolution protocol
- **PreCompact hook**: Mechanical Flow cleanup before compact
