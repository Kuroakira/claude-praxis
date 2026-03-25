# Claude Praxis - Project Overview

@rules/code-quality.md
@rules/document-quality.md
@rules/design-doc-format.md
@rules/verification.md

## File Structure

```
claude-praxis/
├── rules/                       # Always-on constraints (@imported into context)
│   ├── code-quality.md          # TDD, type safety, test quality, security
│   ├── document-quality.md      # Structure, terminology, progressive detailing
│   ├── design-doc-format.md     # WHY over HOW, Notion format, outline-first
│   └── verification.md          # No claims without evidence, completion report
├── catalog/                     # Shared agent catalogs and review-point checklists
│   ├── reviewers.md             # 18 reviewer types with independent verification sources
│   ├── researchers.md           # 7 researcher types with agent types and verification sources
│   ├── code-quality-review-points.md    # 12 categories, code quality checklist (OSS committer-sourced)
│   ├── general-review-points.md         # 10 categories, bug detection checklist
│   ├── beyond-diff-review-points.md     # 3 categories, temporal state / cross-diff / external spec
│   ├── security-perf-review-points.md   # 7 categories, security and performance checklist
│   ├── error-resilience-review-points.md  # 7 categories, failure mode checklist
│   ├── simplicity-review-points.md      # 4 categories, over-engineering detection
│   ├── structural-pattern-review-points.md  # 12 categories, design pattern applicability checklist
│   ├── ts-review-points.md             # 8 categories, TypeScript patterns checklist
│   ├── red-phase-test-patterns.md      # 12 points, RED phase test design prompts (mini-catalog)
│   └── post-green-bug-patterns.md      # 16 points, post-GREEN latent bug patterns (mini-catalog)
├── agents/
│   ├── implementer.md           # Implementation agent
│   ├── reviewer.md              # Code review agent (read-only)
│   ├── researcher.md            # Research agent (haiku, lightweight)
│   └── scout.md                 # Codebase exploration agent (haiku, read-only)
├── hooks/
│   ├── hooks.json               # SessionStart + PreCompact + PostToolUse + Stop + UserPromptSubmit hook config
│   └── src/
│       ├── session-start.ts     # Cleans markers + injects context
│       ├── pre-compact.ts       # Trims Flow files before compact
│       ├── mark-skill-invoked.ts  # Records Skill invocations to session markers
│       ├── stop-verification-gate.ts  # Completion verification gate (warns if unchecked)
│       ├── phase-detect.ts      # Semantic phase detection (UserPromptSubmit)
│       └── context-pressure-check.ts  # Context usage monitoring (UserPromptSubmit)
├── commands/
│   ├── feature-spec.md          # /feature-spec — AI-driven interview to capture requirements
│   ├── design.md                # /design — planner-driven research + outline + write Design Doc
│   ├── implement.md             # /implement — TDD per task + graduated review (accepts plan from /plan)
│   ├── analyze.md               # /analyze — codebase architecture analysis + durable report
│   ├── guide.md                 # /guide — codebase walkthrough guide for human understanding
│   ├── debug.md                 # /debug — investigate + diagnose + document
│   ├── research.md              # /research — standalone research
│   ├── plan.md                  # /plan — thorough planning with Axes Table and architecture analysis
│   ├── review.md                # /review — standalone code review
│   ├── compare.md               # /compare — structured multi-option comparison + selection
│   ├── compound.md              # /compound — extract and accumulate learnings
│   └── understanding-check.md   # /understanding-check — verify understanding of AI-generated work
├── skills/
│   ├── workflow-planner/        # Analyze task, select agents from catalogs, generate execution plan
│   ├── dispatch-reviewers/      # Dispatch reviewers by catalog ID with graduated tiers
│   ├── architecture-analysis/   # Multi-pass codebase analysis with durable reports + quantitative health scoring
│   ├── guide-generation/        # Multi-pass codebase exploration + single-narrator guide writing
│   ├── check-past-learnings/    # Recall relevant learnings before starting work
│   ├── tdd-cycle/               # RED-GREEN-REFACTOR procedure + decision points
│   ├── milestone-review/        # Cross-milestone consistency self-review at milestone boundaries
│   ├── rule-evolution/          # Propose and add new rules from discovered issues
│   ├── subagent-driven-development/     # Fresh agent per task + 2-stage review
│   ├── agent-team-execution/    # Parallel exploration: research, review teams, debugging
│   ├── systematic-debugging/    # 3-phase root cause analysis (reproduce, isolate, diagnose)
│   ├── context-persistence/     # Stock/Flow memory model for context survival
│   ├── understanding-check/     # Explain-Compare-Discover for understanding verification
│   ├── requesting-code-review/  # Dispatch reviewer after tasks
│   └── receiving-code-review/   # Handle feedback (no sycophancy)
├── claudedocs/                  # Analysis reports, design docs, plans, implementation records
├── tests/                       # Unit and integration tests for hooks
├── README.md
└── CLAUDE.md                    # This file
```

