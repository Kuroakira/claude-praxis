# Reviewer Catalog

Specialists who evaluate outputs at each stage. Each entry has an independent verification source — the criterion for whether specialization adds value.

All reviewers use subagent_type `claude-praxis:reviewer` (read-only, inherits main model).

## Entries

### `architecture`

- **Focus**: Design principles, system boundaries, pattern fitness
- **Verification Source**: Architecture research, OSS reference implementations
- **Applicable Domains**: design, implement
- **Prompt**: Review for architecture quality. Check: design decision validity, scalability, maintainability, pattern consistency with existing architecture, whether future extension is unnecessarily constrained. Compare against design principles and well-designed OSS in the same domain.

### `spec-compliance`

- **Focus**: Specification-to-implementation alignment
- **Verification Source**: Design Doc / FeatureSpec as source of truth
- **Applicable Domains**: implement
- **Prompt**: Review for spec compliance. Does the code match the Design Doc/Plan exactly? Are all requirements addressed? Are there deviations from the spec? Report any gaps or mismatches.

### `document-quality`

- **Focus**: Structure, terminology, abstract-to-concrete flow
- **Verification Source**: Project document quality rules (`rules/document-quality.md`, `rules/design-doc-format.md`)
- **Applicable Domains**: feature-spec, design
- **Prompt**: Review for document quality. Check: abstract-to-concrete structure, terminology consistency, progressive detailing, self-contained sections, WHY-over-HOW balance, no h4+ headings, no ASCII diagrams (mermaid only), no local file links. Apply rules/design-doc-format.md and rules/document-quality.md. Would a newcomer understand all decisions without follow-up questions?

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
- **Prompt**: Review for error resilience. Check: Are only happy paths implemented? How does the code behave on DB connection loss, external API timeout, malformed input, resource exhaustion? Are retries bounded? Is there circuit breaker logic where needed? Are errors distinguished (auth failure vs service unavailable)? Verify against production failure patterns.

### `devils-advocate`

- **Focus**: Counterarguments, edge cases, failure patterns
- **Verification Source**: Failure case studies, anti-pattern literature
- **Applicable Domains**: all (mandatory in final reviews)
- **Prompt**: Challenge this work. What edge cases are missing? Where will this break first in production? What hidden technical debt is being introduced? What assumptions are wrong? Even if other reviews pass, what could still go wrong? Find similar failures in the field.

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

## Distinction: `error-resilience` vs `devils-advocate`

`devils-advocate` challenges direction: "Is this design/implementation fundamentally wrong?"
`error-resilience` challenges coverage assuming correct direction: "Are only happy paths implemented?"

AI-generated code tends to work perfectly on happy paths but break in production — returning "auth failed" on DB connection loss, no retry storm prevention, no circuit breakers, uniform error handling without distinction. `error-resilience` detects these patterns. Their verification sources differ (failure case studies vs production failure patterns/chaos engineering), making them independently valuable.
