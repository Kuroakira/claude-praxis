---
name: getting-started
description: Use when starting a new session, resuming after compact/clear, or beginning a new implementation task.
---

# Team Claude Workflow

Team development workflow for Claude Code.
**Self-evolving quality rules** are the key differentiator.

## Core Philosophy

1. **Turn tacit knowledge into explicit rules** - If something was flagged as bad, capture it as a rule
2. **Rules evolve** - Discover issues, propose additions, add upon approval
3. **Team review is the default** - Never work in isolation; collaborate through documentation

## Skills

| Skill | When to Use |
|-------|-------------|
| `code-quality-rules` | Always during implementation. Enforces and evolves quality rules. |
| `design-doc-format` | When creating Design Docs. Notion-compatible format. |
| `incremental-review` | During implementation. Show small changes with reasoning. |
| `context-recovery` | After compact/clear. State restoration. |

## Core Workflow

```
┌─────────────────────────────────────────────────────┐
│ 1. Research Phase                                   │
│    - Investigate best practices / similar OSS       │
│    - Deepen understanding by asking questions       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. Design Phase                                     │
│    - Consider ideal architecture based on current   │
│    - Create Design Doc (Notion-compatible format)   │
│    - Submit for team review                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. Planning Phase                                   │
│    - Break Design Doc into small PRs                │
│    - Create implementation plan per Phase/Step      │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. Implementation Phase                             │
│    - Implement per Phase                            │
│    - Get approval before proceeding                 │
│    - Issue found → propose rule → update Doc → redo │
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

## How to Use Skills

**If a skill exists for the task, you must use it.**

1. Receive a task
2. Check if a relevant skill exists
3. If yes, **always** follow that skill
4. If the skill doesn't cover something, consult the human

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

When context is lost:

```
If told "continue from last time":

1. Read the Design Doc
2. Read the implementation plan
3. Check completed Phases
4. Check current Phase state
5. Resume from there
```

Ask the human for necessary file paths.
