# Team Claude Workflow - Project Overview

## Purpose

Systematize team development workflows for Claude Code as skills, published as a GitHub repository.
Inspired by obra/superpowers, with these unique values:

1. **Self-Evolving Quality Rules** - Discover issues during implementation → propose rule addition → approve → update SKILL.md
2. **Team Development First** - Design Docs, Notion integration, team review flows
3. **Context Recovery** - Smooth state restoration after compact/clear via SessionStart hook

## File Structure

```
team-claude-workflow/
├── hooks/
│   ├── hooks.json               # SessionStart hook config
│   └── session-start.sh         # Injects getting-started skill on every session
├── commands/
│   ├── research.md              # /research — start research phase
│   ├── design.md                # /design — create Design Doc
│   ├── plan.md                  # /plan — create implementation plan
│   ├── implement.md             # /implement — execute the plan
│   └── review.md                # /review — request code review
├── skills/
│   ├── getting-started/         # Bootstrap: workflow overview + session start
│   ├── code-quality-rules/      # Quality rules + self-evolution protocol
│   ├── verification-before-completion/  # No claims without evidence
│   ├── subagent-driven-development/     # Fresh agent per task + 2-stage review
│   ├── agent-team-execution/    # Parallel exploration: research, review, debugging
│   ├── design-doc-format/       # Notion-compatible document rules
│   ├── writing-skills/          # Meta-skill: TDD for skill creation
│   ├── requesting-code-review/  # Dispatch reviewer after tasks
│   ├── receiving-code-review/   # Handle feedback (no sycophancy)
│   └── git-worktrees/           # Isolated feature development
├── README.md
└── CLAUDE.md                    # This file
```

## Core Workflow

```
/research → /design → Team Review → /plan → /implement → /review
                                               ↑
                                    Issue found → update Doc → redo
```

## Quality Rules (defined in code-quality-rules)

- **TDD Required** - If you wrote production code before tests, delete and redo
- **No `as`** - Never use TypeScript type assertions
- **No eslint-disable** - Fix lint errors in code
- **No Lazy Assertions** - Don't settle for just `toBeDefined()`
- **Post-Implementation Checks Required** - Run typecheck, lint, test, build every time
- **Verification Before Completion** - No success claims without fresh evidence
- **No Hardcoded Secrets** - Use environment variables, never commit secrets
- **Input Validation at Boundaries** - Validate all external input
- **No Dynamic Code Execution** - No eval(), Function(), exec()
- **Dependency Awareness** - Check before adding dependencies

## Next Tasks

1. **incremental-review** skill - Show small changes with reasoning
   - No bulk implementations, explain "what" and "why" per change

## References

- obra/superpowers: https://github.com/obra/superpowers
- Jesse Vincent's blog: https://blog.fsck.com/2025/10/09/superpowers/

## Research Policy

- **Web-first research** - Always search the web rather than relying on internal knowledge alone
- **Cite sources** - Every claim must include a clear source (URL, documentation link, or repository reference)
- **No hallucinated references** - If a source cannot be found or verified, state that explicitly
- **Prefer primary sources** - Official docs > blog posts > Stack Overflow
- **Recency matters** - Prefer up-to-date sources; flag if information may be outdated

## Language Policy

- **User-facing outputs** (Design Docs, reports, explanations, proposals) → Use the language of the user's request
- **Internal files** (SKILL.md, CLAUDE.md, code comments in skills) → Always English to reduce token consumption
- When the self-evolution protocol adds a new rule to SKILL.md → English regardless of the conversation language

## Design Decisions

- Distributed as Claude Code plugin via marketplace system (install/uninstall/update with one command)
- Self-evolving quality rules implemented via direct SKILL.md edits
- Notion integration handled through format rules (API integration for future consideration)
- SessionStart hook auto-injects getting-started skill (no CLAUDE.md dependency for bootstrap)
- Skill descriptions contain ONLY trigger conditions (CSO — prevents shortcut behavior)
