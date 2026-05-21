# Design: /guide Visual-First Redesign

**Status**: Approved (grill-with-docs session 2026-05-20)
**Scope**: `skills/guide-generation/SKILL.md`, `skills/guide-generation/assets/style.css`

## Context

The current `/guide` skill produces HTML guides that lean heavily on prose with a text-based Sequence Player as the primary "interactive" element. The Sequence Player's animation is opacity-step-through on text rows — visually static, indistinguishable from reading prose in order.

The user's intent for HTML output (vs. Markdown) is to escape mermaid-style auto-layout and produce visually distinctive, mechanism-revealing diagrams. The current SKILL.md does not enforce that intent strongly enough — writers fall back to the Sequence Player and mermaid because they are the easiest options.

This redesign tightens the skill around four principles: a topic-derived **Persona Card** as a writing discipline, a **Visual-First** hard rule, a **Meaningful Animation** rule that bans opacity-step text reveals, and **1-item-1-content** as a structural constraint across all containers.

## Decisions

### D1. Sequence Player: text-list form fully removed

The existing Appendix A (actor pills + step rows with opacity advance) is deleted. No fallback retained.

**Why**: keeping it as a fallback creates a gravity well — it is the shortest pattern to write, so writers will use it under time pressure. Removing the form forces the new patterns.

### D2. Replace with two SVG sub-patterns in Appendix A

| Sub-pattern | When to use |
|-------------|-------------|
| **UML sequence diagram** (default) | Actor-to-actor message order is the story. Vertical actor lanes, horizontal message arrows. |
| **Stage diagram** (exceptional) | All three hold: each step produces visible state change on the receiver, actor spatial position has semantic meaning, actor count ≤4. |

If both sub-patterns fit, choose UML (safer default).

### D3. UML sub-pattern: cumulative draw + lifeline activation

- Arrows are pre-rendered invisible (`stroke-dasharray` = path length, `stroke-dashoffset` = path length).
- On Next: previous arrows remain drawn but muted. New arrow animates `stroke-dashoffset → 0` over ~600ms. Current arrow highlighted (color + thickness).
- On Prev: latest arrow shrinks back to invisible.
- Optional lifeline activation bar: thin vertical rectangle on the receiver's lane, visible only while that step is current.

### D4. Stage sub-pattern: moving dot + state badge

- Each step: a dot translates from sender to receiver along a path (~600ms).
- On arrival: receiver's state badge updates (counter / state text / list-item append / color change). Writer picks the badge form per topic.
- Required: every step must produce a visible badge change on the receiver. If a step has no visible change, the topic does not qualify for Stage — use UML instead.
- Cumulative: previously-changed receivers retain their accumulated state. Prev reverts the latest change.

### D5. One caption per step (replaces multi-line explain)

Each step has exactly:

- **Title** (1 verb phrase, ~5-8 words) shown as the message label on the arrow / dot
- **Body** (1-2 sentences) shown in a caption box below the visual that updates per step

The current `explain` field (paragraph-per-step) is removed. Caption box mirrors Appendix D's `arch-step-caption`.

### D6. Persona Card (writer-only, topic-derived)

Added as Phase 1 substep **1f**, required at all levels (L1/L2/L3).

Writer composes a card with three fields:

- **Knows already** (≥2 items) — prerequisite knowledge the reader already has
- **Has never seen** (≥3 items) — terms / concepts that must be inline-defined on first use
- **Why reading** (1 sentence) — what the reader can do / answer after the guide

The card is **not surfaced** in the output HTML. It functions as a writing-time contract: every "Has never seen" term must be inline-defined the first time it appears in the body.

Persona is composed AFTER investigation (1a–1e) so it can use specific code terms in "Has never seen".

### D7. Reader Profile section retained (separate from Persona Card)

The existing "Reader Profile" rule (universal writing constraints — middle-school comprehension, one idea per sentence, analogy before mechanism, etc.) stays as-is. It is the universal regime; Persona Card is the per-guide instance. Both required.

### D8. Visual-First: hard rule, all levels

Every section that explains a mechanism MUST open with a diagram (SVG sequence / Stage / state / arch). Prose follows the diagram and references it.

**Mechanism section** = any section whose title is shaped like "How X works" / "X flow" / "X transition" / "X lifecycle", or that contains `<pre><code>` blocks demonstrating logic.

**Allowed exceptions** (no diagram required):

- Overview / 概要 section (analogy first, overview diagram optional)
- "Why this design" rationale section
- Persona Card / Scope callout sections (if used)

The existing L1 rule "No sequence player at L1 — prose is enough" is revised: L1 sections must lead with a small (4-6 step) UML or Stage sub-pattern, OR a small state / arch diagram. The 300-500 line budget for L1 accommodates this — a small SVG is ~20 lines and typically displaces ~50 lines of equivalent prose.

