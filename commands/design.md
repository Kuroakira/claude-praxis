---
name: design
description: >-
  Create a complete Design Doc — research, per-axis evaluation, review.
  TRIGGER when: user asks to create or write a Design Doc, design a system/feature/API,
  or produce an architectural document.
  BLOCKING REQUIREMENT: invoke this skill BEFORE drafting any design document or claudedocs file.
  Do NOT write Design Doc content directly.
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
| `domain_context` | Research strategy, architecture patterns, document structure. New technology selection → add counter-research + oss-research. Known pattern → codebase-scout + best-practices only. Cross-cutting change → full researcher team. The mandatory Design Axes Table in Synthesis Rules structurally prevents conflating "What" clarity with "How" clarity. Axes marked "Requires exploration" trigger Independent Axis Evaluation (per-axis parallel agents) — see workflow-planner. |
| `constraints` | (1) Research must produce a synthesis with findings and contradictions. (2) Synthesis must include a Design Axes Table — every design decision with multiple valid approaches must be enumerated with verdict (Clear winner / Requires exploration). (3) If Design Axes Table has "Requires exploration" axes, planner executes Independent Axis Evaluation to resolve them before outline creation. (4) Outline must be reviewed before full writing. (5) Final Design Doc must receive thorough review with 3+ reviewers including devils-advocate. (6) Design Doc format rules (rules/design-doc-format.md) must be followed. |
| `catalog_scope` | Reviewers: architecture, document-quality, simplicity, feasibility, user-impact, security-perf, structural-fitness, devils-advocate. Researchers: all (oss-research, codebase-scout, domain-research, best-practices, counter-research, axis-evaluator). |

The planner will:
1. Analyze the topic and select relevant researchers from the catalog
2. Present the plan (transparency window — human can interrupt if direction is wrong)
3. Dispatch selected researchers in parallel
4. Synthesize findings — reconcile contradictions, identify candidate approaches
5. Produce Design Axes Table. For "Requires exploration" axes: dispatch per-axis evaluators, synthesize results, resolve axes (see workflow-planner Independent Axis Evaluation)

### Synthesis Rules

After researcher agents return:
1. Reconcile findings — where researchers recommend an approach, check counter-evidence against it
2. Resolve contradictions explicitly (state what conflicted and which finding was adopted)
3. Identify at least 2-3 candidate approaches with trade-offs informed by all perspectives
4. **Enumerate design axes (MANDATORY)** — produce a Design Axes Table covering every design decision where multiple valid approaches exist. This step CANNOT be skipped. "What" clarity does not imply "How" clarity — even when requirements are precisely defined, multiple design axes for achieving them may exist
5. Carry synthesis (including Design Axes Table) forward into Phase 3 — do NOT pass raw agent outputs

### Design Axes Table (Required Synthesis Output)

Every synthesis MUST produce this table. If the table has zero "Requires exploration" axes, state the justification explicitly — "no axes require exploration because [reason]."

| Axis | Choices | Verdict | Rationale |
|------|---------|---------|-----------|
| [design decision] | A: [option] / B: [option] | Clear winner (A) / Requires exploration | [why A is clearly better, OR why both are viable with genuine trade-offs] |

**Rules**:
- Every design decision from the synthesis must appear as an axis
- **"Requires exploration"** = both choices have genuine trade-offs that affect the design direction (not just implementation details)
- **"Clear winner"** = one choice is objectively better with stated rationale
- A verdict of "0 axes require exploration" needs explicit justification — this conclusion cannot be reached by default
- Common axes to check (not exhaustive): data model structure, logic placement (which layer), consistency/integrity strategy, integration approach (centralized vs distributed), state management approach, performance strategy (processing model, caching, scaling approach, rendering strategy), complexity trade-off (simpler design with fewer features vs comprehensive design with more moving parts)

This table is a **required input** for Independent Axis Evaluation. Axes marked "Requires exploration" are resolved through per-axis parallel evaluation before Phase 3.

Do NOT present research findings to the human separately. Carry them forward into Phase 2 and Phase 3.

**Record to progress.md**: Append an entry with key findings, rejected approaches, and relevant domain tags. If per-axis evaluation was executed, include the resolved axes and rationale.

```markdown
## [timestamp] — /claude-praxis:design: Research complete
- Decision: [key findings and approaches identified]
- Rationale: [why certain approaches were rejected early]
- Domain: [topic tag for future matching]
```

## Phase 2: Analyze Architecture

Invoke `architecture-analysis` to capture the current codebase state before making design decisions. Research (Phase 1) provides "what's possible out there"; analysis provides "what exists here now." Both inform the Design Axes Table.

1. **Determine scope**: Narrow to modules, directories, or layers named in the research synthesis. If research identified specific integration points or affected areas, those become the analysis scope
2. **Invoke `architecture-analysis`** with:
   - `scope`: Task-relevant area identified from research findings
   - `anticipated_changes`: The design topic and candidate approaches from Phase 1
   - `research_context`: Key findings from Phase 1 synthesis
3. **Output**: Durable report saved to `claudedocs/analysis/[scope-name].md`

Carry the analysis report forward into Phase 3 (outline creation). If the analysis detects structural friction, update the Design Axes Table (produced in Phase 1) to include a structural fitness axis with "extend current structure" vs "restructure first" as choices.

Do NOT present the analysis to the human separately. Proceed to Phase 3.

## Phase 3: Create Outline

Build the skeleton of the Design Doc following **abstract to concrete** ordering. By this point, all axes are resolved — either "Clear winner" from synthesis or resolved through Independent Axis Evaluation.

Create a single outline from the resolved axes:

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
5. For axes that went through per-axis evaluation: the resolved decision and rationale should inform the Proposal section's argument structure

Do NOT present the outline to the human yet. Proceed to Phase 4.

## Phase 4: Outline Review

The planner determines the review tier for the outline based on task analysis. Typical pattern:

- **Light review** (default): `document-quality` + `devils-advocate` — catch structural issues and directional errors before full writing
- **Thorough review** (for high-risk designs): adds `architecture` and/or `feasibility`

Save the outline to `claudedocs/design-docs/[name]-outline.md` before dispatching, so reviewers can read it independently. Invoke `dispatch-reviewers` with the planner's selected reviewers, tier, and the **outline file path** as target.

If any check fails, revise the outline before proceeding. Do NOT ask the human — fix it internally. Delete the outline file after the full Design Doc is written in Phase 5 (it is superseded).

## Phase 5: Write Full Design Doc

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

## Phase 6: Final Review (Thorough)

The planner selects reviewers for the final Design Doc review. This is a **thorough** review — structural floor applies (3+ reviewers including `devils-advocate`).

Typical final review team: `architecture` + `document-quality` + `simplicity` + `devils-advocate` (+ `user-impact` if the design affects users). `simplicity` reviews Design Docs for architectural over-complexity — unnecessary layers, premature generalization in the proposed design, and whether simpler alternatives would meet the same goals.

Invoke `dispatch-reviewers` with the planner's selected reviewers, tier `thorough`, and the **Design Doc file path** as target (e.g., `claudedocs/design-docs/auth.md`). Do NOT include summaries or design rationale — reviewers read the document independently.

## Phase 7: Present for Human Approval

**This is the ONLY point where the workflow pauses for human input.**

Present the complete Design Doc to the human with:

1. A brief summary of the research that informed the design (3-5 key findings with sources)
2. The full Design Doc
3. **Review trace**: Which reviewers were selected at each stage and why
4. Explicit request for approval: "Design Doc ready for review. Approve to proceed, or share feedback for revision."

If the human requests changes, revise and re-run Phase 6 (final review) before presenting again.
