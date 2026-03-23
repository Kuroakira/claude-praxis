# Code Quality Review Points

Language-agnostic code quality review checklist. Categories 1-6 extracted from actual PR reviews by top OSS committers (for detailed quotes and context, see `claudedocs/research/code-quality-review-insights.md`). Categories 7-10 derived from Clean Code smells and heuristics (Robert C. Martin).

---

## 1. YAGNI (Don't Build What You Don't Need)

### 1-1. Adding a conceptually duplicate feature
A similar feature with subtle differences from an existing one — consider whether improving the existing API solves it instead.
— timneutkens (Next.js)

### 1-2. Non-functional APIs or type definitions left behind
Unimplemented or deprecated interfaces give users false affordance — a misleading expectation of available functionality.
— patak-dev (Vite)

### 1-3. Dead code removal backed by measurements
"Might use it someday" is not a reason to keep code. Demonstrate bundle size or build time improvement from removal with measurements.
— timneutkens (Next.js)

---

## 2. DRY (Eliminate Duplication)

### 2-1. Consolidating duplicate logic revealing hidden bugs
Merging scattered identical logic can expose edge-case bugs that were invisible in individual copies. DRY is also a bug detection mechanism.
— sebmarkbage (React)

### 2-2. Refactoring motivated by duplicate pattern elimination
"Architecture change for the sake of architecture change" is not valid motivation. Ground refactoring in concrete duplicate patterns being eliminated.
— sebmarkbage, acdlite (React)

### 2-3. Redundant guard already performed by callee
A defensive check (null coalescing, default value, normalization) that the callee already performs internally. The caller's guard is dead code that obscures the actual contract. Trace into the called function to verify whether the guard is already applied.

```
// ❌ useRichTextEditor internally does `content || ""` at L120,
//    so the caller's guard is redundant noise
const editor = useRichTextEditor({ content: content || "" });

// ✅ Trust the callee's contract — it handles null/undefined internally
const editor = useRichTextEditor({ content });
```
— Derived from PR review gap analysis: hook internally normalized input, but callers added redundant guards that 5/5 reviewers missed

### 2-4. Fix suggestion not using existing project utility
When suggesting a fix for duplication or code smell, search the project's utility layer (`src/lib/`, `src/utils/`, shared modules) for an existing function that already solves the problem. Suggesting a generic solution (e.g., `clsx(...)`) when the project already has a tailored utility (e.g., `cn()`) misses the point of DRY.

```
// ❌ Suggesting generic library usage without checking project utilities
import clsx from "clsx";
const className = clsx("base", condition && "active");

// ✅ Project already has cn() in src/lib/utils — use it
import { cn } from "@/lib/utils";
const className = cn("base", condition && "active");
```
— Derived from PR review gap analysis: reviewers detected trailing space issue but suggested generic clsx instead of project's existing cn()

---

## 3. KISS (Keep It Simple)

### 3-1. Spec compliance enabling code reduction
When simpler code also conforms to the spec, delete complex custom implementations.
— patak-dev (Vite)

### 3-2. Obviously wasteful allocations left in place
Excessive caution justified by "need to measure first" is unnecessary for clearly wasteful object creation or copies. Eliminate them immediately.
— dsherret (Deno)

---

## 4. Test Quality

### 4-1. Assertions placed after the action under test
Assertions placed before the action they should verify test nothing at all.
— Node.js core team

### 4-2. Missing await in async tests
Missing `await` is the root cause of flaky tests. A test that passes probabilistically has zero reliability.
— Node.js core team

### 4-3. Timing dependency replaced with event-driven approach
Fixing flaky tests means eliminating timing dependency itself, not increasing `setTimeout` values.
— mcollina (Node.js)

### 4-4. Assertion argument order correct
actual first, expected second. Consistent ordering directly affects failure message quality.
— Node.js core team

### 4-5. Tested in all execution contexts
Not just the happy path — test in all runtime environments/modes (server, client, hybrid, etc.).
— sebmarkbage (React)

### 4-6. Test case symmetry for functions with similar signatures
When multiple functions share similar signatures and behavior (e.g., `insertRowAt` / `insertColumnAt`, `addUser` / `removeUser`), verify that test coverage is symmetric. If one function has edge-case tests (empty array, boundary index, invalid input), the counterpart should have equivalent tests. Asymmetric test coverage often indicates copy-paste test creation where edge cases were added to one function but forgotten for the other.
— Derived from PR review gap analysis: `insertRowAt` had empty array test but `insertColumnAt` did not

---

## 5. Dead Code / Technical Debt

### 5-1. Unused code kept "just in case"
Dead code is technical debt. If another API provides the same functionality, delete immediately.
— Node.js core team

### 5-2. Unnecessary test infrastructure dependencies left in place
Test code hygiene is equally important as production code hygiene.
— Node.js core team

