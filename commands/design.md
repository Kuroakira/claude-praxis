---
name: design
description: Create a complete Design Doc — research, outline, review, write, quality check, present
disable-model-invocation: false
---

Orchestrate the **Design Doc Creation Workflow**.

This is an end-to-end workflow. Execute all phases sequentially without waiting for human input between phases — UNLESS a phase explicitly says to pause for human input.

## Phase 0: Check Past Learnings

Invoke `check-past-learnings` (role: design). Carry relevant learnings forward into Phase 1 as constraints or starting points.

## Phase 1: Plan and Research (Workflow Planner)

Invoke `workflow-planner` with the following domain context:

| Parameter | Value |
|-----------|-------|
| `task` | Research and write a Design Doc for [topic] |
| `domain` | design |
| `domain_context` | Research strategy, architecture patterns, document structure. New technology selection → add counter-research + oss-research. Known pattern → codebase-scout + best-practices only. Cross-cutting change → full researcher team. |
| `constraints` | (1) Research must produce a synthesis with findings and contradictions. (2) Outline must be reviewed before full writing. (3) Final Design Doc must receive thorough review with 3+ reviewers including devils-advocate. (4) Design Doc format rules (rules/design-doc-format.md) must be followed. |
| `catalog_scope` | Reviewers: architecture, document-quality, feasibility, user-impact, devils-advocate. Researchers: all (oss-research, codebase-scout, domain-research, best-practices, counter-research). |

The planner will:
1. Analyze the topic and select relevant researchers from the catalog
2. Present the plan (transparency window — human can interrupt if direction is wrong)
3. Dispatch selected researchers in parallel
4. Synthesize findings — reconcile contradictions, identify candidate approaches

### Synthesis Rules

After researcher agents return:
1. Reconcile findings — where researchers recommend an approach, check counter-evidence against it
2. Resolve contradictions explicitly (state what conflicted and which finding was adopted)
3. Identify at least 2-3 candidate approaches with trade-offs informed by all perspectives
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

## Phase 3: Outline Review

The planner determines the review tier for the outline based on task analysis. Typical pattern:

- **Light review** (default): `document-quality` + `devils-advocate` — catch structural issues and directional errors before full writing
- **Thorough review** (for high-risk designs): adds `architecture` and/or `feasibility`

Invoke `dispatch-reviewers` with the planner's selected reviewers and tier.

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
5. **Save the Design Doc to file**: Write the completed doc to `claudedocs/design-docs/[name].md` (kebab-case name derived from the doc title). This ensures the doc survives context compact

**Record to progress.md**: Append an entry with the chosen design direction and reasoning. Record each key design decision separately — especially those from Alternatives Considered where alternatives were rejected. These entries serve as comparison material for `/understanding-check`.

```markdown
## [timestamp] — /claude-praxis:design: Design Doc written
- Decision: [chosen design direction]
- Rationale: [why this approach over alternatives]
- Domain: [topic tag for future matching]
```

## Phase 5: Final Review (Thorough)

The planner selects reviewers for the final Design Doc review. This is a **thorough** review — structural floor applies (3+ reviewers including `devils-advocate`).

Typical final review team: `architecture` + `document-quality` + `devils-advocate` (+ `user-impact` if the design affects users).

Invoke `dispatch-reviewers` with the planner's selected reviewers, tier `thorough`, and the Design Doc as target.

## Phase 6: Present for Human Approval

**This is the ONLY point where the workflow pauses for human input.**

Present the complete Design Doc to the human with:

1. A brief summary of the research that informed the design (3-5 key findings with sources)
2. The full Design Doc
3. **Review trace**: Which reviewers were selected at each stage and why
4. Explicit request for approval: "Design Doc ready for review. Approve to proceed, or share feedback for revision."

If the human requests changes, revise and re-run Phase 5 (final review) before presenting again.
