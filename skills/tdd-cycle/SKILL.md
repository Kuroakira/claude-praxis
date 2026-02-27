---
name: tdd-cycle
description: Use when implementing code within a task — provides the RED-GREEN-REFACTOR procedure and decision point consultation pattern.
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

### Commit

After REFACTOR, commit the working code + passing tests together.

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
