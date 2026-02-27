---
name: rule-evolution
description: Use when a quality issue is discovered during work and should become a permanent rule, or when the human provides feedback that reveals a missing rule.
---

# Rule Evolution

Rules grow from real experience, not abstract best practices. This skill handles adding new rules to `rules/` files and improving workflows from feedback.

## When an Issue Is Discovered

During any phase (implementation, review, design, debugging), if you notice a pattern that should be a rule:

1. **Identify the problem**
   - What is the problem
   - Why is it a problem
   - How should it be handled

2. **Propose to the human**
   ```
   ⚠️ Rule Addition Proposal

   **Detected issue**: [specific problem]
   **Why it's a problem**: [impact]
   **Proposed rule**: [rule to add]
   **Target file**: rules/[code-quality|document-quality|verification|design-doc-format].md

   Add this rule? (y/n)
   ```

3. **If approved** — Add the rule to the appropriate `rules/` file:
   - Code patterns → `rules/code-quality.md`
   - Document patterns → `rules/document-quality.md`
   - Completion/verification patterns → `rules/verification.md`
   - Design Doc format patterns → `rules/design-doc-format.md`
   - Include concrete examples (1 ❌ + 1 ✅)
   - Commit message: `chore: add rule - [rule name]`

4. **If rejected** — Record the reason. Don't force it.

### Rule Addition Format

```markdown
## [Rule Name]

[1-2 sentence description]

```[language]
// ❌ [bad example]
// ✅ [good example]
```
```

## In-Flight Process Improvement

During any phase, if you notice a better way to work, **propose the improvement immediately** — don't wait for /compound.

> "I noticed that [current approach] could be improved by [suggestion]. Want me to update [skill/command] to reflect this?"

This applies to:
- A better research structure
- A missing Design Doc consideration
- A more effective debugging pattern
- An implementation practice that should be standard

## Feedback-Driven Improvement

When the human corrects or adjusts your output, treat it as a potential rule signal:

```
You produce output
    ↓
Human gives feedback ("add more Why", "compare alternatives", "check security")
    ↓
You fix the current work
    ↓
Ask: "This seems like it should always apply. Want me to update [rules/skill/command]?"
    ↓
Human approves → edit directly
```

**Every repeated correction is a missing rule.** If the human says the same thing twice, the framework should have caught it the first time.

## Integration

- **Rules live in**: `rules/` directory (always-applied via @import)
- **Invoked when**: Quality issue discovered, human feedback received, /compound identifies pattern
- **Replaces**: Rule Evolution Protocol sections formerly in code-quality-rules and document-quality-rules skills
