# Reviewer Catalog

Specialists who evaluate outputs at each stage. Each entry has an independent verification source — the criterion for whether specialization adds value.

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

## Entries

### `architecture`

- **Focus**: Design principles, system boundaries, pattern fitness
- **Verification Source**: Architecture research, OSS reference implementations
- **Applicable Domains**: design, implement, guide
- **Prompt**: Review for architecture quality. Check: design decision validity, scalability, maintainability, pattern consistency with existing architecture, whether future extension is unnecessarily constrained. Compare against design principles and well-designed OSS in the same domain.

### `spec-compliance`

- **Focus**: Specification-to-implementation alignment
- **Verification Source**: Design Doc / FeatureSpec as source of truth
- **Applicable Domains**: implement
- **Prompt**: Review for spec compliance. Does the target (code or implementation plan) match the Design Doc/FeatureSpec exactly? Are all requirements addressed? Are there deviations from the spec? Report any gaps or mismatches.

### `document-quality`

- **Focus**: Structure, terminology, abstract-to-concrete flow, conciseness, plain language
- **Verification Source**: Project document quality rules (`rules/document-quality.md`; additionally `rules/design-doc-format.md` for design domain only)
- **Applicable Domains**: feature-spec, design, guide
- **Prompt**: Review for document quality. Check: abstract-to-concrete structure, terminology consistency, progressive detailing, self-contained sections, conciseness (no filler words, no redundant modifiers, one idea per sentence), plain language (no abstract jargon when a concrete expression conveys the same meaning). Apply rules/document-quality.md for all domains. For design domain only, additionally apply rules/design-doc-format.md (WHY-over-HOW balance, no h4+ headings, no ASCII diagrams, no local file links). Would a newcomer understand the document without follow-up questions?

### `code-quality`

- **Focus**: TDD compliance, type safety, patterns, YAGNI/DRY/KISS
- **Verification Source**: Project code quality rules (`rules/code-quality.md`), `catalog/code-quality-review-points.md` (6 categories, 16 concrete review points with committer attribution)
- **Applicable Domains**: implement, debug
- **Prompt**: Review for code quality. First, read `catalog/code-quality-review-points.md` — this is your checklist with 16 concrete review points across 6 categories: (1) YAGNI, (2) DRY, (3) KISS, (4) Test quality, (5) Dead code/tech debt, (6) Pattern consistency. Also check compliance with `rules/code-quality.md` (TDD, type safety, no lazy assertions). For each changed file, systematically check every applicable point. When you find a violation, cite the specific point ID (e.g., "4-2: async await leak") and the committer principle. Prioritize findings by severity: high = correctness or test reliability risk, medium = maintainability concern, low = convention.

### `security-perf`

- **Focus**: Input validation, resource management, DoS prevention, performance optimization
- **Verification Source**: `catalog/security-perf-review-points.md` (7 categories, 22 concrete review points with committer attribution), OWASP Top 10
- **Applicable Domains**: implement, debug
- **Prompt**: Review for security and performance. First, read `catalog/security-perf-review-points.md` — this is your checklist with 22 concrete review points across 7 categories: (1) Input validation, (2) Object pollution, (3) Resource management, (4) DoS prevention, (5) Performance, (6) Bundle/delivery optimization, (7) Sandbox/permissions. For each changed file, systematically check every applicable point. When you find a violation, cite the specific point ID (e.g., "1-3: arithmetic overflow") and the committer principle. Also check OWASP Top 10 vulnerabilities not covered by the checklist: injection, broken auth, data exposure, XXE, broken access control, misconfiguration, XSS, insecure deserialization, known vulnerabilities, insufficient logging. Severity-rate each finding: critical = exploitable vulnerability, high = security or performance risk, medium = potential issue under specific conditions, low = best practice improvement.

### `error-resilience`

