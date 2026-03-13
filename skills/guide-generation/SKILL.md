---
name: guide-generation
description: Use when generating codebase walkthrough guides — produces durable HTML book output (multi-page folder with navigation) for human understanding. Invoked by /guide command.
user-invokable: false
---

# Guide Generation

Multi-pass codebase exploration followed by single-narrator writing that produces a durable walkthrough guide as a multi-page HTML book. The guide serves as a human learning companion — read alongside the code to build understanding step by step. mermaid diagrams render as interactive visuals, code blocks get syntax highlighting, and hub-and-spoke navigation lets readers zoom in and out of focus areas.

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

### Pre-step: Session Cache (Optional)

If the `session-cache:session-cache-protocol` skill is available, invoke it before starting file reads. This reduces redundant file reads when the same scope has been partially read earlier in the session. If unavailable, proceed without — this step is an optimization, not a requirement.

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

Based on Pass 1 findings, select the most important data flow paths starting from identified entry points. One path at a time, up to a maximum of 5. Prioritize by: (1) paths from the primary entry point, (2) paths that touch the most components.

**Step 2a — Reference Chain Analysis (Main Agent, Serena)**

For each deep-dive path, use `find_referencing_symbols` on the key symbols along the path to trace precise cross-file reference chains. This gives exact data flow data: which files reference which symbols, how data moves between components, and the coupling direction.

**Step 2b — Deep Dive (Scout Agent)**

Dispatch one scout agent per path (subagent_type: `claude-praxis:scout`) with the reference chain data from Step 2a. Each agent reads function bodies, traces the full data flow through the path, and notes: what each step does, why it exists, how it connects to the next step, and what design decisions are visible. Every finding must reference specific file paths and symbol names.

For "project" scope: deep dives cover top-level component interactions and important internal implementation patterns that reveal design intent. Show how key components work internally (e.g., the main processing logic, critical algorithms, state management) — not just their public interfaces. Individual modules can still be explored in more depth via separate `/guide [module]` invocations.

If the scope is small enough that Pass 1 already covers the full data flow, skip Pass 2. State this in the guide's Coverage Boundary.

### Pass 3: Write Guide (HTML Book)

The main agent (not a subagent) writes the complete guide as a multi-page HTML book using scout findings as input. This pass produces the output folder following the HTML Page Structure below.

Key writing responsibilities:
- **Locate assets**: Use Glob with pattern `**/guide-generation/assets/style.css` to find the skill's asset directory. This resolves the correct path whether claude-praxis is the current project or installed as a plugin
- **Copy CSS**: Copy the located `style.css` to the output folder using bash `cp` — do not generate CSS manually
- **Embed head**: Read the located `head.html` from the same assets directory and use its content as the `<head>` for every HTML page, replacing `{{TITLE}}` with the page title (e.g., `Guide: [Scope Name]` for index, `[Focus Area Name]` for chapters)
- Write `index.html` (Big Picture hub page) using analogies and plain language
- Write each chapter page (`NN-[focus-area].html`) following the zoom-in/zoom-out rhythm
- Include mermaid diagrams as `<div class="mermaid">` blocks (rendered client-side)
- Include code references as `<pre><code class="language-[lang]">` blocks (highlighted client-side)
- Write navigation elements (sidebar TOC, prev/next links, "Back to the Big Picture" links)
- Write the Coverage Boundary section in the last chapter or as a dedicated page
- Optionally generate concept visuals via image generation MCP (see below)

**Single narrator requirement**: The main agent writes the entire guide to maintain a consistent voice, tone, and level of detail throughout. Do not delegate writing to subagents.

**Short guide rule**: If the scope has 2 or fewer Focus Areas, write a single `index.html` containing all content (no chapter split). The sidebar TOC links to sections within the same page via anchor links. The style.css is still copied separately.

### Content Density Requirements

Guides must feel information-rich. Prose alone is thin — density comes from real codebase examples, structured comparisons, visual callouts, and design rationale interspersed with narrative.

**Show real code from the codebase**: Every code example must come from the actual codebase being documented — not hypothetical illustrations. Include the file path as a comment or preceding text so readers can open the file alongside the guide. Show the code, then explain what it does and why.

**One concept, one code example**: After each concept explanation (2-3 sentences), include a code example (3-15 lines) showing the actual implementation, interface, or pattern. Mark the "point" of each example with a comment. Larger examples (up to 25 lines) are acceptable when showing a complete data flow path or critical algorithm.

**Type signatures and interfaces**: Display public interfaces and key types in dedicated code blocks. Include not just the signatures but brief inline annotations explaining non-obvious fields or parameters. Types are the most information-dense elements — readers can infer behavior from them.

**Comparison tables**: Use `<table>` for component responsibilities, pattern tradeoffs, "what vs why vs where" breakdowns, or cross-component relationship maps. Tables compress information more than bullet lists. Use them liberally.

