# Design Doc Format

Design Docs are decision records, not implementation guides. Always-applied format constraints for Notion compatibility and team review.

## Why Over How

**Write WHY generously. Write HOW sparingly.**

- **WHY**: Problem, constraints, rejected alternatives — stays valid when implementation changes
- **HOW**: Code examples, directory structures, API details — becomes lies after refactoring

A newcomer reading the doc should NOT need to ask: "Why this approach over X?", "Was Y considered?", "What assumptions?", "When to reconsider?"

### Acceptable Level of Detail

- **Interface contracts** (signatures, types, endpoints): OK — they describe boundaries
- **Method implementations, logic flow**: NOT OK — these are implementation
- **Directory structures**: NOT OK — these change with refactoring
- **Data model schemas**: Conceptual model only (entities + relationships), not column types

**Rule of thumb**: If changing the code would require updating the doc, it's too detailed.

**Exception**: When implementation detail IS the design decision, include just enough marked as **Conceptual**.

## Abstract to Concrete Ordering

**Document Level**: WHY (Overview, Context, Goals) → WHAT (Proposal) → HOW boundaries (interfaces) → Verification (Alternatives, Concerns)

**Section Level**: Context/motivation → Specifics → Implications/trade-offs

## Outline-First Process

1. Write outline (headers + 1-2 sentence summaries)
2. Review outline (argument flow, alternatives present, abstract-to-concrete)
3. Write full doc from reviewed outline

## Stock Document Principle

Design Docs are **stock** (durable reference), not **flow** (temporal narrative). Write in a timeless voice.

```
❌ "現在〜が問題になっている" "最近〜が増えた" "今のところ〜"
❌ "Currently X is causing issues" "Recently we noticed" "As of now"
✅ "The system requires X because Y" "This design addresses the constraint that Z"
```

Time-dependent expressions decay. Write so the doc reads the same in 6 months.

## Self-Contained Document

The Design Doc must be readable **standalone** — no references to intermediate artifacts (Axes Table, synthesis, research notes). Axis evaluation conclusions are woven into Proposal and Alternatives naturally, not cited as external findings.

```
❌ "Axis評価の結果、Aを採用した" "synthesisで判明した通り"
❌ "Per the axis evaluation..." "As identified in the synthesis..."
✅ State the decision and rationale directly in-context
```

## Diagram-First Expression

Concepts, relationships, and comparisons are expressed as **mermaid diagrams first, prose second**. Diagrams are not decoration — they are the primary vehicle for communicating structure.

- **Proposal**: Must include at least one structural diagram showing the proposed design
- **Alternatives Considered**: Include comparison diagrams when the difference between approaches is structural
- **Context and Scope**: Use a diagram to show the problem space or system boundaries when helpful

Prose accompanies diagrams to explain what the diagram cannot show (rationale, trade-offs, constraints). Do not repeat in prose what the diagram already communicates.

## Absolute Rules

**No Local File Links** — Notion cannot resolve `./path`. Describe inline or link to shared URLs.

**No `####` (h4) or Deeper** — Notion's heading hierarchy goes to h3.

**No ASCII Diagrams** — Use mermaid. ASCII breaks with font changes and doesn't render in Notion.

## Document Structure

```markdown
# [Feature/Change Name]

## Overview
One paragraph: what this is and why it matters.

## Context and Scope
Background facts. A reader unfamiliar with the project understands the problem from this section alone.

## Goals / Non-Goals
### Goals
- What this design WILL achieve
### Non-Goals
- What this design explicitly WILL NOT address

## Proposal
The chosen approach at boundary/interface level. Why this is the best fit. Key design decisions with reasoning.

Include structural impact: Does the existing architecture naturally support this feature, or does the architecture need to change first? If restructuring is needed, state what and why — this is a design decision, not an implementation detail.

### System-Context Diagram (optional)
Mermaid diagram showing where this fits in the existing system.

## Alternatives Considered (MANDATORY)
For each: description, why Proposal is preferred, when to reconsider.

When the feature could be implemented by either extending the current structure or restructuring first, both options must appear as alternatives with explicit trade-offs.

## Cross-Cutting Concerns
Security, Privacy, Observability — only sections relevant to this design.

## Concerns
Known risks, uncertainties, mitigations.

## Review Checklist
- [ ] Architecture approved
- [ ] Security implications reviewed
- [ ] Performance impact assessed
- [ ] Migration plan (if applicable)
```

## Code Snippets — Use Sparingly

Default: don't include code. Only when code IS the design decision.

1. Always mark as **Conceptual**
2. Keep under 10 lines
3. No local file links

## Lifecycle

- WHY-focused docs should NOT need editing — rationale survives implementation changes
- Significant deviations → add amendment section, don't rewrite

## Size Guidance

Large designs: thorough. Small changes: mini doc (Overview + Proposal + Alternatives may suffice). Length determined by decisions needing explanation, not page count.
