---
name: guide-generation
description: Use when generating single-file interactive HTML walkthroughs of a code topic — produces one self-contained .html with prose, hand-laid-out SVG diagrams, step-through sequence sub-patterns, and (when applicable) a live interactive demo. Invoked by /guide command.
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

## Reader Profile

**Assume zero prior knowledge of the topic the intent asks about.** The reader is a complete beginner — not just to this codebase, but to the entire problem space the intent names. If the intent is "how do atoms work in Jotai", assume the reader has never heard of atoms, state management, React hooks, or even what a "store" is in this context. They are smart, but starting from nothing.

Write at a middle-school comprehension level. The reader is not stupid — they are uninitiated. Uninitiated readers cannot infer what jargon means and cannot fill in unstated prerequisites.

- **One idea per sentence.** Short sentences over compound ones.
- **Analogy before mechanism.** "An atom is like a recipe card — it doesn't hold ingredients itself, it just tells the kitchen what to make. The store is the kitchen." → then show the code.
- **Concrete example before the abstract pattern.** Walk through one specific call, then generalize.
- **Define every technical term inline on first use.** Do not say "this is a reducer" without saying what a reducer is. Do not use "memoization", "currying", "selector", "monad", "atom", "subscription", "side effect", etc. without a parenthetical definition.
- **No framework shorthand.** Do not say "as you know in Jotai..." — the reader does not know. Do not write "the usual store pattern" — write what the store does.
- **Build vocabulary forward.** Term used in Section 3 must have been defined in Section 1 or 2. Do not reference concepts the reader hasn't met yet.
- **Litmus test**: a smart reader who has never used this framework (or any similar framework) opens the HTML cold and reads top to bottom. Can they follow every sentence? If no, simplify.

This rule applies to every section, including code-heavy ones. The code itself does not explain. The prose around it does.

## Persona Card

The Reader Profile above is the universal regime — what writing must look like for any beginner. The Persona Card is the per-guide instance: a writer-only contract composed in Phase 1 substep 1f, used to constrain term introduction during writing.

**The card is internal.** It is NOT surfaced in the output HTML. It exists to discipline the writer.

The writer fills three fields once Phase 1 investigation has surfaced the code's symbols (after substep 1e):

| Field | Required content |
|-------|-----------------|
| **Knows already** (≥2 items) | Prerequisite knowledge the reader has before opening the guide |
| **Has never seen** (≥3 items) | Terms / concepts from the code or domain that the reader has never encountered |
| **Why reading** (1 sentence) | What the reader will be able to do / answer after finishing the guide |

**The contract**: every "Has never seen" term MUST be inline-defined the first time it appears in the body. The Stop-when-answered rule (Phase 4) is satisfied when "Why reading" is answered — adding more material beyond that is a failure regardless of how good the extra material is.

Example for a guide about Jotai atoms:

- **Knows already**: React component basics, useState
- **Has never seen**: atom, store, primitive atom vs derived atom, subscription
- **Why reading**: Understand how Jotai atoms differ from useState and when to choose them

## Visual-First

Every section that explains a mechanism MUST open with a diagram. The diagram is the primary explanation; prose supports it and references it.

A **mechanism section** is any section whose title is shaped like "How X works" / "X flow" / "X transition" / "X lifecycle", or that contains `<pre><code>` blocks demonstrating logic.

**Allowed exceptions** (no diagram required):

- Overview / 概要 section (analogy first; overview diagram optional)
- "Why this design" rationale section
- Reader-facing Scope callout, if used

This rule binds at all levels including L1. A small (4-6 step) UML sub-pattern displaces ~50 lines of equivalent prose with ~20 lines of SVG markup — net neutral or smaller on the L1 budget.

## Meaningful Animation

Every animation in the output HTML must convey one of:

- **State change** — a badge, color, or position represents a state and updates when the state changes
- **Data movement** — something visibly travels from one location to another
- **Causation** — one element's change triggers another's visible change

**Banned patterns** (enumeration, not exhaustive):

- Opacity step-through on text (any pattern that advances by fading text rows in or out)
- Text fade-in / slide-in for sequential reveal
- Typewriter / per-character text reveals
- Decorative spin / pulse / bounce with no semantic tie to content

**Approved patterns**:

