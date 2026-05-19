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
- **Section 3**: State machine / flow overview — custom SVG state diagram (Appendix C) or architecture diagram (Appendix D), depending on whether the topic is a state machine or a system flow. Reserve mermaid for the simplest cases (see Phase 4 diagram-choice table).
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
- `<pre><code class="language-typescript">` for code references
- `<span class="file-ref">filename.ts:line-range</span>` for inline file references
- `<div class="note">` for gotchas and non-obvious constraints
- `<div class="insight">` for design decisions and "why not X" explanations

**Diagram choice**: pick the format that matches the content. Do NOT default to mermaid.

| Content | Format | Why |
|---------|--------|-----|
| Sequence of events between actors (call chain, request flow, dispatch trace) | **Sequence player** (Appendix A) | Step-through reveals one interaction at a time. Mermaid `sequenceDiagram` is static and visually dense |
| State machine with guards, transitions, and multiple kinds | **Custom SVG state diagram** (Appendix C) | Hand-laid-out SVG carries far more semantic load (active-state highlighting, named transitions, guard annotations) than mermaid `stateDiagram-v2` |
| System architecture showing how components hand off data (request lifecycle across server/db/queue/cache) | **Architecture diagram** (Appendix D) | ByteByteGo-style: primitive shape icons + numbered step bubbles + animated data-flow arrows. Mermaid `flowchart` cannot show data movement or animate sequencing |
| Simple high-level overview where layout doesn't matter (3-5 boxes, no animation, no numbered steps) | `<div class="mermaid">` with `graph LR` or `graph TD` | Cheapest to write. Reserve for the "context map" / "where this fits" diagram only |

**Mermaid is the fallback, not the default.** When you reach for `<div class="mermaid">`, ask: does this content have actors, steps, or state changes? If yes, switch to a richer format.

**Sequence player**: For each flow section (Phase 1d trace), include the player markup and inline JS from Appendix A. Adapt the `participants` and `steps` arrays to the actual call chain. Color-code participants by type (user / hook / atom / service / component / external).

**Interactive demo** (only when Phase 2 said yes): Include the demo container markup, inline JS state machine, and event handlers wired to clickable elements. Use the pattern from Appendix B that matches the real code. Demo state transitions must match the actual reducer/state machine logic found in Phase 1c.

## Output Path

Filename: `claudedocs/investigations/YYYY-MM-DD-[topic-slug].html` where:
- `YYYY-MM-DD` is today's date (check the session's current date).
- `[topic-slug]` is a kebab-case slug derived from the intent, max 60 chars.
- If a file with that name already exists, append `-2`, `-3`, etc.

The skill writes ONE file. No accompanying CSS/JS files, no folder.

## Long-output Overflow Rule

If the final HTML would exceed 1500 lines, split into a multi-page bundle at `claudedocs/investigations/YYYY-MM-DD-[topic-slug]/` with `index.html` plus `NN-[section].html` files. This is rare — most topics fit in one file. Do not pre-emptively split; only split when the single-file estimate actually exceeds the threshold.

## Appendix A: Sequence Player Template (actor-based)

Sequence flows are rendered as actor pills + typed steps. Each step is either a `msg` (one actor calls another, drawn with an arrow) or a `note` (something happens inside one actor). Steps are pre-rendered into the DOM; the player advances by highlighting one at a time.

Paste this block for each flow section. Replace `FLOW_ID` with a unique identifier (e.g., `reclick-flow`), populate `participants` with the actors involved, and populate `steps` with one entry per function call or internal action from the Phase 1d trace.

**Actor types** (drive color coding via the `data-type` attribute on `.seq-actor`):

| `type` | Use for | Color |
|--------|---------|-------|
| `user` | Human input — clicks, keystrokes, gestures | amber |
| `hook` | React hooks, custom hooks (`useXxx`) | blue |
| `atom` | State containers (Jotai atoms, Zustand stores, Recoil atoms) | violet |
| `service` | Domain services, repositories, API clients | green |
| `component` | React components / view components | pink |
| `external` | Browser API, network, third-party SDK | red |

