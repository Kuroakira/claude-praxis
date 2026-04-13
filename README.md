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
| `/feature-spec [feature]` | Brainstorm-driven interview: one question at a time, 2-3 proposals, incremental section approval → FeatureSpec | Answer questions, choose proposals, approve each section |
| `/design [topic]` | Brainstorm-driven architecture dialogue: key decisions with concrete choices, incremental section approval → Design Doc | Make architecture decisions, approve each section |
| `/plan [topic] [design-doc-path]` | Implementation plan with Axes Table, architecture analysis, Granularity Contract → plan for superpowers | Review plan, hand off to superpowers for execution |
| `/investigate [problem]` | Reproduces, isolates, diagnoses — for complex problems, planner dispatches parallel investigation agents | Provide context between phases, review the diagnosis |

### Supporting Commands

| Command | When to Use Directly |
|---------|---------------------|
| `/analyze [scope] [--thorough]` | Analyze codebase architecture — produces a Markdown+mermaid report with structural friction detection and quantitative health scoring |
| `/guide [scope]` | Generate a codebase walkthrough guide as a multi-page HTML book |
| `/compare [topic]` | Structured comparison of 2-4 options with axes evaluation — when facing a decision with multiple viable approaches |
| `/research [topic]` | Explore a problem space without committing to a Design Doc |
| `/review [--full]` | Code review on existing code outside the implementation flow. `--full` skips tier detection and dispatches all reviewers |
| `/review-guide [--base branch] [--doc path]` | Generate a self-review guide for AI-generated code — test-first reading order with attention points and design rationale |
| `/eval` | Evaluate the most recent command execution and improve framework skills/commands/rules |
| `/understanding-check` | Verify you can explain key decisions in AI-generated work (recommended: separate session) |

Commands are auto-suggested based on context. You can also invoke any command directly.

## Key Mechanisms

- **`/eval` Framework Self-Improvement** - Evaluate recent execution and improve framework files directly. Rules and skills grow from YOUR experience, not abstract best practices.
- **superpowers Integration** - `/plan` produces plans at the right granularity for superpowers execution. The handoff: `/plan` → superpowers `writing-plans` → superpowers executes with TDD.
- **Context Persistence** - Stock/Flow memory model survives compact/clear. Flow (progress) is pruned; Stock (learnings) persists forever.
- **Structured Understanding** - Design Docs force you to articulate alternatives and WHY you chose this path. That reasoning becomes reusable.
- **Verification Before Completion** - No claims without fresh evidence. Proves understanding, not just output.

## Installation

### Via CLI (Recommended)

Add the marketplace, then install the plugin:

```bash
claude plugin marketplace add Kuroakira/claude-praxis
claude plugin install claude-praxis@claude-praxis
```

To update:

```bash
claude plugin update claude-praxis
```

To uninstall:

```bash
claude plugin uninstall claude-praxis
```

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
| `agent-team-execution` | Parallel exploration (research, review teams, debugging) with independent verification sources |
| `architecture-analysis` | Multi-pass codebase analysis with durable Markdown+mermaid reports and quantitative health scoring (TypeScript) |
| `guide-generation` | Multi-pass codebase exploration + single-narrator guide as HTML book |
| `systematic-debugging` | 3-phase root cause analysis (reproduce, isolate, diagnose) |
| `context-persistence` | Stock/Flow memory model for context survival across compact/clear |
| `check-past-learnings` | Recall relevant learnings at the start of any workflow phase |
| `understanding-check` | Explain-Compare-Discover procedure for verifying understanding |

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
| `/feature-spec [feature]` | **Main workflow**: Brainstorm-driven interview, one question at a time → FeatureSpec |
| `/design [topic]` | **Main workflow**: Brainstorm-driven architecture dialogue, incremental section approval → Design Doc |
| `/plan [topic] [design-doc-path]` | **Main workflow**: Implementation plan with Axes Table, Granularity Contract → plan for superpowers |
| `/investigate [problem]` | **Main workflow**: Reproduce + isolate + diagnose + document findings |
| `/analyze [scope] [--thorough]` | Standalone: codebase architecture analysis → Markdown+mermaid report with quantitative health scoring |
| `/guide [scope]` | Standalone: codebase walkthrough guide → multi-page HTML book |
| `/compare [topic]` | Standalone: structured comparison of 2-4 options with axes evaluation |
| `/research [topic]` | Standalone: explore a problem space without committing to a Design Doc |
| `/review [--full]` | Standalone: code review on existing code (scope auto-detected from git diff). `--full` dispatches all reviewers |
| `/review-guide [--base branch] [--doc path]` | Standalone: self-review guide for AI-generated code (test-first reading order + attention points) |
| `/eval` | Evaluate the most recent command execution and improve framework skills/commands/rules |
| `/understanding-check` | Standalone: verify understanding of AI-generated work |

### Command Options Reference

| Option | Commands | Description |
|--------|----------|-------------|
| `[scope]` | `/analyze`, `/guide` | Target: module name, directory, cross-cutting concern, or `project` |
| `[topic]` | `/design`, `/compare`, `/research`, `/plan` | Subject to design, compare, research, or plan |
| `[feature]` | `/feature-spec` | Feature name or description (clarified interactively if omitted) |
| `[problem]` | `/investigate` | Problem description (clarified in Phase 1 if omitted) |
| `[design-doc-path]` | `/plan` | Path to existing Design Doc to plan against |
| `--thorough` | `/analyze` | Two-phase analysis: generates debt inventory, then user selects items for deep dive |
| `--full` | `/review` | Skip tier determination and dispatch all reviewers for maximum coverage |
| `--base` | `/review-guide` | Override the base branch for diff detection (default: auto-detect merge-base with main) |
| `--doc` | `/review-guide` | Specify a FeatureSpec or Design Doc path for design context |

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
| [sekko-arch](https://www.npmjs.com/package/sekko-arch) | Quantitative architecture health scoring across 24 dimensions for TypeScript projects. Used by `/analyze` for health grades and degradation detection. | `claude mcp add sekko-arch -s user -- npx -y sekko-arch` |

## Planned

- `incremental-review` - Show small changes with reasoning

## Contributing

1. Fork
2. Add/improve skills
3. PR

## License

MIT
