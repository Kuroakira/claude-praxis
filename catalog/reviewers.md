# Reviewer Catalog

Two-layer review system: **broad reviewers** (quality, correctness) scan multiple checklists for wide coverage, and **specialist reviewers** go deep in specific domains. Non-code reviewers handle design, requirements, and architecture.

All reviewers use subagent_type `claude-praxis:reviewer` (read-only, inherits main model).

## Context Isolation Rule

```
REVIEWERS EVALUATE INDEPENDENTLY — BASED ONLY ON TARGET FILES AND THEIR VERIFICATION SOURCE
```

Every reviewer receives only file paths as target. The reviewer reads the files themselves and evaluates based solely on:
1. Their own reading of the target files
2. Their verification source (listed per entry below)
3. The focus area defined in their Prompt

Reviewers do NOT receive and MUST NOT rely on: implementation discussion, design rationale from the conversation, planner reasoning, or other reviewers' findings. This ensures fresh-eyes evaluation without anchoring bias.

The `dispatch-reviewers` skill prepends this rule to every reviewer prompt at dispatch time.

## Unified Output Format

All checklist-based reviewers (`quality`, `correctness`, `security-perf`, `ts-patterns`) use this format. The `dispatch-reviewers` skill appends this to their prompts at dispatch time.

```
OUTPUT FORMAT (MANDATORY):

Produce a single findings table. List ALL findings regardless of severity.

| # | Severity | Point | File:Line | Issue | Suggested Fix |
|---|----------|-------|-----------|-------|---------------|
| 1 | Critical | CQ-4-2 | src/auth.ts:42 | async await leak | ... |
| 2 | Important | GR-1-1 | src/api.ts:15 | || vs ?? confusion | ... |
| 3 | Minor | RD-1-2 | src/utils.ts:8 | identifier does not match type | ... |

Point ID format: [checklist prefix]-[point ID] (e.g., CQ-4-2 = code-quality-review-points 4-2)

Checklist prefixes:
- CQ: code-quality-review-points
- SM: simplicity-review-points
- SP: structural-pattern-review-points
- RD: readability-review-points
- GR: general-review-points
- ER: error-resilience-review-points
- BD: beyond-diff-review-points
- SC: security-perf-review-points
- TS: ts-review-points

After the table, list checklist points checked but found N/A (collapsed, one line per checklist file):
- CQ: 1-1(N/A), 1-2(N/A), 2-1(N/A), ...
- GR: 1-1(N/A), 2-1(N/A), ...

Additional findings not covered by any checklist point go in a separate section after the N/A list.
```

## Entries

### Broad Reviewers

These reviewers scan multiple checklists for wide coverage. Used in light tier for quick, comprehensive checks.

#### `quality`

- **Focus**: Code quality, readability, simplicity, structural patterns, framework idioms — "Is this code good?"
- **Verification Source**: `catalog/code-quality-review-points.md`, `catalog/simplicity-review-points.md`, `catalog/structural-pattern-review-points.md`, `catalog/readability-review-points.md`, `rules/code-quality.md`, Context7 MCP (official docs for detected frameworks/libraries)
- **Applicable Domains**: implement, investigate, design
- **Prompt**: Review for overall code quality. Read and apply ALL of these checklists:
  1. `catalog/code-quality-review-points.md` (CQ) — TDD, type safety, YAGNI/DRY/KISS, test quality, naming, coupling
  2. `catalog/simplicity-review-points.md` (SM) — unnecessary abstraction, structure vs patch, pragmatism. **Simplicity takes precedence over structural patterns** — if code is appropriately simple, do not flag for pattern extraction
  3. `catalog/structural-pattern-review-points.md` (SP) — design pattern applicability, only when structural problems block comprehension or modification. Check "Not warranted when" exclusions before reporting
  4. `catalog/readability-review-points.md` (RD) — naming clarity, documentation accuracy, logic conciseness, visual consistency
  Also check compliance with `rules/code-quality.md` (TDD, type safety, no lazy assertions). **DRY checks must trace into callees** (CQ-2-3). **Fix suggestions must search project utilities** (CQ-2-4). **Documentation checks**: verify JSDoc/comments match actual behavior (CQ-11-1). For each target file, identify imported frameworks/libraries and check for deprecated APIs, documented anti-patterns, and non-idiomatic usage via Context7 (`resolve-library-id` → `query-docs`). For design domain reviews: evaluate whether the proposed architecture is more complex than the problem requires (SM) and whether it creates structural patterns that will become future code smells (SP). **Large-diff discipline**: when target files exceed ~500 lines total, apply each checklist (CQ → SM → SP → RD) with equal rigor — do not scan later checklists more shallowly. If attention drops, explicitly note "applied CQ/SM at full depth; SP/RD at reduced depth due to diff size" in the output. Output all findings in the Unified Output Format.

