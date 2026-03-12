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

- **Focus**: TDD compliance, type safety, patterns
- **Verification Source**: Project code quality rules (`rules/code-quality.md`) and codebase conventions
- **Applicable Domains**: implement, debug
- **Prompt**: Review for code quality. Check: code quality rules compliance (rules/code-quality.md), pattern consistency with existing project, test quality (no lazy assertions, TDD followed), YAGNI adherence, appropriate error handling.

### `security-perf`

- **Focus**: OWASP, performance profiling, resource usage
- **Verification Source**: Security research + profiling tools
- **Applicable Domains**: implement, debug
- **Prompt**: Review for security and performance. Check: OWASP Top 10 vulnerabilities, input validation at boundaries, injection risks, data exposure, algorithmic complexity, unnecessary allocations, N+1 queries, bundle size impact. Severity-rate each finding.

### `error-resilience`

- **Focus**: Unhappy paths, failure modes, graceful degradation
- **Verification Source**: Production failure patterns, chaos engineering principles
- **Applicable Domains**: implement, debug
- **Prompt**: Review for error resilience. Check: Are only happy paths implemented? How does the code behave on DB connection loss, external API timeout, malformed input, resource exhaustion? Are retries bounded? Is there circuit breaker logic where needed? Are errors distinguished (auth failure vs service unavailable)? For defensive mechanisms (visited sets, guards, cycle detection, input validation): verify coverage is complete — all types, all code paths, not just the primary case. A guard that protects section elements but not non-section elements is a partial defense. Construct specific adversarial inputs that bypass partial guards. Verify against production failure patterns.

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
- **Verification Source**: Cyclomatic complexity indicators, function size, nesting depth, abstraction layer count, conditional logic structure
- **Applicable Domains**: design, implement, debug
- **Prompt**: Review for unnecessary complexity — especially the kind AI-generated code tends to introduce. Check: (1) Over-abstraction: Are there wrapper functions, utility classes, or abstraction layers that serve only one caller? Could the code be inlined without loss of clarity? (2) Conditional complexity: Can nested if/else chains be flattened with early returns, guard clauses, or lookup tables? Are there boolean parameters that split a function into two disguised functions? (3) Premature generalization: Are generic type parameters, configuration objects, or strategy patterns used where a simple concrete implementation would suffice? (4) Layer bloat: Are there unnecessary indirection layers (service → helper → util → actual logic)? Could the call chain be shortened? (5) Function size: Can functions over ~20 lines be split into named steps? Are there god functions that do too many things? (6) Design-level complexity (for design reviews): Is the proposed architecture more complex than the problem requires? Are there simpler alternatives that meet the same goals? For each finding, suggest the specific simplification and state what is lost (if anything). Severity-rate: high = complexity with no benefit, medium = justified complexity that could be simpler, low = stylistic simplification.

### `general-review`

- **Focus**: Broad code review — potential bugs, logic errors, readability, naming, idiomatic patterns, test coverage adequacy
- **Verification Source**: Language/framework idiom guides, common bug pattern databases (CWE weakness patterns, language-specific gotchas), peer code review best practices
- **Applicable Domains**: implement, debug
- **Prompt**: Review as a senior developer doing a general code review. Check: (1) Potential bugs: null/undefined access, off-by-one errors, incorrect boolean logic, race conditions, unintended type coercion. (2) Readability: Are variable/function names clear and descriptive? Is the code's intent obvious without reading comments? Would a new team member understand the flow? (3) Idiomatic patterns: Does the code use language/framework idioms appropriately? Are there non-idiomatic constructs that could be simplified using standard patterns? (4) Edge cases in logic: Are boundary conditions in business logic handled? Are there implicit assumptions about input ranges, array lengths, or string formats? For graph/tree traversal or recursive algorithms: construct at least one corrupted/adversarial input scenario and manually trace through the code step by step. (5) Test coverage adequacy: Are the right scenarios tested — not just happy paths but meaningful edge cases? Are there untested code paths? This is NOT about test quality (assertion style, TDD compliance — that is code-quality's job) but about whether the test suite covers the important behaviors. For each finding, state the specific risk and suggest the fix. Severity-rate: high = likely bug or significant readability barrier, medium = non-idiomatic or missing edge case, low = minor naming or style improvement.