- **Focus**: Unhappy paths, failure modes, graceful degradation
- **Verification Source**: `catalog/error-resilience-review-points.md` (7 categories, 23 concrete review points with committer attribution), production failure patterns, chaos engineering principles
- **Applicable Domains**: implement, debug
- **Prompt**: Review for error resilience. First, read `catalog/error-resilience-review-points.md` — this is your checklist with 23 concrete review points across 7 categories: (1) Error capture scope, (2) Error propagation and context, (3) Resource cleanup, (4) Partial defenses, (5) Async error handling, (6) State machines and lifecycle, (7) Graceful degradation. For each changed file, systematically check every applicable point. When you find a violation, cite the specific point ID (e.g., "1-2: not-found vs access-error") and the committer principle. Additionally check: How does the code behave on DB connection loss, external API timeout, malformed input, resource exhaustion? Are retries bounded? Is there circuit breaker logic where needed? Are errors distinguished (auth failure vs service unavailable)? For defensive mechanisms (visited sets, guards, cycle detection, input validation): verify coverage is complete — all types, all code paths, not just the primary case. A guard that protects section elements but not non-section elements is a partial defense. Construct specific adversarial inputs that bypass partial guards. Verify against production failure patterns.

### `devils-advocate`

- **Focus**: Fundamental skepticism — question the problem, the direction, and the claimed benefits
- **Verification Source**: First-principles reasoning, analogous failures in other projects/domains
- **Applicable Domains**: all (mandatory in final reviews)
- **Prompt**: Be unconditionally skeptical. Assume nothing is correct until proven. Challenge at every level: (1) Problem validity: Is the stated problem real? Are we solving a symptom instead of the root cause? Is this problem even worth solving? (2) Direction: Is this the right approach to the right problem? Are we building what users actually need, or what we assumed they need? (3) Assumptions: List every implicit assumption. Which ones are unverified? Which would invalidate the entire approach if wrong? (4) Claimed benefits: Are the stated advantages real or wishful thinking? What evidence supports them? Would the benefits survive contact with reality? (5) Scope: Are we doing too much or too little? Is the boundary drawn where it should be? (6) Trade-off honesty: What costs are being downplayed? What is sacrificed by this choice that no one wants to talk about? (7) Alternatives not taken seriously: Were rejected alternatives genuinely evaluated, or dismissed to confirm a pre-existing preference? Do not suggest fixes. Your job is to expose what others are reluctant to question.

### `requirements`

- **Focus**: User journeys, edge cases, scenario coverage
- **Verification Source**: User stories, domain analysis
- **Applicable Domains**: feature-spec
- **Prompt**: Review for requirements completeness. Check: user story coverage, edge case consideration, acceptance criteria clarity. Are there missing user journeys or overlooked stakeholders? Compare against common feature requirement patterns.

### `feasibility`

- **Focus**: Implementation complexity, codebase constraints
- **Verification Source**: Codebase exploration (Scout findings)
- **Applicable Domains**: feature-spec, design
- **Prompt**: Review for technical feasibility. Is this technically achievable within the existing system? Are dependencies and integration points clear? Are there hidden technical constraints that make parts impractical? Base assessment on actual codebase state, not assumptions.

### `user-impact`

- **Focus**: UX, accessibility, backward compatibility
- **Verification Source**: UX research, accessibility standards
- **Applicable Domains**: design
- **Prompt**: Review for user impact. Check: UI/UX implications, backward compatibility, migration path, user experience changes. Detect cases where technically correct design negatively impacts users.

### `structural-fitness`

- **Focus**: Whether incremental change is appropriate or broader refactoring is needed
- **Verification Source**: Codebase structure analysis, coupling/cohesion indicators, technical debt patterns
- **Applicable Domains**: design, implement
- **Prompt**: Assess structural fitness. Is the proposed approach incrementally extending existing structure when broader refactoring would be more effective? Check: Does the change fight the existing architecture (working around limitations instead of fixing them)? Will it increase coupling or create structural friction for future changes? Are we patching around a design that no longer fits the requirements? Would restructuring first make this change — and future changes — simpler? Detect sunk-cost thinking: "we have this code, so we should build on it" when the code's structure doesn't fit the new need. If refactoring is warranted, describe the scope and expected benefit.

### `axes-coherence`

