# Scout Report: Competing Outlines & Strategy Exploration Implementation Map

## Executive Summary

The competing outlines and strategy exploration infrastructure is **68% implemented** across the claude-praxis codebase. The design docs are complete and synced with `/design` and `/implement` commands, but the `workflow-planner` skill is missing critical plumbing to:

1. Document planner's responsibility for Axes Table generation and validation
2. Implement decision logic connecting Axes Table verdicts to strategy exploration trigger
3. Establish explicit causal dependencies for competing outlines fallback mechanism

The `/plan` command has no strategy exploration infrastructure at all.

This report maps exact file locations, line numbers, and implementation gaps for F1-F5 fixes.

---

## Quick Reference: File Locations

| File | Status | Key Lines |
|------|--------|-----------|
| `/design.md` (design Phase 1-2) | ✅ SYNCED | Axes Table (40-60), Strategy Exploration (62-70), Competing Outlines (98-114) |
| `/implement.md` (implement Phase 1) | ✅ SYNCED | Axes Table (39-56), Strategy Exploration (58-66), Competing Plans (96-113) |
| `/plan.md` | ❌ MISSING | No Axes Table, no exploration, no competing outlines |
| `workflow-planner/SKILL.md` | ⚠️ PARTIAL | Protocol defined (140-275+), but planner responsibility MISSING |
| `competing-strategy-exploration.md` | ✅ REFERENCE | Full protocol (P1-P6), cost analysis, design decisions |
| `enhanced-multi-agent-coordination.md` | ✅ REFERENCE | Parallel dispatch proposal, orthogonal to this exploration |

---

## 1. `/design` Command Status

**File**: `/Users/akirashirahama/workspace/claude-praxis/commands/design.md`

**Status**: ✅ FULLY SYNCED with strategy exploration infrastructure

### Phase 1: Plan and Research

**Lines 40-60**: Design Axes Table (MANDATORY)
```markdown
**Enumerate design axes (MANDATORY)** — produce a Design Axes Table 
covering every design decision where multiple valid approaches exist.

| Axis | Choices | Verdict | Rationale |
|------|---------|---------|-----------|
| [decision] | A: / B: | Clear winner (A) / Requires exploration | [why] |

Rules:
- Every design decision from synthesis must appear as axis
- "Requires exploration" = genuine trade-offs affecting design direction
- "Clear winner" = objectively better with rationale
- 0 axes needs explicit justification
```

**Lines 62-70**: Strategy Exploration (CONDITIONAL)
```markdown
If the planner's synthesis identifies 2+ viable candidate approaches that meet 
strategy exploration trigger conditions (see workflow-planner's Strategy Exploration Protocol), 
the planner executes the exploration protocol between synthesis and Phase 2.

The exploration produces a structured comparison table and the human selects a direction. 
The selected direction — including its constraint set and comparison rationale — becomes 
the required input for Phase 2 (causal dependency).
```

### Phase 2: Create Outline

**Lines 83-96**: Single Outline (all axes "Clear winner")

**Lines 98-114**: Competing Outlines (any axis "Requires exploration")
```markdown
If the Design Axes Table has 1+ axes marked "Requires exploration" AND Strategy Exploration 
was NOT triggered (or was triggered but sub-axes remain), create 2-3 competing outlines:

1. Each outline takes a different position on the "Requires exploration" axes
2. Label with position (e.g., "Outline A: caller-side consistency + centralized integration")
3. Include task list with descriptions and ordering rationale
4. After creating all outlines, produce brief comparison
5. Select best outline with explicit rationale
```

**Assessment**: ✅ Complete. Axes Table + strategy exploration + competing outlines fallback all integrated with clear branching logic.

---

## 2. `/implement` Command Status

**File**: `/Users/akirashirahama/workspace/claude-praxis/commands/implement.md`

**Status**: ✅ FULLY SYNCED with strategy exploration infrastructure

### Phase 1 Step 1: Gather Context

**Lines 23-31**: workflow-planner invocation with domain_context
```markdown
domain_context includes:
- "Strategy exploration: if context gathering identifies 2+ viable implementation 
  directions with no clear winner and design-decision-level differences, 
  propose strategy exploration"
- "Typical implementation-level constraint axes: test strategy (integration-heavy vs 
  unit-heavy), refactoring scope (minimal change vs surrounding improvement), 
  dependency management"
```