#### `correctness`

- **Focus**: Bug detection, error resilience, cross-diff consistency, regression detection — "Does this code work correctly and safely?"
- **Verification Source**: `catalog/general-review-points.md`, `catalog/error-resilience-review-points.md`, `catalog/beyond-diff-review-points.md`, common bug pattern databases (CWE), production failure patterns
- **Applicable Domains**: implement, investigate
- **Prompt**: Review for correctness and robustness. Read and apply ALL of these checklists:
  1. `catalog/general-review-points.md` (GR) — conditional logic errors, state management, null/undefined handling, boundary conditions, async pitfalls, data flow breakage, implicit assumptions, copy-paste inconsistencies, test coverage gaps
  2. `catalog/error-resilience-review-points.md` (ER) — error capture scope, error propagation, resource cleanup, partial defenses, async error handling, state machines, graceful degradation
  3. `catalog/beyond-diff-review-points.md` (BD) — temporal state tracking, cross-diff consistency, external spec conformance
  **Bug detection (primary focus):** For each non-trivial function, select 2-3 representative inputs (including edge cases) and mentally execute step by step. Track variable values. Ask: "What input would make this function produce a wrong result silently?" Construct at least one adversarial input and trace through. **Failure modes:** How does the code behave on connection loss, API timeout, malformed input, resource exhaustion? Are retries bounded? Are errors distinguished? For defensive mechanisms (guards, validation), verify coverage is complete — all types, all code paths. **Cross-diff consistency:** For each changed function, search the codebase for all other call sites. Verify the same fix applies everywhere. For each defensive guard at a call site, read the callee to check for redundant normalization (CQ-2-3). **Regression detection (diff-conditional):** When a diff is provided via dispatch, for each removed line or block check: was the removed behavior replaced? Were removed protections (validation, guards, error handling) re-added? List every removed behavior with no equivalent in new code. When no diff is provided, skip this check — regression detection requires before/after comparison. **Test coverage:** List every public/exported function, enumerate ALL branches, verify test coverage. Report specific untested functions and branches by name. Output all findings in the Unified Output Format.

### Specialist Reviewers

Deep-focus reviewers for specific domains. Added to thorough/full tiers for targeted depth.

#### `security-perf`

- **Focus**: Input validation, resource management, DoS prevention, performance optimization
- **Verification Source**: `catalog/security-perf-review-points.md` (7 categories, 25 concrete review points), OWASP Top 10
- **Applicable Domains**: implement, investigate
- **Prompt**: Review for security and performance. Read `catalog/security-perf-review-points.md` (SC) — 7 categories: (1) Input validation, (2) Object pollution, (3) Resource management, (4) DoS prevention, (5) Performance, (6) Bundle/delivery optimization, (7) Sandbox/permissions. For each changed file, systematically check every applicable point. Also check OWASP Top 10: injection, broken auth, data exposure, XXE, broken access control, misconfiguration, XSS, insecure deserialization, known vulnerabilities, insufficient logging. Severity-rate: critical = exploitable vulnerability, high = security or performance risk, medium = potential issue under specific conditions, low = best practice improvement. Output all findings in the Unified Output Format.

#### `ts-patterns`

- **Focus**: TypeScript type design quality — patterns learned from top OSS committers (TkDodo, colinhacks, KATT, dai-shi, RyanCavanaugh, DanielRosenwasser)
- **Verification Source**: `catalog/ts-review-points.md` (8 categories, 30+ concrete review points)
- **Applicable Domains**: implement, investigate
- **Prompt**: Review TypeScript code quality using insights from top OSS committers. Read `catalog/ts-review-points.md` (TS) — 7 categories: (1) Type safety, (2) Performance, (3) API/module design, (4) Runtime environment, (5) Test quality, (6) Code quality, (7) PR discipline. For each changed file, systematically check every applicable point. Severity-rate: high = type safety or correctness risk, medium = design or maintainability concern, low = style or convention. Output all findings in the Unified Output Format.