- `stroke-dashoffset` path draw — arrow drawing itself (message in motion)
- Marching-ants / dashed-flow on a path — existing `arch-flow` (data in transit)
- Position translation of a dot/token from one actor to another
- State badge text / color transition on a receiver
- `state-active` toggle on state-diagram nodes
- Progressive component activation — existing Appendix D (component appears at step N)

If an animation does not fit the principle AND is not in the approved list, do not add it.

## 1-Item-1-Content

Every container in the output HTML holds exactly one focus. This rule applies at all container levels:

| Container | Constraint |
|-----------|------------|
| Section (`<h2>...`) | One question answered. Title containing "and" / "や" / "+" is a split signal |
| Callout (`<div class="note">`, `<div class="insight">`) | One gotcha per `.note`. One design decision per `.insight`. Never bundle |
| Step caption | Title = 1 verb phrase. Body = 1 fact OR 1 why (not both) |
| Paragraph | 1 idea (also enforced by `rules/document-quality.md`) |
| Diagram | 1 abstraction level (also enforced by `rules/document-quality.md`) |

**Self-check phrase**: when summarizing a container, if you need "X **and also** Y", split the container.

## Intent Calibration

**Read the intent before investigating. The intent's abstraction level controls everything downstream** — investigation depth, section count, output length, demo inclusion. Failing to calibrate produces a 1500-line answer to a 1-sentence question, which is harder to read than the source code itself.

Classify the intent into one of three levels:

| Level | Intent signals | Output budget |
|-------|----------------|---------------|
| **L1 Conceptual (default)** | "explain", "how does X work", "what is", "mental model", "仕組み", "どう動く", "理解したい" | **3-5 sections, 300-500 lines, NO interactive demo, 1 illustrative trace** |
| **L2 Mechanism** | "show how X handles Y", "trace the flow when Z", "フロー", "handle", "処理", "implementation" | 5-8 sections, 600-1000 lines, demo optional, 2-3 traces |
| **L3 Exhaustive** | "all", "complete", "every", "全部", "網羅", "完全", "deep dive", "exhaustive" | 8+ sections, 1000+ lines, demo encouraged |

**Default to L1.** Most questions are conceptual ("how does X work"). Only escalate to L2/L3 when the intent's words explicitly demand it. **When uncertain, drop one level** — better to leave the reader wanting more than to drown them.

**The calibration is binding.** Even if Phase 1 uncovers rich material, do not exceed the level's targets. Surplus findings are context for you, not content for the HTML. The reader's understanding is the goal — exhaustive coverage is not.

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `scope` | Yes | Directory or file path to investigate (e.g., `frontend/src/features/board/`) |
| `intent` | Yes | One-line topic statement framing what to deep-dive (e.g., "interaction state がどう遷移するか") |

## Procedure

### Phase 1: Structured Investigation (scaled to calibrated level)

Investigation depth scales with the level from Intent Calibration. Do not over-investigate — surplus findings will tempt you to over-write.

| Level | Required substeps | Skip |
|-------|-------------------|------|
| L1 | **1a + 1d + 1f** (one happy path + Persona Card) | 1b, 1c (beyond the one path), 1e |
| L2 | **1a, 1b, 1c, 1d, 1f** (2-3 paths if branches are essential to the topic) | 1e unless cross-cuts are the topic itself |
| L3 | **All 6 substeps** | nothing |

Substep 1f (Persona Card) is required at every level — composing it is the contract that constrains term introduction.

**1a. Entry points** — Use Serena `get_symbols_overview` on the scope. Identify what triggers the behavior the intent describes: event handlers, route handlers, public API functions, exported hooks. Record file paths and symbol names.

**1b. Event sources** — Use Serena `find_referencing_symbols` from the entry points outward. Map who calls what: which components wire up the event handlers, which hooks consume the public API. Trace at least two levels of the call chain.

**1c. State shape** — Locate state holders: atoms, stores, `useState`/`useReducer` hooks, class fields, module-level variables. Extract their initial values and all sites where they are updated. Record file path + line range for each.

**1d. Happy path trace** — Pick one representative interaction the intent describes. Walk the full call chain from event source through every function to the final render or output. List each function visited with its file path and line range. This trace becomes the sub-pattern content (the messages in A1 or the dot-transitions in A2).

