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

### 2-5. Index-based derived state stale after collection mutation
When state stores indices into an array/list (selectedIndex, selectionAnchor, cursor position, focused row/column), and the underlying collection is mutated (insert, delete, reorder), the stored indices silently point to wrong elements or go out-of-bounds. After every collection mutation, validate and adjust all index-based derived state.

```typescript
// ❌ selectedRange stores {row, col} indices into cells[][]
//    After insertRowAt(0), all indices shift by +1 but selectedRange is unchanged
const [selectedRange, setSelectedRange] = useState({ start: {row: 2, col: 1}, end: {row: 3, col: 2} });
function insertRowAt(index: number) {
  setCells(prev => [...prev.slice(0, index), newRow, ...prev.slice(index)]);
  // selectedRange still points to old indices — now selects wrong cells
}

// ✅ Adjust derived index state when base collection changes
function insertRowAt(index: number) {
  setCells(prev => [...prev.slice(0, index), newRow, ...prev.slice(index)]);
  setSelectedRange(prev => ({
    start: { row: prev.start.row >= index ? prev.start.row + 1 : prev.start.row, col: prev.start.col },
    end: { row: prev.end.row >= index ? prev.end.row + 1 : prev.end.row, col: prev.end.col },
  }));
}
```
— Derived from PR review gap analysis: row/column insertion shifted cell indices but selectedRange and selectionAnchor were not adjusted, 6/6 reviewers missed

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

### 4-4. Negative index behavior in array/string operations
Language-specific behavior of negative indices can silently produce wrong results instead of errors. In JavaScript, `Array.prototype.slice(-1)` returns the last element (counting from end), `Array.prototype.at(-1)` returns the last element, but `array[-1]` returns `undefined`. When an index variable can be negative (e.g., from `indexOf` returning -1, or from arithmetic), trace through each array/string operation and verify the language-spec behavior for that negative value.

```
// ❌ indexOf returns -1, slice(-1) silently returns last element
const idx = headers.indexOf(targetColumn);  // -1 if not found
const after = row.slice(idx);  // slice(-1) = last element, not empty
// Bug: silently operates on wrong data instead of failing

// ✅ Guard against negative index before array operations
const idx = headers.indexOf(targetColumn);
if (idx === -1) throw new Error(`Column not found: ${targetColumn}`);
const after = row.slice(idx);
```
— Derived from PR review gap analysis: reviewer noted "out-of-range index is implicitly no-op" but missed that negative index has distinct language-spec behavior in slice

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

### 8-5. Stub/placeholder code not reachable in production
When stub code exists (`component: () => null`, empty implementations, placeholder returns), verify that production code paths cannot reach it. Check surrounding integration points: can a user trigger creation of a stub-backed entity? Does the UI expose controls (toolbar buttons, menu items) that lead to the stub? A stub marked `supportsEditMode: true` with a disabled toolbar flag is only safe if the toolbar flag is checked on all entry points.

**Verification steps**:
1. List all code paths that reference the stub
2. For each path, trace backward to the nearest user-facing entry point
3. Verify a guard (disabled flag, feature flag, conditional rendering) blocks every entry point
4. Check that guards are consistent — one unguarded path makes all other guards irrelevant
— Derived from PR review gap analysis: `component: () => null` with `supportsEditMode: true` was judged "appropriate stub" without verifying toolbar disabled flag covered all creation paths

### 8-6. CSS overflow hiding absolutely-positioned children
`overflow: hidden` on a parent element clips absolutely-positioned children that extend beyond the parent's bounds. Icons, tooltips, dropdowns, or decorative elements placed with `position: absolute` become invisible when any ancestor has `overflow: hidden` or `overflow: auto`. The culprit may be several DOM levels above the clipped element.

```css
/* ❌ Parent has overflow: hidden, child's absolute icon is clipped */
.cell-wrapper {
  position: relative;
  overflow: hidden;     /* clips content */
}
.cell-icon {
  position: absolute;
  top: -20px;           /* extends above parent — invisible */
}

/* ✅ Use overflow: visible, or restructure so the icon's container is outside the clipped area */
.cell-wrapper {
  position: relative;
  overflow: visible;    /* or move icon to a non-clipped ancestor */
}
```

**Verification**: For every `position: absolute/fixed` element, trace up the DOM tree and check for `overflow: hidden/auto/scroll` on ancestors. If found, verify the element stays within the ancestor's bounds.
— Derived from PR review gap analysis: absolute-positioned icon with negative offset was clipped by parent's overflow:hidden, no reviewer checked CSS layout interaction