## Layer Architecture

7 layers, each answering one question. **One fact lives in one place only** — other layers reference, never duplicate.

| Layer | Question | Contains | Does NOT Contain |
|-------|----------|----------|------------------|
| **CLAUDE.md** | What is this project, how to use it? | Project info, workflow overview, skill/agent catalog | Rule details, procedures, hook logic |
| **Rule** (`rules/`) | What must always be followed? | Constraints, prohibitions, quality standards (with examples) | Procedures, workflows, self-evolution logic |
| **Catalog** (`catalog/`) | What agents are available to select from? What do they check? | Agent types with IDs, focus areas, independent verification sources, applicable domains. Review-point checklists referenced by reviewer prompts | Procedures, phase ordering, selection logic (Skill's job) |
| **Command** (`commands/`) | In what order, by whom, where does the human decide? | Phase sequence, PAUSE points, skill invocations, planner invocation with domain context + constraints | Procedure bodies (delegate to Skill), constraints (delegate to Rule) |
| **Skill** (`skills/`) | How to do it? (reusable procedure) | Step-by-step procedures, templates, decision criteria | Constraints (Rule's job), phase ordering (Command's job) |
| **Agent** (`agents/`) | Who does it? | Role, tools, model, maxTurns | Procedures (Skill's job), constraints (Rule's job) |
| **Hook** (`hooks/`) | What to auto-detect and notify? | Event detection, warn/remind, marker management | Rule content re-statements, procedure duplication |

### Loading Model

```
Always-on (session start, every session):
  CLAUDE.md + @rules/*.md  →  constraints always in context
  Skill descriptions        →  name + trigger only (~100 tokens/skill)
  SessionStart hook output  →  session state facts

On-demand (when invoked):
  Skill full content        →  loaded on invoke (~2000+ tokens/skill)
  Command content           →  loaded on slash command
  Hooks                     →  fire on events (UserPromptSubmit, Stop, etc.)
```

### Boundary Rule

When adding or moving information, ask: "Which layer's question does this answer?"

- A constraint (what to always follow) → `rules/`
- An agent type with verification source → `catalog/`
- A procedure (how to do it) → `skills/`
- Phase ordering or human checkpoints → `commands/`
- Who executes with what tools → `agents/`
- Automatic detection/notification → `hooks/`
- Project overview or catalog → `CLAUDE.md`

If the same fact appears in 2+ places, one must become a reference ("see X") not a copy.

## Workflows

See `README.md` for workflow details, installation, and feature list. Commands are loaded on-demand when invoked. Quality rules are loaded via `@import` above.

## Session Cache MCP

Before reading any file, call `check_cache` from the session-cache server with the file path. If the cache returns a hit, use the summary instead of re-reading the file unless you need details not covered by the summary.

After reading a file, call `record_read` from the session-cache server with the file path and a concise summary (2-4 sentences covering the file's purpose, key exports, and important details).

At the start of a complex task, call `get_session_map` to see what files have already been read in this session.

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
- Quality rules live in `rules/` as always-on constraints; procedural skills (`tdd-cycle`, `rule-evolution`) handle the "how"
- Notion integration handled through format rules (API integration for future consideration)
- SessionStart hook cleans markers and injects context (rules auto-apply via @import)
- Skill descriptions contain ONLY trigger conditions (CSO — prevents shortcut behavior)
- Context persistence follows "Write Auto, Read Manual" — never auto-inject content into context
- Phase progression uses "Auto-detect, Suggest, User decides" — commands exist for explicit use, but Claude proactively suggests the right phase based on context. Praxis lives in the phase content (articulating "why"), not in remembering to type commands
- Implementation decision points are surfaced to the user — when multiple valid approaches exist, Claude presents options instead of choosing silently
- Learnings are stored with context/rationale — enables "does the same assumption hold?" recall instead of blind repetition
- Contextual recall uses judgment prompts, not quizzes — "same rationale applies here?" not "do you remember?"
- Four orchestrating workflows (`/claude-praxis:feature-spec`, `/claude-praxis:design`, `/claude-praxis:implement`, and `/claude-praxis:debug`) handle sub-steps internally — human interaction points are minimized to approval gates and decision points. Supporting commands remain for direct invocation when the full workflow is not needed
- FeatureSpec owns "What and Why," Design Doc owns "How" — this boundary prevents requirements ambiguity from propagating into design. Phase detection automatically suggests FeatureSpec when requirements are vague
- Planner-driven adaptive workflow: commands define phase structure and constraints, `workflow-planner` skill provides judgment on agent selection. Catalogs (`catalog/`) define the selection pool with independent verification sources per entry. Review tiers are graduated (none/light/thorough) based on stage and content. `dispatch-reviewers` is the canonical reviewer dispatch mechanism