**1e. Cross-cuts** — Find places where this scope leaks into other modules: imports of scope's symbols from outside, scope's imports of external state or context. Note boundary crossings that the reader should know about.

**1f. Persona Card** — Compose the topic-specific Persona Card defined in the [Persona Card](#persona-card) section. Use the symbols surfaced in 1a-1c to populate "Has never seen" with the specific terms the reader will meet. The card is a writer-only artifact — not surfaced in the output HTML. Required at all levels.

Output: a structured internal mental model + the Persona Card. Optionally save to `claudedocs/scout-reports/[topic-slug]-investigation.md` as a working artifact; this is not required.

### Phase 2: Demo Feasibility Assessment (strict trigger)

Default: **no demo**. A demo doubles output length and rarely helps conceptual understanding.

Include a demo ONLY when ALL of the following are true:

1. **Intent explicitly asks for hands-on**: contains "触る" / "play" / "demo" / "see it working" / "let me try" / "interactive" / "動かして". Mere presence of state in the code is NOT sufficient.
2. **Calibration level is L2 or L3** (L1 conceptual never gets a demo — the reader needs the mental model, not a toy).
3. The state can be modeled in vanilla JS without external dependencies — no need to replicate React reconciliation, network calls, or persistent storage.

If **no demo**: proceed to Phase 3 without a demo section. The UML sequence sub-pattern (Appendix A) is enough for tracing flows.

If **yes demo**: choose between two forms:

- **Appendix B Pattern 1** (user-driven interactive) — when the topic is an event-driven state machine reacting to clicks. The reader participates.
- **Stage sub-pattern of Appendix A** (auto-advancing) — when the topic is a data pipeline or state accumulation with no user input. The reader observes.

Extract the state spec from Phase 1c findings into a small JS-replicable representation. Verify against the actual code before writing.

### Phase 3: Outline Generation (level-aware, internal)

The outline is bounded by the calibration level. Do not exceed the section/length budget.

**L1 outline (3-5 sections, 300-500 lines)**: the reader leaves with a working mental model — nothing more.

1. Topic overview + analogy (no code yet) — 1 paragraph.
2. The mental model — one labeled diagram (custom SVG or simple mermaid `graph LR`, 4-6 nodes) + 2-3 paragraphs naming the key pieces.
3. One illustrative example — a single concrete walk-through from Phase 1d using a small (4-6 step) UML sequence sub-pattern from Appendix A. The diagram leads; 2-3 small code snippets with file refs support it as prose.
4. (Optional) Why this design — 1-2 paragraphs on the *why* if it's non-obvious.

**L2 outline (5-8 sections, 600-1000 lines)**: the reader can trace specific flows on their own.

1. Topic overview + analogy.
2. State shape — what the state IS, table form.
3. Overview diagram — custom SVG state diagram (Appendix C) or architecture diagram (Appendix D).
4-6. One section per significant flow (2-3 max), each opening with a sub-pattern from Appendix A (UML sequence by default; Stage diagram only when all Stage triggers hold).
7. (Optional) Cross-cuts / constraints — 1 paragraph each.
8. (Conditional) Interactive demo — only if Phase 2 said yes.

**L3 outline (8+ sections, 1000+ lines OK)**: exhaustive reference.

Same as L2 plus: all major flows get their own section, cross-cuts get a dedicated section, edge cases get callouts, interactive demo encouraged.

**Section count rule of thumb**: every section earns its place by answering a question the reader would actually ask. If a section's content is "and there's also this internal mechanism", it does not earn a place — fold it into a callout or drop it.

### Phase 4: Write the HTML (one-shot, single narrator)

The main agent writes the entire HTML in one turn. No subagent delegation for writing.

**Stop-when-answered rule**: after drafting each section, ask "does the reader now understand the topic the intent asks about?" If yes, stop adding sections — even if you have more material from Phase 1, even if the level's section budget hasn't been hit. Writing under-budget at L1 is fine when the topic is small. Writing over-budget at L1 is a failure regardless of how good the extra material is.

**Reader-profile check while writing**: every paragraph passes the middle-schooler test. If a paragraph names a framework concept or pattern without defining it inline, rewrite it. If a paragraph builds on a concept that the reader hasn't been introduced to yet, restructure or define-on-first-use.

Required structure:

**`<head>`**: Copy from `assets/head.html`, substitute `{{TITLE}}` with the intent (Japanese OK).

**Inline `<style>` block**: Paste the full contents of `assets/style.css` into a `<style>` element in `<head>`. Do not reference `style.css` as an external file — the output must be self-contained.

**`<body>` per outline**: Each section uses:
- `<h2>` for section title
- `<p>` for prose
- `<pre><code class="language-typescript">` for code references
- `<span class="file-ref">filename.ts:line-range</span>` for inline file references
- `<div class="note">` for gotchas and non-obvious constraints
- `<div class="insight">` for design decisions and "why not X" explanations

**Diagram choice**: pick the format that matches the content. mermaid is forbidden for any content with flow / arrows / message passing.

| Content | Format | Why |
|---------|--------|-----|
| Actor-to-actor message order (call chain, request flow, dispatch trace) | **UML sequence sub-pattern** (Appendix A) | Vertical lanes + horizontal arrows that draw on advance. Preserves call-chain history; current step highlighted |
| Actors with visible state accumulation, ≤4 actors, spatial position has meaning | **Stage sub-pattern** (Appendix A) | Moving dots + state badge updates on receivers. Shows the result emerging |
| State machine with multiple states and transitions (static structure of *all* states) | **Custom SVG state diagram** (Appendix C) | One diagram shows the entire state machine. Different from Stage sub-pattern, which shows one specific run over time |
| System architecture — components handing off data (server / db / queue / cache) | **Architecture diagram** (Appendix D) | Primitive shape icons + numbered step bubbles + animated data-flow arrows |
| Concept classification tree (taxonomy, is-a, no flow) | `<div class="mermaid">` with `graph TD` | Safe when no arrows cross. mermaid auto-layout works for pure trees |
| Anything else with flow / arrows / message passing | **Hand-laid-out SVG required** — mermaid forbidden |

**mermaid is forbidden for flow / arrows / message passing.** Auto-layout tangles lines, defeating the purpose of HTML output (which exists precisely to escape that constraint). mermaid is only allowed for flow-free concept trees. Any other diagram is hand-laid-out SVG.

**Sequence sub-pattern selection**: For each flow section (Phase 1d trace), default to the **UML sub-pattern** of Appendix A. Switch to the **Stage sub-pattern** only when all three triggers hold:

1. Every step produces a visible state change on the receiver (badge / counter / list / color)
2. The actor's spatial position carries semantic meaning
3. Actor count ≤4

If both fit, choose UML (safer default). Color-code actors by type (user / hook / atom / service / component / external).

**Interactive demo** (only when Phase 2 said yes): use the form chosen in Phase 2. **Appendix B Pattern 1** for user-driven event handlers wired to clickable elements with a state machine; **Appendix A Stage sub-pattern** for auto-advancing data pipelines or accumulating state. Demo state transitions must match the actual reducer / state machine logic found in Phase 1c.

## Output Path

Filename: `claudedocs/investigations/YYYY-MM-DD-[topic-slug].html` where:
- `YYYY-MM-DD` is today's date (check the session's current date).
- `[topic-slug]` is a kebab-case slug derived from the intent, max 60 chars.
- If a file with that name already exists, append `-2`, `-3`, etc.