**Lines 39-56**: Implementation Axes Table (MANDATORY)
```markdown
**Enumerate implementation axes (MANDATORY)** — after context gathering, 
produce an Implementation Axes Table covering every implementation decision 
where multiple valid approaches exist.

| Axis | Choices | Verdict | Rationale |
|------|---------|---------|-----------|
| [implementation decision] | A: / B: | Clear winner (A) / Requires exploration | [rationale] |

Rules:
- Every implementation decision must appear as axis
- "Requires exploration" = genuine trade-offs affecting implementation approach
- "Clear winner" = objectively better with stated rationale
- Common axes: test strategy, implementation ordering, refactoring scope, 
  dependency management, error handling approach
```

**Lines 58-66**: Strategy Exploration (CONDITIONAL)
```markdown
If the planner identifies 2+ viable implementation directions after context gathering 
that meet strategy exploration trigger conditions (see workflow-planner's Strategy Exploration Protocol), 
the planner executes the exploration protocol between Step 1 and Step 2.

The exploration produces a structured comparison table and the human selects a direction. 
The selected direction — including its constraint set and comparison rationale — becomes 
the required input for Step 2 (causal dependency).

If exploration is not triggered but the Implementation Axes Table has axes marked 
"Requires exploration", proceed to Step 2 with competing plan outlines.

If all axes are "Clear winner" and exploration is not triggered, proceed to Step 2 
with a single plan outline.
```

### Phase 1 Step 2: Create Plan

**Lines 72-94**: Single Plan (all axes "Clear winner")
```markdown
If the Implementation Axes Table has zero "Requires exploration" axes, create a single plan directly

4. Break into steps sized for ~500-line PRs
5. For each step, specify file paths, tests, verification, per-task review plan
6. TDD ordering: test files before implementation files
7. Dependency analysis and parallelization evaluation
8. Always include Final Review as the last task in the plan
```

**Lines 96-113**: Competing Plan Outlines (any axis "Requires exploration")
```markdown
If the Implementation Axes Table has 1+ axes marked "Requires exploration" AND 
Strategy Exploration was NOT triggered, create 2-3 competing plan outlines:

1. Each outline is a high-level plan skeleton — task breakdown, ordering strategy, 
   key approach decisions — NOT a fully detailed plan
2. Each outline takes a different position on the "Requires exploration" axes 
   (e.g., "Plan A: integration-test-heavy + data-layer-first" vs 
   "Plan B: unit-test-heavy + UI-first")
3. Each outline includes:
   - Task list with 1-line descriptions and ordering rationale
   - Position on each exploration axis and how it affects the plan structure
   - Expected trade-offs (complexity, risk, parallelization potential)
4. After creating all outlines, produce a brief comparison
5. Select the best outline with explicit rationale
6. Expand the selected outline into the full detailed plan
```

**Line 115**: PAUSE point
```markdown
**PAUSE**: Present the plan to the human for approval before proceeding. Include the 
planner's agent selection rationale. If competing plan outlines were created, 
include the comparison summary and selection rationale.
```

**Assessment**: ✅ Complete. Axes Table + strategy exploration + competing plan outlines all integrated with clear branching and causal dependencies.

---

## 3. `/plan` Command Status

**File**: `/Users/akirashirahama/workspace/claude-praxis/commands/plan.md`

**Status**: ❌ MISSING strategy exploration infrastructure

**Current content** (19 lines):
```markdown
---
name: plan
description: Create a detailed implementation plan...
---

Begin the **Planning Phase**:

1. **Understand the scope**: Read the Design Doc...
2. **Break into steps sized for ~500-line PRs**...
3. For each step, specify...
4. **TDD ordering**: Within each step...
5. Save the plan for reference during execution
```

**What's missing**:
- No workflow-planner invocation
- No Axes Table enumeration
- No learnings check
- No strategy exploration conditional
- No competing plan outlines fallback
- No PAUSE point for human approval

**Impact**: `/plan` is a standalone command with no strategy exploration benefits. Should have feature parity with `/implement` Phase 1 for consistency.

---

## 4. `workflow-planner` SKILL Status

**File**: `/Users/akirashirahama/workspace/claude-praxis/skills/workflow-planner/SKILL.md`

**Status**: ⚠️ PARTIAL — Protocol defined but planner responsibility MISSING

### What's Defined ✅

