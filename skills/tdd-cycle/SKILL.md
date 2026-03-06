---
name: tdd-cycle
description: Use when implementing code within a task — provides the RED-GREEN-REFACTOR procedure and decision point consultation pattern.
user-invokable: false
---

# TDD Cycle

The concrete procedure for test-driven development. The constraint "TDD Required — delete and redo" lives in `rules/code-quality.md`. This skill provides the HOW.

## The Cycle

### RED: Write a Failing Test

Define the expected behavior as a test BEFORE writing any production code.

1. Write a test that describes what the code should do
2. Run the test — it MUST fail (if it passes, the test is wrong or the behavior already exists)
3. The test failure message should clearly describe the gap

### GREEN: Write Minimal Code

Write the smallest amount of code that makes the test pass.

1. Do NOT write more than needed — resist the urge to "complete" the feature
2. Run the test — it MUST pass
3. If it doesn't pass, fix the code (not the test, unless the test was wrong)

### REFACTOR: Clean Up

Improve the code while keeping all tests green.

1. Remove duplication
2. Improve naming
3. Simplify structure
4. Run tests after each change — they must stay green

### Structural Friction Check

After REFACTOR, before committing, evaluate whether the implementation is fighting the existing structure. This recreates the feedback loop that hand-coding naturally provides — where friction signals "the architecture needs rethinking."

**Friction signals** (any one warrants a PAUSE):
- This task touched more files than the feature's complexity warrants
- You added conditionals or branches to accommodate the new behavior instead of the structure naturally supporting it
- Tests required extensive mocking or setup because components are tightly coupled
- You duplicated a pattern that already exists elsewhere (the structure doesn't allow reuse)
- The "simplest implementation" still feels complex

**When friction is detected**: PAUSE and present to the human:

> "Structural friction detected: [describe what happened]. This suggests the surrounding structure may not be a good fit for this feature. Options:
> A) Continue as-is — the friction is acceptable for this scope
> B) Restructure [specific area] first, then re-implement this task on the cleaner foundation"

The human decides. Do not silently power through structural friction.

### Commit

After REFACTOR (and structural friction check), commit the working code + passing tests together.

## Decision Point Consultation

When multiple valid approaches exist during implementation (library choice, data structure, error handling strategy, API design), do NOT decide silently. Present options with trade-offs:

> "Two approaches here: A (simpler, less flexible) vs B (more setup, but extensible). Which fits better?"

This applies to:
- Library or dependency choices
- Data structure or algorithm selection
- Error handling strategy (throw vs return vs Result type)
- API design (REST conventions, naming, response shape)
- Architecture patterns (when the Design Doc doesn't prescribe one)

The human decides. This is where engineering judgment grows.

## Integration

- **Constraint**: `rules/code-quality.md` — "TDD Required. Delete and redo."
- **Invoked by**: `commands/implement.md` Phase 2 Step A
- **Referenced by**: `subagent-driven-development` Implementer Prompt Template
