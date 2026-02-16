---
name: verification-before-completion
description: Use when about to claim a task is done, report success, or mark something as complete.
---

# Verification Before Completion

No completion claims without fresh verification evidence.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

Run the command. Read the output. THEN claim the result.

## Process

Before saying anything is "done", "working", "fixed", or "passing":

1. **Run the verification command** (test, build, typecheck, lint)
2. **Read the actual output** - not what you expect, what actually happened
3. **Quote the evidence** - include relevant output in your response
4. **Then and only then** claim success or failure

## Forbidden Language (without evidence)

| Forbidden | Why |
|-----------|-----|
| "This should work" | Run it and verify. |
| "Tests are probably passing" | Run them and show output. |
| "The build seems fine" | Build it and confirm. |
| "I believe this fixes..." | Verify the fix. Show proof. |
| "That should be all" | Check for side effects. |

## Verification Checklist

After every implementation change:

```bash
# All four must pass with fresh output
npm run typecheck   # or tsc --noEmit
npm run lint
npm run test
npm run build       # if applicable
```

After each command:
- Read the full output
- If errors exist, fix them before claiming success
- If all pass, use the Completion Report template below

## Completion Report (MANDATORY FORMAT)

Every completion MUST use this template. The structure forces inclusion of next-phase suggestion.

```markdown
## Completion Report

### Verification
- typecheck: [PASS/FAIL + key output]
- lint: [PASS/FAIL + key output]
- test: [PASS/FAIL + count]
- build: [PASS/FAIL or N/A]

### Summary
[What was changed and why]

### Next Phase
→ [Next phase suggestion, e.g. "Ready for /review?"]
```

### Next Phase Lookup

| Completed Phase | Next Phase field |
|----------------|-----------------|
| /praxis:research | → Ready for /praxis:design to create a Design Doc? |
| /praxis:design | → Ready for /praxis:implement to start implementation? |
| /praxis:plan | → Ready for /praxis:implement to start coding? |
| /praxis:implement | → Proceeding to /praxis:review (mandatory — not skippable) |
| /praxis:review | → Run /praxis:compound to capture learnings? |
| Non-phase task | → No next phase needed |

User can accept or skip for most phases. **Exception: /implement → /review is mandatory and not skippable.** The field MUST be present in the report.

## Red Flags (stop and verify)

- You're about to say "done" without running anything
- You're using past tense ("tests passed") without fresh evidence
- You're about to move to the next task without verifying the current one
- You feel confident without having checked — confidence is not evidence
- You're about to claim completion without suggesting the next phase

## Integration

- Works with `code-quality-rules` — the post-implementation checklist requires this skill
- Works with `subagent-driven-development` — reviewers must independently verify, not trust implementer claims
- Works with `getting-started` — Phase Detection triggers entry, this skill triggers exit suggestions
