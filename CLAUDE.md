# Claude Praxis - Project Overview

@rules/code-quality.md
@rules/document-quality.md
@rules/design-doc-format.md
@rules/verification.md

## Core Concept

**Bring "understanding" back to vibe coding. A development framework where engineers grow — even when AI writes the code.**

AI-assisted development is fast. But speed alone leaves nothing inside the engineer.
This plugin uses AI as a "mirror" — by articulating and accumulating the "why" behind design and implementation decisions, it compounds engineering judgment over time.

## Why This Exists

1. **Understand, Not Just Build** - Every phase forces you to articulate "why": why this design, why this approach, why not alternatives
2. **You Own It** - AI implements and ensures quality. But the Design Doc, the code, the decisions — they're yours. You should be able to explain every choice to your team without saying "AI said so"
3. **Compound Growth** - Knowledge from each project accumulates as learnings, making the next project's decisions sharper
4. **Self-Evolving Rules** - Quality standards grow from real experience, not abstract best practices

## File Structure

```
claude-praxis/
├── rules/                       # Always-on constraints (@imported into context)
│   ├── code-quality.md          # TDD, type safety, test quality, security
│   ├── document-quality.md      # Structure, terminology, progressive detailing
│   ├── design-doc-format.md     # WHY over HOW, Notion format, outline-first
│   └── verification.md          # No claims without evidence, completion report
├── agents/
│   ├── implementer.md           # Implementation agent
│   ├── reviewer.md              # Code review agent (read-only)
│   ├── researcher.md            # Research agent (haiku, lightweight)
│   └── scout.md                 # Codebase exploration agent (haiku, read-only)
├── hooks/
│   ├── hooks.json               # SessionStart + PreCompact + PreToolUse + PostToolUse + Stop hook config
│   ├── session-start.sh         # Cleans markers + injects context
│   ├── pre-compact.sh           # Trims Flow files before compact
│   ├── check-skill-gate.sh     # File-type skill gate (warns if rules not loaded)
│   ├── mark-skill-invoked.sh   # Records Skill invocations to session markers
│   └── stop-verification-gate.sh  # Completion verification gate (warns if unchecked)
├── commands/
│   ├── feature-spec.md          # /feature-spec — AI-driven interview to capture requirements
│   ├── design.md                # /design — research + outline + write Design Doc
│   ├── implement.md             # /implement — plan + TDD + review
│   ├── debug.md                 # /debug — investigate + diagnose + document
│   ├── research.md              # /research — standalone research
│   ├── plan.md                  # /plan — standalone planning
│   ├── review.md                # /review — standalone code review
│   └── compound.md              # /compound — extract and accumulate learnings
├── skills/
│   ├── check-past-learnings/    # Recall relevant learnings before starting work
│   ├── parallel-review-team/    # Dispatch 4 parallel reviewers by review type
│   ├── tdd-cycle/               # RED-GREEN-REFACTOR procedure + decision points
│   ├── rule-evolution/          # Propose and add new rules from discovered issues
│   ├── subagent-driven-development/     # Fresh agent per task + 2-stage review
│   ├── agent-team-execution/    # Parallel exploration: research, review teams, debugging
│   ├── systematic-debugging/    # 4-phase root cause analysis
│   ├── context-persistence/     # Stock/Flow memory model for context survival
│   ├── writing-skills/          # Meta-skill: TDD for skill creation
│   ├── requesting-code-review/  # Dispatch reviewer after tasks
│   ├── receiving-code-review/   # Handle feedback (no sycophancy)
│   └── git-worktrees/           # Isolated feature development
├── README.md
└── CLAUDE.md                    # This file
```

## Core Workflow

Each phase exists to deepen understanding, not just to produce output.

### Four Main Workflows

Most tasks use these orchestrating commands:

```
/claude-praxis:feature-spec → AI-driven interview + parallel draft review → FeatureSpec
/claude-praxis:design       → Parallel Research Team + Outline + Write + Parallel Review Team → Design Doc
/claude-praxis:implement    → Scout + Plan + TDD per task + Parallel Review Team → Verified code
/claude-praxis:debug        → Reproduce + Isolate + Diagnose + Document Findings + Present
```

`/claude-praxis:feature-spec` captures "what to build and why" through an AI-driven interview. Before presenting the draft to the human, a parallel review team (Requirements Completeness, Technical Feasibility, Writing Quality, Devil's Advocate) checks it from 4 independent perspectives.

`/claude-praxis:design` dispatches a parallel research team (Problem Space, Scout, Best Practices, Devil's Advocate) for multi-angle investigation, then writes the Design Doc and runs a parallel review team (Architecture, User Impact, Writing Quality, Devil's Advocate) before presenting. The human's only input is final approval.

`/claude-praxis:implement` dispatches a Scout for codebase exploration before planning, executes TDD per task, then runs a parallel review team (Spec Compliance, Code Quality, Security+Performance, Devil's Advocate) as the final review. The human approves the plan and makes decisions at implementation decision points.

`/claude-praxis:debug` investigates problems systematically and produces an Investigation Report. Interactive throughout — the human provides context between phases. The fix itself is done via `/claude-praxis:implement`.

### Supporting Commands

Available for direct invocation when the full workflow is not needed:

```
/claude-praxis:research  → Standalone research (when you just want to explore options)
/claude-praxis:plan      → Standalone planning (when you already have a plan in mind)
/claude-praxis:review    → Standalone code review (when you want feedback on existing code)
/claude-praxis:compound  → Extract what you learned, carry it forward
```

## Quality Rules (defined in rules/)

Rules are always-on constraints loaded via `@import` — no skill invocation needed.

- **Code quality** (`rules/code-quality.md`) - TDD, type safety, no `as`, no eslint-disable, no lazy assertions, security rules
- **Document quality** (`rules/document-quality.md`) - Abstract-to-concrete structure, terminology consistency, progressive detailing
- **Design Doc format** (`rules/design-doc-format.md`) - WHY over HOW, Notion format, outline-first process (builds on document-quality)
- **Verification** (`rules/verification.md`) - No success claims without fresh evidence, completion report template, next phase lookup

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
