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
| **Stock** | `learnings-feature-spec.md` | `{repo}/.claude/context/` | Permanent. Scope/requirements knowledge |
| **Stock** | `learnings-design.md` | `{repo}/.claude/context/` | Permanent. Design/architecture knowledge |
| **Stock** | `learnings-coding.md` | `{repo}/.claude/context/` | Permanent. Implementation patterns knowledge |
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

### learnings-*.md (Stock — 3 level-based files)
```markdown
## [topic]
- **Learning**: [what was discovered]
- **Context**: [when/why this matters]
```

Three files by knowledge level: `learnings-feature-spec.md` (requirements/scope), `learnings-design.md` (architecture/design), `learnings-coding.md` (implementation patterns). Only promote from progress.md when knowledge is reusable. Use `/claude-praxis:compound` for deliberate promotion with level classification.

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
├── learnings-feature-spec.md   ← Stock: requirements/scope knowledge
├── learnings-design.md         ← Stock: design/architecture knowledge
├── learnings-coding.md         ← Stock: implementation patterns
├── compound-last-run.json      ← Marker: last /compound execution time + count
├── last-compact.json           ← Marker: last compact metadata (written by PreCompact)
└── context-pressure.json       ← Marker: context usage % (written by StatusLine Bridge)

~/.claude/learnings/            ← Global, cross-project
└── global-learnings.md         ← Stock: universal knowledge
```

## PreCompact Hook

Fires automatically before compact (~83.5% context). Performs mechanical cleanup and state capture:

1. Capture progress summary (entry count + recent 3 headings) before trimming
2. Trim `progress.md` to last 10 entries
3. Update timestamp in `task_plan.md`
4. Write `last-compact.json` with compact metadata (timestamp, compound execution status, progress summary, learnings confidence summary)

SessionStart reads `last-compact.json` after compact to inject recovery guidance — including whether `/claude-praxis:compound` was run before compact.

**LLM-judged promotion (Flow → Stock) is NOT done here.** That is `/claude-praxis:compound`'s job.

## StatusLine Bridge (Optional Enhancement)

StatusLine can write context usage data to `context-pressure.json`, enabling proactive /compound suggestions before compact occurs. This is an optional enhancement — without it, Layer 1 (phase boundary suggestions) and Layer 3 (compact recovery) still provide basic knowledge preservation.

To enable, configure your StatusLine script in `~/.claude/settings.json` to write `{repo}/.claude/context/context-pressure.json` on every status update:
- Write `{ "usedPercentage": N, "timestamp": "...", "lastNotifiedLevel": "none" }` with current usage percentage
- **Below 60%** (after compact/clear): Delete the file to reset

The `lastNotifiedLevel` field tracks notification throttling — the StatusLine always writes `"none"`, and the UserPromptSubmit hook escalates it to `"info"` (at 60%) or `"urgent"` (at 75%) after notifying. This prevents repeated notifications at the same threshold.

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

- **session-start hook**: SessionStart notifies file existence + compact recovery guidance
- **`/claude-praxis:compound` command**: Promotes Flow → Stock with LLM judgment, writes `compound-last-run.json` marker
- **rule-evolution skill**: Universal quality learnings route to self-evolution protocol
- **PreCompact hook**: Mechanical Flow cleanup + writes `last-compact.json` with state metadata
- **Stop hook**: Suggests /compound when progress.md has unpromoted entries (non-blocking advisory)
- **UserPromptSubmit hook**: Reads `context-pressure.json` for proactive /compound suggestions (requires StatusLine Bridge)
