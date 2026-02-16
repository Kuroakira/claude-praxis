---
name: implement
description: Execute the implementation plan — follow the plan task by task with verification
disable-model-invocation: true
---

Invoke skills `code-quality-rules` and `verification-before-completion`, then begin the **Implementation Phase**:

1. Read the implementation plan
2. For plans with 3+ independent tasks, consider using `subagent-driven-development`
3. **Check learnings before starting**: Read `learnings.md` and `global-learnings.md` if they exist. When a past learning is relevant to the current task, present it with its original context and ask if the same reasoning applies:
   > "Previously we chose [X] because [rationale]. Does the same assumption hold here, or has the context changed?"
4. For each task:
   - Follow TDD (RED → GREEN → REFACTOR)
   - **Consult on decision points**: When multiple valid approaches exist (library choice, data structure, error handling strategy, API design, etc.), do NOT decide silently. Present the options with trade-offs and let the human choose:
     > "Two approaches here: A (simpler, less flexible) vs B (more setup, but extensible). Which fits better?"
   - Run verification after each change (typecheck, lint, test, build)
   - Get human approval before proceeding to next task
5. If issues are found, propose rule additions via `code-quality-rules` self-evolution protocol
6. **Code review is mandatory** — after all tasks are complete and verification passes, invoke `/review`. Implementation is NOT done until review is complete. This is not a suggestion to the user — execute it as part of the implementation flow
