# Claude Praxis - Project Overview

## Core Concept

**Vibe codingに「理解」を取り戻す。AIが書いても、エンジニアが育つ開発フレームワーク。**

AI-assisted developmentは速い。しかし速さだけでは、エンジニアの中に何も残らない。
このプラグインは、AIを「鏡」として使い、設計と実装の「なぜ」を言語化・蓄積することで、
エンジニアとしての判断力を複利的に成長させるシステムである。

## Why This Exists

1. **Understand, Not Just Build** - Every phase forces you to articulate "why": why this design, why this approach, why not alternatives
2. **You Own It** - AI implements and ensures quality. But the Design Doc, the code, the decisions — they're yours. You should be able to explain every choice to your team without saying "AI said so"
3. **Compound Growth** - Knowledge from each project accumulates as learnings, making the next project's decisions sharper
4. **Self-Evolving Rules** - Quality standards grow from real experience, not abstract best practices

## File Structure

```
claude-praxis/
├── hooks/
│   ├── hooks.json               # SessionStart + PreCompact hook config
│   ├── session-start.sh         # Injects getting-started skill + notifies persistence files
│   └── pre-compact.sh           # Trims Flow files before compact
├── commands/
│   ├── research.md              # /research — understand WHY before building
│   ├── design.md                # /design — articulate your design rationale
│   ├── plan.md                  # /plan — break design into deliberate steps
│   ├── implement.md             # /implement — build with quality awareness
│   ├── review.md                # /review — discover blind spots
│   └── compound.md              # /compound — extract and accumulate learnings
├── skills/
│   ├── getting-started/         # Bootstrap: philosophy + workflow overview
│   ├── code-quality-rules/      # Quality rules + self-evolution protocol
│   ├── verification-before-completion/  # No claims without evidence
│   ├── subagent-driven-development/     # Fresh agent per task + 2-stage review
│   ├── agent-team-execution/    # Parallel exploration: research, review, debugging
│   ├── systematic-debugging/    # 4-phase root cause analysis
│   ├── context-persistence/     # Stock/Flow memory model for context survival
│   ├── design-doc-format/       # Notion-compatible document rules
│   ├── writing-skills/          # Meta-skill: TDD for skill creation
│   ├── requesting-code-review/  # Dispatch reviewer after tasks
│   ├── receiving-code-review/   # Handle feedback (no sycophancy)
│   └── git-worktrees/           # Isolated feature development
├── README.md
└── CLAUDE.md                    # This file
```

## Core Workflow

Each phase exists to deepen understanding, not just to produce output.

```
/research  → Understand the problem space and prior art
/design    → Articulate WHY this design, not just WHAT
/plan      → Break into steps you can explain
/implement → Build with quality rules, learn from issues
/review    → Expose blind spots through other perspectives
/compound  → Extract what you learned, carry it forward
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
- Context persistence follows "Write Auto, Read Manual" — never auto-inject content into context
- Phase progression uses "Auto-detect, Suggest, User decides" — commands exist for explicit use, but Claude proactively suggests the right phase based on context. Praxis lives in the phase content (articulating "why"), not in remembering to type commands
