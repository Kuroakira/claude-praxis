---
name: workflow-planner
description: Analyze task content, select agents from shared catalogs, and generate an execution plan with explicit rationale. Invoked by commands with domain context injection.
---

# Workflow Planner

A single domain-agnostic planner that analyzes task content, selects agents from shared catalogs, and generates a step-by-step execution plan. Commands inject domain-specific context — the planner's core logic (catalog selection, step formatting, review tiers) is shared across all domains.

## The Iron Law

```
EXPLICIT SELECTION RATIONALE — EVERY AGENT CHOICE MUST STATE WHY SELECTED AND WHY OTHERS WERE NOT
```

## Parameters

This skill is invoked by commands with:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `task` | Yes | Description of what needs to be accomplished |
| `domain` | Yes | Which command invoked the planner (`feature-spec`, `design`, `implement`, `debug`) |
| `domain_context` | Yes | Domain-specific judgment guidelines (injected by calling command) |
| `constraints` | Yes | Non-negotiable requirements from the command (e.g., TDD mandatory, final review mandatory) |
| `catalog_scope` | Yes | Which catalog entries are visible to this domain (reviewer IDs + researcher IDs) |

## Procedure

### Step 1: Analyze Task Content

Read the task description and domain context. Identify:

- **Complexity**: Simple (single concern), moderate (2-3 concerns), complex (4+ concerns or cross-cutting)
- **Risk profile**: Low (internal refactor), medium (API changes), high (security/auth, external dependencies, infrastructure)
- **Domain signals**: Keywords and patterns that inform agent selection (see domain context for guidance)
- **Strategy exploration potential**: Whether the task might benefit from evaluating multiple strategic directions in parallel (see domain_context for exploration guidance; only applicable in `design` and `implement` domains)

### Step 2: Select Agents from Catalog

Using **only** the catalog entries listed in `catalog_scope`:

1. **Read the relevant catalogs**: `catalog/reviewers.md` and/or `catalog/researchers.md`
2. **Filter by applicable domain**: Only consider entries whose "Applicable Domains" includes the current domain
3. **Select based on task content**: Match agent focus areas to the task's needs
4. **For each selected agent, state**:
   - Why this agent is needed for this specific task
   - What unique perspective it contributes (tied to its independent verification source)
5. **For each omitted agent (in scope but not selected), state**:
   - Why it's not needed for this specific task

### Step 3: Determine Review Tiers

Apply the graduated review model to each step:

| Tier | Depth | When | Reviewers | Devil's Advocate |
|------|-------|------|-----------|-----------------|
| **None** | No formal review | Intermediate artifacts that will be fully revised (research notes, working drafts) | 0 | No |
| **Light** | 1-2 focused dimensions | Drafts/outlines, low-risk intermediate steps | 1-2 | Optional |
| **Thorough** | Multi-dimensional, comprehensive | Final outputs, high-risk decisions, human-facing deliverables | 3-4 | **Mandatory** |

**Judgment guidelines** (apply based on domain_context):
- Intermediate artifacts to be revised → **None** or **Light**
- Output feeding the next major phase → **Light** (catch structural issues early)
- Final deliverable or irreversible decision → **Thorough** (comprehensive coverage)
- Security-sensitive or architecture-impacting → **Thorough** regardless of stage

**Structural floor for thorough**: 3+ reviewers including `devils-advocate`. This is a command-level constraint the planner cannot override. The planner's flexibility is in choosing which other 2-3 reviewers to include.

**None tier limitation**: None tier applies only to artifacts that will be completely revised. Before passing to the next step, verify structural completeness (all expected sections/data exist) — not a formal review, but prevents obviously incomplete output from propagating.

### Step 4: Generate Execution Plan

Produce a step sequence where each step's output is the next step's required input (causal dependency).

**Step format**:

```
Step [N]: [Descriptive name]
  requires: [Output from previous step(s) — what data this step consumes]
  agents:
    - [catalog ID]: [why selected — tied to this specific task]
    - [catalog ID]: [why selected]
    (omitted: [catalog ID] — [why not needed])
  produces: [What this step generates — consumed by downstream steps]
  review_tier: [none | light | thorough]
  review_reviewers: [catalog IDs for review, if applicable]
  review_reasoning: [Why this tier at this stage for this task]
```

**Causal dependency rule**: Step N+1 must explicitly consume Step N's output. If Step N fails or produces incomplete output, Step N+1 cannot proceed. This is structural — not a checklist item.

