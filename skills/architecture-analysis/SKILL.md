---
name: architecture-analysis
description: Use when analyzing codebase architecture — produces durable Markdown+mermaid reports with structural friction detection. Supports code-centric, document-centric, and mixed projects via auto-detection. Invoked by /analyze command and as a workflow phase in /design and /implement.
user-invokable: false
---

# Architecture Analysis

Multi-pass codebase analysis that produces a durable architecture report. The report serves as both human understanding material and AI planning input — specifically as required input for Axes Table decisions about structural fitness.

## The Iron Law

```
DRILL TO SOURCE — EVERY FINDING REFERENCES SPECIFIC FILE PATHS AND SYMBOLS
```

No vague claims. Every observation in the report must include a file path (and symbol name where applicable) so the human can verify it by reading the code. The report is a hypothesis document — findings say "this appears to be" rather than "this is."

## Analysis Methods

Three methods, each with scope-appropriate strengths. The content-type detection in Step 1a determines which methods apply.

- **Serena** (code scopes): LSP-backed precision — symbol hierarchy from `get_symbols_overview`, cross-file reference chains from `find_referencing_symbols`. The primary structural data source for code.
- **Grep patterns** (document scopes): Deterministic cross-reference scanning — 9 validated regex patterns detect typed relationships between Markdown files. The primary structural data source for documents.
- **Scouts** (all scopes): Broad context that structural tools don't capture — directory organization, naming conventions, architectural intent. Scouts receive structural data (Serena symbols or Grep references) as context to enrich their exploration.

Each method operates on different content types. Grep does not replace Serena — code scopes use Serena, document scopes use Grep, mixed scopes use both.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `scope` | Yes | What to analyze: a module path, directory, cross-cutting concern name, or "project" for whole-project analysis |
| `anticipated_changes` | No | What changes are planned (from Design Doc or task description). Enables the structural fitness assessment to evaluate whether the current structure supports these changes |
| `research_context` | No | Findings from prior research phase (in `/design` workflow). When absent (e.g., in `/implement`), analysis relies solely on codebase scanning without external research context |
| `mode` | No | `normal` (default) or `thorough`. Controls analysis depth and report structure. When absent or unrecognized, defaults to `normal` with a warning for unrecognized values |
| `thorough_config` | No | Configuration for thorough mode (present only when `mode=thorough`). Contains: `registry_prefix` (string, e.g. `analysis-thorough-registry:`), `phase` (`1` or `2`), `selected_items` (list of debt items, Phase 2 only) |

### Mode Fallback

If `mode` is provided but not `normal` or `thorough`, emit a warning and proceed with `normal` mode:

> ⚠️ Unrecognized mode '[value]'. Falling back to normal mode.

## Procedure

### Pre-step: Session Cache (Optional)

If the `session-cache:session-cache-protocol` skill is available, invoke it before starting file reads. This reduces redundant file reads when the same scope has been partially read earlier in the session. If unavailable, proceed without — this step is an optimization, not a requirement.

### Pre-check: Registry Lookup

Before running the full analysis, check Serena memory for a recent analysis of the same scope. Determine the registry prefix: use `thorough_config.registry_prefix` when provided, otherwise use `analysis-registry:`. Use `list_memories` and look for entries with this prefix. For each matching entry, `read_memory` to get the value (`[timestamp]|[report-path]`). If an entry exists where the entry's normalized scope contains the current scope, the timestamp is within 24 hours, and the report file exists — read and return the existing report. Skip Pass 1-3.

If no matching entry is found, if Serena memory is unavailable, or if the report file does not exist, proceed with the full analysis (Pass 1-3 + 3b).

### Pass 1: Overview Scan

**Step 1a — Semantic Structure + Content-Type Detection (Main Agent)**

Use Serena's `get_symbols_overview` on key files/directories within the scope to get the precise symbol hierarchy (classes, functions, methods, and their nesting). This provides the structural map.

