---
name: guide-generation
description: Use when generating single-file interactive HTML walkthroughs of a code topic — produces one self-contained .html with prose, diagrams, sequence player, and (when applicable) a live interactive demo. Invoked by /guide command.
user-invocable: false
---

# Guide Generation

This skill produces ONE single-file HTML per topic, modeled after deep-investigation walkthroughs. The output is a self-contained `.html` file — no external CSS or JS files. CDN-loaded libraries (Mermaid via jsDelivr, highlight.js via cdnjs) are the only external dependencies. The writer inlines all styles and scripts in the file itself.

## The Iron Law

```
EVERY EXPLANATION CITES FILE PATH + SYMBOL OR LINE NUMBER.
THE READER MUST BE ABLE TO OPEN THE CODE AND VERIFY EACH CLAIM.
```

No vague descriptions. Every code claim includes a `<span class="file-ref">filename.ts:line-or-symbol</span>` inline.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `scope` | Yes | Directory or file path to investigate (e.g., `frontend/src/features/board/`) |
| `intent` | Yes | One-line topic statement framing what to deep-dive (e.g., "interaction state がどう遷移するか") |

## Procedure

### Phase 1: Structured Investigation (mandatory before any HTML)

Complete all 5 substeps before writing a single line of HTML. The investigation builds the mental model the writer draws on.

**1a. Entry points** — Use Serena `get_symbols_overview` on the scope. Identify what triggers the behavior the intent describes: event handlers, route handlers, public API functions, exported hooks. Record file paths and symbol names.

**1b. Event sources** — Use Serena `find_referencing_symbols` from the entry points outward. Map who calls what: which components wire up the event handlers, which hooks consume the public API. Trace at least two levels of the call chain.

**1c. State shape** — Locate state holders: atoms, stores, `useState`/`useReducer` hooks, class fields, module-level variables. Extract their initial values and all sites where they are updated. Record file path + line range for each.

**1d. Happy path trace** — Pick one representative interaction the intent describes. Walk the full call chain from event source through every function to the final render or output. List each function visited with its file path and line range. This trace becomes the sequence player content.

**1e. Cross-cuts** — Find places where this scope leaks into other modules: imports of scope's symbols from outside, scope's imports of external state or context. Note boundary crossings that the reader should know about.

Output: a structured internal mental model. Optionally save to `claudedocs/scout-reports/[topic-slug]-investigation.md` as a working artifact; this is not required.

### Phase 2: Demo Feasibility Assessment (AI auto-judgment)

After Phase 1, decide whether to include an interactive demo. ALL of the following must be true:

- The scope contains state that updates in response to events (state machine, interactive UI, mode toggles, form state).
- The state can be modeled in vanilla JS without external dependencies — no need to replicate React reconciliation, network calls, or persistent storage.
- The intent benefits from "touching it" over reading about it — the state transitions are the point.

If **no demo**: proceed to Phase 3 with sequence player only.

If **yes demo**: extract the state machine spec from Phase 1c findings into a small JS-replicable representation. Verify the spec against the actual code one more time before writing. Note which pattern from Appendix B applies.

### Phase 3: Outline Generation (internal — not shown to user)

Produce a section outline following the abstract-to-concrete rule from `rules/document-quality.md`:

- **Section 1**: Topic overview — intent restated as section title, one-paragraph summary of what the scope does and why it matters.
- **Section 2**: State shape — what the state IS, with file refs. Table or list of state variants and their payloads.
- **Section 3**: State machine / flow overview — mermaid `stateDiagram-v2` or `graph LR` plus one paragraph of prose.
- **Section 4+**: One section per major flow identified in Phase 1d, each with a sequence player showing the step-by-step call chain.
- **Section N-1**: Cross-cuts and constraints — where this design creates friction or has known limitations. Material for downstream design work.
- **Section N**: Interactive Demo — included only when Phase 2 said yes.

### Phase 4: Write the HTML (one-shot, single narrator)

The main agent writes the entire HTML in one turn. No subagent delegation for writing. Required structure:

**`<head>`**: Copy from `assets/head.html`, substitute `{{TITLE}}` with the intent (Japanese OK).

**Inline `<style>` block**: Paste the full contents of `assets/style.css` into a `<style>` element in `<head>`. Do not reference `style.css` as an external file — the output must be self-contained.

**`<body>` per outline**: Each section uses:
- `<h2>` for section title
- `<p>` for prose
- `<div class="mermaid">` for diagrams
- `<pre><code class="language-typescript">` for code references
- `<span class="file-ref">filename.ts:line-range</span>` for inline file references
- `<div class="note">` for gotchas and non-obvious constraints
- `<div class="insight">` for design decisions and "why not X" explanations

**Sequence player**: For each flow section (Phase 1d trace), include the player markup and inline JS from Appendix A. Adapt the steps array to the actual call chain. Each step specifies a prose explanation visible when that step is current.

**Interactive demo** (only when Phase 2 said yes): Include the demo container markup, inline JS state machine, and event handlers wired to clickable elements. Use the pattern from Appendix B that matches the real code. Demo state transitions must match the actual reducer/state machine logic found in Phase 1c.

## Output Path

Filename: `claudedocs/investigations/YYYY-MM-DD-[topic-slug].html` where:
- `YYYY-MM-DD` is today's date (check the session's current date).
- `[topic-slug]` is a kebab-case slug derived from the intent, max 60 chars.
- If a file with that name already exists, append `-2`, `-3`, etc.

The skill writes ONE file. No accompanying CSS/JS files, no folder.

## Long-output Overflow Rule