```html
<!-- Sequence player: [flow title] -->
<div class="seq-player" id="FLOW_ID">
  <div class="seq-controls">
    <div class="seq-progress">
      <span class="seq-counter" id="FLOW_ID-counter">0 / 0</span>
      <div class="seq-progress-bar"><div class="seq-progress-fill" id="FLOW_ID-progress"></div></div>
    </div>
    <button class="seq-btn" id="FLOW_ID-prev">←</button>
    <button class="seq-btn" id="FLOW_ID-next">Next →</button>
    <button class="seq-btn" id="FLOW_ID-auto">▶</button>
    <button class="seq-btn" id="FLOW_ID-reset">Reset</button>
  </div>
  <div class="seq-participants" id="FLOW_ID-participants">
    <span class="seq-participants-title">登場人物</span>
    <!-- Participant pills get injected here by the script below -->
  </div>
  <div class="seq-steps" id="FLOW_ID-steps">
    <!-- Step rows get injected here by the script below -->
  </div>
</div>
<script>
  (() => {
    // ── Edit these two arrays per flow ──────────────────────────────────
    const participants = [
      { id: 'user',         label: 'User',                detail: 'human' },
      { id: 'useDrag',      label: 'useElementDrag',      detail: 'hook' },
      { id: 'useTransition',label: 'useElementModeTransitions', detail: 'hook' },
      { id: 'modeAtom',     label: 'boardInteractionModeAtom',  detail: 'atom (reducer)' },
    ];

    // type: 'msg' → { from, to, label, explain }
    // type: 'note' → { actor, text, explain }
    const steps = [
      { type: 'msg',  from: 'user', to: 'useDrag',
        label: 'mouseDown on selected element',
        explain: '対象 element が selected の状態で mousedown。<code>useElementDrag.onMouseDown</code> が走る。' },
      { type: 'note', actor: 'useDrag',
        text: 'wasAlreadySingleSelected = true を記録',
        explain: 'click vs drag を後で判定するため、mousedown 時点で「これは sole-selected だった」を保存。' },
      // … one entry per step from Phase 1d
    ];

    // Type assignment — map participant.id → type for color coding
    const typeOf = {
      user: 'user', useDrag: 'hook', useTransition: 'hook', modeAtom: 'atom',
    };
    // ── End edit zone ───────────────────────────────────────────────────

    const $ = (id) => document.getElementById(id);
    const root = $('FLOW_ID');
    const partsEl = $('FLOW_ID-participants');
    const stepsEl = $('FLOW_ID-steps');
    const counter = $('FLOW_ID-counter');
    const progress = $('FLOW_ID-progress');
    const prevBtn = $('FLOW_ID-prev');
    const nextBtn = $('FLOW_ID-next');
    const autoBtn = $('FLOW_ID-auto');
    const resetBtn = $('FLOW_ID-reset');

    function actorPill(id, label, detail) {
      const t = typeOf[id] || 'service';
      return `<span class="seq-actor" data-actor="${id}" data-type="${t}">${label}` +
             (detail ? `<span class="seq-participant-detail-type">${detail}</span>` : '') +
             `</span>`;
    }

    // Render participants bar
    participants.forEach(p => partsEl.insertAdjacentHTML('beforeend', actorPill(p.id, p.label, p.detail)));

    // Render all step rows up front; we toggle .seq-step-current to advance.
    steps.forEach((s, i) => {
      const n = i + 1;
      let html = `<div class="seq-step seq-step-${s.type}" data-step="${n}">`;
      html += `<div class="seq-step-number">${n}</div><div>`;
      if (s.type === 'msg') {
        html += `<div class="seq-msg-line">${actorPill(s.from, s.from)}<span class="seq-arrow">→</span>${actorPill(s.to, s.to)}</div>`;
        html += `<div class="seq-msg-label">${s.label}</div>`;
      } else {
        html += `<div class="seq-note-actor">${actorPill(s.actor, s.actor)} (内部)</div>`;
        html += `<div class="seq-note-text">${s.text}</div>`;
      }
      html += `<div class="seq-step-explain">${s.explain}</div></div></div>`;
      stepsEl.insertAdjacentHTML('beforeend', html);
    });

    let current = 0; let autoTimer = null;
    const total = steps.length;

    function render() {
      counter.textContent = `${current} / ${total}`;
      progress.style.width = `${(current / total) * 100}%`;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === total;
      stepsEl.querySelectorAll('.seq-step').forEach((el, i) => {
        el.classList.toggle('seq-step-current', i + 1 <= current);
      });
      // Scroll the current step into view inside the player
      if (current > 0) {
        const target = stepsEl.querySelector(`[data-step="${current}"]`);
        if (target) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '▶'; }

    prevBtn.addEventListener('click', () => { if (current > 0) { current--; stopAuto(); render(); } });
    nextBtn.addEventListener('click', () => { if (current < total) { current++; render(); } });
    autoBtn.addEventListener('click', () => {
      if (autoTimer) { stopAuto(); return; }
      if (current === total) current = 0;
      autoBtn.textContent = '⏸';
      autoTimer = setInterval(() => {
        if (current < total) { current++; render(); } else { stopAuto(); }
      }, 900);
    });
    resetBtn.addEventListener('click', () => { current = 0; stopAuto(); render(); });

    render();
  })();
</script>
```