The skill writes ONE file. No accompanying CSS/JS files, no folder.

## Long-output Overflow Rule

If the final HTML would exceed 1500 lines, split into a multi-page bundle at `claudedocs/investigations/YYYY-MM-DD-[topic-slug]/` with `index.html` plus `NN-[section].html` files. This is rare — most topics fit in one file. Do not pre-emptively split; only split when the single-file estimate actually exceeds the threshold.

## Appendix A: Sequence Sub-Patterns (SVG)

Two SVG-based sub-patterns. Pick using the trigger in Phase 4 — default to **UML sub-pattern (A1)**; switch to **Stage sub-pattern (A2)** only when all three Stage conditions hold (visible state change per step / spatial meaning / ≤4 actors).

Both sub-patterns share the actor-type taxonomy below and share a single caption box (Title + Body) that updates per step. Mermaid `sequenceDiagram` is forbidden — its auto-layout tangles lines once messages cross.

**Actor types** — apply to both sub-patterns. Drive color coding via the `data-type` attribute on `<g class="uml-actor">` / `<g class="stage-actor">`:

| `type` | Use for | Color |
|--------|---------|-------|
| `user` | Human input — clicks, keystrokes, gestures | amber |
| `hook` | React hooks, custom hooks (`useXxx`) | blue |
| `atom` | State containers (Jotai atoms, Zustand stores, Recoil atoms) | violet |
| `service` | Domain services, repositories, API clients | green |
| `component` | React components / view components | pink |
| `external` | Browser API, network, third-party SDK | red |