### 8-7. Event handler unreachable due to child element covering parent
An event handler on a parent element uses `e.target === e.currentTarget` to detect "background clicks" (clicks directly on the parent, not on children). However, if a child element fills the parent completely (`h-full w-full`, `absolute inset-0`, `flex-1` filling remaining space), the parent has no exposed clickable area — `e.target` is always the child, never the parent. The handler never fires in a real browser, even though unit tests using `fireEvent.click(parent)` pass (because `fireEvent` dispatches directly on the target, bypassing layout).

```tsx
// ❌ Grid child fills root completely — root never receives a direct click
<div onClick={handleBackgroundClick} className="relative h-full">  {/* root */}
  <div className="h-full w-full">  {/* grid — covers root entirely */}
    {cells.map(cell => <Cell key={cell.id} />)}
  </div>
</div>
const handleBackgroundClick = (e) => {
  if (e.target === e.currentTarget) onClearSelection();  // never true in browser
};

// ✅ Option A: Check that click target is not a cell (positive identification)
const handleBackgroundClick = (e) => {
  if (!(e.target as HTMLElement).closest('[data-cell]')) onClearSelection();
};
// ✅ Option B: Handle deselection at a higher level (canvas/board) or via Escape key
```

**Verification**: For every `e.target === e.currentTarget` check, inspect CSS of all direct children. If any child has sizing that fills the parent (`h-full w-full`, `flex-1 + flex parent`, `absolute inset-0`, `100% width + 100% height`), the condition is unreachable. Also check whether tests use `fireEvent.click(element)` to test such handlers — `fireEvent` bypasses layout, so the test passes but the behavior is broken in a real browser.
— Derived from PR review gap analysis: `handleBackgroundClick` with `e.target === e.currentTarget` was unreachable because grid child covered parent entirely; `fireEvent.click(root)` test passed, masking the issue

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

## 10. Test Coverage Gaps

### 10-1. Behavior change without corresponding test
When code changes observable behavior (event propagation, default values, error handling, keyboard shortcuts), a test must verify the new behavior. Detecting that behavior changed is insufficient — the reviewer must also check that tests for the new behavior exist. If no test covers the changed behavior, propose a specific test case.

```typescript
// Code change: Escape now calls stopPropagation (behavior change)
case "Escape":
  e.stopPropagation();  // NEW: previously did not stop propagation
  editor.commands.blur();
  break;

// ❌ Reviewer notes "behavior change" but doesn't check for test
// ✅ Reviewer checks test file, finds no test, and proposes:
it("should stop propagation on Escape key", () => {
  const event = new KeyboardEvent("keydown", { key: "Escape" });
  const stopPropagation = vi.spyOn(event, "stopPropagation");
  editor.view.dom.dispatchEvent(event);
  expect(stopPropagation).toHaveBeenCalled();
});
```
— Derived from PR review gap analysis: 3/5 reviewers detected Escape stopPropagation change, 0/5 noted missing test

### 10-2. Branch without test coverage — enumerate and match
For each function with branching logic (if/else, switch, early return, ternary), enumerate every branch and verify that at least one test case exercises it. List untested branches by name and line, and propose specific test cases for each.

```typescript
// Function has 3 branches:
function handlePaste(editor, event) {
  if (!editor.state.selection.empty) return;  // Branch A: non-empty selection
  const text = event.clipboardData?.getData("text");
  if (!text) return;                           // Branch B: no clipboard text
  editor.commands.insertContent(text);         // Branch C: happy path
}

// ❌ Tests only cover Branch C (happy path)
// ✅ Enumerate: Branch A (selection non-empty) — no test. Branch B (no text) — no test.
//    Propose test for Branch A:
it("should return early when selection is not empty", () => {
  editor.commands.setTextSelection({ from: 1, to: 5 });
  handlePaste(editor, pasteEvent);
  expect(editor.state.doc.textContent).toBe(originalContent);
});
```
— Derived from PR review gap analysis: `if (!editor.state.selection.empty) return` branch had no test, reviewer's "check branch coverage" instruction was too abstract to catch it

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
| Negative index from indexOf passed to slice/splice | 4-4: negative index behavior |
| Stub component/function assumed unreachable without verifying all entry points | 8-5: stub production reachability |
| Behavior change detected but missing test not flagged | 10-1: behavior change without test |
| Early return branch exists but no test exercises it | 10-2: branch without test coverage |
| Index-based state (selection, cursor) not adjusted after array insert/delete | 2-5: index-based state stale |
| Absolute-positioned element clipped by ancestor's overflow:hidden | 8-6: CSS overflow clipping |
| `e.target === e.currentTarget` on parent fully covered by child | 8-7: event handler unreachable |
