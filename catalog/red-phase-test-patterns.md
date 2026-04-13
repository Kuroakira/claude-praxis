# RED Phase Test Patterns

Curated test design prompts for the TDD RED phase. Each entry answers: "What test should I write that I wouldn't have written otherwise?"

Read once per implementation session. Referenced by TDD RED phase trigger questions during implementation.

---

## 1. Boundary Conditions

### R-1-1. Empty collection behavior
Write a test with an empty array, Map, or Set as input. Verify `.reduce()`, `.find()`, `[0]` access, and iteration produce correct results — not crashes or silent wrong values.
Source: general-review 4-1

### R-1-2. Single-element collection where first and last overlap
Write a test with a single-element collection. When the code has special handling for "first" and "last" iterations, verify the single element is correctly treated as both.
Source: general-review 4-2

### R-1-3. Negative index from search operations
Write a test where `indexOf` returns -1, then pass the result to `slice`, `splice`, or array access. Verify the code guards against negative indices rather than silently operating on wrong data.
Source: general-review 4-4

### R-1-4. Type edge cases for type utilities
Write tests with `any`, `never`, `unknown`, `readonly`, union types, negative index, and empty array. Type utilities that pass only happy-path tests are insufficient.
Source: ts-patterns 1-13

---

## 2. State Management

### R-2-1. State leakage between sequential operations
Write a test that invokes the operation twice in sequence. Verify timeouts, counters, flags, and temporary state from the first operation don't leak into the second.
Source: general-review 2-1

### R-2-2. Closure capturing a mutating variable
Write a test where closures are created inside a loop or repeated operation. Verify each closure captures its intended value — not the final value of the outer variable.
Source: general-review 2-3

### R-2-3. Second invocation sees updated state
Write a test that performs an operation, then checks the condition that triggered it. Verify the condition reflects the result of the first operation — not the pre-operation state.
Source: beyond-diff 1-1

### R-2-4. No accumulated side effects on repeated invocation
Write a test that invokes the function 3+ times. Verify no listeners are added without cleanup, no timers accumulate, no entries grow unbounded.
Source: beyond-diff 1-4

---

## 3. Async Patterns

### R-3-1. Concurrent async operations on shared state
Write a test with two async operations running concurrently on shared mutable state. Verify the result is correct regardless of completion order.
Source: general-review 2-4

### R-3-2. Preconditions stale after await
Write a test where a value obtained before `await` changes during the async operation. Verify the code re-checks preconditions after resuming.
Source: general-review 5-3

---

## 4. Data Flow and Null Safety

### R-4-1. Falsy values as valid input
Write a test with `0`, `false`, or `""` as a valid input value. Verify the code uses `??` (not `||`) when these values should not fall back to defaults.
Source: general-review 1-1

### R-4-2. Optional chaining result used downstream
Write a test where optional chaining (`?.`) returns `undefined`. Verify subsequent code handles the `undefined` — not silently assuming non-null.
Source: general-review 3-1
