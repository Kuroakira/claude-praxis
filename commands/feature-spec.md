---
name: feature-spec
description: Capture "what to build and why" through brainstorm-style dialogue — one question at a time, incremental approval per section, before design or implementation begins
disable-model-invocation: false
---

Orchestrate the **FeatureSpec Workflow**.

This is a dialogue-driven workflow. The AI explores the project context, asks one question at a time to build understanding, presents 2-3 approaches for the user to choose from, then constructs the FeatureSpec section by section — each approved individually before assembling the final document.

**How is excluded.** FeatureSpec owns "What and Why." Technical approach belongs in the Design Doc.

## When to Use This (vs. Going Directly to Design)

- **Use FeatureSpec**: The problem or scope is unclear. The user says "I want to add X" but hasn't articulated who benefits, what's in scope, or what success looks like. Multiple interpretations are possible.
- **Skip to Design**: The requirements are already clear. The user can articulate the problem, scope, and success criteria without prompting. What remains is the technical "how."
- **Skip to Implement**: Both requirements and design are clear. A Design Doc exists, or the task is small enough that design is implicit.

## Phase 0: Check Past Learnings

Invoke `check-past-learnings` (role: requirements). Carry relevant learnings forward as context for the dialogue.

## Phase 1: Context Exploration

Before asking anything, explore the project to understand the current state. This prevents asking questions the codebase already answers.

1. **Explore project files**: Read `CLAUDE.md`, recent `claudedocs/`, any existing FeatureSpecs or Design Docs related to the topic
2. **Check recent commits**: Run `git log --oneline -20` to understand recent work direction
3. **Summarize understanding**: Present a brief summary of what the project currently does and what context is relevant to the user's request:

   > "Before we start, here's what I understand about the project context:
   > [2-4 sentences on relevant current state]
   > Does this match your understanding, or is there important context I'm missing?"

**PAUSE**: Wait for the user to confirm or correct context before entering dialogue.

## Phase 2: Dialogue

Ask one question per message. Do not ask multiple questions at once. Prefer concrete choices over open-ended questions — choices reduce cognitive load and surface assumptions faster.

### Question areas (in rough order)

Cover these areas through dialogue. The order can adapt to what the user reveals:

1. **Purpose**: Why does this need to exist? What problem does it solve today?
2. **Constraints**: What constraints exist? (time, compatibility, integration dependencies, non-negotiables)
3. **Success criteria**: How would the user know this is done and working well?
4. **Scope boundary**: What is explicitly out of scope for this effort?
5. **Risks**: What could go wrong at the requirements or adoption level? (not technical risks)

### Question format

Always offer concrete choices when possible:

> **Question**: [one focused question]
>
> **Options** (or suggest your own):
> A) [concrete option]
> B) [concrete option]
> C) [concrete option — often "none of the above / something else"]

### Stopping condition

Stop asking questions when all five areas have enough input to write each FeatureSpec section. It is acceptable to have 3-6 questions total for a focused feature. Do not interrogate beyond what's needed.

**PAUSE after each question**: Wait for the user's answer before asking the next question.

### "Don't ask about How" rule

Never ask questions like "Which implementation approach?", "What technology?", or "How should this work internally?" These belong to the Design Doc. Redirect if the user volunteers How details:

> "That's useful context on the technical side — I'll note it. For the FeatureSpec, let's stay focused on the What and Why: [rephrase as a What/Why question]"

## Phase 3: Proposals

After dialogue is complete, present 2-3 approaches to framing the FeatureSpec. These are not implementation proposals — they are different ways to scope or frame the problem itself.

Present each approach with:
- A short name
- What it includes and excludes
- Key trade-off (1-2 sentences)
- A recommendation with reasoning

### Example proposal format

> ## Proposed Approaches for [Feature Name]
>
> ### Option A: [Name]
> Frames the problem as [description]. Includes [scope]. Excludes [scope].
> **Trade-off**: Narrower scope means faster delivery, but leaves [adjacent problem] unresolved.
>
> ### Option B: [Name]
> Frames the problem more broadly as [description]. Includes [scope].
> **Trade-off**: More complete solution, but requires [dependency/risk].
>
> ### Option C: [Name]
> Minimal version — [description]. Treats this as a first step toward [larger goal].
> **Trade-off**: Low risk, but may need a follow-up effort sooner.
>
> **Recommendation**: Option [X] because [1-2 sentence rationale tied to what the user said].
>
> Which approach fits best, or would you like to adjust one?

**PAUSE**: Wait for the user to select an approach before proceeding.

## Phase 4: Incremental Section Presentation

Present each FeatureSpec section individually and get approval before moving to the next. Do not present the full draft at once — incremental approval surfaces misalignment early.

Present sections in this order:

1. **Problem Statement** → approve
2. **User Stories** → approve
3. **Scope (In / Out)** → approve
4. **Purpose** → approve
5. **Risks** → approve

### Per-section format

> ## [Section Name]
>
> [Section content]
>
> Does this capture it accurately, or should we adjust anything?

If the user requests changes, revise and re-present the section before moving on.

After all five sections are approved, note:

> "All sections approved. I'll now assemble and save the FeatureSpec."

## Phase 5: Write FeatureSpec

Assemble the approved sections into the FeatureSpec template and save the file.

1. **Assemble** the full document from approved sections
2. **Save** to `claudedocs/feature-specs/[feature-name].md` (kebab-case derived from the feature title). Create the directory if it doesn't exist.

### FeatureSpec Template

```markdown
# FeatureSpec: [Feature Name]

## Problem Statement
What problem exists today? What's the current workaround or pain point?

## User Stories
Who benefits, and what does their experience look like? Written as
narratives, not technical specifications.

## Scope
### In Scope
- [what this feature includes]

### Out of Scope
- [what this feature explicitly excludes]

## Purpose
What does success look like? Quantitative (measurable metrics) or
qualitative (user experience improvements).

## Risks
Known risks and uncertainties at the requirement level. Not technical
risks — business risks, user adoption risks, dependency risks.

## References
Links to related discussions, competitor implementations, user feedback,
prior art.
```

**Record to `.claude/context/progress.md`**: Append an entry with the key decisions captured in the spec.

```markdown
## [timestamp] — /claude-praxis:feature-spec: FeatureSpec complete — [feature name]
- Decision: [what was defined — problem, scope, success criteria]
- Rationale: [key scoping decisions — what was included/excluded and why]
- Domain: [topic tag for future matching]
```

## Phase 6: Self-Review

Before presenting the final document, review the assembled FeatureSpec against these four checks:

1. **No placeholders**: Every section has real content. No "TBD", "TODO", or empty sections (unless marked N/A with a reason).
2. **Consistency**: Problem Statement, User Stories, and Scope are internally consistent. If the Problem Statement says X is a pain point, User Stories should address X.
3. **No How content**: No implementation details, technology choices, or architectural decisions. If any slipped in, remove or reframe as constraints.
4. **Bounded scope**: Scope Out section explicitly names at least one thing that is NOT included, preventing scope creep.

If any check fails, fix before presenting.

## Phase 7: Next Step Suggestion

After the FeatureSpec is saved and self-review passes, suggest the next step:

- If the problem space needs exploration → "FeatureSpec saved. Ready for `/claude-praxis:research` to explore approaches before designing?"
- If the approach is already clear → "FeatureSpec saved. Ready for `/claude-praxis:design` to create a Design Doc?"

The user decides which path to take.
