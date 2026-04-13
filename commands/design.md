---
name: design
description: >-
  Create a Design Doc through brainstorm-style dialogue — one-question-at-a-time
  architecture decisions, incremental section approval, demand-driven research.
  TRIGGER when: user asks to create or write a Design Doc, design a system/feature/API,
  or produce an architectural document.
  BLOCKING REQUIREMENT: invoke this command BEFORE drafting any design document or claudedocs file.
  Do NOT write Design Doc content directly.
disable-model-invocation: false
---

Guide the user through a **brainstorm-style Design Doc creation**. Architecture decisions are made
through one-question-at-a-time dialogue. The user participates directly — this is not a batch pipeline.

Format rules: `rules/design-doc-format.md`. Output: `claudedocs/design-docs/[name].md`.

---

## Phase 0: Init

**Check past learnings**: Invoke `check-past-learnings` (role: design). Note any relevant patterns
or prior decisions that should inform this design.

**FeatureSpec check**: If a FeatureSpec exists for this feature, read it.
- Confirm "What" and "Why" are settled — the Design Doc only addresses "How"
- If requirements are still vague, PAUSE and suggest running `/claude-praxis:feature-spec` first
- If FeatureSpec exists: carry its decisions forward — do NOT re-ask What/Why questions in Phase 2

---

## Phase 1: Context Exploration

Explore the design space before asking questions. This informs the quality of choices offered.

1. Read the FeatureSpec (if it exists)
2. Explore related code: existing patterns, integration points, architectural constraints
3. If helpful, invoke `architecture-analysis` to understand structural context
   (not mandatory — use judgment based on scope and complexity)
4. Summarize your understanding of the design space to the user:
   - What the feature needs to do (from FeatureSpec or user's request)
   - Relevant existing patterns and architectural constraints
   - Key design decisions that need to be resolved

Present this summary before starting Phase 2. Ask the user to correct any misunderstandings.

---

## Phase 2: Dialogue — Architecture Decisions

Resolve architecture decisions through one-question-per-message dialogue.

**Rules**:
- One question per message — never bundle multiple decisions
- Always offer concrete choices (A/B/C) with brief trade-off notes
- FeatureSpec decisions are NOT re-asked — only "How" questions here
- If the user's answer reveals a new decision, queue it as the next question
- Stop when all key decisions are resolved (typically 3-6 questions)

**Question format**:

```
**Decision [N]/[estimated total]: [Decision area]**

[1-2 sentences of context explaining why this decision matters]

A) [Option] — [brief trade-off]
B) [Option] — [brief trade-off]
C) [Option] — [brief trade-off]

Which approach? Or describe a different direction.
```

**Decision areas to cover** (select relevant ones based on Phase 1 findings):
- Architecture pattern (e.g., where logic lives, separation of concerns)
- Data storage or state management approach
- Integration boundaries (how this interacts with existing systems)
- Key technical trade-offs (complexity vs. simplicity, consistency vs. performance)
- Error handling and failure modes (if cross-cutting)

After each answer: confirm understanding, note the decision, then ask the next question.

---

## Phase 3: Architecture Proposals

After all decisions are resolved, present 2-3 concrete architecture approaches.

**Format per approach**:

```
### Approach [A/B/C]: [Name]

[mermaid diagram — ≤15 nodes, one abstraction level]

**Trade-offs**
- Strengths: [2-3 points]
- Weaknesses: [2-3 points]

**When to reconsider**: [specific condition that would make another approach better]
```

End with a **Recommendation**: state which approach you recommend and why.

**If the user wants deeper analysis**:
- Perform targeted research: web search, Context7 docs, or deeper codebase exploration
- Present findings before asking for selection

**PAUSE** — ask the user to select an approach (or describe modifications).

---

## Phase 4: Incremental Section Presentation

Present the Design Doc section by section. Each section builds on prior approved sections.

For each section:
1. Draft the section
2. Present it to the user with: `[Section Name] — approve or share feedback`
3. Incorporate feedback before moving to the next section
4. Do NOT present the next section until the current one is approved

**Section order**:

1. **Overview** — One paragraph: what this is and why it matters
2. **Context and Scope** — Background facts; a reader unfamiliar with the project understands the problem
3. **Goals / Non-Goals** — What this design will and won't address
4. **Proposal** — Chosen approach at boundary/interface level; WHY this is the best fit; must include at least one mermaid structural diagram
5. **Alternatives Considered** — Each rejected approach: description, why Proposal is preferred, when to reconsider
6. **Concerns** — Known risks, uncertainties, mitigations

Apply `rules/design-doc-format.md` to every section:
- WHY generously, HOW sparingly
- Timeless voice — no "currently", "recently", "as of now"
- No references to intermediate artifacts (no "per our discussion", "from Phase 2")
- Mermaid diagrams: ≤15 nodes, one abstraction level per diagram

---

## Phase 5: Write Design Doc

Assemble all approved sections into the complete Design Doc.

1. Save to `claudedocs/design-docs/[kebab-case-name].md`
2. Confirm the file path to the user

**Design Doc structure**:

```markdown
# [Feature/Change Name]

## Overview

## Context and Scope

## Goals / Non-Goals
### Goals
### Non-Goals

## Proposal

## Alternatives Considered

## Cross-Cutting Concerns
(include only sections relevant to this design: Security, Privacy, Observability)

## Concerns
```

---

## Phase 6: Self-Review

Review the saved Design Doc against `rules/design-doc-format.md`:

| Check | Criterion |
|-------|-----------|
| WHY over HOW | No implementation details, directory structures, or method logic unless they ARE the design decision |
| Mermaid diagrams | Every diagram ≤15 nodes; one abstraction level per diagram |
| Format compliance | No `####` or deeper headings; no ASCII diagrams; no local file links |
| Alternatives section | Every alternative has: description, why Proposal is preferred, when to reconsider |
| Timeless voice | No temporal expressions ("currently", "recently", "as of now") |
| Self-contained | No references to intermediate artifacts, session context, or research notes |
| Placeholders | No `[TBD]`, `[TODO]`, or incomplete sections |

Fix any issues found. Note what was fixed in a brief summary to the user.

---

## Phase 7: Final Review (Conditional)

**Trigger**: complex design (4+ key decisions resolved in Phase 2, or cross-module impact).

If triggered:
1. Invoke `dispatch-reviewers` with:
   - **Reviewers**: `architecture` + `document-quality` + `devils-advocate`
   - **Tier**: thorough
   - **Target**: the Design Doc path
2. Present findings to the user
3. For each finding: ask whether to incorporate, modify, or skip
4. Apply approved changes to the Design Doc file

If not triggered: skip this phase and proceed to Phase 8.

---

## Phase 8: Next Step Suggestion

Suggest the next phase based on what was produced:

```
## Completion Report

### Output
- Design Doc: claudedocs/design-docs/[name].md
- Key decisions: [list of decisions resolved in Phase 2]

### Next Phase
→ Ready for /claude-praxis:plan?
```

If significant research gaps surfaced during the dialogue, note them:
```
→ Ready for /claude-praxis:plan — with open research questions: [list]
```