### D9. Meaningful Animation rule

**Principle**: every animation in the output must convey one of:

- State change (badge / color / position represents a state)
- Data movement (something visibly travels from A to B)
- Causation (one element's change triggers another's visible change)

**Banned** (enumeration, not exhaustive):

- Opacity step-through on text (current Sequence Player's `opacity: 0.45 → 1` advance)
- Text fade-in / slide-in for sequential reveal
- Typewriter / per-character reveals
- Decorative spin / pulse / bounce with no semantic tie

**Approved** (enumeration):

- `stroke-dashoffset` path draw (arrows drawing themselves)
- Marching-ants / dashed-flow on a path (data in motion) — existing `arch-flow`
- Position translation of a dot/token from one actor to another
- State badge text/color transition on receiver
- `state-active` toggle on state-diagram nodes
- Progressive component activation (component appears at step N) — existing Appendix D

### D10. mermaid policy tightening

| Content | Allowed format |
|---------|----------------|
| Anything with flow / arrows / message passing | mermaid **forbidden**; use hand-laid-out SVG |
| Concept classification tree (taxonomy, is-a relations, no flow) | mermaid `graph TD` allowed |

The current "simple 3-5 box overview" mermaid allowance is removed — overview implies flow, which is precisely where mermaid auto-layout tangles.

### D11. 1-item-1-content rule (all container levels)

Every container in the output holds exactly one focus:

- **Section** — one question answered. Title with "and" / "や" / "+" is a split signal.
- **Callout** (`<div class="note">`, `<div class="insight">`) — one gotcha or one design decision per callout. Never bundle.
- **Step caption** — Title = 1 verb phrase; Body = 1 fact OR 1 why (not both).
- **Paragraph** — 1 idea (existing rule from `document-quality.md`).
- **Diagram** — 1 abstraction level (existing rule from `document-quality.md`).

Self-check phrase: if summarizing a container requires "X **and also** Y", the container must be split.

### D12. Appendix B Pattern 2 removed

The old data-driven step-through animation (Pattern 2) is mechanically identical to the new Stage sub-pattern (D4). Pattern 2 is deleted; Appendix B now contains only Pattern 1 (interactive stage with user-driven state machine).

Phase 2 (Demo Feasibility) wording updates: when a demo is included, choose between Pattern 1 (user-driven interactive) and the Stage sub-pattern of Appendix A (auto-advancing).

### D13. Optional "Scope" callout (separate from Persona Card)

A reader-facing "Scope" callout can appear at the top of the HTML when the intent's scope is not self-evident. Two fields:

- **Covers** (1 line) — what this guide explains
- **Does not cover** (1 line) — adjacent topics deliberately excluded

This is reader navigation, not persona surfacing (Q5 reaffirmed: persona stays internal).

### D14. Appendix C (state diagram) retained unchanged

Appendix C and the Stage sub-pattern serve different intents:

- **Appendix C** — static structure: the entire state machine on one diagram (all states, all transitions, all guards). No player. Used to answer "what are the states and how are they connected?"
- **Stage sub-pattern** — dynamic walkthrough: one specific run of state changes over time, advanced by the player. Used to answer "how does this state come to be in this scenario?"

No overlap. Diagram-choice table will document the distinction.

## Surface area

Files modified:

- `skills/guide-generation/SKILL.md`
  - Add "Persona Card" sub-section under Reader Profile
  - Insert Phase 1 substep 1f
  - Add Visual-First section
  - Add Meaningful Animation section
  - Add 1-item-1-content section
  - Rewrite diagram-choice table per D10
  - Replace Appendix A entirely (UML + Stage templates)
  - Update Appendix B (remove Pattern 2, update Phase 2 references)
  - Update Phase 4 references to old Sequence Player
- `skills/guide-generation/assets/style.css`
  - Remove `.seq-step` / `.seq-actor` / `.seq-msg-*` rules (old player)
  - Add `.uml-seq-*` rules (lanes, lifelines, animated arrows, activation bars)
  - Add `.stage-seq-*` rules (actors, moving dots, state badges)
  - Keep `.arch-*` (Appendix D), `.state-*` (Appendix C), `.demo-*` (Appendix B Pattern 1) unchanged

Files NOT modified:

- `commands/guide.md` (no parameter changes)
- `agents/*.md` (no agent changes)
- `rules/document-quality.md` (existing rules subsume / complement the new ones; no edits needed)
- `assets/head.html` (CDN deps unchanged)

## Out of scope

- Multi-page bundle behavior (overflow rule unchanged)
- Research command (`/research`) — separate skill
- Existing example guide outputs in `claudedocs/investigations/` — not regenerated as part of this redesign

## Open questions

None — all 14 grilled decisions resolved + 3 deferred-then-decided (D7 Reader Profile keep, D13 Scope callout, D14 Appendix C retention).