**Usage**: Repeat one player block per flow section. Each `FLOW_ID` must be unique on the page (also rename the four `$(FLOW_ID-…)` lookups). The number of `steps` entries should match the function/transition count from Phase 1d. Aim for 6-15 steps per player — fewer feels thin, more becomes hard to follow.

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

## Appendix C: Custom State Diagram Template (SVG)

Use when the state machine is rich enough that mermaid's auto-layout becomes a liability — multiple states with named transitions, guard conditions, or a clear spatial story (e.g., "selected sits between idle and editing"). A hand-laid-out SVG gives you full control of node placement, transition labels, and the active-state highlight that the demo wires to.

The template provides four state nodes laid out in a row with transitions between them. Adapt node count, layout coordinates, and transition labels to the actual state machine extracted in Phase 1c.

```html
<div class="state-diagram">
  <svg viewBox="0 0 820 320" class="state-diagram-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Arrowhead marker reused by every transition line -->
      <marker id="state-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#6b7280"/>
      </marker>
    </defs>

    <!-- State nodes — each is a <g class="state-node-group"> with a rect + labels -->
    <g class="state-node-group" data-state="idle">
      <rect class="state-node" x="40"  y="120" width="140" height="80" rx="10"/>
      <text class="state-node-label" x="110" y="155">idle</text>
      <text class="state-node-sub"   x="110" y="178">kind: 'idle'</text>
    </g>
    <g class="state-node-group" data-state="selected">
      <rect class="state-node" x="240" y="120" width="160" height="80" rx="10"/>
      <text class="state-node-label" x="320" y="152">selected</text>
      <text class="state-node-sub"   x="320" y="175">kind: 'selected'</text>
      <text class="state-node-sub"   x="320" y="190">+ elementIds[]</text>
    </g>
    <g class="state-node-group" data-state="editing">
      <rect class="state-node" x="460" y="120" width="160" height="80" rx="10"/>
      <text class="state-node-label" x="540" y="152">editing</text>
      <text class="state-node-sub"   x="540" y="175">kind: 'editing'</text>
      <text class="state-node-sub"   x="540" y="190">+ elementId</text>
    </g>
    <g class="state-node-group" data-state="dragging">
      <rect class="state-node" x="660" y="120" width="140" height="80" rx="10"/>
      <text class="state-node-label" x="730" y="155">dragging</text>
      <text class="state-node-sub"   x="730" y="178">kind: 'dragging'</text>
    </g>

    <!-- Transitions: path from one node edge to another's edge + label centered above -->
    <path class="state-transition" d="M180,160 L240,160"/>
    <text class="state-transition-label" x="210" y="150" text-anchor="middle">SELECT_ELEMENT</text>

    <path class="state-transition" d="M400,160 L460,160"/>
    <text class="state-transition-label" x="430" y="150" text-anchor="middle">ENTER_EDIT_MODE</text>

    <path class="state-transition" d="M620,160 L660,160"/>
    <text class="state-transition-label" x="640" y="150" text-anchor="middle">START_DRAG</text>

    <!-- Return / escape transitions arc back -->
    <path class="state-transition" d="M460,180 C420,240 240,240 240,180"/>
    <text class="state-transition-label" x="350" y="245" text-anchor="middle">EXIT_EDIT_MODE</text>

    <path class="state-transition" d="M240,140 C160,80 100,80 100,140"/>
    <text class="state-transition-label" x="170" y="80" text-anchor="middle">CLEAR_SELECTION</text>
  </svg>
</div>
```