**Callout boxes**: Use `<div class="callout callout-note/warning/tip">` for:
- Gotchas discovered during deep dives (warning)
- Design decisions that surprised you or are non-obvious (note)
- Practical tips for working with the code (tip)
- "Why not X?" explanations for rejected alternatives (note)

**Before/After pairs**: For design decisions, show the naive approach, then the actual approach, then explain why the actual is better.

**Progressive complexity**: Start with the simplest happy path through each component. Then layer in error handling, edge cases, and optimizations.

**Cross-references with context**: When one component depends on another, show the specific integration point — the function call, the import, the shared type. Don't just say "A uses B"; show how.

**Mermaid diagram structure** (mirrors document hierarchy):
- **Big Picture (index.html)**: One overview diagram showing high-level components (5-8 nodes max). Each node represents a Focus Area or major component — no internal details
- **Chapter pages**: Focused diagrams showing internals of that chapter's focus area (up to 15 nodes). These drill into the abstract nodes from the overview
- **Never**: A single diagram trying to show the entire system at full detail. If a chapter's diagram exceeds 15 nodes, split the chapter or raise the abstraction level of the diagram
- The diagram hierarchy matches the guide's zoom-in/zoom-out navigation: overview diagram → chapter diagram → code examples

**Minimum density targets** (MUST — not aspirational):
- Each chapter page must have at least 4 code examples, 2 tables, and 2 callouts
- The Big Picture (index.html) must have at least 1 mermaid diagram (high-level overview, ≤8 nodes), 1 comparison table, and 1 code example showing a representative interaction
- No section of 2+ paragraphs without a code example, table, diagram, or callout breaking up the prose
- Every chapter must include at least 1 "Design Decision" callout explaining why something is built the way it is
- Every chapter must include at least 1 relationship table showing how the focus area connects to other components

## HTML Page Structure

The guide follows a zoom-in/zoom-out navigation pattern expressed as a multi-page HTML book. The `index.html` (Big Picture) is the hub that readers navigate to and from between each focused chapter.

### Output folder

```
claudedocs/guides/[scope-name]/
├── index.html              # Big Picture (hub page)
├── 01-[focus-area].html    # Chapter 1 (spoke page)
├── 02-[focus-area].html    # Chapter 2 (spoke page)
├── ...
├── style.css               # Shared stylesheet (copied from assets/style.css)
└── images/                 # Optional: generated concept visuals
```

### index.html (Big Picture)

```html
<!DOCTYPE html>
<html lang="en">
<!-- Set lang attribute to match the guide's language (e.g., lang="ja" for Japanese) -->
<!-- <head> content: Read from assets/head.html, replace {{TITLE}} with "Guide: [Scope Name]" -->
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <nav class="sidebar" aria-label="Guide navigation">
    <h2>[Scope Name]</h2>
    <ul>
      <li><a href="index.html" class="active">Big Picture</a></li>
      <li><a href="01-[focus].html">[Focus Area 1]</a></li>
      <li><a href="02-[focus].html">[Focus Area 2]</a></li>
      <!-- ... -->
    </ul>
  </nav>
  <main id="main-content" class="content">
    <h1>Guide: [Scope Name]</h1>
    <p class="meta">Generated: [timestamp]. This is a point-in-time snapshot — verify against current code.</p>

    <h2>Big Picture</h2>
    <!-- What this system/module does, explained with analogies and plain language.
         A reader with no prior knowledge of this codebase should finish this section
         with a mental model of the overall structure.
         No code references yet — this section builds the conceptual foundation. -->

    <div class="mermaid">
    graph LR
      %% Major components and their relationships
    </div>

    <!-- Chapter links as a navigable list -->
    <h2>Focus Areas</h2>
    <ol>
      <li><a href="01-[focus].html">[Focus Area 1]</a> — [one-sentence summary]</li>
      <li><a href="02-[focus].html">[Focus Area 2]</a> — [one-sentence summary]</li>
    </ol>

    <h2>Coverage Boundary</h2>
    <ul>
      <li><strong>Covered</strong>: [components/paths explored, with file references]</li>
      <li><strong>Not covered</strong>: [components/paths NOT explored, and why]</li>
      <li><strong>Suggested next</strong>: <code>/guide [specific-module]</code> for [area]</li>
    </ul>
  </main>
</body>
</html>
```

### NN-[focus-area].html (Chapter Page)

