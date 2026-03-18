# General Review (Bug Detection) Points

Language-agnostic bug detection review checklist. Extracted from actual PR reviews by top OSS committers.
Focuses on bugs found by reading code: execution tracing, logic analysis, and state tracking.

---

## 1. Conditional Logic Errors

### 1-1. `||` vs `??` confusion silently discarding falsy values
Using `||` where `false`, `0`, or `""` are valid values causes unintended fallback to default values.
— RyanCavanaugh, DanielRosenwasser (TypeScript)

### 1-2. Guard clause making downstream safety checks unreachable
An early-return guard can force subsequent branch conditions to always evaluate true/false. Re-verify all downstream branches when adding guards.
— RyanCavanaugh (TypeScript)

### 1-3. Chained negations inverting intent
Confusing `if (!a || !b)` with `if (!(a && b))`, double negation `if (!isNotValid)`, etc. Logic error probability increases with condition complexity.
— RyanCavanaugh (TypeScript)

---

## 2. State Management and Closures

### 2-1. State not reset between operations
Timeouts, counters, and temporary flags carried over from a previous operation cause misbehavior in the next. Verify state reset on reused objects.
— KATT (tRPC)

### 2-2. Map/Set entries remaining after early return
Adding an entry to a Map before starting processing, then early-returning mid-way, leaves the entry behind. Guarantee cleanup with `finally` or try-catch.
— timneutkens, huozhi (Next.js)

### 2-3. Closure capturing a mutating variable
A closure created inside a loop references an outer variable whose value changes by execution time. Make a local copy or reconsider when the closure is created.
— KATT (tRPC), dai-shi (Zustand/Jotai)

### 2-4. Concurrent async operations racing on shared mutable state
Shared state may be modified by another operation during a long-running async task. Snapshot state at operation start or add mutual exclusion.
— KATT (tRPC), Rich-Harris (Svelte)

---

## 3. Null/Undefined Handling

### 3-1. Assuming non-null after optional chaining
Code that uses the result of `obj?.prop` as non-null downstream. Optional chaining can return undefined, but subsequent code ignores this.
— KATT (tRPC), colinhacks (Zod)

### 3-2. Semantic distinction between null and undefined preserved
When code distinguishes "no value" from "explicitly empty", confusing `null` and `undefined` breaks branching logic. `||` and `??` both treat them identically; use `=== null` / `=== undefined` when semantic distinction matters.
— markerikson (Redux Toolkit), RyanCavanaugh (TypeScript)

### 3-3. Element access after array/object existence check
`if (arr)` is true even for empty arrays `[]`. Verify `arr.length > 0` or `arr[0] !== undefined` before element access.
— huozhi (Next.js)

---

## 4. Boundary Conditions

### 4-1. Correct behavior with empty collections (Array/Map/Set)
`.reduce()`, `.find()`, `[0]` access on an empty array. Iteration over an empty Map. Verify fallback when the collection has zero elements.
— RyanCavanaugh (TypeScript), dsherret (ts-morph)

### 4-2. Boundary logic correct for single-element collections
When a loop has special handling for the first and last iteration, a single element is both first and last. Verify logic for this case.
— DanielRosenwasser (TypeScript)

### 4-3. String operations accounting for empty string, multibyte, and special characters
`.split()`, `.indexOf()`, `.slice()` return unexpected results for empty strings. Also check for Unicode surrogate pairs and newline characters.
— colinhacks (Zod), yyx990803 (Vue.js)

---

## 5. Async Pitfalls

### 5-1. Errors captured in async event listener callbacks
Passing an async function to `addEventListener` leaves rejected Promises unhandled, causing process crashes in Node.js. Wrap with `.catch()` or place try-catch inside.
— KATT (tRPC)

### 5-2. Promise created but never awaited
`void asyncFn()` or ignoring the return value of an async call silently loses errors. If intentional fire-and-forget, add `.catch()`; otherwise `await`.
— KATT (tRPC), mikearnaldi (Effect-TS)

### 5-3. Preconditions stale after await
A value obtained before `await` may no longer be valid after it. Re-verify preconditions (connection state, permissions, data existence) after long async operations.
— Rich-Harris (Svelte), KATT (tRPC)

### 5-4. Catch block reachable
If the function called inside `try` internally catches all errors without re-throwing, the outer catch is unreachable dead code. Trace the callee's error handling and verify the catch block can actually execute. Code that returns a fallback value in catch is never executed if the callee swallows errors.
(See: error-resilience-review-points 1-3 detects the swallowing itself. This point covers the impact propagating to the caller.)
— huozhi, timneutkens (Next.js), mikearnaldi (Effect-TS)