---

## 6. Pattern Consistency

### 6-1. Naming reflecting the project's current scope
Historical names confuse new contributors. Update internal API names as the project evolves.
— ryanflorence (React Router)

---

## 7. Abstraction Level Discipline

### 7-1. Function mixing high-level and low-level operations
A function that both orchestrates a workflow and performs low-level operations (string parsing, byte manipulation, direct I/O) is mixing abstraction levels. Each function should operate at a single level — either coordinate other functions or perform primitive operations, not both.
— Robert C. Martin (Clean Code: G6, G34)

### 7-2. Base class depending on derivative details
When a base class references or assumes knowledge of its derived classes, the dependency is inverted. Base classes should be ignorant of their derivatives.
— Robert C. Martin (Clean Code: G7)

---

## 8. Naming and Convention Consistency

### 8-1. Inconsistent naming for similar entities
`getUser` / `findPerson` / `retrieveEmployee` for the same pattern. When things have the same meaning, they should follow the same convention. Pick one and apply it everywhere.
— Robert C. Martin (Clean Code: G11)

### 8-2. Name hiding side effects
`getUser()` that also writes to a cache or log. `createReport()` that also sends an email. Names should describe everything the function does — if the name can't describe it concisely, the function does too much.
— Robert C. Martin (Clean Code: N7)

### 8-3. Name at wrong abstraction level
An interface method named `process` or `handle` is too generic for its abstraction level. A utility function named `validateUserEmailForRegistrationFlow` is too specific for a general-purpose module. Names should match the abstraction level of the context they live in.
— Robert C. Martin (Clean Code: N2)

### 8-4. Short name in long scope
`d`, `tmp`, `val` as class fields or module-level variables. The farther a variable is from its declaration, the longer and more descriptive its name should be. Conversely, loop indices like `i` in a 3-line loop are fine.
— Robert C. Martin (Clean Code: N5)

### 8-5. Negative conditionals obscuring intent
`if (!isNotValid)` instead of `if (isValid)`. Negatives are harder to parse than positives. Prefer affirmative boolean names and conditions.
— Robert C. Martin (Clean Code: G29)

---

## 9. Responsibility and Coupling

### 9-1. Feature envy
A method that uses another object's data more than its own. When a function reaches into another object for multiple fields to compute a result, that logic likely belongs on the other object.
— Robert C. Martin (Clean Code: G14)

### 9-2. Transitive navigation (Law of Demeter)
`a.getB().getC().doSomething()` — each dot couples the caller to an additional object's structure. Talk to immediate collaborators only; don't reach through them to access their internals.
— Robert C. Martin (Clean Code: G36)

### 9-3. Misplaced responsibility
Logic placed where it's convenient to write rather than where it conceptually belongs. Ask: "Which module would a reader look in first to find this behavior?" Place it there.
— Robert C. Martin (Clean Code: G17)

---

## 10. Function Interface Design

### 10-1. Too many arguments
More than 3 arguments signals the function does too much or the arguments form a concept that deserves its own object. Fewer arguments = easier to understand, test, and call correctly.
— Robert C. Martin (Clean Code: F1)

### 10-2. Flag arguments splitting behavior
A boolean parameter that makes a function do two different things. `update(data, replace=True)` should be two functions: `replace(data)` and `update(data)`. Each function should do one thing.
— Robert C. Martin (Clean Code: F3)

### 10-3. Complex conditional not encapsulated
Raw boolean expressions like `if (timer.hasExpired() && !timer.isRecurrent())` inline in business logic. Extract to a named predicate: `if (shouldBeDeleted(timer))`. The name communicates intent.
— Robert C. Martin (Clean Code: G28)

---

## 11. Documentation-Code Consistency

### 11-1. JSDoc/comment describing behavior that implementation contradicts
When a JSDoc comment says a parameter is "required when X" but the implementation auto-fills a default when omitted, the documentation gives users a false understanding of the API contract. Check that documentation of optional parameters accurately describes what happens when they are omitted — especially auto-fill, fallback, or internally-managed behavior.

```typescript
// ❌ JSDoc says "required when using onOverflowChange" but implementation
//    creates an internal ref when containerRef is omitted
/**
 * @param containerRef - Required when using onOverflowChange
 */
function useOverflow({ containerRef, onOverflowChange }: Props) {
  const internalRef = useRef(null);
  const ref = containerRef ?? internalRef;  // auto-fills — not actually required
  // ...
}

// ✅ JSDoc matches implementation behavior
/**
 * @param containerRef - Optional. Uses an internal ref when omitted.
 */
```
— Derived from PR review gap analysis: JSDoc stated "required when using onOverflowChange" but implementation auto-created internal ref, 5/5 reviewers missed
