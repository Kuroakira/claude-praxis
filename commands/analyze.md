---
name: analyze
description: >-
  Analyze codebase architecture — produces a durable Markdown+mermaid report with structural
  friction detection and refactoring opportunities.
  TRIGGER when: user asks to analyze, understand, or examine the architecture of code —
  a module, directory, concern, or the whole project.
  Also invoked as a workflow phase within /design and /implement (see those commands).
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

## Step 2: Run Analysis

Invoke `architecture-analysis` skill with:

| Parameter | Value |
|-----------|-------|
| `scope` | The scope from Step 1 |
| `anticipated_changes` | If the user mentioned planned changes, include them. Otherwise omit |
| `research_context` | Omit (standalone mode has no prior research phase) |

The skill executes the multi-pass analysis (overview → targeted deep dives → synthesis) and produces the report.

## Step 3: Save and Present

1. Save the report to `claudedocs/analysis/[scope-name].md` (kebab-case derived from scope)
2. If a report already exists at that path, overwrite it (no versioning — latest analysis only)
3. Present the report to the user with a brief summary of key findings:
   - Number of components identified
   - Friction areas found (if any)
   - Refactoring opportunities (if any)
   - What was NOT assessed (from Confidence Boundary)

The report is now available for the user to read and for subsequent `/design` or `/implement` workflows to consume as input.
