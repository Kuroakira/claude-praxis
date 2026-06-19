# Containment Diagram (Structure Axis) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a structure-axis diagram type ("containment diagram") to `/guide` output so guides can show what-is-inside-what, not only flow.

**Architecture:** A new hand-laid-out SVG diagram type, documented as Appendix E in the guide-generation skill and styled by new `.containment-*` classes in the shared stylesheet. Each section renders one static diagram showing one containment level inside its parent boundary (C4 convention). Boxes map to real code (file-ref required); labeled relationship arrows (solid = static dependency, dashed = runtime data flow) act as an index into the existing flow-axis diagrams. No zoom, no progressive reveal, no persistence — those are explicitly deferred (see `CONTEXT.md` → Orientation).

**Tech Stack:** Inline SVG, CSS (the guide's single-file stylesheet), Markdown (SKILL.md). Verification via the Playwright MCP browser (render a standalone HTML, screenshot, eyeball). No automated test framework exists in this repo — visual rendering is the test.

**Design reference:** Terms and decisions are recorded in `CONTEXT.md` (Diagram Axes, Containment diagram, Orientation). Read it before starting.

---

## File Structure

- **Modify** `skills/guide-generation/assets/style.css` — append the `.containment-*` style block (Appendix E styling). One responsibility: visual rules for the new diagram.
- **Modify** `skills/guide-generation/SKILL.md` — three distinct edits, split across tasks:
  - the Appendix E template + adaptation notes (Task 2)
  - the decision-point wiring: diagram-choice table row, Phase 1 derivation substep, outline placement note (Task 3)
- **Temp (not committed)** a standalone `/tmp/containment-proof.html` used only to render-and-screenshot during verification; deleted before each commit.
- **Create (Task 4 proof)** one real guide HTML under `claudedocs/investigations/` exercising the diagram on actual code. This is the end-to-end proof; whether to commit it is noted in Task 4.

Each task produces a self-contained, independently reviewable change.

---

## Task 1: Containment diagram CSS

**Files:**
- Modify: `skills/guide-generation/assets/style.css` (append at end, after line 339)
- Temp: `/tmp/containment-proof.html`

- [ ] **Step 1: Write the failing render harness**

Create `/tmp/containment-proof.html`. It inlines the current stylesheet, then a containment-diagram SVG that uses the **not-yet-defined** `.containment-*` classes. Before Step 3 it will render as unstyled black-stroke default SVG (boxes with no fill/color, no dashed boundary), proving the classes are missing.

```html
<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="file:///Users/akirashirahama/workspace/private/claude-praxis/skills/guide-generation/assets/style.css">
</head><body>
<div class="containment-diagram">
  <svg viewBox="0 0 720 360" class="containment-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="containment-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#6b7280"/>
      </marker>
    </defs>
    <rect class="containment-boundary" x="20" y="20" width="680" height="320" rx="10"/>
    <text class="containment-boundary-label" x="34" y="40">jotai/core (the store module)</text>

    <g class="containment-unit">
      <rect class="containment-box" x="60" y="80" width="180" height="90" rx="6"/>
      <text class="containment-box-label" x="150" y="120">atom()</text>
      <text class="containment-box-ref"   x="150" y="140">atom.ts:12</text>
    </g>
    <g class="containment-unit">
      <rect class="containment-box" x="480" y="80" width="180" height="90" rx="6"/>
      <text class="containment-box-label" x="570" y="120">createStore()</text>
      <text class="containment-box-ref"   x="570" y="140">store.ts:40</text>
    </g>
    <g class="containment-unit">
      <rect class="containment-box" x="270" y="220" width="180" height="90" rx="6"/>
      <text class="containment-box-label" x="360" y="260">useAtom()</text>
      <text class="containment-box-ref"   x="360" y="280">react.ts:88</text>
    </g>

    <path class="containment-rel containment-rel-dep"  d="M300,220 L180,172"/>
    <text class="containment-rel-label" x="232" y="188">reads</text>
    <path class="containment-rel containment-rel-flow" d="M420,220 L540,172"/>
    <text class="containment-rel-label" x="486" y="188">subscribes</text>
  </svg>
</div>
</body></html>
```

- [ ] **Step 2: Render to verify it is unstyled**

Use the Playwright MCP: `browser_navigate` to `file:///tmp/containment-proof.html`, then `browser_take_screenshot`.
Expected: boxes render with default black stroke / no fill; the boundary rect is solid black, not a grey dashed frame; arrows have no marker styling difference. This confirms the classes do not yet exist.

- [ ] **Step 3: Append the containment CSS**

Append to the end of `skills/guide-generation/assets/style.css`:

```css

/* ── Appendix E: Containment diagram (structure axis) ──────────────────── */
.containment-diagram {
  margin: 24px 0; padding: 16px;
  border: 1px solid var(--color-border); border-radius: 8px;
  background: #f9fafb;
}
.containment-svg { display: block; max-width: 100%; height: auto; }

/* Parent boundary — the enclosing unit drawn as context (dashed frame) */
.containment-boundary { fill: none; stroke: var(--color-file-ref); stroke-width: 1.5; stroke-dasharray: 6 4; }
.containment-boundary-label { font-family: var(--font-code); font-size: 11px; fill: var(--color-file-ref); font-weight: 600; }

/* Containment boxes — one real code unit each */
.containment-box { fill: #eef2ff; stroke: var(--color-accent); stroke-width: 1.5; }
.containment-box-label { font-family: var(--font-body); font-size: 13px; font-weight: 600; fill: var(--color-heading); text-anchor: middle; }
.containment-box-ref { font-family: var(--font-code); font-size: 10px; fill: var(--color-file-ref); text-anchor: middle; }
/* Conceptual-only grouping box (no code behind it) — visually distinct, used rarely */
.containment-box.containment-box-conceptual { fill: #ffffff; stroke-dasharray: 5 3; }

/* Relationship arrows — every arrow MUST carry a label */
.containment-rel { fill: none; stroke: #6b7280; stroke-width: 1.5; marker-end: url(#containment-arrow); }
.containment-rel-flow { stroke-dasharray: 5 4; }
.containment-rel-label {
  font-family: var(--font-code); font-size: 10px; fill: var(--color-text);
  paint-order: stroke fill; stroke: white; stroke-width: 3px; stroke-linejoin: round;
  text-anchor: middle;
}
```

Note: `.containment-rel-dep` needs no extra rule — a solid stroke is the `.containment-rel` default. The class exists in markup for symmetry and future overrides.

- [ ] **Step 4: Render to verify it is styled**

Re-run `browser_navigate` to `file:///tmp/containment-proof.html` (or `browser_navigate` again to force reload), then `browser_take_screenshot`.
Expected: outer boundary is a grey **dashed** frame with a small monospace label top-left; three boxes have light-indigo fill with blue stroke, a bold title and a grey monospace file-ref under it; the "reads" arrow is **solid**, the "subscribes" arrow is **dashed**; both arrows carry a white-haloed label and an arrowhead. Confirm boxes do not overlap and arrows are visible.

- [ ] **Step 5: Clean up and commit**

```bash
rm -f /tmp/containment-proof.html
cd /Users/akirashirahama/workspace/private/claude-praxis
git checkout -b feature/containment-diagram
git add skills/guide-generation/assets/style.css
git commit -m "feat(guide): add containment-diagram CSS (structure-axis styling)"
```

---

## Task 2: Appendix E template in SKILL.md

**Files:**
- Modify: `skills/guide-generation/SKILL.md` (append new Appendix E after Appendix D, which ends at line 982)
- Temp: `/tmp/containment-proof.html` (reuse the harness to confirm the template renders)

- [ ] **Step 1: Append Appendix E**

Append to the end of `skills/guide-generation/SKILL.md`:

````markdown

## Appendix E: Containment Diagram Template (SVG)

Use when the question is **structural** — "what is inside what". This is the only **structure-axis** diagram type; every other diagram (Appendix A/C/D, mermaid) is **flow-axis** (order, transition, data movement over time). See `CONTEXT.md` → Diagram Axes.

**Static, one level per section.** Each diagram shows one containment level drawn inside its **parent boundary** (a dashed frame labelled with the enclosing unit). The next-deeper section draws a new diagram where the previously-inner box becomes the new parent boundary. There is no zoom and no progressive reveal — a map is most useful fully visible.

**Every box maps to real code.** Each box carries a `file-ref` (file / symbol). Nesting reflects actual code containment (directory structure, Serena `get_symbols_overview` symbol containment) — never an invented hierarchy. A conceptual-only grouping box (no code behind it) is rare and drawn with `class="containment-box containment-box-conceptual"` and no file-ref.

**Level selection by target type** (do not draw levels the target lacks):

| Target | Levels to draw |
|--------|----------------|
| Application / system | whole system + external actors → deployable units → modules |
| Library / single module (e.g. Jotai) | the module-and-its-internals level (the main one). No deployable-unit level — it does not exist |

**Relationship arrows** are optional but, when present, MUST be labelled with a verb. They turn the map into an index into the flow-axis diagrams (a labelled edge here is detailed step-by-step by an Appendix A player elsewhere):

- **Static dependency** (`class="containment-rel containment-rel-dep"`, solid) — `uses` / `imports` / `extends`
- **Runtime data flow** (`class="containment-rel containment-rel-flow"`, dashed) — `dispatches` / `reads` / `notifies`

Cap relationship arrows at **5 per diagram**. More than that means the structure axis is being polluted by flow — move that detail to an Appendix A player.

```html
<!-- Appendix E: Containment diagram — [level title] -->
<div class="containment-diagram">
  <svg viewBox="0 0 720 360" class="containment-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="containment-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#6b7280"/>
      </marker>
    </defs>

    <!-- Parent boundary: the unit that contains everything shown (drawn as context). -->
    <rect class="containment-boundary" x="20" y="20" width="680" height="320" rx="10"/>
    <text class="containment-boundary-label" x="34" y="40">jotai/core (the store module)</text>

    <!-- Child boxes: one real code unit each. file-ref required. -->
    <g class="containment-unit">
      <rect class="containment-box" x="60" y="80" width="180" height="90" rx="6"/>
      <text class="containment-box-label" x="150" y="120">atom()</text>
      <text class="containment-box-ref"   x="150" y="140">atom.ts:12</text>
    </g>
    <g class="containment-unit">
      <rect class="containment-box" x="480" y="80" width="180" height="90" rx="6"/>
      <text class="containment-box-label" x="570" y="120">createStore()</text>
      <text class="containment-box-ref"   x="570" y="140">store.ts:40</text>
    </g>
    <g class="containment-unit">
      <rect class="containment-box" x="270" y="220" width="180" height="90" rx="6"/>
      <text class="containment-box-label" x="360" y="260">useAtom()</text>
      <text class="containment-box-ref"   x="360" y="280">react.ts:88</text>
    </g>

    <!-- Relationship arrows: every arrow labelled. Solid = dependency, dashed = data flow. -->
    <path class="containment-rel containment-rel-dep"  d="M300,220 L180,172"/>
    <text class="containment-rel-label" x="232" y="188">reads</text>
    <path class="containment-rel containment-rel-flow" d="M420,220 L540,172"/>
    <text class="containment-rel-label" x="486" y="188">subscribes</text>
  </svg>
</div>
```

**Adaptation notes:**

- Draw the **parent boundary** first as a dashed `<rect class="containment-boundary">` filling most of the viewBox; its label names the enclosing unit. For a top-level Context diagram, the boundary is the whole system and external actors sit *outside* it.
- One `<g class="containment-unit">` per child. The box `<rect>` sits fully inside the boundary; the label and file-ref are centred (`text-anchor:middle` is in the CSS, so x is the box centre).
- Keep total boxes **≤ 15** (the `document-quality.md` node ceiling). If a level has more, raise abstraction — group children and detail the group in a deeper section.
- Relationship arrow paths run between box edges. Pick `-dep` (solid) or `-flow` (dashed) per the meaning, and always add a `<text class="containment-rel-label">` at the path midpoint.
- The `marker-end` is supplied by CSS; no inline `marker-end` needed.
- The diagram is static — no `<script>`. Multiple containment diagrams may appear on one page; the `containment-arrow` marker only needs to be defined once but re-defining it per SVG is harmless.
````

- [ ] **Step 2: Verify the template renders**

Recreate `/tmp/containment-proof.html` from the Task-1 harness (same body, which is the Appendix E template wrapped in the stylesheet link). `browser_navigate` to it, `browser_take_screenshot`.
Expected: identical to Task 1 Step 4 — the template in the appendix is the exact markup just verified, so it renders correctly. This confirms the documented template is copy-paste-correct (IDs, class names, and marker reference all match the CSS).

- [ ] **Step 3: Clean up and commit**

```bash
rm -f /tmp/containment-proof.html
cd /Users/akirashirahama/workspace/private/claude-praxis
git add skills/guide-generation/SKILL.md
git commit -m "docs(guide): add Appendix E containment-diagram template"
```

---

## Task 3: Wire the containment diagram into the skill's decision points

This task makes the skill actually *reach for* the new diagram. Three edits to `skills/guide-generation/SKILL.md`, all about when/how to use Appendix E. No new template code.

**Files:**
- Modify: `skills/guide-generation/SKILL.md` (diagram-choice table ~line 232-240; Phase 1 substeps ~line 149-161; L1/L2 outline ~line 186-200)

- [ ] **Step 1: Add a row to the Phase 4 diagram-choice table**

In the diagram-choice table (the rows starting at `| Content | Format | Why |`, line 232), add this row immediately **above** the "Concept classification tree" row (line 238):

```markdown
| Static containment — what is *inside* what (system ⊃ module ⊃ symbol); the structure axis | **Containment diagram** (Appendix E) | Nested boxes inside a parent-boundary frame. Shows shape, not behavior. Hand-laid SVG; labelled arrows optional |
```

- [ ] **Step 2: Add a Phase 1 derivation substep**

After substep `1e. Cross-cuts` (ends line 157) and before `1f. Persona Card` (line 159), insert a new substep:

```markdown
**1e2. Containment shape** (only when the topic is structural — see Appendix E "Level selection by target type") — Derive the nesting from real code, not from a mental model. For an application: read the directory / deployable-unit structure. For a library or single module: use Serena `get_symbols_overview` to get symbol containment. Record, per box, its label + file-ref + which box contains it. Note any relationship worth an arrow (dependency or data flow) with its verb. This becomes the Appendix E diagram(s). If the code has no real containment to show, skip — do not invent a hierarchy.
```

Then update the level/substep table (lines 141-145) so the new substep is included at the right levels. Replace the table body rows with:

```markdown
| L1 | **1a + 1d + 1f** (one happy path + Persona Card), plus **1e2 if the topic is structural** | 1b, 1c (beyond the one path), 1e |
| L2 | **1a, 1b, 1c, 1d, 1f**, plus **1e2 if structural** (2-3 paths if branches are essential to the topic) | 1e unless cross-cuts are the topic itself |
| L3 | **All substeps** including 1e2 | nothing |
```

- [ ] **Step 3: Add an outline placement note for L1 and L2**

In the L1 outline, the mental-model item currently reads (line 189):

```markdown
2. The mental model — one labeled diagram (custom SVG or simple mermaid `graph LR`, 4-6 nodes) + 2-3 paragraphs naming the key pieces.
```

Replace it with:

```markdown
2. The mental model — one labeled diagram + 2-3 paragraphs naming the key pieces. **If the topic is structural (what-is-inside-what), use a containment diagram (Appendix E) here** — it is the natural home for the structure axis. Otherwise a custom SVG or simple mermaid `graph LR` (4-6 nodes).
```

In the L2 outline, the overview-diagram item currently reads (line 197):

```markdown
3. Overview diagram — custom SVG state diagram (Appendix C) or architecture diagram (Appendix D).
```

Replace it with:

```markdown
3. Overview diagram — pick by axis: **containment diagram (Appendix E)** when the overview is structural (what contains what), custom SVG state diagram (Appendix C) for a state machine, or architecture diagram (Appendix D) for system data flow.
```

- [ ] **Step 4: Verify internal consistency**

Re-read the three edited regions plus Appendix E. Confirm: the table row names "Appendix E" and "Containment diagram" exactly as the appendix title; substep id `1e2` is referenced consistently; the "structural" gating phrase matches between the diagram-choice row, substep 1e2, and the outline notes. No broken cross-references.

- [ ] **Step 5: Commit**

```bash
cd /Users/akirashirahama/workspace/private/claude-praxis
git add skills/guide-generation/SKILL.md
git commit -m "feat(guide): wire containment diagram into diagram-choice, Phase 1, and outlines"
```

---

## Task 4: End-to-end proof on real code

Render a containment diagram from an actual codebase to prove the whole path works (derivation → template → CSS → browser). This catches problems the synthetic harness cannot: real symbol names overflowing boxes, >15 nodes, awkward nesting.

**Files:**
- Create: `claudedocs/investigations/2026-06-19-containment-diagram-proof.html` (a minimal guide-shaped HTML — head + stylesheet + one containment section)
- Read (for real data): pick a small real module. Default: this repo's own `skills/guide-generation/assets/` is too thin; instead use a real library checkout if available, else use the Darius frontend at `/Users/akirashirahama/workspace/darius/frontend/src` (a known structural codebase).

- [ ] **Step 1: Derive real containment**

Choose one real module. Run Serena `get_symbols_overview` (or `find_symbol`) on it to get actual symbols and their containment. Record 3-6 boxes with real file-refs and at most 5 labelled relationships. Verify each file-ref points to a real line.

- [ ] **Step 2: Build the proof HTML**

Create `claudedocs/investigations/2026-06-19-containment-diagram-proof.html`: copy `assets/head.html` (substitute `{{TITLE}}` with "Containment diagram proof"), inline `assets/style.css` in a `<style>` block (self-contained rule, SKILL.md:220), then one `<h2>` section containing the Appendix E template populated with the **real** boxes and relationships from Step 1.

- [ ] **Step 3: Render and verify**

`browser_navigate` to the `file://` path of the proof HTML, `browser_take_screenshot`.
Expected: real symbol names fit inside their boxes (no text overflow past the box edge); ≤15 boxes; boundary frame encloses all child boxes; every arrow has a visible verb label and correct solid/dashed style. If any box overflows, widen it or shorten the label; if >15 boxes, raise abstraction per the adaptation notes.

- [ ] **Step 4: Decide on committing the proof**

The proof HTML is a real `/guide`-style output artifact, not source. Per repo convention `claudedocs/investigations/` holds generated output. Ask the user whether to keep it as a reference example or delete it:

```bash
# If keeping as a reference example:
cd /Users/akirashirahama/workspace/private/claude-praxis
git add claudedocs/investigations/2026-06-19-containment-diagram-proof.html
git commit -m "docs(guide): add containment-diagram proof example"

# If discarding:
rm -f claudedocs/investigations/2026-06-19-containment-diagram-proof.html
```

---

## Self-Review

**Spec coverage** (against `CONTEXT.md` + grilled decisions):
- Structure axis / new diagram type → Tasks 1+2 (CSS + template). ✓
- Static, one level per section, parent boundary (decision B) → Appendix E prose, Task 2. ✓
- Boxes map to real code, file-ref required, no invented hierarchy → substep 1e2 (Task 3) + Appendix E prose. ✓
- Level selection by target type → Appendix E table (Task 2). ✓
- Labelled relationship arrows, solid=dep / dashed=flow, ≤5 → CSS (Task 1) + Appendix E prose (Task 2). ✓
- Gating: all levels, only when structural; L1 mental-model home → outline edits + diagram-choice row (Task 3). ✓
- Hand-SVG not mermaid → entire approach; consistent with SKILL.md:241. ✓
- Deferred (zoom / persistence / orientation) → not in plan, recorded in CONTEXT.md. ✓

**Placeholder scan:** No "TBD"/"add appropriate X". All CSS and SVG shown in full. Task 4 Step 1 is genuinely data-dependent (real codebase), so it specifies the *method* (Serena overview) and *acceptance* (real file-refs, ≤15 boxes) rather than fake data — correct for a proof task.

**Type/name consistency:** class names match across CSS (Task 1), template (Task 2), and harness (Task 1): `containment-diagram`, `containment-svg`, `containment-boundary(-label)`, `containment-box(-label/-ref/-conceptual)`, `containment-rel(-dep/-flow/-label)`, `containment-unit`, marker id `containment-arrow`. Substep id `1e2` and the appendix name "Appendix E" / "Containment diagram" used identically in Task 3.