- Project-wide scope: scan each top-level module/directory
- Module scope: scan all files in the module

After the Serena probe, classify each directory in the scope by content type. Two binary checks per directory:

1. Did Serena return code symbols (classes, functions, methods — not headers)?
2. Do `.md` files exist in this directory (check via Glob)?

Classification:

| Code symbols? | `.md` files? | Content type |
|---|---|---|
| Yes | No | `code` |
| No | Yes | `document` |
| Yes | Yes | `mixed` |
| No | No | `code` (fallback) |

Record the per-directory classification. It determines which downstream steps execute: `code` scopes follow the existing analysis path unchanged. `document` and `mixed` scopes activate additional steps (Step 1d, extended Step 1c, adapted Step 2a).

The output is a structured symbol map (from Serena) and a content-type classification per directory.

**Step 1b — Broad Context (Scout Agent)**

Dispatch one scout agent (subagent_type: `claude-praxis:scout`) with the symbol map from Step 1a as context. The scout adds what Serena doesn't capture: directory organization, import patterns, documentation, config files, and architectural conventions. For each component: note responsibility, key dependencies, and public interface surface. Flag friction signals: high coupling, scattered responsibility, excessive complexity. Every finding must reference specific file paths.

**Output**: A structured list of components (enriched by both Serena symbols and scout observations), their dependencies, and flagged friction areas with severity ratings.

**Step 1d — Document Reference Scan (Main Agent, Grep)**

Runs only when Step 1a classified any directory as `document` or `mixed`. Skipped entirely for `code`-only scopes.

Step 1d executes before Step 1c (non-alphabetical order) because Step 1c's document debt assessment requires the reference graph produced here. Without this data, orphaned files and broken references cannot be detected.

Scan all `.md` files in `document` and `mixed` directories using these 9 validated Grep patterns:

| Pattern | Regex | Detects |
|---|---|---|
| @import rules | `^@rules/` | Rule imports in CLAUDE.md |
| Skill invocations | ``Invoke\s+`[a-z-]+` `` | Skill calls in commands/skills |
| Agent type references | `claude-praxis:[a-z]+` | Agent dispatch references |
| Catalog references | `catalog/[a-z]+\.md` | Catalog file references |
| Skill-to-skill deps | `Invoked by` | Explicit invocation metadata |
| Rule references | `rules/[a-z-]+\.md` | Rule file references |
| File path references | `claudedocs/` | Output/analysis path references |
| Progress references | `progress\.md` | Progress file data flow |
| Analysis registry | `analysis-registry:` | Registry key references |

For each match, extract a triple: (source file, target entity, pattern type). Map each pattern type to one of 5 semantic relationship types:

| Relationship type | Meaning | Included patterns |
|---|---|---|
| **invokes** | A triggers B's execution | Skill invocations, skill-to-skill deps |
| **dispatches** | A delegates execution to B | Agent type references |
| **constrains** | A limits B's behavior | @import rules, rule references |
| **selects-from** | A picks from B's entries | Catalog references |
| **records/reads** | A writes to / reads from B | File path references, progress references, analysis registry |

After scanning, validate each target: does the referenced file or section exist? Flag unresolvable targets as broken references.

**Output**: A set of typed reference triples, relationship counts per type, and a list of broken references. This data feeds Step 1c (document debt) and Pass 3 (synthesis).

**Step 1c — Debt Inventory (Thorough Mode, Phase 1 only)**

When `mode=thorough` and `thorough_config.phase=1`, generate a comprehensive debt inventory after Steps 1a and 1b. This step runs in the same agent context as Steps 1a/1b (shared Serena data avoids re-reading).

For each friction area identified (no 3-area limit in thorough mode), use Serena's `find_referencing_symbols` to collect preliminary impact metrics:

- Affected file count
- Reference count (callers)
- Coupled module count

Output a fixed-column Markdown table (the Debt Inventory Table):

