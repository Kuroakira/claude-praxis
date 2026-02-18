---
name: feature-spec
description: Capture "what to build and why" through AI-driven interview — before design or implementation begins
disable-model-invocation: false
---

Invoke the skills `getting-started` and `document-quality-rules`, then orchestrate the **FeatureSpec Workflow**.

This is an interactive workflow. The AI acts as an interviewer — drawing out the problem, scope, and intent through conversation, then producing a structured document for the user to approve.

## When to Use This (vs. Going Directly to Design)

- **Use FeatureSpec**: The problem or scope is unclear. The user says "I want to add X" but hasn't articulated who benefits, what's in scope, or what success looks like. Multiple interpretations are possible.
- **Skip to Design**: The requirements are already clear. The user can articulate the problem, scope, and success criteria without prompting. What remains is the technical "how."
- **Skip to Implement**: Both requirements and design are clear. A Design Doc exists, or the task is small enough that design is implicit.

## Phase 0: Check Past Learnings

Before starting the interview, check if past knowledge is relevant.

1. Read `.claude/context/learnings.md` and `~/.claude/learnings/global-learnings.md` if they exist
2. When a past learning is relevant, carry it forward as context for the interview:
   > "Previously we chose [X] because [rationale]. Does the same context apply here, or is this situation different?"

## Phase 1: Free Form (Phase A)

Let the user describe what they want in their own words. No structure imposed.

1. **Listen actively**: Let the user talk. Don't interrupt with template fields
2. **Identify clarity levels**: As the user talks, mentally categorize:
   - Clear: The user has articulated this well
   - Vague: The user mentioned it but the meaning is ambiguous
   - Missing: The user hasn't addressed this at all
3. **Summarize understanding**: After the user finishes, reflect back what you understood:
   > "Here's what I'm hearing: [summary]. Before I ask follow-up questions, does this capture it?"

**PAUSE**: Confirm the summary is accurate before proceeding to gap-filling.

## Phase 2: Gap-Filling (Phase B)

Ask targeted questions to fill gaps. Not a checklist interrogation — questions are contextual, building on what the user already said.

1. **Ask about gaps**: For each vague or missing area, ask a contextual question:
   - If the user said "I want better error handling" → "Which errors are causing the most pain right now?"
   - If user stories are missing → "Who besides you would interact with this? What does their experience look like?"
   - If scope is unclear → "When you picture this done, what's included and what's explicitly not?"
   - If success criteria are missing → "How would you know this was successful? What changes?"
2. **Adapt depth to clarity**: If the user arrived with clear thinking, keep questions brief. If the idea is nascent, explore more deeply
3. **Don't ask about "How"**: FeatureSpec owns "What and Why." Technical approach belongs in the Design Doc
4. **Respect "N/A"**: If a section genuinely doesn't apply (e.g., infrastructure work with no traditional "User Stories"), accept it with a brief explanation rather than forcing content

**PAUSE**: When all major gaps are filled, confirm readiness to draft:
> "I have enough to draft a FeatureSpec. Ready to see the first version?"

## Phase 3: Draft and Iterate (Phase C)

Produce the FeatureSpec and iterate until the user approves.

1. **Write the draft** following the template structure below
2. **Present the full draft** to the user
3. **Iterate**: If the user provides feedback, revise and present again. This loop continues until the user approves

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

4. **Save the approved FeatureSpec**: Write the final document to `feature-specs/[name].md` (kebab-case name derived from the feature title). Create the `feature-specs/` directory if it doesn't exist

**Record to progress.md**: Append an entry with the key decisions captured in the spec.

```markdown
## [timestamp] — /claude-praxis:feature-spec: FeatureSpec complete — [feature name]
- Decision: [what was defined — problem, scope, success criteria]
- Rationale: [key scoping decisions — what was included/excluded and why]
- Domain: [topic tag for future matching]
```

## Phase 4: Suggest Next Phase

After the FeatureSpec is approved, suggest the next step:

- If the problem space needs exploration → "FeatureSpec approved. Ready for /claude-praxis:research to explore approaches?"
- If the approach is already clear → "FeatureSpec approved. Ready for /claude-praxis:design to create a Design Doc?"

The user decides which path to take. The AI suggests but doesn't force.
