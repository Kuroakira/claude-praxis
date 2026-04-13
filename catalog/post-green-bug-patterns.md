# Post-GREEN Bug Patterns

Curated latent bug patterns for the TDD VERIFY phase. Each entry describes a pattern where code passes tests but contains hidden issues detectable through code reading.

Read once per implementation session. Referenced by TDD VERIFY phase during implementation.

---

## 1. State and Lifecycle

### V-1-1. Decision-driving state not updated after action
A value used for conditional logic (token expiry, cache timestamp, config version) isn't updated after the action it triggers. The first invocation works; subsequent invocations re-trigger unnecessarily because the decision state is stale.
Source: beyond-diff 1-1

### V-1-2. Lifecycle event racing with in-progress operation
An event listener (auth state change, connection status, visibility change) fires during an ongoing async operation and starts a conflicting action. The first operation completes into an inconsistent state.
Source: beyond-diff 1-2

### V-1-3. Side effects accumulating without cleanup
Event listeners added without removal, timers set without clearing previous ones, entries appended without bounds. Look for `addEventListener`, `setInterval`, `setTimeout`, or collection `.push`/`.set` without corresponding cleanup.
Source: beyond-diff 1-4

### V-1-4. Stale reference under debounce accumulating wrong delta
A debounced callback reads a ref to compute a delta, but rapid calls during the delay window all read the same pre-debounce value. Only the last delta takes effect.
Source: beyond-diff 1-5

### V-1-5. Compound state transition in single handler
A handler both terminates one operation and initiates another. With batched state updates, the first `setState` hasn't been applied when the second transition's conditions are evaluated.
Source: beyond-diff 1-6

---

## 2. Error Handling

### V-2-1. try-catch scope too broad
Both I/O operations and business logic wrapped in the same try-catch. Business logic bugs are silently handled as I/O errors.
Source: error-resilience 1-1

### V-2-2. Catch block swallowing all errors
`catch (e) { return null; }` suppresses all errors including unexpected ones. Look for catch blocks that don't discriminate by error type.
Source: error-resilience 1-3

### V-2-3. Error notification method mismatch
External API wrapped in try/catch but the API reports errors through redirects, return values, or callbacks — not exceptions. Check whether default options determine the error method (e.g., `redirect: true` as default means errors are reported via redirect, not exceptions).
Source: error-resilience 1-4, general-review 8-4

### V-2-4. Resources not released on error path
Cleanup only executes on the success path. Look for file handles, DB connections, temp files, or Map entries that leak when an early return or exception occurs before cleanup.
Source: error-resilience 3-1

---

## 3. Async and Promise Pitfalls

### V-3-1. Async function in event listener callback
Passing an async function to `addEventListener` leaves rejected Promises unhandled. Look for async callbacks registered on event emitters or DOM events without `.catch()`.
Source: general-review 5-1

### V-3-2. Promise created but never awaited
`void asyncFn()` or ignoring the return value of an async call silently loses errors. Look for async function calls whose return value is discarded.
Source: general-review 5-2

### V-3-3. Errors lost mid-Promise chain
`.then()` without `.catch()`, or `.catch()` with an empty handler. Trace to the end of the Promise chain and verify errors are handled on all paths.
Source: error-resilience 5-2

---

## 4. Data Flow and Code Paths

### V-4-1. Guard clause making downstream checks unreachable
An early-return guard forces subsequent branch conditions to always evaluate true or false. Re-verify all downstream branches when a guard is added.
Source: general-review 1-2

### V-4-2. Values silently lost in transformation pipeline
In chains like `.map()` → `.filter()` → `.reduce()`, intermediate steps may return undefined or filter conditions may unintentionally exclude values. Trace data through each pipeline stage.
Source: general-review 6-1

### V-4-3. Function return value ignored by caller
A function that returns error information or transformation results is called as `void`, losing important information. Look for async function calls, error-indicating returns (false, null, Error), or result values that are silently discarded.
Source: general-review 6-3

### V-4-4. Stub or placeholder reachable in production
`component: () => null`, empty implementations, or placeholder returns — verify that production code paths cannot reach them. Trace from user-facing entry points to the stub.
Source: general-review 8-5