If the final HTML would exceed 1500 lines, split into a multi-page bundle at `claudedocs/investigations/YYYY-MM-DD-[topic-slug]/` with `index.html` plus `NN-[section].html` files. This is rare — most topics fit in one file. Do not pre-emptively split; only split when the single-file estimate actually exceeds the threshold.

## Appendix A: Sequence Player Template

Paste this template for each flow section. Replace `FLOW_ID` with a unique identifier (e.g., `reclick-flow`), and replace the `steps` array contents with the actual call chain from Phase 1d.

```html
<!-- Sequence player: [flow title] -->
<div class="seq-player" id="FLOW_ID">
  <div class="seq-controls">
    <span class="seq-step-index" id="FLOW_ID-counter">0 / 0</span>
    <button class="seq-btn" id="FLOW_ID-prev">←</button>
    <button class="seq-btn" id="FLOW_ID-next">Next →</button>
    <button class="seq-btn" id="FLOW_ID-auto">▶</button>
    <button class="seq-btn" id="FLOW_ID-reset">Reset</button>
  </div>
  <div class="seq-step-panel" id="FLOW_ID-panel">
    <p style="color:#9ca3af;font-style:italic">Press Next to start stepping through the flow.</p>
  </div>
</div>
<script>
  (() => {
    const steps = [
      // Each entry: { title: "short label", body: "prose explanation with <code> tags" }
      { title: "Step 1 label", body: "Prose: what happens here, with <code>fileName.ts:42</code> reference." },
      { title: "Step 2 label", body: "Prose: next step in the call chain." },
      // … add one entry per step from Phase 1d trace
    ];

    const counter = document.getElementById('FLOW_ID-counter');
    const panel   = document.getElementById('FLOW_ID-panel');
    const prevBtn = document.getElementById('FLOW_ID-prev');
    const nextBtn = document.getElementById('FLOW_ID-next');
    const autoBtn = document.getElementById('FLOW_ID-auto');
    const resetBtn = document.getElementById('FLOW_ID-reset');

    let current = 0;
    let autoTimer = null;
    const total = steps.length;

    function render() {
      counter.textContent = `${current} / ${total}`;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === total;
      if (current === 0) {
        panel.innerHTML = '<p style="color:#9ca3af;font-style:italic">Press Next to start.</p>';
      } else {
        const s = steps[current - 1];
        panel.innerHTML = `<div class="seq-step-index">${current} / ${total} — ${s.title}</div><p>${s.body}</p>`;
      }
    }

    function stopAuto() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
      autoBtn.textContent = '▶';
    }

    prevBtn.addEventListener('click', () => { if (current > 0) { current--; render(); stopAuto(); } });
    nextBtn.addEventListener('click', () => { if (current < total) { current++; render(); } });
    autoBtn.addEventListener('click', () => {
      if (autoTimer) { stopAuto(); return; }
      if (current === total) current = 0;
      autoBtn.textContent = '⏸';
      autoTimer = setInterval(() => {
        if (current < total) { current++; render(); }
        else { stopAuto(); }
      }, 800);
    });
    resetBtn.addEventListener('click', () => { current = 0; stopAuto(); render(); });

    render();
  })();
</script>
```

**Usage**: Repeat one player block per flow section. Each `FLOW_ID` must be unique on the page. The `steps` array mirrors the call chain traced in Phase 1d — one entry per function or state transition visited.

## Appendix B: Interactive Demo Patterns

Choose one pattern based on whether the real code is event-driven (user gestures trigger state) or data-driven (a pipeline transforms data).

### Pattern 1: Stage + State Panels (event-driven state machines)

Use when: the scope has a state machine that reacts to user gestures — clicks, drags, keyboard. The Darius board example (`Section 10`) is the canonical reference.

**Structure**:
- A `<div class="demo-container">` wrapping the whole demo.
- A `<div class="demo-stage">` with a mock UI: clickable `<div>` elements representing the real UI's interactive targets (buttons, table cells, canvas). These fire state transitions when clicked.
- A `<div class="demo-state-panels">` grid with one `<div class="demo-panel">` per state variable. Each panel shows the current value of its variable, updated via DOM manipulation on every state change.
- Optional: a dispatch log `<ol>` showing which actions fired, in order.
- Inline `<script>` with a plain-object state machine that mirrors the real reducer logic. Event handlers on stage elements call `dispatch(action)`, the dispatch function updates the state object, then calls `render()` which writes current values to the panels.

**State change wiring**:
```javascript
// Plain state object (mirrors real atom/store)
const state = { kind: 'idle' };

function dispatch(action) {
  // Mirror the real reducer — same guards, same transitions
  if (action.type === 'SELECT' && state.kind === 'idle') {
    state.kind = 'selected';
    state.id = action.id;
  }
  // … other transitions
  render();
}

function render() {
  document.getElementById('state-display').textContent = state.kind;
  // Update all panels to reflect current state
}
```

The key fidelity requirement: the demo's state transitions must match the actual code's reducer guards exactly — same conditions, same result kinds. Verify against Phase 1c before writing.

### Pattern 2: Step-through Animation (data-driven pipelines)

Use when: the scope transforms data through a sequence of stages with no user input in the real code — request/response flows, data processing pipelines, build-time transformations.

**Structure**:
- A `<div class="demo-container">` with labeled stage boxes arranged left-to-right or top-to-bottom.
- An auto-advancing animation driven by the sequence player from Appendix A, where each step highlights a different stage box and shows the data value at that point.
- Stage boxes use CSS transitions (`transition: background 0.4s, border-color 0.4s`) to animate activation as the player advances.
- No user interaction beyond the player controls — the user observes, not participates.

This pattern is less interactive but correct for code that has no event-driven state machine. It makes the data movement visible without misrepresenting the code's interaction model.
