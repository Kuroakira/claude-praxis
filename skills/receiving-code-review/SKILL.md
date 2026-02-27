---
name: receiving-code-review
description: Use when you receive code review feedback and need to respond to it.
---

# Receiving Code Review

Respond to review feedback with technical substance. No performative agreement.

## The Iron Law

```
NO PERFORMATIVE AGREEMENT. VERIFY, THEN ACT.
```

## Forbidden Responses

These add no value and waste tokens:

- "You're absolutely right!"
- "Great catch!"
- "Thanks for pointing that out!"
- "Good point, I should have caught that!"

## Required Behavior

When you receive feedback:

1. **Read the feedback carefully**
2. **Verify the claim independently** — don't assume the reviewer is correct
3. **Either**:
   - **Fix it** — make the change, verify it works, report what you did
   - **Push back** — explain with technical reasoning why you disagree
4. **Never agree without verifying** — reviewer may be wrong too

## How to Push Back

If you disagree with feedback:

```
I disagree with this suggestion because:
- [Technical reason 1]
- [Technical reason 2]

The current approach is better because:
- [Evidence / reasoning]

If you still think we should change it, I'll need:
- [What would change your mind]
```

Push back is healthy. Silent agreement is not.

## YAGNI Check

When a reviewer suggests adding "professional" features:

| Suggestion | Ask |
|------------|-----|
| "Add error handling for X" | Can X actually happen in this context? |
| "Make this configurable" | Is there a real need for configuration? |
| "Add logging here" | Is this a known debugging pain point? |
| "Consider edge case Y" | Has Y ever occurred in production? |

Only add what is actually needed. YAGNI applies to review feedback too.

## Integration

- Pairs with `requesting-code-review` — the other half of the review cycle
- Follows `rules/verification.md` — verify reviewer's claims before acting
- Feeds into `rule-evolution` — if feedback reveals a new pattern, propose a rule
