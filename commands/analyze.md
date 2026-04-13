---
name: analyze
description: >-
  Analyze codebase architecture — produces a durable Markdown+mermaid report with structural
  friction detection and refactoring opportunities.
  Supports --thorough mode for comprehensive debt inventory with staged interaction.
  TRIGGER when: user asks to analyze, understand, or examine the architecture of code —
  a module, directory, concern, or the whole project.
  Also invoked as a workflow phase within /design and /plan (see those commands).
disable-model-invocation: false
---

Run the **Architecture Analysis** workflow.

This command produces a durable architecture report saved to `claudedocs/analysis/[scope-name].md`. The report serves as both human understanding material and AI planning input.

## Step 1: Determine Scope

Ask the user what to analyze if not already specified. Scope can be:
- A module or directory (e.g., "the hooks system", "skills/workflow-planner")
- A cross-cutting concern (e.g., "how review dispatch works across commands")
- The whole project ("project")

If the user has already specified the scope (e.g., `/analyze hooks`), proceed directly.

Check for `--thorough` flag. If present, set mode to `thorough`. If an unrecognized flag is provided, warn and proceed with normal mode:

> ⚠️ Unrecognized flag '[value]'. Proceeding with normal mode.

## Step 1b: Architecture Health Scan (TypeScript only — mandatory when tsconfig.json exists)

If `tsconfig.json` exists at the project root, run a quantitative health scan before the qualitative analysis:

Call `mcp__plugin_sekko-arch_sekko-arch__scan` with the project path. If the scope from Step 1 targets specific directories, pass the `include` filter matching those directories. This returns per-dimension grades with file-level detail in both normal and thorough modes.

Extract the results:
- Dimensions scoring D or F are quantitative friction signals — carry these into Step 2 as `health_scores` context
- If no D/F dimensions: note `health_scores: no issues detected`

If `tsconfig.json` is absent, skip silently and note in the report's Confidence Boundary: "Quantitative architecture health scoring was not assessed (project does not use TypeScript)."

## Step 2: Run Analysis

Pass the `health_scores` from Step 1b to the skill. If the skill's Step 1e produces its own health scan, the command-level results take precedence (avoid redundant calls).

**Normal mode**: Invoke `architecture-analysis` skill with:

| Parameter | Value |
|-----------|-------|
| `scope` | The scope from Step 1 |
| `anticipated_changes` | If the user mentioned planned changes, include them. Otherwise omit |
| `research_context` | Omit (standalone mode has no prior research phase) |
| `health_scores` | Results from Step 1b (D/F dimensions, grades, and file-level detail in thorough mode). Omit if Step 1b was skipped |

The skill executes the multi-pass analysis (overview → targeted deep dives → synthesis) and produces the report. Proceed to Step 3.

**Thorough mode (Phase 1)**: Invoke `architecture-analysis` skill with:

| Parameter | Value |
|-----------|-------|
| `scope` | The scope from Step 1 |
| `anticipated_changes` | Same as normal mode |
| `mode` | `thorough` |
| `thorough_config` | `{ registry_prefix: "analysis-thorough-registry:", phase: 1 }` |
| `health_scores` | Results from Step 1b. Omit if Step 1b was skipped |

The skill runs Pass 1 (overview scan + Debt Inventory) and returns without Pass 2/3. Proceed to Step 2b.

## Step 2b: Select Items for Deep Dive (Thorough Mode Only)

After Phase 1 completes:

1. Save the Phase 1 report to `claudedocs/analysis/[scope-name]-thorough.md`
2. Present the Debt Inventory Table to the user
3. **PAUSE** — ask the user to select which items to deep-dive:

> "Debt inventory generated with [N] items. Select items for detailed analysis (by number or name), or 'all' for comprehensive analysis."

Wait for user selection before proceeding.

## Step 2c: Run Deep Dives (Thorough Mode Only)

After user selection, invoke `architecture-analysis` skill again with:

| Parameter | Value |
|-----------|-------|
| `scope` | Same as Phase 1 |
| `anticipated_changes` | Same as Phase 1 |
| `mode` | `thorough` |
| `thorough_config` | `{ registry_prefix: "analysis-thorough-registry:", phase: 2, selected_items: [user selection] }` |

The skill runs Pass 2 (deep dives on selected items), Pass 3 (synthesis), and Pass 3b (registry). The skill appends Phase 2 results to the existing report.

## Step 2.5: Pattern Consideration (mandatory)

After architecture-analysis produces its report (Normal mode: after Step 2; Thorough mode: after Step 2c), read `catalog/structural-pattern-review-points.md` and evaluate the analysis report's Structural Observations and friction areas for design pattern applicability. For each category in the catalog, check whether the friction signals, coupling issues, or complexity findings match the recognition signal. Report:

- **Pattern opportunities**: where a design pattern would reduce structural friction identified in the analysis (e.g., "Structural Observations identified scattered type-dispatching in `src/handlers/` with high coupling — 1-1 applies, Polymorphism would consolidate")
- **Inconsistent pattern usage**: where the analysis revealed a pattern partially applied (e.g., "Factory used in `src/auth/` but manual instantiation in `src/payments/` noted as friction")

If no opportunities are found, note "Pattern consideration: no opportunities detected."

Append a `## Pattern Opportunities` section to the saved analysis report (after the Structural Observations section). For each opportunity, reference the specific catalog point ID (e.g., "1-1"), the friction finding it addresses, and the suggested pattern direction.

## Step 3: Save and Present

**Normal mode**:

1. Save the report to `claudedocs/analysis/[scope-name].md` (kebab-case derived from scope)
2. If a report already exists at that path, overwrite it (no versioning — latest analysis only)
3. Present the report to the user with a brief summary of key findings:
   - Number of components identified
   - Friction areas found (if any)
   - Pattern opportunities (if any)
   - Refactoring opportunities (if any)
   - What was NOT assessed (from Confidence Boundary)

**Thorough mode**:

The report at `claudedocs/analysis/[scope-name]-thorough.md` is already assembled by the skill (Phase 1 saved in Step 2b, Phase 2 appended in Step 2c). Present the report to the user with a summary:
   - Number of debt items identified (from Phase 1 inventory)
   - Number of items analyzed in detail (from Phase 2 deep dives)
   - Key findings from deep dives
   - Pattern opportunities (if any)
   - What was NOT assessed (from Confidence Boundary)

The report is now available for the user to read and for subsequent `/design` or `/plan` workflows to consume as input.
