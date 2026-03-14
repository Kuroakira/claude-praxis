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

### Main Workflows

| Workflow | What Happens | What You Do |
|----------|-------------|-------------|
| `/feature-spec [feature]` | AI-driven interview to capture requirements, planner selects reviewers based on spec complexity (light → thorough) | Answer interview questions, approve the FeatureSpec |
| `/design [topic]` | Planner-driven research + architecture analysis, writes the Design Doc, graduated review (light for outline, thorough for final) | Review and approve the final Design Doc |
| `/implement [plan-path]` | TDD per task with per-task review selection, graduated final review (3+ reviewers). Accepts plan from `/plan` or performs inline breakdown | Approve inline breakdown (or provide plan), make decisions at implementation choice points |
| `/debug [problem]` | Reproduces, isolates, diagnoses — for complex problems, planner dispatches parallel investigation agents | Provide context between phases, review the diagnosis |

### Supporting Commands

| Command | When to Use Directly |
|---------|---------------------|
| `/analyze [scope] [--thorough]` | Analyze codebase architecture — produces a Markdown+mermaid report with structural friction detection |
| `/guide [scope]` | Generate a codebase walkthrough guide as a multi-page HTML book |
| `/compare [topic]` | Structured comparison of 2-4 options with axes evaluation — when facing a decision with multiple viable approaches |
| `/research [topic]` | Explore a problem space without committing to a Design Doc |
| `/plan [topic] [design-doc-path]` | Create a thorough implementation plan (Axes Table, architecture analysis) without starting implementation |
| `/review` | Code review on existing code outside the implementation flow (scope auto-detected from git diff) |
| `/compound` | Extract and classify learnings from completed work |
| `/understanding-check` | Verify you can explain key decisions in AI-generated work (recommended: separate session) |

Commands are auto-suggested based on context. You can also invoke any command directly.

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
| `workflow-planner` | Analyze task content, select agents from shared catalogs, generate execution plan |
| `dispatch-reviewers` | Dispatch reviewers by catalog ID with graduated tiers |
| `subagent-driven-development` | Fresh agent per task + two-stage review (implementation) |
| `agent-team-execution` | Parallel exploration (research, review teams, debugging) with independent verification sources |
| `architecture-analysis` | Multi-pass codebase analysis with durable Markdown+mermaid reports |
| `guide-generation` | Multi-pass codebase exploration + single-narrator guide as HTML book |
| `systematic-debugging` | 3-phase root cause analysis (reproduce, isolate, diagnose) |
| `context-persistence` | Stock/Flow memory model for context survival across compact/clear |
| `check-past-learnings` | Recall relevant learnings at the start of any workflow phase |
| `rule-evolution` | TDD-based protocol for proposing and adding quality rules |
| `tdd-cycle` | RED-GREEN-REFACTOR cycle enforcement |
| `understanding-check` | Explain-Compare-Discover procedure for verifying understanding |
| `requesting-code-review` | Dispatch reviewer after implementation |
| `receiving-code-review` | Handle review feedback (no sycophancy) |

### Always-On Rules (loaded via @import in CLAUDE.md)

| Rule | Description |
|------|-------------|
| `rules/code-quality.md` | Code quality enforcement (TDD, type safety, test quality, security) |
| `rules/document-quality.md` | Document structure and terminology consistency |
| `rules/design-doc-format.md` | Design Doc specific format (WHY over HOW, Notion-compatible) |
| `rules/verification.md` | Verification before completion + completion report format |

## Commands

| Command | Purpose |
|---------|---------|
| `/feature-spec [feature]` | **Main workflow**: AI-driven interview + parallel draft review → FeatureSpec |
| `/design [topic]` | **Main workflow**: Parallel research team + outline + write + parallel review team → Design Doc |
| `/implement [plan-path]` | **Main workflow**: TDD per task + parallel review team → verified code. Without plan path, performs inline breakdown |
| `/debug [problem]` | **Main workflow**: Reproduce + isolate + diagnose + document findings |
| `/analyze [scope] [--thorough]` | Standalone: codebase architecture analysis → Markdown+mermaid report |
| `/guide [scope]` | Standalone: codebase walkthrough guide → multi-page HTML book |
| `/compare [topic]` | Standalone: structured comparison of 2-4 options with axes evaluation |
| `/research [topic]` | Standalone: explore a problem space without committing to a Design Doc |
| `/plan [topic] [design-doc-path]` | Standalone: thorough implementation plan (Axes Table, architecture analysis) without starting implementation |
| `/review` | Standalone: code review on existing code (scope auto-detected from git diff) |
| `/compound` | Extract learnings and carry them to the next project |
| `/understanding-check` | Standalone: verify understanding of AI-generated work |

### Command Options Reference

| Option | Commands | Description |
|--------|----------|-------------|
| `[scope]` | `/analyze`, `/guide` | Target: module name, directory, cross-cutting concern, or `project` |
| `[topic]` | `/design`, `/compare`, `/research`, `/plan` | Subject to design, compare, research, or plan |
| `[feature]` | `/feature-spec` | Feature name or description (clarified interactively if omitted) |
| `[problem]` | `/debug` | Problem description (clarified in Phase 1 if omitted) |
| `[plan-path]` | `/implement` | Path to plan from `/plan` (e.g., `claudedocs/plans/feature-plan.md`). Omit for inline breakdown |
| `[design-doc-path]` | `/plan` | Path to existing Design Doc to plan against |
| `--thorough` | `/analyze` | Two-phase analysis: generates debt inventory, then user selects items for deep dive |

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

## Recommended MCP Servers

| MCP Server | Purpose | Install |
|------------|---------|---------|
| [session-cache-mcp](https://www.npmjs.com/package/session-cache-mcp) | Eliminates redundant file reads across subagents via shared in-memory cache. Provides `check_cache`, `record_read`, `get_session_map` tools. | `claude mcp add session-cache -s user -- npx -y session-cache-mcp` |

## Planned

- `incremental-review` - Show small changes with reasoning

## Contributing

1. Fork
2. Add/improve skills
3. PR

## License

MIT