| Item | Description | Affected Files | Reference Count | Coupled Modules | Refactoring Direction |
|------|-------------|---------------|-----------------|-----------------|----------------------|

When the scope includes `document` or `mixed` directories, add document-specific debt items to the Debt Inventory Table using Step 1d's reference data:

- **Orphaned files**: `.md` files with zero incoming references in the relationship graph — no other file invokes, dispatches, constrains, selects-from, or records/reads them
- **Metadata gaps**: Files missing expected metadata (e.g., skills without `Invoked by`, commands without skill invocation patterns)
- **Broken references**: Targets in Step 1d output that could not be resolved to existing files or sections
- **Circular reference chains**: Cycles detected in the typed relationship graph (e.g., skill A invokes skill B which invokes skill A)

These categories appear alongside code debt items in the same Debt Inventory Table. For document debt, use reference count from the relationship graph as the impact metric.

After the Debt Inventory Table is complete, skip Pass 2, Pass 3, and Pass 3b. Phase 1 produces an incomplete report (inventory only, no synthesis) — registering it would serve a partial report to downstream consumers expecting a full analysis. The command will PAUSE for user selection, then re-invoke with Phase 2.

### Pass 2: Targeted Deep Dives

**Normal mode**: If Pass 1 identifies friction areas, analyze them in depth. One friction area at a time, up to a maximum of 3. Prioritize by severity (highest coupling/complexity first). If Pass 1 identifies no friction areas, skip Pass 2 entirely. State in the report that no friction areas were detected and proceed to synthesis.

**Thorough mode (Phase 2)**: When `mode=thorough` and `thorough_config.phase=2`, analyze the items specified in `thorough_config.selected_items` instead of friction areas. No cap on number of items — scope is controlled by the human's selection. If the Phase 1 report file does not exist, emit a warning and proceed with a fresh Pass 1 (normal overview scan) before deep dives. The fresh scan provides background context — the selected items are analyzed regardless of whether the fresh scan identifies them as friction areas.

**Step 2a — Reference Chain Analysis (Main Agent)**

For `code` scopes: use Serena's `find_referencing_symbols` on the relevant symbols to trace precise cross-file dependency chains. This gives exact coupling data: which files reference which symbols, how many callers, and the coupling direction.

For `document` and `mixed` scopes: use Grep-based reference chain tracing from Step 1d data. Starting from a file identified as a friction point, trace all incoming and outgoing references by relationship type. Follow typed edges (invokes, dispatches, constrains, selects-from, records/reads) to build the dependency chain. This provides the equivalent of Serena's cross-file chains but for document content.

**Step 2b — Deep Dive (Scout Agent)**

Dispatch one scout agent per friction area (subagent_type: `claude-praxis:scout`) with the reference chain data from Step 2a. Each agent reads function bodies, traces data flow, and assesses simplification/restructuring opportunities. Every finding must reference specific file paths and symbol names.

### Pass 3: Synthesis

Combine overview and deep-dive findings into a single Markdown report following the Report Structure below. This is done by the main agent (not a subagent).

Key synthesis responsibilities:
- Reconcile findings from multiple deep-dive agents (do they agree? contradict?)
- Produce mermaid diagrams from the raw component/dependency data, applying the Diagram Complexity rule (see `rules/document-quality.md`): each diagram ≤15 nodes, one abstraction level per diagram. If the system has more components, the Architecture Overview diagram shows high-level groups (≤8 nodes) and each group's internals appear as focused diagrams in the Structural Observations section
- When Step 1d ran: construct the "Document Relationships" report section from the reference data. Build a Mermaid relationship graph with files as nodes and typed edges. Apply the diagram complexity rule — if the graph exceeds 15 nodes, split into focused diagrams by abstraction level (e.g., one per layer or per relationship type). Graph construction belongs here (not in Step 1d) because grouping decisions require the full picture from all passes
- Write the mandatory Structural Observations section, including the refactoring assessment
- Write the Confidence Boundary section — explicitly state what was NOT assessed