**Conditional strategy exploration**: If domain_context includes strategy exploration guidance and Step 1 analysis identifies exploration potential, include a conditional exploration step in the plan:

```
Step [N]: Strategy Exploration (conditional)
  requires: [Synthesis output with 2+ candidate approaches]
  trigger: All conditions met — (1) 2+ viable candidates, (2) no clear winner,
           (3) candidates differ at design-decision level
  agents:
    - strategy-researcher × [2-3]: one per direction, distinct constraint sets
    - devils-advocate × 1: comparison structural verification
  produces: Structured comparison table + selected direction + rationale
  review_tier: none (human selection serves as review)
  protocol: See "Strategy Exploration Protocol" section
```

If trigger conditions are not met at execution time, skip the step and proceed with the strongest candidate from synthesis. The selected direction becomes a required input for the next step (causal dependency).

### Step 5: Present Plan (Transparency Window)

Before execution, present the complete plan to the human:

1. **Task analysis summary**: complexity, risk profile, key signals
2. **Full step sequence**: with agent selections and review tiers
3. **Selection rationale**: why each agent was chosen/omitted
4. **Review trace preview**: which tiers apply at which stages and why

This is a **transparency window**, not an approval gate. The human sees what will happen and can interrupt if the direction is wrong. Execution proceeds unless the human intervenes.

### Step 6: Execute Plan

Execute steps sequentially:

1. For each step, dispatch the selected agents using Task tool
2. **Researcher dispatch**: Use the agent type specified in `catalog/researchers.md` (scout or researcher)
3. **Reviewer dispatch**: Invoke `dispatch-reviewers` with the step's review_reviewers list and tier
4. After each step, integrate agent outputs before proceeding to the next step
5. Verify causal dependency: confirm the step produced the expected output before the next step consumes it
6. **Strategy exploration**: If the plan includes a conditional strategy exploration step and trigger conditions are met at execution time, execute the Strategy Exploration Protocol (see below). If conditions are not met, skip and proceed

### Step 7: Present Results with Review Trace

After all steps complete, present to the human:

1. **Final output** (the deliverable)
2. **Review trace**: For each step, what review tier was applied and why
3. **Agent selection summary**: Which agents contributed at each stage

## Strategy Exploration Protocol (Conditional)

An opt-in protocol for evaluating 2-3 structurally different strategic directions in parallel. Triggered when research synthesis or context gathering identifies multiple viable approaches with no clear winner.

This protocol is an execution pattern within the planner's Step 6 — not a separate skill. Commands inject domain-specific exploration guidance via `domain_context`.

### Trigger Conditions

All three conditions must be met:

1. **Multiple viable candidates**: Synthesis identifies 2+ candidate approaches
2. **No clear winner**: No candidate has obvious superiority across key evaluation criteria
3. **Design-decision-level differences**: Candidates differ in trade-offs at the design level, not just implementation details

If any condition is not met, skip exploration and proceed with the strongest candidate.

### P1: Direction Generation (controller)

Generate 2-3 strategy briefs using **constraint-axis branching**. Each brief contains:

- Direction name and one-sentence summary
- Assigned constraint set (derived from design tensions identified in synthesis)
- Optimization objective (what this direction prioritizes)
- Key assumptions (preconditions for this direction to succeed)

**Constraint axes**: Derive from the design tensions in the synthesis, not from a generic template. If synthesis identified "Candidate A is fast but complex" vs "Candidate B is simple but limited," the axes are speed-vs-simplicity and extensibility-vs-constraints.

Reference template (for deriving axes when design tensions are ambiguous):

| Axis Category | Examples |
|---|---|
| Optimization target | Latency vs memory vs dev speed vs maintainability |
| Architecture assumption | Monolith vs microservice, sync vs async |
| Dependency choice | Build vs buy, cloud vs self-hosted |
| Trust model | Zero-trust vs network boundary |
| Data model | Normalized vs denormalized, RDB vs document DB |

**Minimum divergence validation**: Directions must differ in at least 2 constraint axes. If only 1 axis differs, the directions are "variants" not "fundamentally different directions." If validation fails: modify constraints and regenerate, or abandon exploration and proceed with the synthesis candidate.

### P2: Parallel Evaluation (strategy-researcher per direction)

Dispatch one `strategy-researcher` (haiku) per direction (max 3 in parallel). Each researcher evaluates their assigned direction under its constraint set:

- **Viability**: Technically feasible? Known blockers?
- **Major risks**: Biggest technical, operational, cost risks?
- **Implementation cost**: Complexity and effort estimate
- **Trade-offs**: What does this direction sacrifice?

