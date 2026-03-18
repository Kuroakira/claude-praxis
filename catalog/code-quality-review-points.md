# Code Quality Review Points

Language-agnostic code quality review checklist. Extracted from actual PR reviews by top OSS committers.
For detailed quotes and context, see `claudedocs/research/code-quality-review-insights.md`.

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
