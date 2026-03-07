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

### Pass 3: Write Guide (HTML Book)

The main agent (not a subagent) writes the complete guide as a multi-page HTML book using scout findings as input. This pass produces the output folder following the HTML Page Structure below.

Key writing responsibilities:
- Create the output folder and write `style.css` (verbatim from CSS Template below)
- Write `index.html` (Big Picture hub page) using analogies and plain language
- Write each chapter page (`NN-[focus-area].html`) following the zoom-in/zoom-out rhythm
- Include mermaid diagrams as `<div class="mermaid">` blocks (rendered client-side)
- Include code references as `<pre><code class="language-[lang]">` blocks (highlighted client-side)
- Write navigation elements (sidebar TOC, prev/next links, "Back to the Big Picture" links)
- Write the Coverage Boundary section in the last chapter or as a dedicated page
- Optionally generate concept visuals via image generation MCP (see below)

**Single narrator requirement**: The main agent writes the entire guide to maintain a consistent voice, tone, and level of detail throughout. Do not delegate writing to subagents.

**Short guide rule**: If the scope has 2 or fewer Focus Areas, write a single `index.html` containing all content (no chapter split). The sidebar TOC links to sections within the same page via anchor links. The style.css is still generated separately.

## HTML Page Structure

The guide follows a zoom-in/zoom-out navigation pattern expressed as a multi-page HTML book. The `index.html` (Big Picture) is the hub that readers navigate to and from between each focused chapter.

### Output folder

```
claudedocs/guides/[scope-name]/
├── index.html              # Big Picture (hub page)
├── 01-[focus-area].html    # Chapter 1 (spoke page)
├── 02-[focus-area].html    # Chapter 2 (spoke page)
├── ...
├── style.css               # Shared stylesheet (verbatim from CSS Template)
└── images/                 # Optional: generated concept visuals
```

### index.html (Big Picture)

```html
<!DOCTYPE html>
<html lang="en">
<!-- Set lang attribute to match the guide's language (e.g., lang="ja" for Japanese) -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guide: [Scope Name]</title>
  <link rel="stylesheet" href="style.css">
  <script defer src="https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css"
        integrity="sha512-0MQwo6K1MmMGmoaZEjMzmKPRYma6JEEmq5TSmVKl1JRhcLjrMZqN1ieV1GF3bFfcKMJHe9UNGTJkAfRXfKdCSA=="
        crossorigin="anonymous" referrerpolicy="no-referrer" />
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"
          integrity="sha512-EBLzUL8XLl+va/zAsmXwS7Z2B1F9HUHkZwyS/VKwh3S7T/U0nF4BaU29EP/ZSf6zgiIxYAnKLu6bJ8dqpmX5uw=="
          crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script defer>document.addEventListener('DOMContentLoaded', function() { hljs.highlightAll(); mermaid.initialize({ startOnLoad: true, theme: 'neutral' }); });</script>
</head>
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
<head>
  <!-- Same <head> as index.html -->
</head>
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
         - Why it's designed this way (if visible from the code) -->

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

## CSS Template

Write the following CSS **verbatim** to `style.css`. Do not modify, abbreviate, or rephrase — copy exactly as shown.

```css
:root {
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-code: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  --color-bg: #ffffff;
  --color-text: #1a1a2e;
  --color-heading: #16213e;
  --color-link: #0f3460;
  --color-link-hover: #e94560;
  --color-sidebar-bg: #f8f9fa;
  --color-sidebar-active: #e8edf2;
  --color-border: #dee2e6;
  --color-code-bg: #f6f8fa;
  --color-nav-bg: #f0f2f5;
  --content-max-width: 48rem;
  --sidebar-width: 16rem;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.7;
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background: var(--color-sidebar-bg);
  border-right: 1px solid var(--color-border);
  padding: 2rem 1rem;
  position: fixed;
  top: 0;
  bottom: 0;
  overflow-y: auto;
}

.sidebar h2 {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6c757d;
  margin-bottom: 1rem;
}

.sidebar ul { list-style: none; }

.sidebar li { margin-bottom: 0.25rem; }