Each researcher's output is a **strategy sketch** — a concise viability assessment, not a deep investigation. Deep investigation is reserved for the selected direction in the post-exploration phase.

### P3: Comparison Structural Verification (Devil's Advocate)

Dispatch 1 Devil's Advocate using **Task tool with the custom prompt below** (not the generic `devils-advocate` catalog prompt, which is a broad challenge prompt). The DA's role here is **structural verification** — not quality judgment. Quality judgment carries the same LLM-as-judge bias risks (position bias, verbosity bias, self-preference) and is delegated to the human.

DA verification prompt — use this exact scope:

- Are differences between directions structural or merely surface-level? (Do constraint-axis differences produce actual architectural differences?)
- Are all cells in the comparison table filled? Are confidence levels consistent with sketch depth?
- Are there directions mentioned in synthesis but absent from comparison?

### P4: Structured Comparison and Human Selection (controller)

Synthesize all evaluation results into a structured comparison table:

| Criterion | Direction A | Direction B | Direction C | Confidence |
|---|---|---|---|---|
| Technical viability | [assessment] | [assessment] | [assessment] | [high/medium/low] |
| Major risks | [assessment] | [assessment] | [assessment] | [high/medium/low] |
| Implementation cost | [assessment] | [assessment] | [assessment] | [high/medium/low] |
| Trade-offs | [assessment] | [assessment] | [assessment] | [high/medium/low] |

Attach DA findings after the table.

Header note: "Based on strategy sketches (shallow evaluation). Conclusions may change after deep investigation of the selected direction."

Present to the human. The controller may include a recommendation, but the human makes the final selection.

### P5: Post-Selection Deep Dive

The selected direction proceeds to the existing research/planning phase:

- In `/design`: Phase 1 continues with full researcher team on the selected direction
- In `/implement`: Step 2 (Create Plan) uses the selected direction as basis

The selected direction's constraint set and comparison table are **required inputs** for the next step — not just metadata. The downstream step must consume them (causal dependency).

### P6: Fallback Protocol

If deep investigation reveals the selected direction is infeasible:

1. Identify the runner-up direction from the comparison table
2. **Cross-validate**: Before investigating the runner-up, verify that the primary direction's failure reason does not also invalidate the runner-up. If it does (e.g., shared dependency on an unavailable API), skip to step 4
3. Execute deep investigation on the runner-up (additional 7-10x cost)
4. Maximum 1 fallback. If a second fallback is needed or cross-validation fails, the direction generation itself is flawed — discard exploration results and proceed with controller's synthesis judgment

### Cost Profile

Cost as multiples of a single sub-agent invocation (1x):

| Item | Token Cost |
|---|---|
| Direction generation + divergence validation (controller) | ~1-1.5x |
| Parallel evaluation (strategy-researcher × 2-3) | 4-6x |
| Comparison structural verification (DA × 1) | 1-2x |
| Comparison synthesis (controller) | ~0.5x |
| **Total (exploration phase only)** | **7-10x** |

When proposing strategy exploration, include this cost estimate so the human can make an informed opt-in decision.

### Opt-in Reporting

When strategy exploration is triggered, record the comparison results and selection rationale to progress.md. When exploration is not triggered (conditions not met), omit from reporting entirely — do not display "Strategy Exploration: not run."

## Domain Context

Domain-specific judgment guidelines are injected by calling commands via the `domain_context` parameter. The planner does not maintain its own copy — see each command's planner invocation for specific context and catalog scope.

## Autonomy Boundaries

**Planner decides**: Which agents to dispatch, how many reviewers, which research to pursue, step ordering within a phase, whether to propose strategy exploration (based on trigger conditions)

**Command decides**: Phase ordering, mandatory constraints (TDD required, final review required, learnings check required), human interaction points, minimum review floor

**Human decides**: Whether to proceed with proposed strategy exploration (opt-in), which strategic direction to select from comparison table

The planner operates within the command's guardrails. It adds judgment to agent selection — it does not invent phases or bypass constraints.

## Integration

- **Invoked by**: `commands/design.md`, `commands/implement.md`, `commands/feature-spec.md`, `commands/debug.md`
- **Catalogs**: `catalog/reviewers.md`, `catalog/researchers.md` (including `strategy-researcher` for exploration)
- **Dispatches**: `dispatch-reviewers` for review steps, Task tool for researcher/scout dispatch, `strategy-researcher` for exploration evaluation
- **Principle**: Constrained dynamic — commands define structure, planner provides judgment