> **Note**: The distinction sections below clarify boundaries for human readers and planner agents. Selection logic (which reviewers to pick for a given task) is determined by `skills/workflow-planner/SKILL.md`.

## Distinction: `general-review` vs `code-quality` vs `simplicity`

`code-quality` checks rule compliance and correctness standards: TDD, type safety, no lazy assertions, pattern adherence.
`simplicity` checks cognitive economy: over-abstraction, unnecessary indirection, premature generalization.
`general-review` checks what a senior developer's eye catches in a PR review: potential bugs, readability, idiomatic usage, logic edge cases, and test coverage adequacy.

A function can pass `code-quality` (correct types, TDD followed, no rule violations), pass `simplicity` (no unnecessary abstraction, flat structure), and still have a subtle logic bug, a misleading variable name, or a missing edge case in its tests. `general-review` catches these "common sense" issues that fall between specialist cracks. Their verification sources differ (project rules vs complexity metrics vs language idiom guides and bug pattern databases), making them independently valuable.

## Distinction: `error-resilience` vs `devils-advocate`

`devils-advocate` questions everything fundamentally: "Is the problem real? Is the direction right? Are the claimed benefits honest?" It operates from first-principles skepticism — challenging the validity of the work itself, not its technical execution.
`error-resilience` assumes the direction is correct and challenges coverage: "Are only happy paths implemented? What happens when things fail at runtime?"

They are complementary: devils-advocate may say "this feature shouldn't exist"; error-resilience says "if this feature exists, it needs to handle DB timeouts." Their verification sources differ (first-principles reasoning vs production failure patterns/chaos engineering), making them independently valuable.

## Distinction: `error-resilience` vs `general-review` on partial defenses

`general-review` spots potential bugs and edge cases by tracing logic flow. `error-resilience` checks whether failure modes are handled. A gap exists when defensive code is **present but partial** — e.g., a `visited` set that covers section elements but not non-section elements. `general-review` may observe the partial coverage but lack the adversarial mindset to construct a bypassing input. `error-resilience` may see "defense exists" and move on without verifying completeness. Both prompts now address this: `error-resilience` explicitly checks partial guards ("all types, all code paths"), and `general-review` constructs adversarial inputs for graph/tree traversal algorithms.

## Distinction: `code-quality` vs `simplicity`

`code-quality` checks correctness and standards: TDD compliance, type safety, test quality, pattern consistency.
`simplicity` checks cognitive economy: Is this more complex than it needs to be? Could a simpler approach achieve the same result?

AI-generated code tends to be correct but over-engineered — adding unnecessary abstraction layers, premature generalization (generic where concrete suffices), configuration objects for single-use cases, and wrapper functions that add indirection without value. `simplicity` detects these patterns. Their verification sources differ (rules compliance vs complexity metrics/cognitive load), making them independently valuable.

## Distinction: `axes-coherence` vs `devils-advocate` vs `structural-fitness`

`axes-coherence` checks decision validity: "Do the resolved Axes Table decisions still make sense when concretized?"
`devils-advocate` questions the foundations: "Is the problem real? Is the direction right? Are we honest about the trade-offs?"
`structural-fitness` checks architecture fit: "Should we extend or restructure?"

`axes-coherence` is uniquely positioned because it reads TWO artifacts — the Axes Table and the outline/plan — and cross-references them. Devils-advocate reads only the target and challenges from first-principles skepticism — questioning whether the problem, direction, and benefits are valid at all. Structural-fitness evaluates architecture without reference to prior axis decisions. Their verification sources differ (resolved Axes Table vs failure patterns vs coupling/cohesion metrics).