.sidebar a {
  display: block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.25rem;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.9rem;
}

.sidebar a:hover { background: var(--color-sidebar-active); }

.sidebar a.active {
  background: var(--color-sidebar-active);
  font-weight: 600;
}

.content {
  margin-left: var(--sidebar-width);
  padding: 3rem 2rem;
  max-width: calc(var(--content-max-width) + 4rem);
  width: 100%;
}

h1 {
  font-size: 2rem;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 0.5rem;
}

h2 {
  font-size: 1.5rem;
  color: var(--color-heading);
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}

h3 {
  font-size: 1.15rem;
  color: var(--color-heading);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

p { margin-bottom: 1rem; }

a { color: var(--color-link); }
a:hover { color: var(--color-link-hover); }

ul, ol { margin-bottom: 1rem; padding-left: 1.5rem; }
li { margin-bottom: 0.375rem; }

pre {
  background: var(--color-code-bg);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
}

code { font-family: var(--font-code); font-size: 0.875em; }

p code, li code {
  background: var(--color-code-bg);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid var(--color-border);
}

.mermaid {
  text-align: center;
  margin: 1.5rem 0;
}

.page-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.page-nav a {
  padding: 0.5rem 1rem;
  background: var(--color-nav-bg);
  border-radius: 0.375rem;
  text-decoration: none;
  font-size: 0.9rem;
}

.page-nav a:hover { background: var(--color-sidebar-active); }

.back-to-hub {
  display: inline-block;
  margin-bottom: 1.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--color-nav-bg);
  border-radius: 0.25rem;
  text-decoration: none;
  font-size: 0.875rem;
}

.back-to-hub:hover { background: var(--color-sidebar-active); }

.meta {
  color: #6c757d;
  font-style: italic;
  font-size: 0.875rem;
  margin-bottom: 2rem;
}

.concept-image {
  max-width: 100%;
  margin: 1.5rem 0;
  border-radius: 0.5rem;
}

@media (max-width: 768px) {
  .sidebar { display: none; }
  .content { margin-left: 0; padding: 1.5rem 1rem; }
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-heading);
  color: #fff;
  padding: 0.5rem 1rem;
  z-index: 100;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}
```

## Image Generation MCP (Optional)

At the start of Pass 3, use ToolSearch to check if any image generation MCP tools are available (search for keywords like "image", "generate", "create", "visual", "draw").

- **If found**: Generate concept visuals for key architectural concepts where a visual metaphor aids understanding — mental models, system analogies, conceptual overviews. Save images to the `images/` subdirectory within the guide output folder. Embed in HTML with `<img src="images/[name].png" alt="[description]" class="concept-image">`.
- **If not found**: Skip image generation entirely. The guide is complete with mermaid diagrams and text alone. Do not warn or notify — image generation is a silent enhancement.

**Scope limitation**: mermaid diagrams handle structural/flow diagrams (component relationships, data flow, dependency graphs). Image generation MCP is for conceptual/intuitive visuals that mermaid cannot express (mental model illustrations, metaphorical diagrams, architectural analogies). Do not duplicate what mermaid already covers.

## Document Lifecycle

- **Overwrite**: Re-running on the same scope overwrites the existing guide (no versioning). The calling command handles folder cleanup before invoking this skill
- **Timestamp**: Always include generation timestamp in the guide header (`<p class="meta">`)

## Integration

- **Semantic tools**: Serena MCP (`get_symbols_overview`, `find_referencing_symbols`) for precise symbol hierarchy and cross-file reference tracing — run by the main agent
- **Exploration agents**: `claude-praxis:scout` for broad context scanning and deep-dive exploration (haiku, read-only). Main agent writes the guide
- **External libraries**: mermaid.js 11.4.1 (jsDelivr CDN) for diagram rendering, highlight.js 11.11.1 (cdnjs CDN, SRI verified) for syntax highlighting. Both loaded client-side with version pinning
- **Image generation**: Optional MCP-based concept visuals (ToolSearch detection, silent skip if unavailable)
- **Invoked by**: `commands/guide.md`