- **Focus**: Whether resolved Axes Table decisions hold up when concretized into an outline or plan
- **Verification Source**: The resolved Axes Table file (verdicts + rationale) cross-referenced against the concretized outline/plan
- **Applicable Domains**: design, implement
- **Prompt**: Read the resolved Axes Table and the outline/plan together. For each resolved axis, check: (1) Does the concretized structure contradict the axis verdict? (e.g., the outline naturally gravitates toward the rejected alternative) (2) Does concretization reveal a missing axis — a decision that wasn't identified during abstract planning but becomes visible when writing specifics? (3) Are there axes whose rationale no longer holds in concrete context? (4) Does the outline/plan fight the resolved decisions — requiring workarounds, conditionals, or awkward structure to accommodate them? Flag any axis where the concrete expression suggests the abstract verdict should be reconsidered. For each flagged axis, state: what was resolved, what the outline/plan reveals, and what re-evaluation would look like.

### `simplicity`

- **Focus**: Unnecessary complexity, over-abstraction, cognitive load reduction
- **Verification Source**: `catalog/simplicity-review-points.md` (4 categories, 12 concrete review points with committer attribution), cyclomatic complexity indicators
- **Applicable Domains**: design, implement, debug
- **Prompt**: Review for unnecessary complexity — especially the kind AI-generated code tends to introduce. First, read `catalog/simplicity-review-points.md` — this is your checklist with 12 concrete review points across 4 categories: (1) Unnecessary abstraction, (2) Structure vs patch, (3) Pragmatism, (4) Reduction judgment. For each changed file, systematically check every applicable point. When you find a violation, cite the specific point ID (e.g., "1-1: single-caller helper") and the committer principle. Additionally check: (a) Conditional complexity: Can nested if/else be flattened with early returns or lookup tables? Are boolean parameters splitting a function into two disguised functions? (b) Function size: Can functions over ~20 lines be split into named steps? (c) Design-level complexity (for design reviews): Is the proposed architecture more complex than the problem requires? For each finding, suggest the specific simplification and state what is lost (if anything). Severity-rate: high = complexity with no benefit, medium = justified complexity that could be simpler, low = stylistic simplification.

### `ts-patterns`

- **Focus**: TypeScript type design quality — patterns learned from top OSS committers (TkDodo, colinhacks, KATT, dai-shi, RyanCavanaugh, DanielRosenwasser)
- **Verification Source**: `catalog/ts-review-points.md` (7 categories, 30+ concrete review points with committer attribution)
- **Applicable Domains**: implement, debug
- **Prompt**: Review TypeScript code quality using insights from top OSS committers. First, read `catalog/ts-review-points.md` — this is your primary checklist with 30+ concrete review points across 7 categories: (1) Type safety, (2) Performance, (3) API/module design, (4) Runtime environment, (5) Test quality, (6) Code quality, (7) PR discipline. For each changed file, systematically check every applicable point in the checklist. When you find a violation, cite the specific point ID (e.g., "1-3: double cast") and the committer principle. Prioritize findings by severity: high = type safety or correctness risk, medium = design or maintainability concern, low = style or convention.

### `general-review`

- **Focus**: Bug detection through execution tracing, logic errors, state/data-flow issues, implicit assumptions — with secondary checks on readability, idioms, and test coverage
- **Verification Source**: `catalog/general-review-points.md` (9 categories, 27 concrete review points with committer attribution), language/framework idiom guides, common bug pattern databases (CWE weakness patterns, language-specific gotchas)
- **Applicable Domains**: implement, debug
- **Prompt**: Review as a senior developer doing a general code review. First, read `catalog/general-review-points.md` — this is your checklist with 27 concrete review points across 9 categories: (1) Conditional logic errors, (2) State management and closures, (3) Null/undefined handling, (4) Boundary conditions, (5) Async pitfalls, (6) Data flow breakage, (7) Pattern matching and regex, (8) Implicit assumptions, (9) Copy-paste inconsistencies. For each changed file, systematically check every applicable point. When you find a violation, cite the specific point ID (e.g., "1-1: || vs ?? confusion") and the committer principle. **Primary focus — Bug detection (allocate majority of review effort here):** For each non-trivial function, select 2-3 representative inputs (including at least one edge case) and mentally execute the code step by step. Track variable values at each step. Document where actual behavior diverges from expected behavior. Ask: "What input would make this function produce a wrong result silently (no error thrown, but wrong output)?" Construct at least one concrete adversarial input and trace through the code. **Secondary focus:** (6) Readability: Are variable/function names clear and descriptive? Is the code's intent obvious without reading comments? Would a new team member understand the flow? (7) Idiomatic patterns: Does the code use language/framework idioms appropriately? Are there non-idiomatic constructs that could be simplified? (8) Test coverage adequacy — systematic gap identification: (a) List every public/exported function in the changed files. For each, check whether a corresponding test exists. (b) For each function with branching logic (if/else, switch, try/catch), check whether tests cover both the primary path and at least one alternative path. (c) For utility functions that transform data (formatters, validators, parsers), check whether edge case inputs are tested (empty string, null, boundary values, malformed input). (d) Report specific untested functions by name, not just "tests are missing." This is NOT about test quality (assertion style, TDD compliance — that is code-quality's job) but about whether the test suite covers the important behaviors at function-level granularity. For each finding, state the specific risk, provide a concrete example input that triggers the issue, and suggest the fix. Severity-rate: high = likely bug or silent wrong behavior, medium = edge case that could cause issues under specific conditions, low = readability or style improvement.

