# Verification Rules

No completion claims without fresh verification evidence.

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

Run the command. Read the output. THEN claim the result.

## Process

Before saying anything is "done", "working", "fixed", or "passing":

1. **Run the verification command** (test, build, typecheck, lint)
2. **Read the actual output** — not what you expect, what actually happened
3. **Quote the evidence** — include relevant output in your response
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
npm run typecheck
npm run lint
npm run test
npm run build       # if applicable
```

## Completion Report (MANDATORY FORMAT)

```markdown
## Completion Report

### Verification
- typecheck: [PASS/FAIL + key output]
- lint: [PASS/FAIL + key output]
- test: [PASS/FAIL + count]
- build: [PASS/FAIL or N/A]

### Understanding Status (optional — only when /understanding-check was executed)
Understanding Check: [Y] of [X] key decisions explained, [Z] gaps discovered

### Summary
[What was changed and why]

### Next Phase
→ [Next phase suggestion]
```

### Next Phase Lookup

| Completed Phase | Next Phase field |
|----------------|-----------------|
| /claude-praxis:feature-spec | → Ready for /claude-praxis:research or /claude-praxis:design? |
| /claude-praxis:research | → Ready for /claude-praxis:design? |
| /claude-praxis:design | → Ready for /claude-praxis:implement? |
| /claude-praxis:plan | → Ready for /claude-praxis:implement? |
| /claude-praxis:implement | → Run /claude-praxis:compound to capture learnings? |
| /claude-praxis:debug | → Ready for /claude-praxis:implement to fix? |
| /claude-praxis:review | → Run /claude-praxis:compound to capture learnings? |
| /claude-praxis:understanding-check | → Run /claude-praxis:compound to capture learnings? |
| Non-phase task | → No next phase needed |

## Red Flags (stop and verify)

- About to say "done" without running anything
- Using past tense ("tests passed") without fresh evidence
- About to move to the next task without verifying the current one
- Feeling confident without having checked — confidence is not evidence
- About to claim completion without suggesting the next phase