```html
<!DOCTYPE html>
<html lang="en">
<!-- Same lang as index.html -->
<!-- <head> content: Read from assets/head.html, replace {{TITLE}} with "[Focus Area Name]" -->
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <nav class="sidebar" aria-label="Guide navigation">
    <!-- Same sidebar as index.html, but with THIS page's link marked class="active" -->
  </nav>
  <main id="main-content" class="content">
    <a href="index.html" class="back-to-hub">← Back to Big Picture</a>

    <h1>[Focus Area Name]</h1>

    <h2>Where We Are</h2>
    <p>Of the [N] components in the Big Picture, we're now looking at [X] — the [role].</p>

    <h2>Walkthrough</h2>
    <!-- Step-by-step narrative following the data flow through this area. Each step:
         - What it does (plain language, analogies where helpful)
         - Where it lives (file path + symbol name as <code>)
         - Why it's designed this way (if visible from the code)
         - Show actual code for key logic, not just describe it
         - Include callout boxes for non-obvious design decisions or gotchas -->

    <h2>Key Code</h2>
    <!-- The most important code in this area, shown with full context.
         For each snippet:
         - File path and symbol name
         - The actual code (5-25 lines, from the real codebase)
         - Annotation: what makes this code important, what design decisions it embodies
         Include type signatures, key interfaces, or critical algorithms.
         Aim for 2-3 annotated code blocks in this section. -->

    <h2>Design Decisions</h2>
    <!-- Why is this area designed the way it is?
         For each decision:
         - What the decision is
         - Why it was made (evidence from the code)
         - What the alternative would be and why it wasn't chosen (if visible)
         Use callout-note boxes for each decision. Aim for 2-3 decisions per chapter. -->

    <h2>Connections</h2>
    <!-- How this area relates to other parts of the system.
         Use a table showing: Component | Relationship | Integration Point (file:symbol)
         Or a mermaid diagram showing the dependency/data flow connections.
         This is more detailed than "Back to the Big Picture" — show specific integration points. -->

    <h2>Back to the Big Picture</h2>
    <p>Now that we've seen how [X] works, we know that [insight]. Next, we'll look at [Y], which receives [X]'s output and...</p>

    <nav class="page-nav">
      <a href="[prev].html">← [Previous Chapter]</a>
      <a href="index.html">Big Picture</a>
      <a href="[next].html">[Next Chapter] →</a>
    </nav>
  </main>
</body>
</html>
```

**Navigation rules**:
- First chapter: no "← Previous" link (omit or link to index.html)
- Last chapter: no "Next →" link (omit)
- Every chapter: always has "Big Picture" center link and "← Back to Big Picture" at the top

## Static Assets

CSS and HTML `<head>` templates are maintained as static files in `assets/` to ensure deterministic output. Do not duplicate their content in this file.

- `assets/style.css` — Complete guide stylesheet (grid layout, sidebar, mermaid overlay, callouts, responsive breakpoints, skip-link). Copy to output folder with bash `cp`
- `assets/head.html` — HTML `<head>` block with CDN links (mermaid 11.4.1, highlight.js 11.11.1 with SRI), initialization scripts, and mermaid click-to-zoom JavaScript. Contains `{{TITLE}}` placeholder — replace with the page title when embedding

**Path discovery**: Use Glob `**/guide-generation/assets/style.css` to locate the assets directory. This works regardless of whether the skill runs from the project root or from a plugin installation path

## Image Generation MCP (Optional)

At the start of Pass 3, use ToolSearch to check if any image generation MCP tools are available (search for keywords like "image", "generate", "create", "visual", "draw").

- **If found**: Generate concept visuals for key architectural concepts where a visual metaphor aids understanding — mental models, system analogies, conceptual overviews. Save images to the `images/` subdirectory within the guide output folder. Embed in HTML with `<img src="images/[name].png" alt="[description]" class="concept-image">`.
- **If not found**: Skip image generation entirely. The guide is complete with mermaid diagrams and text alone. Do not warn or notify — image generation is a silent enhancement.

**Scope limitation**: mermaid diagrams handle structural/flow diagrams (component relationships, data flow, dependency graphs). Image generation MCP is for conceptual/intuitive visuals that mermaid cannot express (mental model illustrations, metaphorical diagrams, architectural analogies). Do not duplicate what mermaid already covers.

## Document Lifecycle

- **Overwrite**: Re-running on the same scope overwrites the existing guide (no versioning). The calling command handles folder cleanup before invoking this skill
- **Timestamp**: Always include generation timestamp in the guide header (`<p class="meta">`)

## Integration

- **Static assets**: `assets/style.css` (bash `cp` to output) and `assets/head.html` (Read + `{{TITLE}}` substitution) ensure deterministic CSS and `<head>` output — no LLM generation of these critical templates
- **Semantic tools**: Serena MCP (`get_symbols_overview`, `find_referencing_symbols`) for precise symbol hierarchy and cross-file reference tracing — run by the main agent
- **Exploration agents**: `claude-praxis:scout` for broad context scanning and deep-dive exploration (haiku, read-only). Main agent writes the guide
- **External libraries**: mermaid.js 11.4.1 (jsDelivr CDN) for diagram rendering, highlight.js 11.11.1 (cdnjs CDN, SRI verified) for syntax highlighting. Both loaded client-side with version pinning. CDN URLs and SRI hashes are maintained in `assets/head.html`
- **Image generation**: Optional MCP-based concept visuals (ToolSearch detection, silent skip if unavailable)
- **Session cache**: `session-cache:session-cache-protocol` skill (optional) — reduces redundant file reads across agents when available
- **Invoked by**: `commands/guide.md`
