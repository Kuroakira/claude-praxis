# Team Claude Workflow

Team development workflow for Claude Code. Self-evolving quality rules, team review flows, and structured development phases.

Inspired by [obra/superpowers](https://github.com/obra/superpowers).

## Features

- **Self-Evolving Quality Rules** - Discover issues during implementation, propose rule additions. Once approved, rules are added to skills and automatically enforced.
- **Team Development First** - Team review via Design Docs, Notion-compatible formatting
- **Context Recovery** - Automatic state restoration via SessionStart hook
- **Subagent-Driven Development** - Fresh agent per task with two-stage review (spec + quality)
- **Agent Team Execution** - Parallel exploration for research, review, and debugging using Opus 4.6 agent teams
- **Verification Before Completion** - No success claims without fresh evidence

## Installation

### Via Plugin Marketplace (Recommended)

1. Open **Manage Plugins** (Claude Code settings)
2. Go to the **Marketplaces** tab
3. Enter `Kuroakira/team-claude-workflow` and click **Add**
4. Switch to the **Plugins** tab and install `team-claude-workflow`

To update or uninstall, use the same **Plugins** tab.

### Manual Installation (Alternative)

```bash
git clone https://github.com/Kuroakira/team-claude-workflow.git
cd team-claude-workflow
mkdir -p ~/.claude/skills
ln -s $(pwd) ~/.claude/skills/team-claude-workflow

# To uninstall:
rm ~/.claude/skills/team-claude-workflow
```

## Skills

| Skill | Description |
|-------|-------------|
| `getting-started` | Workflow overview and session bootstrap |
| `code-quality-rules` | Quality rule enforcement and self-evolution |
| `verification-before-completion` | No claims without fresh evidence |
| `subagent-driven-development` | Fresh agent per task + two-stage review (implementation) |
| `agent-team-execution` | Parallel exploration with agent teams (research, review, debugging) |
| `design-doc-format` | Notion-compatible document format rules |
| `writing-skills` | Meta-skill: TDD for creating new skills |
| `requesting-code-review` | Dispatch reviewer after implementation |
| `receiving-code-review` | Handle review feedback (no sycophancy) |
| `git-worktrees` | Isolated feature development with worktrees |

## Commands

| Command | Phase |
|---------|-------|
| `/research` | Investigate best practices and similar implementations |
| `/design` | Create a Design Doc for team review |
| `/plan` | Break Design Doc into small executable tasks |
| `/implement` | Execute the plan with TDD and verification |
| `/review` | Request code review for completed work |

## Core Workflow

```
/research → /design → Team Review → /plan → /implement → /review
                                               ↑
                                    Issue found → update Doc → redo
```

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
