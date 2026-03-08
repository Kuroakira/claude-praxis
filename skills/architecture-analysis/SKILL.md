---
name: architecture-analysis
description: Use when analyzing codebase architecture — produces durable Markdown+mermaid reports with structural friction detection. Invoked by /analyze command and as a workflow phase in /design and /implement.
user-invokable: false
---

# Architecture Analysis

Multi-pass codebase analysis that produces a durable architecture report. The report serves as both human understanding material and AI planning input — specifically as required input for Axes Table decisions about structural fitness.

## The Iron Law

```
DRILL TO SOURCE — EVERY FINDING REFERENCES SPECIFIC FILE PATHS AND SYMBOLS
```

No vague claims. Every observation in the report must include a file path (and symbol name where applicable) so the human can verify it by reading the code. The report is a hypothesis document — findings say "this appears to be" rather than "this is."

## Semantic-First Approach

Use Serena's semantic analysis tools as the primary source for structural data. Serena provides LSP-backed precision — symbol hierarchy from `get_symbols_overview`, cross-file reference chains from `find_referencing_symbols`. No guessing from grep patterns.

Scout agents complement Serena with broader context that semantic tools don't capture: directory organization, import conventions, documentation patterns, and architectural intent.

**Division of labor**: Serena (main agent) → structural facts. Scouts → contextual interpretation.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `scope` | Yes | What to analyze: a module path, directory, cross-cutting concern name, or "project" for whole-project analysis |
| `anticipated_changes` | No | What changes are planned (from Design Doc or task description). Enables the structural fitness assessment to evaluate whether the current structure supports these changes |
| `research_context` | No | Findings from prior research phase (in `/design` workflow). When absent (e.g., in `/implement`), analysis relies solely on codebase scanning without external research context |

## Procedure

### Pass 1: Overview Scan

**Step 1a — Semantic Structure (Main Agent, Serena)**

Use Serena's `get_symbols_overview` on key files/directories within the scope to get the precise symbol hierarchy (classes, functions, methods, and their nesting). This provides the structural map.

- Project-wide scope: scan each top-level module/directory
- Module scope: scan all files in the module

The output is a structured symbol map: what symbols exist, where, and how they nest.

**Step 1b — Broad Context (Scout Agent)**

Dispatch one scout agent (subagent_type: `claude-praxis:scout`) with the symbol map from Step 1a as context. The scout adds what Serena doesn't capture: directory organization, import patterns, documentation, config files, and architectural conventions. For each component: note responsibility, key dependencies, and public interface surface. Flag friction signals: high coupling, scattered responsibility, excessive complexity. Every finding must reference specific file paths.

**Output**: A structured list of components (enriched by both Serena symbols and scout observations), their dependencies, and flagged friction areas with severity ratings.

### Pass 2: Targeted Deep Dives

If Pass 1 identifies friction areas, analyze them in depth. One friction area at a time, up to a maximum of 3. Prioritize by severity (highest coupling/complexity first).

If Pass 1 identifies no friction areas, skip Pass 2 entirely. State in the report that no friction areas were detected and proceed to synthesis.

**Step 2a — Reference Chain Analysis (Main Agent, Serena)**

For each friction area, use `find_referencing_symbols` on the relevant symbols to trace precise cross-file dependency chains. This gives exact coupling data: which files reference which symbols, how many callers, and the coupling direction.

**Step 2b — Deep Dive (Scout Agent)**

Dispatch one scout agent per friction area (subagent_type: `claude-praxis:scout`) with the reference chain data from Step 2a. Each agent reads function bodies, traces data flow, and assesses simplification/restructuring opportunities. Every finding must reference specific file paths and symbol names.

### Pass 3: Synthesis

Combine overview and deep-dive findings into a single Markdown report following the Report Structure below. This is done by the main agent (not a subagent).

Key synthesis responsibilities:
- Reconcile findings from multiple deep-dive agents (do they agree? contradict?)
- Produce mermaid diagrams from the raw component/dependency data, applying the Diagram Complexity rule (see `rules/document-quality.md`): each diagram ≤15 nodes, one abstraction level per diagram. If the system has more components, the Architecture Overview diagram shows high-level groups (≤8 nodes) and each group's internals appear as focused diagrams in the Structural Observations section
- Write the mandatory Structural Observations section, including the refactoring assessment
- Write the Confidence Boundary section — explicitly state what was NOT assessed

## Report Structure

The report follows abstract-to-concrete ordering. Each section is mandatory — omitting a section requires explicit justification in the Confidence Boundary.

```markdown
# Architecture Analysis: [Scope Name]

_Generated: [timestamp]. This is a point-in-time snapshot, not a live reference._

## Scope & Approach

What was analyzed, which method was used (overview + N deep dives), and what could NOT be assessed. If scope was automatically narrowed in workflow mode, state the original task and the narrowing rationale.

## Architecture Overview

Component map showing major modules/components and their responsibilities.

[mermaid C4 diagram]

Summary table: component name, responsibility, key dependencies.

## Dependency Structure

How components depend on each other. Highlight circular dependencies if any.

[mermaid flowchart diagram]

## Structural Observations

Friction signals with specific file references. For each observation:
- What was found (with file path + symbol reference)
- Why it matters (coupling risk, complexity cost, maintenance burden)
- Refactoring opportunity: what restructuring would look like and what benefit it would provide

**Structural Fitness Assessment** (mandatory when `anticipated_changes` is provided):
Does the current structure naturally support the anticipated changes, or would restructuring first make the changes simpler? If restructuring is recommended, describe the scope and expected benefit.

## Confidence Boundary

Explicit "assessed / not assessed" scope. Each observation above includes a verifiable reference (file path + symbol) so the human can check. List areas that were out of scope or could not be reliably assessed.
```

## Document Lifecycle

- **Overwrite**: Re-running on the same scope overwrites the existing document (no versioning)
- **Timestamp**: Always include generation timestamp in the report header

## Integration

- **Semantic tools**: Serena MCP (`get_symbols_overview`, `find_referencing_symbols`) for precise symbol hierarchy and cross-file dependency tracing — run by the main agent
- **Exploration agents**: `claude-praxis:scout` for broad context scanning and deep-dive exploration (haiku, read-only)
- **Invoked by**: `commands/analyze.md`, `commands/design.md`, `commands/implement.md`
