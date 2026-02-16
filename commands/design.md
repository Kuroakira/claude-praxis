---
name: praxis:design
description: Create a complete Design Doc — research, outline, review, write, quality check, present
disable-model-invocation: true
---

Invoke the skills `getting-started` and `design-doc-format`, then orchestrate the **Design Doc Creation Workflow**.

This is an end-to-end workflow. Execute all phases sequentially without waiting for human input between phases — UNLESS a phase explicitly says to pause for human input.

## Phase 1: Research

Investigate the problem space to build the foundation for design decisions.

1. **Understand the problem space**: Search the web for prior art, similar implementations, and established patterns. Cite all sources with URLs
2. **Understand "what it should be"**: Research the ideal architecture or approach regardless of the current implementation. Best practices, industry standards, and well-designed OSS projects
3. **Identify candidate approaches**: Find at least 2-3 distinct ways to solve the problem:
   - The ideal approach (if built from scratch)
   - A pragmatic middle ground (meaningful improvement within reasonable cost)
   - An incremental approach (extending the current implementation)
4. **Examine the current codebase**: Read relevant existing code to understand the starting point, constraints, and integration points
5. **Surface constraints**: Identify project-specific constraints that narrow the choices

Do NOT present research findings to the human separately. Carry them forward into Phase 2.

## Phase 2: Create Outline

Build the skeleton of the Design Doc following **abstract to concrete** ordering.

1. Create an outline with section headers and 1-2 sentence summaries per section
2. Ordering principle — **abstract to concrete**:
   - Start with WHY (problem, motivation, constraints)
   - Then WHAT (goals, scope, proposed approach at the conceptual level)
   - Then HOW boundaries (interface contracts, key design decisions — only where necessary)
   - Within each section, follow the same pattern: context first, then specifics
3. The outline should make the document's argument visible at a glance:
   - A reader should understand the design direction from the outline alone
   - Each section should have a clear purpose — no sections "for completeness"
4. Ensure Alternatives Considered is included with at least the approaches from Phase 1

Do NOT present the outline to the human yet. Proceed to Phase 3.

## Phase 3: Internal Outline Review

Self-review the outline before writing the full document.

| Check | Question |
|-------|----------|
| Completeness | Would a newcomer understand WHY this design was chosen? |
| Alternatives | Are at least 2 alternatives listed with rejection reasoning? |
| Abstract-to-concrete | Does each section flow from context to specifics? |
| Why over How | Is the outline focused on decisions and rationale, not implementation details? |
| Scope | Does the outline stay within Goals and avoid Non-Goals territory? |
| Audience readiness | Can someone unfamiliar with the project follow the argument? |

If any check fails, revise the outline before proceeding. Do NOT ask the human — fix it internally.

## Phase 4: Write Full Design Doc

Expand the outline into the complete Design Doc.

1. Follow the **Why Over How** principle:
   - **Write WHY generously**: problem context, constraints, decision rationale, rejected alternatives
   - **Write HOW sparingly**: no code examples, directory structures, or implementation details unless they ARE the design decision
2. Follow the `design-doc-format` skill for all formatting and structural rules
3. Within each section, maintain **abstract to concrete** ordering:
   - Lead with context and motivation
   - Follow with specifics and details
   - End with implications and trade-offs
4. Write with the assumption this doc will NOT need editing — by focusing on WHY (which stays valid even when implementation changes), the doc remains accurate over time

## Phase 5: Auto-Review

Review the completed Design Doc for quality before presenting to the human.

| Check | Question |
|-------|----------|
| Why over How | Can HOW sections be removed without losing the core argument? If yes, remove them |
| Newcomer test | Would someone joining the team understand all decisions without asking follow-up questions? |
| Alternatives quality | For each alternative: is "why Proposal is better" specific to the current context (not generic)? |
| No local file links | Are all references inline or to shared URLs? |
| No h4+ | Maximum heading depth is h3? |
| No ASCII diagrams | All diagrams in mermaid format? |
| Abstract-to-concrete | Does the document flow from problem context to design specifics throughout? |
| Self-contained | Does the doc stand alone without requiring external documents to understand? |

If any check fails, fix it before proceeding. Do NOT ask the human — fix it internally.

## Phase 6: Present for Human Approval

**This is the ONLY point where the workflow pauses for human input.**

Present the complete Design Doc to the human with:

1. A brief summary of the research that informed the design (3-5 key findings with sources)
2. The full Design Doc
3. Explicit request for approval: "Design Doc ready for review. Approve to proceed, or share feedback for revision."

If the human requests changes, revise and re-run Phase 5 (auto-review) before presenting again.
