# Claude Praxis

**Bring understanding back to vibe coding.** A development framework where AI builds, but the engineer grows.

> **Praxis** (Greek: πρᾶξις) — learning through practice. Aristotle distinguished three forms of knowledge: *theoria* (pure knowledge), *poiesis* (making things), and *praxis* (understanding through action). Vibe coding is poiesis — you get output, but nothing stays with you. This framework brings praxis back: every phase forces you to articulate "why," and that understanding compounds across projects.

Inspired by [obra/superpowers](https://github.com/obra/superpowers).

## The Problem

AI-assisted coding is fast. But speed alone leaves nothing behind. You get working software, yet your engineering judgment doesn't grow. Before AI, writing every line forced understanding. With vibe coding, that process disappears.

## The Solution

Use AI as a **mirror** — a tool that reflects your decisions back to you, forcing you to articulate "why" at every step. Each project compounds into the next through deliberate knowledge accumulation.

**The accountability stays with you.** AI implements and ensures quality. But the Design Doc, the code, the decisions — they're yours to explain. "AI said so" is not an answer. This framework prepares you so you never need to say it.

## How It Works

Just describe what you want to do. Claude detects the appropriate phase and suggests it — you don't need to remember commands.

| Phase | What You Do | What You Gain |
|-------|------------|---------------|
| `/research` | Investigate the problem space | Understanding of prior art and trade-offs |
| `/design` | Write a Design Doc with rationale | Clarity on WHY this approach, not just WHAT |
| `/plan` | Break design into deliberate steps | Ability to explain each decision |
| `/implement` | Build with quality rules and TDD | Awareness of patterns and pitfalls |
| `/review` | Get feedback from other perspectives | Discovery of your blind spots |
| `/compound` | Extract and classify learnings | Knowledge that carries to the next project |

Commands are auto-suggested based on context, and the next step is proposed after each phase completes. You can also invoke any command directly to jump to a specific phase.

## Key Mechanisms

- **Self-Evolving Quality Rules** - Discover issues during implementation, propose rule additions. Rules grow from YOUR experience, not abstract best practices.
- **Compound Learning** - `/compound` promotes valuable knowledge from work logs to permanent learnings, routed to project-specific or cross-project storage.
- **Context Persistence** - Stock/Flow memory model survives compact/clear. Flow (progress) is pruned; Stock (learnings) persists forever.
- **Structured Understanding** - Design Docs force you to articulate alternatives and WHY you chose this path. That reasoning becomes reusable.
- **Verification Before Completion** - No claims without fresh evidence. Proves understanding, not just output.

## Installation

### Via Plugin Marketplace (Recommended)

1. Open **Manage Plugins** (Claude Code settings)
2. Go to the **Marketplaces** tab
3. Enter `Kuroakira/claude-praxis` and click **Add**
4. Switch to the **Plugins** tab and install `claude-praxis`

To update or uninstall, use the same **Plugins** tab.

### Manual Installation (Alternative)

```bash
git clone https://github.com/Kuroakira/claude-praxis.git
cd claude-praxis
mkdir -p ~/.claude/skills
ln -s $(pwd) ~/.claude/skills/claude-praxis

# To uninstall:
rm ~/.claude/skills/claude-praxis
```

## Skills

| Skill | Description |
|-------|-------------|
| `getting-started` | Workflow overview and session bootstrap |
| `code-quality-rules` | Quality rule enforcement and self-evolution |
| `verification-before-completion` | No claims without fresh evidence |
| `subagent-driven-development` | Fresh agent per task + two-stage review (implementation) |
| `agent-team-execution` | Parallel exploration with agent teams (research, review, debugging) |
| `systematic-debugging` | 4-phase root cause analysis (reproduce, isolate, diagnose, fix) |
| `context-persistence` | Stock/Flow memory model for context survival across compact/clear |
| `design-doc-format` | Notion-compatible document format rules |
| `writing-skills` | Meta-skill: TDD for creating new skills |
| `requesting-code-review` | Dispatch reviewer after implementation |
| `receiving-code-review` | Handle review feedback (no sycophancy) |
| `git-worktrees` | Isolated feature development with worktrees |

## Commands

| Command | Purpose |
|---------|---------|
| `/research` | Understand the problem space before building |
| `/design` | Articulate your design rationale as a Design Doc |
| `/plan` | Break Design Doc into deliberate, explainable steps |
| `/implement` | Build with TDD, quality rules, and verification |
| `/review` | Expose blind spots through code review |
| `/compound` | Extract learnings and carry them to the next project |

## Quality Rules (Defaults)

- **TDD Required** - Write tests first, or delete and redo
- **No `as`** - Never use TypeScript type assertions
- **No eslint-disable** - Fix lint errors in code
- **No Lazy Assertions** - Specific assertions only
- **Verification Required** - Run typecheck, lint, test, build every time
- **No Hardcoded Secrets** - Use environment variables, never commit secrets
- **Input Validation at Boundaries** - Validate all external input
- **No Dynamic Code Execution** - No eval(), Function(), exec()
- **Dependency Awareness** - Check before adding dependencies

## Planned

- `incremental-review` - Show small changes with reasoning

## Contributing

1. Fork
2. Add/improve skills (follow `writing-skills` for TDD approach)
3. PR

## License

MIT