---

## 6. Data Flow Breaks

### 6-1. Values silently lost in transformation pipelines
In chains like `.map()` → `.filter()` → `.reduce()`, verify that intermediate steps don't return undefined or that filter conditions don't unintentionally exclude values.
— markerikson (Redux Toolkit)

### 6-2. Operation order correct (normalize→filter vs filter→normalize)
Transformation and filtering order changes results. Filtering before normalization misses non-matching data; normalizing before filtering processes unnecessary data. Verify order matches requirements.
— markerikson (Redux Toolkit)

### 6-3. Function return value not ignored by caller
Calling a function that returns error information or transformation results as `void` loses important information. Watch especially for ignored error-indicating return values (false, null, Error objects).
— dsherret (ts-morph), huozhi (Next.js)

---

## 7. Pattern Matching and Regex

### 7-1. Regex matching wider than intended
`.` matching all characters including newlines (with `s` flag), `*` matching greedily, character class ranges being too broad, etc. Test that unintended inputs don't match.
— huozhi (Next.js), DanielRosenwasser (TypeScript)

### 7-2. String search causing substring false matches
`includes('id')` also matches `'grid'`, `'valid'`. When exact match is needed, use boundary checks (regex `\b`, array `.includes()`, etc.).
— timneutkens (Next.js)

---

## 8. Implicit Assumptions

### 8-1. Caller assumptions documented or validated
When a function implicitly depends on assumptions like "always called with an array" or "value is a positive integer", protect with type constraints or runtime assertions.
— RyanCavanaugh (TypeScript)

### 8-2. Invariants preserved after refactoring
After extracting functions, adding parameters, or changing conditions, verify that previous invariants (e.g., "this function is always called after initialization") still hold.
— RyanCavanaugh (TypeScript), dsherret (ts-morph)

### 8-3. Default values valid in all usage contexts
A default value that's correct in one context may cause incorrect behavior in another. When a parameter with a default is called from multiple sites, verify the default is appropriate at every call site.
— colinhacks (Zod), KATT (tRPC)

### 8-4. External library default behavior matches code's control flow assumptions
External library APIs may report errors or results through methods different from what the code implicitly assumes. In particular, a call wrapped in try/catch may not throw on error — libraries may use redirects, special return values, or callback-based error notification by default. Verify that the callee's default options match the control flow the code expects.
(See: 5-4 covers cases where internal functions swallow errors making catch unreachable. This point covers cases where external library API contracts make catch non-functional.)
(See: error-resilience-review-points 1-4 detects error notification method mismatches.)

```
// ❌ next-auth signIn() with redirect: true (default) redirects to
//    /api/auth/error on auth failure instead of throwing. catch is unreachable.
try {
  await signIn("credentials", { callbackUrl: "/" });
} catch (e) {
  showError(e);  // dead code
}

// ✅ Specify redirect: false and handle errors explicitly via return value
const result = await signIn("credentials", { redirect: false });
if (result?.error) {
  showError(result.error);
}
```

---

## 9. Copy-Paste / Inconsistencies

### 9-1. Unintended differences between similar code blocks
In copy-pasted similar processing blocks, variables, conditions, or constants that should have been changed weren't. Diff similar code blocks side-by-side and verify all differences are intentional.
— DanielRosenwasser (TypeScript), colinhacks (Zod)

### 9-2. Return value type/structure consistent across branches
When each branch of `if` / `else` / `switch` returns objects with subtly different structures, property access fails at the call site. Compare return values across all branches.
— markerikson (Redux Toolkit), RyanCavanaugh (TypeScript)

---

## AI-Generated Code Bug Patterns

| Pattern | Review Point |
|---------|-------------|
| `\|\|` for defaults silently discarding `false`/`0` | 1-1: `\|\|` vs `??` |
| Unhandled rejection in async callback | 5-1: async event listener |
| Resource remaining after early return | 2-2: Map/Set entry leak |
| Untested with empty/single-element collections | 4-1, 4-2: boundary conditions |
| Values lost mid-transformation chain | 6-1: pipeline data loss |
| Variable name not updated in copied code | 9-1: similar code differences |
| Calling async function without `await` | 5-2: unawaited Promise |
| Callee swallows all errors making outer catch dead code | 5-4: catch reachability |
| Wrapping external library in try/catch but library doesn't throw on error | 8-4: external library defaults |