### `beyond-diff`

- **Focus**: Issues invisible within the diff — temporal state tracking, cross-diff consistency, external spec conformance
- **Verification Source**: `catalog/beyond-diff-review-points.md` (3 categories, 13 concrete review points with committer attribution), external API documentation, full-codebase call site search
- **Applicable Domains**: implement, debug
- **Prompt**: Review for issues that only surface when looking beyond the immediate diff. First, read `catalog/beyond-diff-review-points.md` — this is your checklist with 13 concrete review points across 3 categories: (1) Temporal state tracking, (2) Cross-diff consistency, (3) External spec conformance. For each changed file, systematically check every applicable point. When you find a violation, cite the specific point ID (e.g., "1-1: stale state after operation") and describe the concrete scenario. **Category 1 — Temporal state tracking**: For each state-dependent operation, trace what happens across multiple invocations. Ask: "After the first successful execution, what state does the second invocation see? Does it still work correctly?" Construct a 2-3 step scenario (first call → state change → second call) and verify correctness. **Category 2 — Cross-diff consistency**: For each changed function call or pattern, search the codebase for all other call sites of the same function. Verify whether the same fix or change applies there too. Report any unfixed siblings. **Category 3 — External spec conformance**: For each external API call in the diff, verify: request format (headers, body structure, field names), response handling (expected shape, error format), and protocol compliance (OAuth2 flows, pagination, rate limits). When the actual API spec is unknown, flag assumptions that could be wrong. Severity-rate: high = will break in production on repeated use or with real API, medium = inconsistency that may cause bugs under specific conditions, low = unverified assumption worth checking.

### `regression-check`

- **Focus**: Diff-based regression detection — what was removed, what replaced it, what was lost
- **Verification Source**: `git diff` output (staged or branch diff), before/after comparison
- **Applicable Domains**: implement
- **Prompt**: Review the diff (not the final files). For each removed line or block, check: (1) Was the removed behavior replaced by equivalent code? (2) Were removed protections (validation, guards, error handling, disabled-state checks) re-added in the new code? (3) Were removed error handling paths covered by the replacement? (4) Were removed comments that documented non-obvious constraints preserved or rendered unnecessary by the new code? List every removed behavior that has no equivalent in the added code. For each finding, state: what was removed, what (if anything) replaced it, and what risk the gap creates.

> **Note**: The distinction sections below clarify boundaries for human readers and planner agents. Selection logic (which reviewers to pick for a given task) is determined by `skills/workflow-planner/SKILL.md`.

## Distinction: `general-review` vs `code-quality` vs `simplicity`

`code-quality` checks rule compliance and correctness standards: TDD, type safety, no lazy assertions, pattern adherence.
`simplicity` checks cognitive economy: over-abstraction, unnecessary indirection, premature generalization.
`general-review` hunts for bugs through execution tracing and logic analysis: mentally executing code with concrete inputs, tracking state mutations and data flow, surfacing implicit assumptions, and checking boundary conditions. Readability and idiomatic patterns are secondary concerns.