**Notes:**
- Add `class="state-active"` to a `<rect class="state-node">` to highlight that node (e.g., when the interactive demo's current state is `editing`).
- Add `class="state-transition-active"` to a `<path>` to highlight a transition (useful when the sequence player advances).
- Keep `viewBox` proportional to your node layout. The SVG scales responsively; the `style-css` declares `.state-diagram-svg { max-width: 100%; height: auto; }`.
- Guard conditions go in the transition label as `EVENT [guard]` (e.g., `ENTER_EDIT_MODE [kind=selected]`). Keep labels short — long ones overflow.
- If the diagram exceeds ~8 states, split into two sub-diagrams instead of cramming.

**Wiring to the interactive demo (optional)**: when Pattern 1 from Appendix B is in use, you can mirror the demo's current state into this diagram by toggling the `state-active` class on the matching `<rect>` from inside `render()`. Use `document.querySelector('[data-state="' + state.kind + '"] rect')` to find the right node.

## Appendix D: Architecture Diagram Template (ByteByteGo-inspired)

Use when the topic is a system flow — multiple components handing data off to each other (server → queue → worker → db, or controller → service → repository → cache → external API). The diagram shows components as iconic primitive shapes (rectangle = server, cylinder = database, parallelogram = queue, etc.), connects them with arrows, and overlays numbered step bubbles. Animated dashed strokes on arrows convey "data is flowing." A step-through controller pairs the diagram with a caption that explains what's happening at each step.

### Component icon primitives

Use these inline SVG shapes — they replicate the draw.io look ByteByteGo uses without requiring an external icon library. Each icon is a `<g>` group; set `transform="translate(x, y)"` to place it.

```html
<!-- Reusable icon definitions — paste once in <defs> at the top of the SVG -->
<defs>
  <!-- Server: simple rounded rectangle -->
  <symbol id="icon-server" viewBox="0 0 100 60">
    <rect class="arch-icon-server" x="2" y="2" width="96" height="56" rx="6"/>
    <line x1="12" y1="20" x2="88" y2="20" stroke="#3b82f6" stroke-opacity="0.4"/>
    <line x1="12" y1="32" x2="88" y2="32" stroke="#3b82f6" stroke-opacity="0.4"/>
    <line x1="12" y1="44" x2="88" y2="44" stroke="#3b82f6" stroke-opacity="0.4"/>
  </symbol>

  <!-- Database: cylinder (top ellipse + side rectangle + bottom curve) -->
  <symbol id="icon-db" viewBox="0 0 100 80">
    <path class="arch-icon-db" d="M 5 12 Q 5 0 50 0 Q 95 0 95 12 L 95 68 Q 95 80 50 80 Q 5 80 5 68 Z"/>
    <ellipse class="arch-icon-db" cx="50" cy="12" rx="45" ry="8"/>
  </symbol>

  <!-- Queue: rectangle with internal divider lines -->
  <symbol id="icon-queue" viewBox="0 0 120 50">
    <rect class="arch-icon-queue" x="2" y="2" width="116" height="46" rx="4"/>
    <line x1="30"  y1="2" x2="30"  y2="48" stroke="#f59e0b" stroke-opacity="0.5"/>
    <line x1="58"  y1="2" x2="58"  y2="48" stroke="#f59e0b" stroke-opacity="0.5"/>
    <line x1="86"  y1="2" x2="86"  y2="48" stroke="#f59e0b" stroke-opacity="0.5"/>
  </symbol>

  <!-- Cache: hexagon-ish (octagon) -->
  <symbol id="icon-cache" viewBox="0 0 100 60">
    <polygon class="arch-icon-cache" points="20,2 80,2 98,30 80,58 20,58 2,30"/>
  </symbol>

  <!-- Client (browser / mobile) — rounded rectangle with header bar -->
  <symbol id="icon-client" viewBox="0 0 100 70">
    <rect class="arch-icon-client" x="2" y="2" width="96" height="66" rx="6"/>
    <rect class="arch-icon-client" x="2" y="2" width="96" height="14" rx="6"/>
    <circle cx="12" cy="9" r="2" fill="#10b981" fill-opacity="0.6"/>
    <circle cx="20" cy="9" r="2" fill="#10b981" fill-opacity="0.6"/>
  </symbol>

  <!-- API gateway: chevron / pointed pentagon -->
  <symbol id="icon-gateway" viewBox="0 0 100 60">
    <polygon class="arch-icon-gateway" points="2,2 80,2 98,30 80,58 2,58"/>
  </symbol>

  <!-- External service: dashed-border box -->
  <symbol id="icon-external" viewBox="0 0 100 60">
    <rect class="arch-icon-external" x="2" y="2" width="96" height="56" rx="4"/>
  </symbol>

  <!-- Arrow head marker reused by every arch-arrow -->
  <marker id="arch-arrow-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="#6b7280"/>
  </marker>
</defs>
```

### Full architecture diagram template

```html
<div class="arch-diagram">
  <svg viewBox="0 0 900 380" class="arch-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- (Paste the <defs> block above here) -->

    <!-- Optional layer bands — uncomment if the diagram is multi-tiered -->
    <!--
    <rect class="arch-band" x="20"  y="20"  width="860" height="80"/>
    <text class="arch-band-label" x="30" y="40">CLIENT</text>
    <rect class="arch-band" x="20"  y="120" width="860" height="100"/>
    <text class="arch-band-label" x="30" y="140">SERVER</text>
    <rect class="arch-band" x="20"  y="240" width="860" height="120"/>
    <text class="arch-band-label" x="30" y="260">DATA</text>
    -->

    <!-- Components — one <g class="arch-component" data-step-from="N" data-step-to="M"> per icon -->
    <g class="arch-component" data-component="client" data-step-from="0" data-step-to="999">
      <use href="#icon-client" x="40" y="40" width="100" height="70"/>
      <text class="arch-component-label" x="90" y="125">Client</text>
      <text class="arch-component-sub"   x="90" y="140">React app</text>
    </g>

    <g class="arch-component" data-component="gateway" data-step-from="1" data-step-to="999">
      <use href="#icon-gateway" x="220" y="45" width="100" height="60"/>
      <text class="arch-component-label" x="270" y="125">API Gateway</text>
      <text class="arch-component-sub"   x="270" y="140">routes + auth</text>
    </g>

    <g class="arch-component" data-component="server" data-step-from="2" data-step-to="999">
      <use href="#icon-server" x="400" y="45" width="100" height="60"/>
      <text class="arch-component-label" x="450" y="125">App Server</text>
      <text class="arch-component-sub"   x="450" y="140">controller + service</text>
    </g>

    <g class="arch-component" data-component="cache" data-step-from="3" data-step-to="999">
      <use href="#icon-cache" x="580" y="50" width="100" height="60"/>
      <text class="arch-component-label" x="630" y="125">Cache</text>
      <text class="arch-component-sub"   x="630" y="140">Redis</text>
    </g>

    <g class="arch-component" data-component="db" data-step-from="4" data-step-to="999">
      <use href="#icon-db" x="760" y="40" width="100" height="80"/>
      <text class="arch-component-label" x="810" y="135">Database</text>
      <text class="arch-component-sub"   x="810" y="150">Postgres</text>
    </g>

    <!-- Arrows between components. data-step matches the step the arrow lights up on. -->
    <path id="arrow-1" class="arch-arrow arch-arrow-animated" data-step="1" d="M140,75 L220,75"/>
    <text class="arch-arrow-label" x="180" y="65" text-anchor="middle">HTTP POST /order</text>

    <path id="arrow-2" class="arch-arrow arch-arrow-animated" data-step="2" d="M320,75 L400,75"/>
    <text class="arch-arrow-label" x="360" y="65" text-anchor="middle">authorized request</text>

    <path id="arrow-3" class="arch-arrow arch-arrow-animated" data-step="3" d="M500,75 L580,80"/>
    <text class="arch-arrow-label" x="540" y="65" text-anchor="middle">lookup cached</text>

    <path id="arrow-4" class="arch-arrow arch-arrow-animated" data-step="4" d="M680,80 L760,80"/>
    <text class="arch-arrow-label" x="720" y="65" text-anchor="middle">cache miss → query</text>

    <!-- Numbered step bubbles — placed on the arrow midpoints or component corners -->
    <g class="arch-step-bubble-group" data-step="1">
      <circle class="arch-step-bubble" cx="180" cy="75" r="13"/>
      <text class="arch-step-number" x="180" y="75">1</text>
    </g>
    <g class="arch-step-bubble-group" data-step="2">
      <circle class="arch-step-bubble" cx="360" cy="75" r="13"/>
      <text class="arch-step-number" x="360" y="75">2</text>
    </g>
    <g class="arch-step-bubble-group" data-step="3">
      <circle class="arch-step-bubble" cx="540" cy="73" r="13"/>
      <text class="arch-step-number" x="540" y="73">3</text>
    </g>
    <g class="arch-step-bubble-group" data-step="4">
      <circle class="arch-step-bubble" cx="720" cy="80" r="13"/>
      <text class="arch-step-number" x="720" y="80">4</text>
    </g>
  </svg>

  <!-- Step caption + controls (reuses .seq-btn from the sequence player CSS) -->
  <div class="arch-step-caption" id="ARCH_ID-caption">
    <div class="arch-step-caption-index" id="ARCH_ID-counter">0 / 4</div>
    <div class="arch-step-caption-title" id="ARCH_ID-title">Press Next to start.</div>
    <div class="arch-step-caption-body"  id="ARCH_ID-body"></div>
  </div>
  <div class="seq-controls" style="margin-top:8px">
    <button class="seq-btn" id="ARCH_ID-prev">←</button>
    <button class="seq-btn" id="ARCH_ID-next">Next →</button>
    <button class="seq-btn" id="ARCH_ID-auto">▶</button>
    <button class="seq-btn" id="ARCH_ID-reset">Reset</button>
  </div>
</div>
<script>
  (() => {
    // ── Edit per architecture diagram ────────────────────────────────────
    const captions = [
      { title: 'Client sends HTTP POST /order', body: 'ブラウザ React app から checkout button が押されると <code>fetch</code> で gateway へ。' },
      { title: 'Gateway authorizes and forwards', body: 'JWT 検証後、内部 service へリクエストを forward。' },
      { title: 'App server checks cache first', body: 'order detail を Redis から lookup。hit したら DB を avoid。' },
      { title: 'Cache miss falls through to DB', body: '<code>SELECT * FROM orders WHERE id=$1</code>。結果を cache に書き戻してからレスポンス。' },
    ];
    // ── End edit zone ────────────────────────────────────────────────────

    const root = document.querySelector('.arch-diagram');
    const $ = (id) => document.getElementById(id);
    const counter = $('ARCH_ID-counter');
    const titleEl = $('ARCH_ID-title');
    const bodyEl  = $('ARCH_ID-body');
    const prevBtn = $('ARCH_ID-prev');
    const nextBtn = $('ARCH_ID-next');
    const autoBtn = $('ARCH_ID-auto');
    const resetBtn = $('ARCH_ID-reset');

    let current = 0; let autoTimer = null;
    const total = captions.length;

    function render() {
      counter.textContent = `${current} / ${total}`;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === total;

      // Components: pending until their step-from is reached
      root.querySelectorAll('.arch-component').forEach(c => {
        const from = parseInt(c.dataset.stepFrom || '0', 10);
        c.classList.toggle('arch-component-pending', current < from);
      });
      // Arrows: active only when their step is exactly current
      root.querySelectorAll('.arch-arrow').forEach(a => {
        const step = parseInt(a.dataset.step, 10);
        a.classList.toggle('arch-arrow-active', step === current);
      });
      // Step bubbles: active when their step ≤ current
      root.querySelectorAll('.arch-step-bubble').forEach(b => {
        const step = parseInt(b.parentElement.dataset.step, 10);
        b.classList.toggle('arch-step-bubble-active', step <= current && current > 0);
      });

      if (current === 0) {
        titleEl.textContent = 'Press Next to start.';
        bodyEl.innerHTML = '';
      } else {
        titleEl.textContent = captions[current - 1].title;
        bodyEl.innerHTML = captions[current - 1].body;
      }
    }

    function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '▶'; }

    prevBtn.addEventListener('click', () => { if (current > 0) { current--; stopAuto(); render(); } });
    nextBtn.addEventListener('click', () => { if (current < total) { current++; render(); } });
    autoBtn.addEventListener('click', () => {
      if (autoTimer) { stopAuto(); return; }
      if (current === total) current = 0;
      autoBtn.textContent = '⏸';
      autoTimer = setInterval(() => {
        if (current < total) { current++; render(); } else { stopAuto(); }
      }, 1100);
    });
    resetBtn.addEventListener('click', () => { current = 0; stopAuto(); render(); });

    render();
  })();
</script>
```

**Adaptation notes:**
- Each `<g class="arch-component">` uses `data-step-from` to say "this component appears at step N" (set to `0` for components present from the start). Lower step numbers reveal the source of the flow first.
- Each arrow's `data-step` matches the step where data flows through that arrow. Arrows have `arch-arrow-animated` for the dashed-flow visual; that animation runs whenever the arrow exists. The `arch-arrow-active` class also turns the arrow blue while it's the current step.
- Numbered bubbles activate cumulatively (1 lights → 1+2 light → 1+2+3 light) to make the path's progress visible at a glance.
- Replace `ARCH_ID` with a unique slug per diagram if a single page has multiple architecture diagrams.
- The `<defs>` icon library only needs to be inlined once per page (the first `.arch-diagram` SVG). Subsequent diagrams can `<use href="#icon-server"/>` etc. without re-defining.
- Skip the layer bands (`.arch-band`) when the diagram is single-tier. Use them when the topic explicitly contrasts client / server / data layers.
- For pure data-pipeline content with no user interaction, this template is the visual companion to Appendix B Pattern 2 — pair them so the player advances both the architecture animation and the optional code-trace simultaneously.
