---
name: review
description: Request a code review for completed work
disable-model-invocation: false
---

Invoke the skill `requesting-code-review`:

1. Verify all changes pass (typecheck, lint, test, build)
2. Prepare review request with changed files and requirements
3. Dispatch a reviewer agent
4. Handle feedback using `receiving-code-review` skill
