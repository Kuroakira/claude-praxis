---
name: parallel-review-team
description: Use when a workflow reaches a review point — dispatches 4 parallel reviewers with independent verification sources. Invoked by commands with a type parameter.
---

# Parallel Review Team

Four independent reviewers, each verifiable against a different source. Delegate review — do NOT self-review with a checklist.

## The Iron Law

```
INDEPENDENT VERIFICATION SOURCES — IF TWO REVIEWERS USE THE SAME EVIDENCE, MERGE THEM
```

## Review Types

Commands invoke this skill with a type that determines the reviewer configuration.

| Type | Used by | Target |
|------|---------|--------|
| code-review | `/implement` Final Review | Implementation code |
| document-review | `/design` Auto-Review | Design Doc |
| spec-review | `/feature-spec` Draft Review | FeatureSpec draft |

If the type is not recognized, warn the user ("⚠️ Unrecognized review type '[type]' — falling back to code-review") and use code-review as the default. This prevents typos from silently producing the wrong review.

## Reviewer Configurations

### code-review

Launch all 4 simultaneously using Task tool (subagent_type: `claude-praxis:reviewer`):

**Reviewer A — Spec Compliance**
> Review this implementation for spec compliance. Does the code match the Design Doc/Plan exactly? Are all requirements addressed? Are there deviations from the spec? Report any gaps or mismatches.

Verification source: Design Doc and implementation Plan.

**Reviewer B — Code Quality**
> Review this implementation for code quality. Check: code-quality-rules compliance, pattern consistency with existing project, test quality (no lazy assertions, TDD followed), YAGNI adherence, appropriate error handling.

Verification source: code-quality-rules and project conventions.

**Reviewer C — Security + Performance**
> Review this implementation for security and performance. Check: OWASP Top 10 vulnerabilities, input validation at boundaries, injection risks, data exposure, algorithmic complexity, unnecessary allocations, N+1 queries, bundle size impact. Severity-rate each finding.

Verification source: OWASP Top 10, performance profiling patterns.

**Reviewer D — Devil's Advocate**
> Challenge this implementation. What edge cases are missing? Where will this break first in production? What hidden technical debt is being introduced? Even if other reviews pass, what could still go wrong?

Verification source: Bug report patterns, regression examples, production incident case studies.

### document-review

Launch all 4 simultaneously using Task tool (subagent_type: `claude-praxis:reviewer`):

**Reviewer A — Architecture**
> Review this Design Doc for architecture quality. Check: design decision validity, scalability, maintainability, pattern consistency with existing architecture, whether future extension is unnecessarily constrained. Compare against design principles and well-designed OSS in the same domain.

Verification source: Design principles, architecture pattern best practices, well-designed OSS.

**Reviewer B — User Impact**
> Review this Design Doc for user impact. Check: UI/UX implications, backward compatibility, migration path, user experience changes. Detect cases where technically correct design negatively impacts users.

Verification source: UX heuristics, accessibility standards, existing user flow impact analysis.

**Reviewer C — Writing Quality**
> Review this Design Doc for document quality. Check: abstract-to-concrete structure, terminology consistency, progressive detailing, self-contained sections, WHY-over-HOW balance, no h4+ headings, no ASCII diagrams (mermaid only), no local file links, all references inline or shared URLs. Apply design-doc-format and document-quality-rules. Would a newcomer understand all decisions without follow-up questions?

Verification source: design-doc-format and document-quality-rules quality criteria.

**Reviewer D — Devil's Advocate**
> Challenge this Design Doc. Under what conditions does this design fail? What if the stated assumptions are wrong? Could a rejected alternative actually be better? For each alternative: is "why Proposal is better" specific to the current context, not generic? What cross-cutting concerns are missing? Find similar design failures.

Verification source: Architecture failure case studies, postmortem articles, over-engineering examples.

### spec-review

Launch all 4 simultaneously using Task tool (subagent_type: `claude-praxis:reviewer`):

**Reviewer A — Requirements Completeness**
> Review this FeatureSpec draft for requirements completeness. Check: user story coverage, edge case consideration, acceptance criteria clarity. Are there missing user journeys or overlooked stakeholders? Compare against common feature requirement patterns.

Verification source: Similar product feature lists, user journey map patterns, requirements best practices.

**Reviewer B — Technical Feasibility**
> Review this FeatureSpec draft for technical feasibility. Is the spec technically achievable within the existing system? Are dependencies and integration points clear? Are there hidden technical constraints that make parts of this spec impractical?

Verification source: Codebase current state, technical constraints, platform specifications.

**Reviewer C — Writing Quality**
> Review this FeatureSpec draft for document quality. Check: abstract-to-concrete structure, terminology consistency, progressive detailing, self-contained sections. Apply document-quality-rules. Would a new team member understand the spec without follow-up questions?

Verification source: document-quality-rules quality criteria.

**Reviewer D — Devil's Advocate**
> Challenge this FeatureSpec. Is the scope boundary realistic? Does the problem definition capture the real problem? Is the In/Out of Scope line reasonable? What could go wrong with these requirements? Find similar projects that failed and why.

Verification source: Competitor failure cases, requirements anti-patterns, similar project lessons.

## Apply Findings

After all 4 reviewers return:

1. **Critical/Important issues** — fix before proceeding (revise code or document)
2. **Minor issues** — note in the completion report for human judgment
3. **Conflicting opinions** — resolve explicitly (state which opinion was adopted and why)
4. If revision is needed, re-run only the affected reviewer(s), not the full team

## Integration

- **Invoked by**: `commands/implement.md`, `commands/design.md`, `commands/feature-spec.md`
- **Selection principle**: See `agent-team-execution` §4 for why teams beat checklists and the independent verification source principle
- **Reviewer agent**: All reviewers use subagent_type `claude-praxis:reviewer` (read-only, code-quality-rules preloaded)
- **Devil's Advocate is mandatory**: Every review type includes one. Prevents groupthink by verifying against counter-evidence