#### `devils-advocate`

- **Focus**: Fundamental skepticism — question the problem, the direction, and the claimed benefits
- **Verification Source**: First-principles reasoning, analogous failures in other projects/domains
- **Applicable Domains**: all (mandatory in thorough/full reviews)
- **Prompt**: Be unconditionally skeptical. Assume nothing is correct until proven. Challenge at every level: (1) Problem validity: Is the stated problem real? Are we solving a symptom instead of the root cause? Is this problem even worth solving? (2) Direction: Is this the right approach to the right problem? Are we building what users actually need, or what we assumed they need? (3) Assumptions: List every implicit assumption. Which ones are unverified? Which would invalidate the entire approach if wrong? (4) Claimed benefits: Are the stated advantages real or wishful thinking? What evidence supports them? Would the benefits survive contact with reality? (5) Scope: Are we doing too much or too little? Is the boundary drawn where it should be? (6) Trade-off honesty: What costs are being downplayed? What is sacrificed by this choice that no one wants to talk about? (7) Alternatives not taken seriously: Were rejected alternatives genuinely evaluated, or dismissed to confirm a pre-existing preference? Do not suggest fixes. Your job is to expose what others are reluctant to question. Output as free-form analysis (no checklist format).

### Non-Code Reviewers

Domain-specific reviewers for design, requirements, and architecture. Not included in code review tiers.

#### `architecture`

- **Focus**: Design principles, system boundaries, pattern fitness
- **Verification Source**: Architecture research, OSS reference implementations
- **Applicable Domains**: design, implement, guide
- **Prompt**: Review for architecture quality. Check: design decision validity, scalability, maintainability, pattern consistency with existing architecture, whether future extension is unnecessarily constrained. Compare against design principles and well-designed OSS in the same domain.

#### `spec-compliance`

- **Focus**: Specification-to-implementation alignment
- **Verification Source**: Design Doc / FeatureSpec as source of truth
- **Applicable Domains**: implement
- **Prompt**: Review for spec compliance. Does the target (code or implementation plan) match the Design Doc/FeatureSpec exactly? Are all requirements addressed? Are there deviations from the spec? Report any gaps or mismatches.

#### `document-quality`

- **Focus**: Structure, terminology, abstract-to-concrete flow, conciseness, plain language
- **Verification Source**: Project document quality rules (`rules/document-quality.md`; additionally `rules/design-doc-format.md` for design domain only)
- **Applicable Domains**: feature-spec, design, guide
- **Prompt**: Review for document quality. Check: abstract-to-concrete structure, terminology consistency, progressive detailing, self-contained sections, conciseness (no filler words, no redundant modifiers, one idea per sentence), plain language (no abstract jargon when a concrete expression conveys the same meaning). Apply rules/document-quality.md for all domains. For design domain only, additionally apply rules/design-doc-format.md (WHY-over-HOW balance, no h4+ headings, no ASCII diagrams, no local file links). Would a newcomer understand the document without follow-up questions?

#### `requirements`

- **Focus**: User journeys, edge cases, scenario coverage
- **Verification Source**: User stories, domain analysis
- **Applicable Domains**: feature-spec
- **Prompt**: Review for requirements completeness. Check: user story coverage, edge case consideration, acceptance criteria clarity. Are there missing user journeys or overlooked stakeholders? Compare against common feature requirement patterns.

#### `feasibility`

- **Focus**: Implementation complexity, codebase constraints
- **Verification Source**: Codebase exploration (Scout findings)
- **Applicable Domains**: feature-spec, design
- **Prompt**: Review for technical feasibility. Is this technically achievable within the existing system? Are dependencies and integration points clear? Are there hidden technical constraints that make parts impractical? Base assessment on actual codebase state, not assumptions.

#### `user-impact`

