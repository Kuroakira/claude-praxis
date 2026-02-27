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

### Step 7: Present Results with Review Trace

After all steps complete, present to the human:

1. **Final output** (the deliverable)
2. **Review trace**: For each step, what review tier was applied and why
3. **Agent selection summary**: Which agents contributed at each stage

## Domain Context

Domain-specific judgment guidelines are injected by calling commands via the `domain_context` parameter. The planner does not maintain its own copy — see each command's planner invocation for specific context and catalog scope.

## Autonomy Boundaries

**Planner decides**: Which agents to dispatch, how many reviewers, which research to pursue, step ordering within a phase

**Command decides**: Phase ordering, mandatory constraints (TDD required, final review required, learnings check required), human interaction points, minimum review floor

The planner operates within the command's guardrails. It adds judgment to agent selection — it does not invent phases or bypass constraints.

## Integration

- **Invoked by**: `commands/design.md`, `commands/implement.md`, `commands/feature-spec.md`, `commands/debug.md`
- **Catalogs**: `catalog/reviewers.md`, `catalog/researchers.md`
- **Dispatches**: `dispatch-reviewers` for review steps, Task tool for researcher/scout dispatch
- **Principle**: Constrained dynamic — commands define structure, planner provides judgment
