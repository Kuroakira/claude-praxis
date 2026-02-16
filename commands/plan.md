---
name: plan
description: Create a detailed implementation plan — break a task into small, TDD-driven steps
disable-model-invocation: true
---

Invoke the skill `getting-started` and begin the **Planning Phase**:

1. **Understand the scope**: Read the Design Doc if it exists. If no Design Doc (direct implementation request), read the codebase to understand the current state and the user's intent
2. **Break into steps sized for ~500-line PRs**: Each step should produce a reviewable, self-contained change. If a step would exceed ~500 lines, split it further
3. For each step, specify:
   - Exact file paths to create or modify
   - What tests to write FIRST (TDD — RED before GREEN)
   - Expected line count estimate (keep under ~500 lines per step)
   - Verification steps (typecheck, lint, test, build)
   - Dependencies on other steps
4. **TDD ordering**: Within each step, list test files before implementation files. The test is the first deliverable, not an afterthought
5. Save the plan for reference during execution