### Pass 3b: Register Analysis

After synthesis, register the completed analysis in Serena memory so downstream commands can discover it without re-running the full analysis.

**Step 1 — Determine normalized scope**: Collect the list of directories and files actually analyzed in Pass 1-3 (not the original scope string from the command). Sort alphabetically and join with commas. Example: `commands/,skills/architecture-analysis/,skills/guide-generation/`

**Step 2 — Write registry entry**: Determine the registry prefix: use `thorough_config.registry_prefix` when provided, otherwise use `analysis-registry:`. Use `write_memory` with:
- **Key**: `[registry-prefix][normalized-scope]` (e.g., `analysis-registry:commands/,skills/architecture-analysis/` or `analysis-thorough-registry:commands/,skills/architecture-analysis/`)
- **Value**: `[ISO-8601-timestamp]|[report-file-path]` (e.g., `2026-03-08T14:30:00Z|claudedocs/analysis/analysis-reuse-pipeline.md`)

If `write_memory` fails, proceed silently — registry is an optimization, not a requirement.

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

## Document Relationships

_This section is present only when Step 1d (Document Reference Scan) was executed._

How documents reference each other through typed relationships.

### Reference Summary

| Relationship Type | Count | Description |
|---|---|---|
| invokes | N | Command/skill procedural triggers |
| dispatches | N | Agent delegation |
| constrains | N | Rule enforcement |
| selects-from | N | Catalog lookups |
| records/reads | N | Data flow through shared files |

### Relationship Graph

[mermaid flowchart: files as nodes, typed edges, ≤15 nodes per diagram]

### Consistency Findings

- Broken references: [targets that could not be resolved]
- Orphaned files: [.md files with zero incoming references]
- Metadata gaps: [files missing expected metadata]

## Structural Observations

Friction signals with specific file references. For each observation:
- What was found (with file path + symbol reference)
- Why it matters (coupling risk, complexity cost, maintenance burden)
- Refactoring opportunity: what restructuring would look like and what benefit it would provide

**Structural Fitness Assessment** (mandatory when `anticipated_changes` is provided):
Does the current structure naturally support the anticipated changes, or would restructuring first make the changes simpler? If restructuring is recommended, describe the scope and expected benefit.

## Debt Inventory (Thorough Mode)

_This section is present only in thorough-mode reports._

[Debt Inventory Table from Phase 1]

## Impact Assessment (Thorough Mode)

_This section is present only when Phase 2 deep dives have been completed._

For each selected item:
- Detailed reference chain analysis
- Coupling depth assessment (beyond Phase 1's "breadth" metrics)
- Specific refactoring recommendations with scope estimate

## Confidence Boundary

Explicit "assessed / not assessed" scope. Each observation above includes a verifiable reference (file path + symbol) so the human can check. List areas that were out of scope or could not be reliably assessed.
```

## Document Lifecycle

- **Overwrite**: Re-running on the same scope overwrites the existing document (no versioning)
- **Timestamp**: Always include generation timestamp in the report header

## Integration

- **Semantic tools**: Serena MCP (`get_symbols_overview`, `find_referencing_symbols`) for precise symbol hierarchy and cross-file dependency tracing — code scopes, run by the main agent
- **Grep patterns**: 9 validated regex patterns for document cross-reference detection — document/mixed scopes, used in Step 1d
- **Analysis registry**: Serena MCP (`list_memories`, `read_memory`, `write_memory`) for registry lookup (Pre-check) and registration (Pass 3b)
- **Exploration agents**: `claude-praxis:scout` for broad context scanning and deep-dive exploration (haiku, read-only)
- **Session cache**: `session-cache:session-cache-protocol` skill (optional) — reduces redundant file reads across agents when available
- **Invoked by**: `commands/analyze.md`, `commands/design.md`, `commands/implement.md`
