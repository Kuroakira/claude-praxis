---
name: design
description: Create a complete Design Doc — research, outline, review, write, quality check, present
disable-model-invocation: false
---

Orchestrate the **Design Doc Creation Workflow**.

This is an end-to-end workflow. Execute all phases sequentially without waiting for human input between phases — UNLESS a phase explicitly says to pause for human input.

## Phase 0: Check Past Learnings

Invoke `check-past-learnings` (role: design). Carry relevant learnings forward into Phase 1 as constraints or starting points.

## Phase 1: Research (Parallel Research Team)

Dispatch 4 specialized agents in parallel. **Do NOT perform research yourself** — delegate entirely and synthesize only.

### Research Team

Launch all 4 agents simultaneously using Task tool:

**Agent 1 — Problem Space Researcher** (subagent_type: `claude-praxis:researcher`)
> Search the web for prior art, similar implementations, and known challenges for [topic]. Find at least 2-3 distinct approaches (ideal, pragmatic, incremental). Cite all sources with URLs.

Verification source: External documentation, blog posts, GitHub repositories.

**Agent 2 — Scout (Codebase Analysis)** (subagent_type: `claude-praxis:scout`)
> Explore the project codebase for: project structure, existing patterns related to [topic], integration points, constraints that affect design choices. Focus exclusively on the codebase.

Verification source: Source code itself.

**Agent 3 — Best Practices Researcher** (subagent_type: `claude-praxis:researcher`)
> Research the ideal architecture and industry standards for [topic]. Focus on official documentation, standards specifications, and well-designed OSS implementations. Cite all sources with URLs.

Verification source: Official documentation, standards specifications.

**Agent 4 — Devil's Advocate** (subagent_type: `claude-praxis:researcher`)
> Find failure cases, anti-patterns, risks, and reasons NOT to pursue the proposed approaches for [topic]. Search for postmortems, critical reviews, and known pitfalls. Cite all sources with URLs.

Verification source: Postmortem articles, issue trackers, failure case studies.

### Synthesis

After all agents return:
1. Reconcile findings — where Researcher A/B recommend an approach, check Devil's Advocate's challenges against it
2. Resolve contradictions explicitly (state what conflicted and which finding was adopted)
3. Identify at least 2-3 candidate approaches with trade-offs informed by all 4 perspectives
4. Carry synthesis forward into Phase 2 — do NOT pass raw agent outputs

Do NOT present research findings to the human separately. Carry them forward into Phase 2.

**Record to progress.md**: Append an entry with key findings, rejected approaches, and relevant domain tags.

```markdown
## [timestamp] — /claude-praxis:design: Research complete
- Decision: [key findings and approaches identified]
- Rationale: [why certain approaches were rejected early]
- Domain: [topic tag for future matching]
```

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
2. Follow the Design Doc format rules (`rules/design-doc-format.md`) for all formatting and structural rules
3. Within each section, maintain **abstract to concrete** ordering:
   - Lead with context and motivation
   - Follow with specifics and details
   - End with implications and trade-offs
4. Write with the assumption this doc will NOT need editing — by focusing on WHY (which stays valid even when implementation changes), the doc remains accurate over time
5. **Save the Design Doc to file**: Write the completed doc to `design-docs/[name].md` (kebab-case name derived from the doc title). This ensures the doc survives context compact

**Record to progress.md**: Append an entry with the chosen design direction and reasoning.

```markdown
## [timestamp] — /claude-praxis:design: Design Doc written
- Decision: [chosen design direction]
- Rationale: [why this approach over alternatives]
- Domain: [topic tag for future matching]
```

## Phase 5: Auto-Review (Parallel Review Team)

Invoke `parallel-review-team` (type: document-review).

## Phase 6: Present for Human Approval

**This is the ONLY point where the workflow pauses for human input.**

Present the complete Design Doc to the human with:

1. A brief summary of the research that informed the design (3-5 key findings with sources)
2. The full Design Doc
3. Explicit request for approval: "Design Doc ready for review. Approve to proceed, or share feedback for revision."

If the human requests changes, revise and re-run Phase 5 (auto-review) before presenting again.