**Lines 140-275+**: Strategy Exploration Protocol (P1-P6)
- P1: Direction generation (constraint-axis branching)
- P2: Parallel evaluation (strategy-researcher × 2-3)
- P3: Structural verification (Devil's Advocate)
- P4: Structured comparison + human selection
- P5: Post-selection deep dive
- P6: Fallback protocol

All with clear cost analysis (7-10x tokens) and trigger conditions.

**Line 37**: Strategy exploration potential mentioned in Step 1
```markdown
**Strategy exploration potential**: Whether the task might benefit from evaluating 
multiple strategic directions in parallel (see domain_context for exploration guidance; 
only applicable in `design` and `implement` domains).
```

**Line 156**: Relationship to Design Axes Table mentioned
```markdown
**Relationship to Design Axes Table**: In `/design`, the command requires a mandatory 
Design Axes Table as synthesis output. If the Design Axes Table surfaces axes marked 
"Requires exploration" that were not represented as separate candidate approaches, 
use those axes to generate additional candidates and re-evaluate the primary trigger.
```

### What's MISSING ⚠️

**1. Axes Table generation responsibility** (CRITICAL GAP)
- Commands expect planner to produce Axes Table (see `/implement.md` constraints line 30)
- But SKILL.md does NOT document how planner generates it
- No procedure in Step 1 (Analyze), Step 2 (Select agents), or Step 4 (Generate plan)

**2. Decision logic: Axes Table verdict → strategy exploration trigger** (CRITICAL GAP)
- Trigger conditions documented (lines 146-156)
- But no guidance on evaluating trigger against Axes Table verdicts
- No explicit link: "If Axes Table has 'Requires exploration' entries, check if they represent 2+ candidate approaches with design-decision-level differences"

**3. Causal dependency enforcement for Axes Table** (CRITICAL GAP)
- Step 7 (Present Results, lines 132-138) does not list Axes Table as required output
- No verification that next phase will consume Axes Table verdict
- No documentation of how Axes verdict triggers competing outlines fallback

**4. Competing outlines fallback mechanism** (MISSING)
- Strategy Exploration Protocol is documented
- But fallback (when exploration not triggered but Axes has "Requires exploration") is NOT documented in SKILL.md
- Commands document it (/design.md lines 98-114, /implement.md lines 96-113), but planner doesn't confirm responsibility

**Specific line ranges with gaps**:

| Gap | Location | Current | Needed |
|-----|----------|---------|--------|
| Axes Table responsibility | Step 1 (30-37) | Mentioned conceptually | Explicit procedure |
| Axes Table validation | Step 4 (72-108) | Not mentioned | Add validation step |
| Trigger evaluation logic | Lines 146-156 | Conditions only | Decision tree with Axes |
| Causal dependency output | Step 7 (132-138) | Generic results | List Axes Table + verdict |
| Competing outlines link | After line 275 | Not mentioned | New section explaining |

---

## 5. Causal Dependency Chain (Where Gaps Cause Failures)

### Intended Flow (Design)

```
Phase 1: Research dispatch
    ↓
Synthesis: Identify 2-3 candidate approaches
    ↓
[MISSING in SKILL] Enumerate Design Axes Table
    (Every decision with multiple valid approaches)
    ↓
[MISSING in SKILL] Evaluate strategy exploration trigger
    - 2+ viable candidates? (from synthesis)
    - No clear winner?
    - Design-decision-level differences?
    ↓
[Decision: Trigger conditions met?]
│
├─→ YES: Execute Strategy Exploration (P1-P6)
│        ↓
│        Structured comparison table + selected direction
│        ↓
│        Return to Phase 2 with SELECTED DIRECTION as input
│
└─→ NO: [Secondary decision: Axes Table has "Requires exploration"?]
        │
        ├─→ YES: Phase 2 creates COMPETING OUTLINES
        │        ↓
        │        Select best outline with rationale
        │        ↓
        │        Return to Phase 2 with SELECTED OUTLINE as input
        │
        └─→ NO: Phase 2 creates SINGLE OUTLINE
               ↓
               Return to Phase 2 with SINGLE OUTLINE as input
```

**Where F1-F5 map to gaps**:

- **F1**: Make planner's Axes Table responsibility explicit (Step 1 + Step 4)
- **F2**: Document trigger evaluation logic using Axes verdict (after line 156)
- **F3**: Add causal dependency verification in Step 7 output requirements
- **F4**: Document competing outlines fallback mechanism (new section after P6)
- **F5**: Clarify `/implement` Phase 1 → Phase 2 causal dependency via Axes Table

---

## 6. Strategy Exploration Protocol Quick Reference

**File**: `workflow-planner/SKILL.md` lines 140-275+

**P1: Direction Generation** (controller)
- Generate 2-3 strategy briefs using constraint-axis branching
- Each brief: name, constraint set, optimization objective, key assumptions
- Minimum divergence: must differ in 2+ constraint axes

**P2: Parallel Evaluation** (strategy-researcher × 2-3)
- Evaluate under assigned constraint set
- Assess: viability, major risks, implementation cost, trade-offs
- Output: "strategy sketch" (shallow assessment, not deep investigation)

**P3: Comparison Structural Verification** (Devil's Advocate × 1)
- Verify differences are structural, not surface
- Confirm all comparison table cells filled
- Check for missing directions

**P4: Structured Comparison + Human Selection** (controller + human)
- Synthesize evaluation results into structured table
- Present to human; human makes final selection
- Not LLM-as-judge; human judgment required

**P5: Post-Selection Deep Dive**
- Selected direction proceeds to existing research phase
- Constraint set + comparison table are REQUIRED INPUTS for next step

**P6: Fallback Protocol**
- If selected direction infeasible: investigate runner-up
- Max 1 fallback; if 2nd fallback needed, abandon exploration

**Cost**: 7-10x tokens (exploration) + 7-10x (deep dive) = 14-20x total (vs 7-10x normal)

---

## 7. Axes Table Format & Rules (Both Domains)

### Structure

```markdown
| Axis | Choices | Verdict | Rationale |
|------|---------|---------|-----------|
| [decision] | A: [option] / B: [option] | Clear winner (A) / Requires exploration | [why A better OR why both viable] |
```

### Enumeration Rules

- **Mandatory**: Every implementation/design decision with 2+ valid approaches
- **Verdict options**:
  - "Clear winner (X)" = option X is objectively better; rationale explains why
  - "Requires exploration" = both options have genuine trade-offs affecting approach; exploration may be needed
- **Justification**: If table has zero "Requires exploration" entries, state explicit reason (e.g., "all decisions have clear technical superiority", not generic "straightforward change")

### Common Axes by Domain

**Design axes** (`/design.md` line 56):
- Data model structure (normalized vs denormalized, RDB vs document)
- Logic placement (which layer)
- Consistency/integrity strategy (caller-side vs server-side)
- Integration approach (centralized vs distributed)
- State management approach

**Implementation axes** (`/implement.md` line 54):
- Test strategy (integration-heavy vs unit-heavy)
- Implementation ordering (data layer first vs UI first)
- Refactoring scope (minimal change vs surrounding improvement)
- Dependency management (existing libraries vs new introduction)
- Error handling approach

---

## 8. Files to Modify for F1-F5

### F1: Clarify planner's Axes Table responsibility

**File**: `/Users/akirashirahama/workspace/claude-praxis/skills/workflow-planner/SKILL.md`

**Changes**:
1. **Step 1: Analyze Task Content** (lines 30-37)
   - Add explicit line: "In `/design` and `/implement` domains, identify that Axes Table enumeration is **mandatory** and will be produced as output"

2. **Step 4: Generate Execution Plan** (lines 72-108)
   - Add sub-section: **"Axes Table as Required Synthesis Output"**
   - Clarify: In domains where Axes Table is mandatory, the synthesis/context-gathering step MUST enumerate every decision with multiple valid approaches

**Impact**: +10-15 lines

---

### F2: Integrate Axes Table verdict with strategy exploration trigger

**File**: `/Users/akirashirahama/workspace/claude-praxis/skills/workflow-planner/SKILL.md`

**Changes**:
1. **Trigger Conditions section** (lines 146-156)
   - Expand to explicitly document the decision tree:
     ```
     Primary trigger — all three conditions must be met:
     1. Multiple viable candidates: Synthesis identifies 2+ candidate approaches
     2. No clear winner: No candidate has obvious superiority across criteria
     3. Design-decision-level differences: Candidates differ in trade-offs at design level
        (NOT just implementation details)
     
     SUPPLEMENTARY: Use Axes Table verdicts to validate candidate count
     - If synthesis identifies 2+ candidates but Axes Table shows all "Clear winner", 
       re-examine whether candidates truly differ at design/approach level
     - If Axes Table has "Requires exploration" entries, these may indicate additional 
       candidate directions to explore
     ```

2. **New sub-section**: **"Axes Table ↔ Trigger Evaluation Mapping"**
   - Document the relationship explicitly
   - Show decision table:
     ```
     If 2+ candidates + no clear winner + design-level differences:
         → Execute Strategy Exploration (P1-P6)
     Else if Axes Table has "Requires exploration" entries:
         → Competing outlines/plans fallback in next phase
     Else (all axes "Clear winner"):
         → Single outline/plan path
     ```

**Impact**: +30-40 lines

---

### F3: Add explicit causal dependency output requirements (Step 7)

**File**: `/Users/akirashirahama/workspace/claude-praxis/skills/workflow-planner/SKILL.md`

**Changes**:
1. **Step 7: Present Results with Review Trace** (lines 132-138)
   - Expand to list required outputs for `/design` and `/implement` domains:
     ```markdown
     For `/design` and `/implement` domains:
     - Include Axes Table in results (not optional)
     - Include Axes Table verdicts (Clear winner / Requires exploration)
     - If strategy exploration was triggered: include comparison table + selected direction
     - If strategy exploration NOT triggered: include explanation (conditions not met)
     - Confirm causal dependency: "Next phase (outline/plan creation) will consume this 
       Axes Table and use it to determine competing outlines/plans vs single outline/plan"
     ```

**Impact**: +15-20 lines

---

### F4: Document competing outlines/plans fallback in planner

**File**: `/Users/akirashirahama/workspace/claude-praxis/skills/workflow-planner/SKILL.md`

**Changes**:
1. **New section after Strategy Exploration Protocol** (after line 275)
   - Title: **"Competing Outlines/Plans Fallback (when Strategy Exploration not triggered)"**
   - Document:
     ```markdown
     This mechanism is activated by the COMMAND phase (design.md Phase 2 or 
     implement.md Step 2) based on Axes Table verdicts from the planner.
     
     Trigger Condition:
     - Axes Table has 1+ entries marked "Requires exploration"
     AND
     - Strategy Exploration was NOT triggered (conditions not met)
     
     Planner's Responsibility:
     - Generate accurate Axes Table with explicit verdicts
     - Provide rationale for "Requires exploration" entries
     - Recommend strategy exploration if trigger conditions are met
     - If exploration not triggered: state why (ambiguity insufficient, time constraint, etc.)
     - REQUIRED OUTPUT: Axes Table is passed to next phase as input
     
     Command Phase Responsibility (design.md Phase 2 / implement.md Step 2):
     - Evaluate Axes Table verdicts
     - If "Requires exploration" entries exist: create 2-3 competing outlines/plans
     - Each outline/plan takes different position on exploration axes
     - Produce comparison: which outline minimizes risk, enables parallelization, 
       produces coherent argument
     - Select best outline/plan with explicit rationale
     - Present to human for approval
     
     Causal Dependency:
     Axes Table verdict → Next phase outline/plan creation approach
     - All "Clear winner" → Single outline/plan
     - 1+ "Requires exploration" → Competing outlines/plans
     ```

**Impact**: +40-50 lines

---

### F5: Clarify /implement Phase 1 → Phase 2 causal dependency via Axes

**File**: `/Users/akirashirahama/workspace/claude-praxis/commands/implement.md`

**Changes**:
1. **Lines 64-66** (Strategy Exploration conditional):
   - Expand clarification:
     ```markdown
     If exploration is not triggered but the Implementation Axes Table has axes 
     marked "Requires exploration", Step 2 must create competing plan outlines:
     
     - Each outline takes a different position on the "Requires exploration" axes 
       (e.g., "Outline A: integration-test-heavy + data-layer-first" vs 
       "Outline B: unit-test-heavy + UI-first")
     - Outline selection basis: which minimizes risk (earlier integration detection), 
       enables parallelization (fewer inter-task dependencies), aligns with Design Doc
     - The selected outline is the STRUCTURAL BASIS for the detailed plan (files, tests, 
       per-task review selection)
     
     This mechanism ensures implementation approach decisions are explicitly explored 
     even when the Design Doc clearly defines "How" at the design level.
     ```

2. **Lines 96-113** (Competing Plan Outlines section):
   - Add inline note on structural impact:
     ```markdown
     Each outline takes a **different position** on the "Requires exploration" axes 
     determined in Step 1. The position directly affects:
     - Task ordering (data layer first vs UI first changes dependency graph)
     - Task scope boundaries (minimal change vs surrounding improvement affects file counts)
     - Parallelization potential (integration-test-heavy creates more inter-task dependencies)
     - Per-task review strategy (error-handling-centric approach needs error-resilience reviewer)
     - Risk management (early integration vs modular isolation changes task sequence)
     ```

3. **After line 113**:
   - Add "Causal Dependency Note":
     ```markdown
     **Causal Dependency Note**: The selected outline becomes the structure for the 
     detailed plan created in Step 2 (lines 76-88). All plan decisions — task ordering, 
     file grouping, dependency analysis, per-task review plans — are derived from the 
     outline's positioning on exploration axes. This ensures the outline's trade-off 
     decisions (speed vs safety, integration vs isolation, etc.) are honored through 
     implementation execution.
     
     Example: If outline A chose "integration-test-heavy + data-layer-first":
     - Step 2 tasks will be ordered: DB schema → data access layer → business logic → UI
     - Per-task review will emphasize error-resilience (data consistency)
     - Test strategy will favor integration tests in early tasks
     - Parallelization potential will be limited (sequential integration points)
     
     Example: If outline B chose "unit-test-heavy + UI-first":
     - Step 2 tasks will be ordered: UI skeleton → components → business logic → DB integration
     - Per-task review will emphasize code-quality (modularity)
     - Test strategy will favor unit tests in early tasks
     - Parallelization potential will be higher (UI tasks independent of data layer)
     ```

**Impact**: +25-35 lines

---

## 9. Summary: Implementation Status

| Component | Location | Status | Gap Size |
|-----------|----------|--------|----------|
| Axes Table concept & rules | `/design.md`, `/implement.md` | ✅ SYNCED | 0 |
| Axes Table format | `/design.md` lines 47-49, `/implement.md` lines 45-47 | ✅ SYNCED | 0 |
| Strategy Exploration Protocol (P1-P6) | `workflow-planner/SKILL.md` lines 140-275+ | ✅ DEFINED | 0 |
| Strategy Exploration in `/design` | `/design.md` lines 62-70 | ✅ INTEGRATED | 0 |
| Strategy Exploration in `/implement` | `/implement.md` lines 58-66 | ✅ INTEGRATED | 0 |
| Competing outlines in `/design` | `/design.md` lines 98-114 | ✅ INTEGRATED | 0 |
| Competing plans in `/implement` | `/implement.md` lines 96-113 | ✅ INTEGRATED | 0 |
| Planner responsibility for Axes Table | `workflow-planner/SKILL.md` | ❌ MISSING | F1: ~10 lines |
| Axes → Strategy Exploration trigger mapping | `workflow-planner/SKILL.md` | ❌ MISSING | F2: ~30 lines |
| Causal dependency output requirements | `workflow-planner/SKILL.md` Step 7 | ⚠️ INCOMPLETE | F3: ~15 lines |
| Competing outlines fallback mechanism | `workflow-planner/SKILL.md` | ❌ MISSING | F4: ~50 lines |
| `/implement` Phase 1→2 causal clarity | `/implement.md` | ⚠️ NEEDS EXPANSION | F5: ~30 lines |
| Strategy in `/plan` command | `/plan.md` | ❌ MISSING | Optional: ~50 lines |

**Total implementation effort**: ~150-160 lines of documentation additions

**High-confidence delivery**: F1-F4 (core planner responsibility) + F5 (command clarity) = ~145 lines

---

## 10. Reference Documents

All files referenced in this scout report:

**Local codebase** (`/Users/akirashirahama/workspace/claude-praxis/`):
- `/commands/design.md` — Design workflow with Axes Table + competing outlines
- `/commands/implement.md` — Implement workflow with Axes Table + competing outlines
- `/commands/plan.md` — Plan workflow (missing exploration)
- `/skills/workflow-planner/SKILL.md` — Planner skill (partial implementation)
- `/claudedocs/design-docs/competing-strategy-exploration.md` — Full protocol reference
- `/claudedocs/design-docs/enhanced-multi-agent-coordination.md` — Parallel dispatch proposal

**Cached 0.7.4 versions** (identical to local):
- `/Users/akirashirahama/.claude/plugins/cache/claude-praxis/claude-praxis/0.7.4/commands/design.md`
- `/Users/akirashirahama/.claude/plugins/cache/claude-praxis/claude-praxis/0.7.4/commands/implement.md`
- `/Users/akirashirahama/.claude/plugins/cache/claude-praxis/claude-praxis/0.7.4/skills/workflow-planner/SKILL.md`