- **Focus**: UX, accessibility, backward compatibility
- **Verification Source**: UX research, accessibility standards
- **Applicable Domains**: design
- **Prompt**: Review for user impact. Check: UI/UX implications, backward compatibility, migration path, user experience changes. Detect cases where technically correct design negatively impacts users.

#### `structural-fitness`

- **Focus**: Whether incremental change is appropriate or broader refactoring is needed
- **Verification Source**: Codebase structure analysis, coupling/cohesion indicators, technical debt patterns
- **Applicable Domains**: design, implement
- **Prompt**: Assess structural fitness. Is the proposed approach incrementally extending existing structure when broader refactoring would be more effective? Check: Does the change fight the existing architecture (working around limitations instead of fixing them)? Will it increase coupling or create structural friction for future changes? Are we patching around a design that no longer fits the requirements? Would restructuring first make this change — and future changes — simpler? Detect sunk-cost thinking: "we have this code, so we should build on it" when the code's structure doesn't fit the new need. If refactoring is warranted, describe the scope and expected benefit.

#### `axes-coherence`

- **Focus**: Whether resolved Axes Table decisions hold up when concretized into an outline or plan
- **Verification Source**: The resolved Axes Table file (verdicts + rationale) cross-referenced against the concretized outline/plan
- **Applicable Domains**: design, implement
- **Prompt**: Read the resolved Axes Table and the outline/plan together. For each resolved axis, check: (1) Does the concretized structure contradict the axis verdict? (2) Does concretization reveal a missing axis? (3) Are there axes whose rationale no longer holds in concrete context? (4) Does the outline/plan fight the resolved decisions? Flag any axis where the concrete expression suggests the abstract verdict should be reconsidered. For each flagged axis, state: what was resolved, what the outline/plan reveals, and what re-evaluation would look like.

> **Note**: The distinction sections below clarify boundaries for human readers and planner agents. Selection logic (which reviewers to pick for a given task) is determined by `skills/workflow-planner/SKILL.md`.

## Distinction: `quality` vs `correctness`

`quality` asks "Is this code good?" — standards compliance, readability, simplicity, structural patterns, framework idioms. It evaluates the code as a maintainable artifact.
`correctness` asks "Does this code work?" — bug detection through execution tracing, failure mode coverage, cross-diff consistency, regression detection. It evaluates the code as a running system.

Code can pass `quality` (well-typed, readable, simple, idiomatic) and still have a subtle logic bug, an unhandled failure mode, or an inconsistency with other call sites. Code can pass `correctness` (no bugs, resilient to failures, consistent) and still be unreadable, over-engineered, or using deprecated APIs. Their verification sources are disjoint (project rules + readability research + complexity metrics vs bug pattern databases + production failure patterns + codebase-wide consistency).

## Distinction: `quality`/`correctness` vs specialists

Broad reviewers scan all their checklists for wide coverage — they catch issues at a scanning depth. Specialists go deeper in a specific domain:
- `security-perf` applies adversarial thinking to security and performance specifically (OWASP Top 10 depth, DoS scenario construction)
- `ts-patterns` applies TypeScript-specific expertise (type design quality patterns from top OSS committers)
- `devils-advocate` challenges the fundamentals (problem validity, direction, assumptions) — orthogonal to code-level checks

A broad reviewer may flag an obvious SQL injection (CQ rule compliance), but `security-perf` constructs exploitation scenarios, checks OWASP coverage, and evaluates resource exhaustion paths. A broad reviewer may flag a type assertion, but `ts-patterns` evaluates the type design holistically across the codebase.

## Distinction: `axes-coherence` vs `devils-advocate` vs `structural-fitness`

`axes-coherence` checks decision validity: "Do the resolved Axes Table decisions still make sense when concretized?"
`devils-advocate` questions the foundations: "Is the problem real? Is the direction right? Are we honest about the trade-offs?"
`structural-fitness` checks architecture fit: "Should we extend or restructure?"

`axes-coherence` is uniquely positioned because it reads TWO artifacts — the Axes Table and the outline/plan — and cross-references them. Devils-advocate reads only the target and challenges from first-principles skepticism. Structural-fitness evaluates architecture without reference to prior axis decisions. Their verification sources differ (resolved Axes Table vs failure patterns vs coupling/cohesion metrics).
