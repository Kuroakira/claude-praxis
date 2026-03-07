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

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `scope` | Yes | What to guide: a module path, directory, cross-cutting concern name, or "project" for whole-project overview |

## Procedure

### Pass 1: Overview Scan

Dispatch one overview agent (subagent_type: `claude-praxis:scout`) to scan the scope broadly. The agent identifies: entry points (CLI commands, API endpoints, UI routes), major components and their responsibilities, key data flows from entry points through the system, and public interface surfaces. Every finding must reference specific file paths.

**Output**: A structured map of entry points, components, data flows, and their relationships.

### Pass 2: Targeted Deep Dives

Based on Pass 1 findings, dispatch deep-dive agents for the most important data flow paths starting from identified entry points. One agent per path, up to a maximum of 3 (subagent_type: `claude-praxis:scout`). Prioritize by: (1) paths from the primary entry point, (2) paths that touch the most components.

Each deep-dive agent traces the full data flow through the path, reading function bodies and noting: what each step does, why it exists, how it connects to the next step, and what design decisions are visible. Every finding must reference specific file paths and symbol names.

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

- **Agent type**: Uses `claude-praxis:scout` for overview and deep-dive agents (read-only, haiku). Main agent writes the guide
- **Invoked by**: `commands/guide.md`