Aim for 6-15 steps per player — fewer feels thin, more becomes hard to follow.

### Sub-pattern A1: UML Sequence Diagram

Vertical actor lanes with horizontal message arrows. The player advances by drawing the next arrow (`stroke-dashoffset` animation, ~600ms) and showing a lifeline activation bar on the receiver. Previously-drawn arrows remain visible in muted color; only the current arrow is highlighted.

**When to use**: actor-to-actor message order is the story (call chain, request flow, dispatch trace). Default sub-pattern.

**Mechanics**:

- All `<path class="uml-arrow">` arrows pre-rendered with `stroke-dasharray = pathLength` + `stroke-dashoffset = pathLength` (initially invisible)
- On Next: previous arrows keep `stroke-dashoffset = 0` in muted color. Current arrow animates `stroke-dashoffset → 0` and is colored as `uml-msg-current` (highlighted)
- On Prev: latest arrow's `stroke-dashoffset` returns to pathLength (un-draws)
- Lifeline activation bar (thin rectangle on receiver's lane) is visible only while that step is current

Replace `FLOW_ID` with a unique identifier per diagram. Adjust the SVG to fit the actual actor count and message count.

```html
<!-- UML sequence sub-pattern: [flow title] -->
<div class="uml-seq" id="FLOW_ID">
  <svg viewBox="0 0 720 360" class="uml-seq-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="FLOW_ID-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#6b7280"/>
      </marker>
    </defs>

    <!-- Actor lanes — one <g class="uml-actor"> per actor. data-type drives color. -->
    <g class="uml-actor" data-actor="user" data-type="user">
      <rect class="uml-actor-box" x="20"  y="20" width="120" height="36" rx="6"/>
      <text class="uml-actor-label" x="80"  y="43">User</text>
      <line class="uml-lifeline" x1="80"  y1="56" x2="80"  y2="340"/>
    </g>
    <g class="uml-actor" data-actor="useDrag" data-type="hook">
      <rect class="uml-actor-box" x="200" y="20" width="160" height="36" rx="6"/>
      <text class="uml-actor-label" x="280" y="43">useElementDrag</text>
      <line class="uml-lifeline" x1="280" y1="56" x2="280" y2="340"/>
    </g>
    <g class="uml-actor" data-actor="modeAtom" data-type="atom">
      <rect class="uml-actor-box" x="420" y="20" width="180" height="36" rx="6"/>
      <text class="uml-actor-label" x="510" y="43">modeAtom</text>
      <line class="uml-lifeline" x1="510" y1="56" x2="510" y2="340"/>
    </g>

    <!-- Lifeline activation bars — visible only when their step is current. -->
    <rect class="uml-activation" data-step="1" x="274" y="90"  width="12" height="40"/>
    <rect class="uml-activation" data-step="2" x="504" y="160" width="12" height="40"/>

    <!-- Message arrows — one <g class="uml-msg"> per arrow. pathLength is used for the draw animation. -->
    <g class="uml-msg" data-step="1">
      <path class="uml-arrow" d="M80,110 L274,110" pathLength="200" marker-end="url(#FLOW_ID-arrow)"/>
      <text class="uml-msg-label" x="177" y="100">mouseDown</text>
    </g>
    <g class="uml-msg" data-step="2">
      <path class="uml-arrow" d="M280,180 L504,180" pathLength="230" marker-end="url(#FLOW_ID-arrow)"/>
      <text class="uml-msg-label" x="392" y="170">SELECT_ELEMENT</text>
    </g>
    <!-- … one <g class="uml-msg" data-step="N"> per message from Phase 1d -->
  </svg>

  <!-- Step caption + controls -->
  <div class="uml-caption">
    <div class="uml-caption-index" id="FLOW_ID-counter">0 / 0</div>
    <div class="uml-caption-title" id="FLOW_ID-title">Press Next to start.</div>
    <div class="uml-caption-body"  id="FLOW_ID-body"></div>
  </div>
  <div class="seq-controls" style="margin-top:8px">
    <button class="seq-btn" id="FLOW_ID-prev">←</button>
    <button class="seq-btn" id="FLOW_ID-next">Next →</button>
    <button class="seq-btn" id="FLOW_ID-auto">▶</button>
    <button class="seq-btn" id="FLOW_ID-reset">Reset</button>
  </div>
</div>
<script>
  (() => {
    // ── Edit per flow ───────────────────────────────────────────────────
    // One entry per <g class="uml-msg"> in the SVG above. Order must match data-step.
    // Title: 1 verb phrase. Body: 1-2 sentences. Use <code>…</code> for symbols.
    const captions = [
      { title: 'User clicks the selected element',
        body: 'A mousedown fires on an already-selected element. <code>useElementDrag.onMouseDown</code> picks it up.' },
      { title: 'Hook dispatches SELECT_ELEMENT',
        body: 'The hook sends an action into the atom reducer, which updates the interaction mode.' },
      // …
    ];
    // ── End edit zone ───────────────────────────────────────────────────

    const $ = (id) => document.getElementById(id);
    const root = document.getElementById('FLOW_ID');
    const counter = $('FLOW_ID-counter');
    const titleEl = $('FLOW_ID-title');
    const bodyEl  = $('FLOW_ID-body');
    const prevBtn = $('FLOW_ID-prev');
    const nextBtn = $('FLOW_ID-next');
    const autoBtn = $('FLOW_ID-auto');
    const resetBtn = $('FLOW_ID-reset');

    // Initialise each arrow's stroke-dasharray so the draw animation works.
    root.querySelectorAll('.uml-arrow').forEach(path => {
      const len = parseFloat(path.getAttribute('pathLength') || '200');
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
    });

    let current = 0; let autoTimer = null;
    const total = captions.length;

    function render() {
      counter.textContent = `${current} / ${total}`;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === total;

      // Arrows: < current → drawn + muted, === current → drawn + highlighted, > current → invisible.
      root.querySelectorAll('.uml-msg').forEach(g => {
        const step = parseInt(g.dataset.step, 10);
        const path = g.querySelector('.uml-arrow');
        const len = parseFloat(path.getAttribute('pathLength') || '200');
        if (step < current) {
          path.style.strokeDashoffset = 0;
          g.classList.remove('uml-msg-current'); g.classList.add('uml-msg-past');
        } else if (step === current) {
          path.style.strokeDashoffset = 0;
          g.classList.add('uml-msg-current'); g.classList.remove('uml-msg-past');
        } else {
          path.style.strokeDashoffset = len;
          g.classList.remove('uml-msg-current', 'uml-msg-past');
        }
      });

      // Activation bars: visible only when their step is exactly current.
      root.querySelectorAll('.uml-activation').forEach(bar => {
        const step = parseInt(bar.dataset.step, 10);
        bar.classList.toggle('uml-activation-active', step === current);
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

- Add one `<g class="uml-actor">` per actor. Position them left-to-right at evenly-spaced x-coordinates; the `<line class="uml-lifeline">` descends from the actor box to the bottom of the SVG.
- Add one `<g class="uml-msg" data-step="N">` per message. The `<path class="uml-arrow">` runs from the sender's lifeline x to the receiver's lifeline x at the y for that step. Set `pathLength` to a stable value (the actual pixel length is fine; ~200 is a sane default).
- Add one `<rect class="uml-activation" data-step="N">` per step on the receiver's lane (centred on the lifeline). It appears only while that step is current.
- Each `FLOW_ID` must be unique on the page. The marker `id` and all `$(FLOW_ID-…)` lookups must be renamed together.
- Self-call (an actor calling itself): draw the arrow as a small clockwise arc on the same lane instead of crossing to another lane.

### Sub-pattern A2: Stage Diagram

Actors arranged spatially as drawn boxes. Each step animates a dot from sender to receiver; on arrival, the receiver's state badge updates visibly (counter / state text / list-item append / color change).

**When to use**: ALL THREE must hold —

1. Every step produces a visible state change on the receiver
2. The actor's spatial position carries semantic meaning (e.g., upstream / downstream layer, role)
3. Actor count ≤4

If any condition fails, use A1 instead. If a step has no visible badge update, the topic does not qualify for A2.

**Mechanics**:

- Each actor is a `<g class="stage-actor">` with `<rect>` body, label, and a `<text class="stage-actor-badge">` whose `textContent` updates per step
- On Next: a single `<circle class="stage-dot">` animates from sender's centre to receiver's centre via `requestAnimationFrame` (~600ms). After arrival, receiver's badge updates
- Cumulative: badge changes persist. Prev applies the reverse and removes the latest visible change
- Initial badge values are read from the SVG on first render and used as the reset baseline

```html
<!-- Stage sub-pattern: [flow title] -->
<div class="stage-seq" id="STAGE_ID">
  <svg viewBox="0 0 720 220" class="stage-seq-svg" xmlns="http://www.w3.org/2000/svg">
    <!-- Actors. Each badge is updated by the script per step. -->
    <g class="stage-actor" data-actor="reducer" data-type="hook">
      <rect class="stage-actor-box" x="60"  y="60" width="160" height="100" rx="8"/>
      <text class="stage-actor-label" x="140" y="95">Reducer</text>
      <text class="stage-actor-badge" id="STAGE_ID-badge-reducer" x="140" y="130">idle</text>
    </g>
    <g class="stage-actor" data-actor="middleware" data-type="service">
      <rect class="stage-actor-box" x="280" y="60" width="160" height="100" rx="8"/>
      <text class="stage-actor-label" x="360" y="95">Middleware</text>
      <text class="stage-actor-badge" id="STAGE_ID-badge-middleware" x="360" y="130">queued: 0</text>
    </g>
    <g class="stage-actor" data-actor="store" data-type="atom">
      <rect class="stage-actor-box" x="500" y="60" width="160" height="100" rx="8"/>
      <text class="stage-actor-label" x="580" y="95">Store</text>
      <text class="stage-actor-badge" id="STAGE_ID-badge-store" x="580" y="130">[ ]</text>
    </g>

    <!-- The moving dot — animated by the script. -->
    <circle class="stage-dot" id="STAGE_ID-dot" cx="140" cy="110" r="8"/>
  </svg>

  <div class="uml-caption">
    <div class="uml-caption-index" id="STAGE_ID-counter">0 / 0</div>
    <div class="uml-caption-title" id="STAGE_ID-title">Press Next to start.</div>
    <div class="uml-caption-body"  id="STAGE_ID-body"></div>
  </div>
  <div class="seq-controls" style="margin-top:8px">
    <button class="seq-btn" id="STAGE_ID-prev">←</button>
    <button class="seq-btn" id="STAGE_ID-next">Next →</button>
    <button class="seq-btn" id="STAGE_ID-auto">▶</button>
    <button class="seq-btn" id="STAGE_ID-reset">Reset</button>
  </div>
</div>
<script>
  (() => {
    // ── Edit per flow ───────────────────────────────────────────────────
    // actorCentre must match the <g class="stage-actor"> centres in the SVG above.
    const actorCentre = {
      reducer:    { x: 140, y: 110 },
      middleware: { x: 360, y: 110 },
      store:      { x: 580, y: 110 },
    };
    // Each step: dot animates from→to, then badge updates per `forward`.
    // `reverse` is applied when going backward (Prev). Title + body match the caption rule.
    const steps = [
      { from: 'reducer', to: 'middleware',
        forward: { middleware: 'queued: 1' },
        reverse: { middleware: 'queued: 0' },
        title: 'Reducer dispatches an action',
        body: 'The reducer emits the action. The middleware receives and queues it.' },
      { from: 'middleware', to: 'store',
        forward: { middleware: 'queued: 0', store: '[ "ADD" ]' },
        reverse: { middleware: 'queued: 1', store: '[ ]' },
        title: 'Middleware drains queue to store',
        body: 'The queued action is applied to the store, mutating its visible state.' },
      // …
    ];
    // ── End edit zone ───────────────────────────────────────────────────

    const $ = (id) => document.getElementById(id);
    const root = document.getElementById('STAGE_ID');
    const dot = $('STAGE_ID-dot');
    const counter = $('STAGE_ID-counter');
    const titleEl = $('STAGE_ID-title');
    const bodyEl  = $('STAGE_ID-body');
    const prevBtn = $('STAGE_ID-prev');
    const nextBtn = $('STAGE_ID-next');
    const autoBtn = $('STAGE_ID-auto');
    const resetBtn = $('STAGE_ID-reset');

    // Capture the initial badge text once so Reset / Prev can restore baseline.
    const baseline = {};
    root.querySelectorAll('.stage-actor-badge').forEach(el => {
      const key = el.id.replace('STAGE_ID-badge-', '');
      baseline[key] = el.textContent;
    });

    function setBadge(actor, value) {
      const el = document.getElementById('STAGE_ID-badge-' + actor);
      if (el) el.textContent = value;
    }

    function rebuildBadgesTo(stepIndex) {
      // Replay forward updates from step 1..stepIndex over the baseline.
      Object.entries(baseline).forEach(([k, v]) => setBadge(k, v));
      for (let i = 0; i < stepIndex; i++) {
        Object.entries(steps[i].forward).forEach(([k, v]) => setBadge(k, v));
      }
    }

    function animateDot(from, to, onDone) {
      const a = actorCentre[from]; const b = actorCentre[to];
      const duration = 600; const start = performance.now();
      dot.style.opacity = 1;
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const ease = t * (2 - t); // easeOutQuad
        dot.setAttribute('cx', a.x + (b.x - a.x) * ease);
        dot.setAttribute('cy', a.y + (b.y - a.y) * ease);
        if (t < 1) requestAnimationFrame(step);
        else { dot.style.opacity = 0; if (onDone) onDone(); }
      }
      requestAnimationFrame(step);
    }

    let current = 0; let autoTimer = null;
    const total = steps.length;

    function render(animate) {
      counter.textContent = `${current} / ${total}`;
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === total;

      if (current === 0) {
        titleEl.textContent = 'Press Next to start.';
        bodyEl.innerHTML = '';
        rebuildBadgesTo(0);
        dot.style.opacity = 0;
        return;
      }

      const s = steps[current - 1];
      titleEl.textContent = s.title;
      bodyEl.innerHTML = s.body;

      if (animate) {
        // Show state up to (current-1), animate the dot, then apply this step's forward update.
        rebuildBadgesTo(current - 1);
        animateDot(s.from, s.to, () => rebuildBadgesTo(current));
      } else {
        rebuildBadgesTo(current);
        dot.style.opacity = 0;
      }
    }

    function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '▶'; }

    prevBtn.addEventListener('click', () => { if (current > 0) { current--; stopAuto(); render(false); } });
    nextBtn.addEventListener('click', () => { if (current < total) { current++; render(true); } });
    autoBtn.addEventListener('click', () => {
      if (autoTimer) { stopAuto(); return; }
      if (current === total) current = 0;
      autoBtn.textContent = '⏸';
      autoTimer = setInterval(() => {
        if (current < total) { current++; render(true); } else { stopAuto(); }
      }, 1400);
    });
    resetBtn.addEventListener('click', () => { current = 0; stopAuto(); render(false); });

    render(false);
  })();
</script>
```

**Adaptation notes:**

- Position actors with their centres on a meaningful spatial axis (left-to-right pipeline, central reducer with peripheral observers, etc.). The spatial layout should reinforce the actor's role.
- `actorCentre` x/y values must match the centre of each actor's box in the SVG.
- Each `STAGE_ID` is unique per diagram; rename the marker, badge ids, dot id, and all `$(STAGE_ID-…)` lookups together.
- If a step's receiver has no badge change, the topic does not qualify for A2 — convert that diagram to A1.

## Appendix B: Interactive Demo Pattern

Appendix B covers the user-driven interactive demo only. For data-driven step-through animation (formerly Pattern 2), use the **Stage sub-pattern of Appendix A** — it provides moving dots + state badge updates with the same step-through controls.

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
- Add `class="state-transition-active"` to a `<path>` to highlight a transition (useful when an Appendix A sub-pattern advances).
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

  <!-- Step caption + controls (reuses the shared .seq-controls / .seq-btn rules) -->
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
- For pure data-pipeline content at the system level (server / db / queue / cache), this architecture template covers it. For actor-level pipelines (reducers, middleware, observers), use the Appendix A Stage sub-pattern instead — the two have different scopes (system vs. actor) and should not be combined in one diagram.


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
