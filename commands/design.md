---
name: design
description: Start the design phase — create a Design Doc for team review
disable-model-invocation: true
---

Invoke the skills `getting-started` and `design-doc-format`, then begin the **Design Phase**:

1. Review research findings and current understanding
2. Create a Design Doc following the **Why Over How** principle:
   - **Write WHY generously**: problem context, constraints, decision rationale, rejected alternatives
   - **Write HOW sparingly**: no code examples, directory structures, or implementation details unless they ARE the design decision
3. Structure the doc with clear sections:
   - Overview (what and why it matters)
   - Context and Scope (orient readers without prior knowledge)
   - Goals / Non-Goals
   - Proposal (the chosen design with reasoning — this is the main section)
   - Alternatives Considered (mandatory — why other approaches were rejected)
   - Cross-Cutting Concerns (security, privacy, observability — only what applies)
   - Concerns (risks, uncertainties, ambiguities)
4. Present the doc for human review before proceeding
