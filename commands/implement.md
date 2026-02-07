---
name: implement
description: Execute the implementation plan — follow the plan task by task with verification
disable-model-invocation: true
---

Invoke skills `code-quality-rules` and `verification-before-completion`, then begin the **Implementation Phase**:

1. Read the implementation plan
2. For plans with 3+ independent tasks, consider using `subagent-driven-development`
3. For each task:
   - Follow TDD (RED → GREEN → REFACTOR)
   - Run verification after each change (typecheck, lint, test, build)
   - Get human approval before proceeding to next task
4. If issues are found, propose rule additions via `code-quality-rules` self-evolution protocol
5. Request code review after completing each phase