A function can pass `code-quality` (correct types, TDD followed, no rule violations), pass `simplicity` (no unnecessary abstraction, flat structure), and still have a subtle logic bug that only surfaces with specific inputs. `general-review` catches these by tracing execution paths with representative inputs — the kind of "run it in your head" analysis that finds silent wrong behavior. Their verification sources differ (project rules vs complexity metrics vs language idiom guides and bug pattern databases), making them independently valuable.

## Distinction: `error-resilience` vs `devils-advocate`

`devils-advocate` questions everything fundamentally: "Is the problem real? Is the direction right? Are the claimed benefits honest?" It operates from first-principles skepticism — challenging the validity of the work itself, not its technical execution.
`error-resilience` assumes the direction is correct and challenges coverage: "Are only happy paths implemented? What happens when things fail at runtime?"

They are complementary: devils-advocate may say "this feature shouldn't exist"; error-resilience says "if this feature exists, it needs to handle DB timeouts." Their verification sources differ (first-principles reasoning vs production failure patterns/chaos engineering), making them independently valuable.

## Distinction: `error-resilience` vs `general-review` on partial defenses

`general-review` spots potential bugs and edge cases by tracing logic flow. `error-resilience` checks whether failure modes are handled. A gap exists when defensive code is **present but partial** — e.g., a `visited` set that covers section elements but not non-section elements. `general-review` now constructs adversarial inputs and traces execution for all non-trivial logic (not just graph/tree traversal), making it more likely to detect partial defenses through execution tracing. `error-resilience` explicitly checks partial guards ("all types, all code paths") from a failure-mode perspective. Both prompts address this gap from complementary angles — execution tracing vs failure-mode analysis.

## Distinction: `code-quality` vs `simplicity`

`code-quality` checks correctness and standards: TDD compliance, type safety, test quality, pattern consistency.
`simplicity` checks cognitive economy: Is this more complex than it needs to be? Could a simpler approach achieve the same result?

AI-generated code tends to be correct but over-engineered — adding unnecessary abstraction layers, premature generalization (generic where concrete suffices), configuration objects for single-use cases, and wrapper functions that add indirection without value. `simplicity` detects these patterns. Their verification sources differ (rules compliance vs complexity metrics/cognitive load), making them independently valuable.

## Distinction: `regression-check` vs other reviewers

`regression-check` is the only diff-based reviewer. All other reviewers evaluate the final state of files (Context Isolation Rule). `regression-check` evaluates the transition — what changed from before to after. This catches "removed behavior with no replacement" that final-state reviewers cannot detect because they never see what existed before. It complements `general-review` (which traces execution of current code) and `error-resilience` (which checks failure handling of current code) by detecting regressions that only surface when comparing old and new code.

## Distinction: `beyond-diff` vs `regression-check` vs `general-review`

`beyond-diff` looks outward from the diff: forward in time (temporal state), sideways across the codebase (consistency), and outward to external contracts (spec conformance). `regression-check` looks backward at the diff: what was removed and whether it was replaced. `general-review` looks inward at the diff: tracing execution of the current code with concrete inputs.

A token refresh function can pass `general-review` (logic traces correctly for a single invocation), pass `regression-check` (no behavior was removed), and still fail in production because state isn't updated after refresh (temporal), the same bug exists in another call site (consistency), or the request format doesn't match the API spec (conformance). `beyond-diff` catches these by extending the review scope beyond what the diff alone reveals.

## Distinction: `axes-coherence` vs `devils-advocate` vs `structural-fitness`

`axes-coherence` checks decision validity: "Do the resolved Axes Table decisions still make sense when concretized?"
`devils-advocate` questions the foundations: "Is the problem real? Is the direction right? Are we honest about the trade-offs?"
`structural-fitness` checks architecture fit: "Should we extend or restructure?"

`axes-coherence` is uniquely positioned because it reads TWO artifacts — the Axes Table and the outline/plan — and cross-references them. Devils-advocate reads only the target and challenges from first-principles skepticism — questioning whether the problem, direction, and benefits are valid at all. Structural-fitness evaluates architecture without reference to prior axis decisions. Their verification sources differ (resolved Axes Table vs failure patterns vs coupling/cohesion metrics).
