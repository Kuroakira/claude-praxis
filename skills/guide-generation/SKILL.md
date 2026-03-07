---
name: guide-generation
description: Use when generating codebase walkthrough guides — produces durable narrative Markdown documents for human understanding. Invoked by /guide command.
user-invokable: false
---

# Guide Generation

Multi-pass codebase exploration followed by single-narrator writing that produces a durable walkthrough guide. The guide serves as a human learning companion — read alongside the code to build understanding step by step.

## The Iron Law

```
DRILL TO SOURCE — EVERY EXPLANATION REFERENCES SPECIFIC FILE PATHS AND SYMBOLS
```

No vague claims. Every code explanation must include a file path and symbol name so the reader can open the code and verify the explanation. The guide is a hypothesis document — explanations say "this appears to handle" rather than "this handles."

## Semantic-First Approach

Use Serena's semantic analysis tools as the primary source for structural data. Serena provides LSP-backed precision — symbol hierarchy from `get_symbols_overview`, cross-file reference chains from `find_referencing_symbols`. No guessing from grep patterns.

Scout agents complement Serena with broader context that semantic tools don't capture: entry point identification, component responsibilities, data flow narrative, directory organization, and architectural intent.

**Division of labor**: Serena (main agent) → structural facts (symbols, references). Scouts → contextual interpretation (what it means, how it flows, why it's designed this way).

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `scope` | Yes | What to guide: a module path, directory, cross-cutting concern name, or "project" for whole-project overview |

## Procedure

### Pass 1: Overview Scan

**Step 1a — Semantic Structure (Main Agent, Serena)**

Use Serena's `get_symbols_overview` on key files/directories within the scope to get the precise symbol hierarchy (classes, functions, methods, and their nesting). This provides the structural map that scouts build upon.

- Project-wide scope: scan each top-level module/directory
- Module scope: scan all files in the module

The output is a structured symbol map: what symbols exist, where, and how they nest.

**Step 1b — Broad Context (Scout Agent)**

Dispatch one scout agent (subagent_type: `claude-praxis:scout`) with the symbol map from Step 1a as context. The scout adds what Serena doesn't capture: entry point identification (CLI commands, API endpoints, UI routes), component responsibilities, key data flows from entry points through the system, directory organization, import patterns, and public interface surfaces. Every finding must reference specific file paths.

**Output**: A structured map of entry points, components, data flows, and their relationships — enriched by both Serena symbols and scout observations.

### Pass 2: Targeted Deep Dives

Based on Pass 1 findings, select the most important data flow paths starting from identified entry points. One path at a time, up to a maximum of 3. Prioritize by: (1) paths from the primary entry point, (2) paths that touch the most components.

**Step 2a — Reference Chain Analysis (Main Agent, Serena)**

For each deep-dive path, use `find_referencing_symbols` on the key symbols along the path to trace precise cross-file reference chains. This gives exact data flow data: which files reference which symbols, how data moves between components, and the coupling direction.

**Step 2b — Deep Dive (Scout Agent)**

Dispatch one scout agent per path (subagent_type: `claude-praxis:scout`) with the reference chain data from Step 2a. Each agent reads function bodies, traces the full data flow through the path, and notes: what each step does, why it exists, how it connects to the next step, and what design decisions are visible. Every finding must reference specific file paths and symbol names.

For "project" scope: deep dives cover only the top-level component interactions, not internal module details. Individual modules are covered by separate `/guide [module]` invocations.

If the scope is small enough that Pass 1 already covers the full data flow, skip Pass 2. State this in the guide's Coverage Boundary.

### Pass 3: Write Guide

The main agent (not a subagent) writes the complete guide using scout findings as input. This pass produces the final document following the Guide Structure below.

Key writing responsibilities:
- Compose the Big Picture section using analogies and plain language
- Structure each focus section following the zoom-in/zoom-out rhythm
- Write return-to-overview transitions between focus sections
- Write the Coverage Boundary section

**Single narrator requirement**: The main agent writes the entire guide to maintain a consistent voice, tone, and level of detail throughout. Do not delegate writing to subagents.

## Guide Structure

The guide follows a zoom-in/zoom-out navigation pattern. The Big Picture section is the "hub" that readers return to between each focused deep dive.

```markdown
# Guide: [Scope Name]

_Generated: [timestamp]. This is a point-in-time snapshot — verify against current code._

## Big Picture

What this system/module does, explained with analogies and plain language. A reader with no prior knowledge of this codebase should finish this section with a mental model of the overall structure. Include a mermaid diagram showing the major components and their relationships.

No code references yet — this section builds the conceptual foundation.

## [Focus Area 1: name derived from primary entry point]

### Where We Are

One sentence placing this focus area in the Big Picture. "Of the [N] components in the diagram above, we're now looking at [X] — the [role]."

### Walkthrough

Step-by-step narrative following the data flow through this area. Each step:
- What it does (plain language, analogies where helpful)
- Where it lives (file path + symbol name)
- Why it's designed this way (if visible from the code)

### Back to the Big Picture

One paragraph reconnecting to the overall system. "Now that we've seen how [X] works, we know that [insight]. Next, we'll look at [Y], which receives [X]'s output and..."

## [Focus Area 2: next area along data flow]

### Where We Are
### Walkthrough
### Back to the Big Picture

[Repeat for each focus area]

## Coverage Boundary

What this guide covers and what it does not. List:
- Components/paths explored (with file references)
- Components/paths NOT explored (and why — scope limit, exploration depth, or out of scope)
- Suggested next guides: `/guide [specific-module]` for areas not covered in depth
```

## Document Lifecycle

- **Overwrite**: Re-running on the same scope overwrites the existing document (no versioning)
- **Timestamp**: Always include generation timestamp in the guide header

## Integration

- **Semantic tools**: Serena MCP (`get_symbols_overview`, `find_referencing_symbols`) for precise symbol hierarchy and cross-file reference tracing — run by the main agent
- **Exploration agents**: `claude-praxis:scout` for broad context scanning and deep-dive exploration (haiku, read-only). Main agent writes the guide
- **Invoked by**: `commands/guide.md`
