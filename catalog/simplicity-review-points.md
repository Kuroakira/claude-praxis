# Simplicity Review Points

Language-agnostic simplicity review checklist. Extracted from actual PR reviews by top OSS committers.
For detailed quotes and context, see `claudedocs/research/simplicity-review-insights.md`.

---

## 1. Unnecessary Abstraction

### 1-1. Helper called from only one place
If called from only one place, the abstraction cost (tracing code across function boundaries) outweighs the reuse benefit. Inline it.
— sebmarkbage (React)

### 1-2. Every layer can justify its existence
Multi-level indirection like Service → Helper → Util → actual logic is excessive unless each layer has an independent reason to exist. If removing a layer achieves the same functionality, remove it.
— sebmarkbage, acdlite (React)

### 1-3. Abstraction based on proven necessity
Generalization, generics, and configuration objects created "just in case" are unnecessary until two or more concrete use cases exist.
— sebmarkbage (React), developit (Preact)

---

## 2. Structure vs Patch

### 2-1. Feature fighting the existing structure
When a new feature is forced to fit the existing structure (adding conditional branches, workarounds), restructure first, then add the feature.
(See: structural-pattern-review-points for refactoring direction when the structural fight involves conditional/type-dispatch logic.)
— Rich-Harris (Svelte)

### 2-2. Patches piling on tangled code
Patching code where multiple concerns are tangled increases complexity exponentially. Fix the fundamental structure before making changes.
(See: structural-pattern-review-points for when tangled code warrants design pattern extraction.)
— Rich-Harris (Svelte)

---

## 3. Pragmatism

### 3-1. Problem redefined for a simpler approach
When a complex algorithm seems necessary, redefining the problem itself may reveal a simpler solution. Try redefining the problem before improving the algorithm.
— Rich-Harris (Svelte)

### 3-2. Perfect edge case handling increasing overall complexity
Rare edge cases often warrant a simple fallback. The complexity cost of perfect handling may not be worth it.
— Rich-Harris (Svelte)

### 3-3. Core and extension layers separated
Keep only essential functionality in the core. Compatibility layers and edge case handling belong in the extension layer.
— developit (Preact)

---

## 4. Reduction Decisions

### 4-1. Low-priority use case support code increasing core complexity
Not every use case needs support. Consciously dropping low-priority cases simplifies the remaining code.
— acdlite (React)

### 4-2. Complexity movable to a different phase
Moving runtime complexity to build/compile time, absorbing configuration complexity with defaults — "moving" complexity can be effective.
— sebmarkbage (React)

### 4-3. Internal implementation details leaking into tooling output
Error messages and log output should focus on "what the user should do next". Internal implementation details are noise.
— timneutkens (Next.js)

---

## AI-Generated Code Patterns

| Pattern | Review Point |
|---------|-------------|
| Utility function used in only 1-2 places | 1-1: single caller = inline |
| Generics or config objects anticipating future extension | 1-3: proven necessity |
| Service → Helper → Util → actual logic | 1-2: question layer boundaries |
| Perfect handling for every edge case | 3-2: pragmatism |
| Conditional branches forced into existing structure | 2-1: structure vs patch |
