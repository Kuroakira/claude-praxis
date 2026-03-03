# Progress

## 2026-03-03 — /claude-praxis:design: Research complete — Competing Outlines Activation Fix
- Decision: Root cause is workflow-planner SKILL.md spec gaps (Axes Table generation, trigger mapping, fallback), not phase detection or architecture redesign
- Decision: Rejected shared Skill extraction (prior design doc Alternative C), /plan overhaul (functional redundancy with /implement Phase 1), weighted scoring (over-engineering for advisory-only), LLM classification (latency/cost/non-determinism)
- Decision: Phase detection fix is pattern reorder + compound patterns, not weighted scoring
- Rationale: DA review revealed outline conflated "documentation is incomplete" with "architecture needs redesigning." F1-F5 fixes to SKILL.md are the actual root cause
- Domain: workflow-planner, phase-detection, competing-outlines

## 2026-03-03 — /claude-praxis:design: Design Doc written — Competing Outlines Activation Fix
- Decision: 5 Design Decisions — (1) Axes Table generation in planner Step 1, (2) Trigger evaluation mapping decision tree, (3) Competing outlines fallback procedure, (4) Phase detection pattern reorder, (5) Advisory message enhancement
- Rationale: Causal dependency principle (learning #1) drives DD1-DD3 — Axes Table as required input for Step 4. DD4-DD5 are low-cost improvements to advisory system
- Domain: workflow-planner, phase-detection, competing-outlines

## 2026-03-03 — /claude-praxis:implement: Task 1 complete — DD1-DD3 workflow-planner SKILL.md enhancement
- Decision: Added Axes Table as MANDATORY substep in Step 1 with structured column definitions
- Decision: Added "Axes Table → Exploration Decision Tree" as 4-branch evaluation logic under Trigger Conditions
- Decision: Added "Competing Outlines Fallback" section with domain-specific outline format (design → document outlines, implement → plan skeletons)
- Decision: Axes Table added to both Step 5 (Present Plan) and Step 7 (Present Results) output requirements
- Rationale: Axes Table as required input (causal dependency) structurally prevents the planner from skipping exploration evaluation. Decision tree maps verdicts to concrete plan structures
- Domain: workflow-planner, competing-outlines

## 2026-03-03 — /claude-praxis:implement: Task 2 complete — DD4-DD5 phase-detect.ts improvement
- Decision: Extracted pure logic to hooks/src/lib/phase-patterns.ts (testable module), left hooks/src/phase-detect.ts as thin I/O wrapper
- Decision: Implemented compound overrides (checked before individual patterns) — implement override ordered first because "Design Doc に従って実装プラン" is more common than "Create a design doc for implementation"
- Decision: Reordered PHASE_PATTERNS array: implement BEFORE design to reduce false design matches
- Decision: Added description field to PhasePattern and formatOutput with " — " separator
- Rationale: Top-level await in phase-detect.ts prevents direct import for testing. Compound overrides solve multi-phase ambiguity without weighted scoring overhead. Array ordering + overrides = 2 layers of disambiguation
- Domain: phase-detection, hooks

## 2026-03-03 — /claude-praxis:implement: Final review complete
- Decision: Documented compound override ordering trade-off as known ambiguity — "Create a design doc for the implementation" resolves to implement (not design)
- Decision: Added explicit tests for known ambiguities with comments explaining the trade-off rationale
- Rationale: Regex cannot disambiguate semantic intent when both "design doc" and "implement" keywords appear. Advisory-only system means misclassification has limited impact. Tests document the behavior as intentional, not accidental
- Learning: When implementing advisory-only systems with known false positive/negative trade-offs, document the trade-off in code comments AND test expectations. This prevents future contributors from "fixing" the intentional behavior
- Domain: phase-detection, testing, trade-off-documentation
