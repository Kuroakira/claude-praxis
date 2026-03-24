# TypeScript Review Points

Review checklist. Each item extracted from actual PR reviews by top OSS committers.

---

## 1. Type Safety

### 1-1. Eliminating `any`
`any` abandons type safety. Use `unknown` + type guards, or let generics infer. Even inside libraries, `any` is not an exception.
— TkDodo, dai-shi, colinhacks

### 1-2. Design that makes type assertions (`as`) unnecessary
If `as` is needed, the type design has a problem. Adjust generic parameter count so inference flows naturally.
— TkDodo

### 1-3. Double cast (`as X as Y`) signals broken type design
Double casts like `as Node as T` cannot be verified for safety in review. Reconsider the fundamental type design.
— DanielRosenwasser

### 1-4. Question the necessity of generics
Generics are unnecessary for a function used in only 2 places. Ask: "Is generality actually needed?"
— DanielRosenwasser

### 1-5. Generic constraint ordering based on variance
Type parameter constraints should follow variance: `TOut <= T <= TIn`.
— DanielRosenwasser

### 1-6. Type guard function naming expresses intent
Name by "what it means", not "what it checks".
Example: `hasDispatchFunction` → `shouldDispatchFromUs`
— dai-shi

### 1-7. Refine `unknown` further
Don't stop at `unknown` — narrow to the most specific type possible.
— dai-shi

### 1-8. Type behavior with strictNullChecks disabled
With `strictNullChecks: false`, all types implicitly include `null`/`undefined`. Even the type literal `true`.
— RyanCavanaugh

### 1-9. Type correctness may take priority over API breakage
If type definitions don't match runtime behavior, fix the types even as a breaking change. "Types lying is worse."
— pcattori (React Router)

### 1-10. Tuple type > Union type for tracking middleware extensions
`Array<Middleware>` as a union type doesn't correctly infer dispatch extensions. Use tuple types for precise tracking.
— markerikson (Redux Toolkit)

### 1-11. Function overloads vs conditional types
When cases are few and enumerable, overloads provide better precision and IDE support than broad conditional types.
However, when type inference breaks, `extends` constraints are safer than overloads.
— mattpocock (ts-reset), mikearnaldi (Effect-TS)

### 1-12. Read/write asymmetry in types
Evaluate API type changes from both "writer" and "reader" sides. If writing becomes easier but read-side type comparison or pattern matching breaks, don't adopt.
— dsherret (ts-morph)

### 1-13. Edge case coverage for type utilities
`any`, `never`, `unknown`, `readonly`, union, negative index, empty array — test all of them. Type utilities passing only happy-path tests are insufficient.
— sindresorhus (type-fest)

---

## 2. Performance

### 2-1. Avoid closure creation on hot paths
`members.some(m => fn(m))` — prefer `for...of` loop with direct check. On frequently called code, one line can impact performance.
— DanielRosenwasser, colinhacks

### 2-2. Minimize property access
Performance-critical paths optimize down to property access count. Keep changes minimal; benchmarks mandatory.
— colinhacks

### 2-3. Type improvement not affecting bundle size
A type-only PR must not affect runtime code. Verify bundle output.
— dai-shi

### 2-4. Lazy initialization with `??=`
`(result ??= []).push(item)` as a one-liner. Reduces unnecessary branching.
— DanielRosenwasser

### 2-5. Optimization adoption decided by benchmarks
Decide by measurement results, not "looks fast". A ~95% improvement benchmark justifies changing direction. Don't adopt optimizations that create code duplication without numerical evidence.
— yyx990803 (Vue.js)

### 2-6. Code structure aware of tree-shaking
Module-level constant declarations are not tree-shaken. Use inline caches inside functions so they're removable when unused.
— yyx990803 (Vue.js)

### 2-7. Declaration placement aware of compression
Grouping `const` declarations improves minifier compression ratios.
— yyx990803 (Vue.js)

### 2-8. Avoid unnecessary computation
Don't run expensive operations on all files then filter — filter first, then process. "If raw buffer size can determine the answer, use that."
— yyx990803 (Vite)

### 2-9. `process.env.NODE_ENV` to enable debug code elimination
Wrap function calls and error messages in NODE_ENV checks so bundlers can eliminate them in production builds.
— markerikson (Reselect)

### 2-10. Quantitative evidence justifies unorthodox approaches
Specific metrics like 6700ms → 700ms justify "technically legal but hacky" approaches like mutable object subscription management.
— markerikson (Redux Toolkit)

### 2-11. `slice()` > spread, `for` loop > `for...of`
`slice()` is faster without iterable shims. `for...of` involves iterator protocol overhead; plain `for` loops are faster.
— DanielRosenwasser, yyx990803

### 2-12. Awareness of npm distribution size
Don't add large dependencies like `@shikijs/cli` (~21MB). Reduce network demands at npm install time. Make them devDependencies and bundle if needed.
— yyx990803 (Vite)

### 2-13. Don't run `for...in` on `EMPTY_OBJ`
`Object.assign(target, EMPTY_OBJ)` runs `for...in` on an empty object. Avoid unnecessary iteration.
— yyx990803 (Vue.js)

### 2-14. Watch for quadratic complexity
Calling `indexOf` in a loop is O(n²). Direct checking with `isAnyDirectorySeparator` in a tight loop is more efficient.
— DanielRosenwasser

### 2-15. React.memo invalidated by unstable props
When a component is wrapped in `React.memo`, every prop must be referentially stable across renders. Inline functions (`onClick={(e) => ...}`), inline objects (`style={{ color: x }}`), and array literals created in render create new references on every render, defeating memoization entirely. Extract to `useCallback`/`useMemo` or stable references outside the render path.

```tsx
// ❌ memo is useless — onClick creates a new function reference every render
const Cell = React.memo(({ value, onClick }: CellProps) => <td onClick={onClick}>{value}</td>);
// Parent:
<Cell value={cell} onClick={(e) => handleClick(rowIdx, colIdx, e)} />

// ✅ Stable reference via useCallback or data attribute + single handler
const handleCellClick = useCallback((e: React.MouseEvent<HTMLTableCellElement>) => {
  const { row, col } = e.currentTarget.dataset;
  handleClick(Number(row), Number(col), e);
}, [handleClick]);
<Cell value={cell} onClick={handleCellClick} data-row={rowIdx} data-col={colIdx} />
```
— Derived from PR review gap analysis: `React.memo` on cell component was nullified by per-cell inline `onClick`, ts-patterns 2-1 detected "closure on hot paths" but rated Low without connecting to memo invalidation

---

## 3. API / Module Design

### 3-1. Reuse existing utilities
Reimplementing the same logic is a bug breeding ground. Find and leverage existing abstractions.
— TkDodo

### 3-2. Pass option objects as a whole
Destructuring and passing individually risks missing future option additions.
— TkDodo

### 3-3. New features are opt-in
New features that change default behavior should be opt-in. Don't break existing users.
— KATT

### 3-4. Internal types marked with `@internal`
Make the boundary with public API explicit.
— KATT

### 3-5. Minimize dependencies
Libraries minimize dependencies. Carefully weigh inline implementation vs import. Core packages should aim for dependency-free.
— KATT, Angelelz (Drizzle)

### 3-6. Breaking changes evaluated by behavior, not just signature
Even with an identical API signature, behavior changes can be breaking.
— dai-shi

### 3-7. Internal APIs kept simple without over-wrapping
Internals tolerate breaking changes. Keep them simple without fearing future changes.
— dai-shi

### 3-8. Feature addition scope judged carefully
If existing mechanisms can solve it, don't add a new feature.
— RyanCavanaugh

### 3-9. OS-dependent behavior delegated to editor settings
Compilers/libraries should be OS-independent. Delegate environment-dependent behavior to editor settings.
— RyanCavanaugh

### 3-10. Structured object return to enable type inference
Attaching methods to middleware itself breaks dispatch type inference. Returning `{middleware, startListening, stopListening}` as an object lets inference work. Changing API shape for type correctness.
— markerikson (Redux Toolkit)

### 3-11. Unified configuration function over individual setters
Individual setters bloat API surface. Use a unified configuration function anticipating future extensions.
— markerikson (Reselect)

### 3-12. Return type decided by conceptual intent
A reset method returning `0` is a JS side effect; conceptually it's `void`. Type annotations express design intent, not runtime accidents.
— markerikson (Reselect)

### 3-13. State decision logic placed where information is richest
Hydration fallback display decisions belong in the Router (it knows the hydration context). Don't compute downstream in the render layer.
— pcattori (React Router)

### 3-14. Serialization made explicit (don't rely on implicit toJSON)
Use `json()` to preserve type information. Implicit serialization conventions lose types on the client side.
— pcattori (Remix)

### 3-15. Request metadata preserved
Don't strip `.data` suffixes or `?index` parameters for observability. Monitoring tools need to distinguish document/data requests.
— React Router team

### 3-16. Accept past design mistakes and absorb complexity
When backward-compatibility cost is high, "absorb the complexity" of a non-ideal design is a valid judgment.
— yyx990803 (Vue.js)

### 3-17. Error handling responsibility boundary clearly defined
Frameworks cannot catch all errors. Document and draw the line for user responsibility.
— yyx990803 (Vue.js)

### 3-18. Don't casually add methods to renderer nodeOps
Custom renderers must implement all methods, so additions are technically breaking changes.
— yyx990803 (Vue.js)

### 3-19. Minimum supported version for language features
`Array.prototype.at` (Node 16.6+), `??=` (ES2021), etc. — don't sneak unsupported syntax into bug fix PRs.
— yyx990803 (Vue.js)

### 3-20. Core kept self-contained
Don't depend on external library type mechanisms (HKT registry, etc.). Simplify the dependency graph for faster compilation and easier maintenance.
— mikearnaldi (Effect-TS)

### 3-21. Wait until language features enable efficient implementation
Implement when the pattern becomes "efficient", not just "possible". E.g., waiting for TypeScript 4.1 template literal types to redesign typeclasses.
— mikearnaldi (Effect-TS)

### 3-22. New parameters added as required first, then given defaults
1) Add as required → 2) Implement in all call sites → 3) Add default value for backward compatibility. This eliminates internal omissions.
— KATT

### 3-23. Abstract Node.js APIs via duck typing instead of direct imports
Use `interface AsyncStorageLike<T>` instead of `import { AsyncLocalStorage } from 'node:async_hooks'`. Ensures compatibility in Lambda and other constrained environments.
— KATT

### 3-24. Error message changes are breaking changes
Users may depend on error message strings. Wording changes are semver-breaking.
— colinhacks

### 3-25. Check for `test.only` and `.d.ts` global pollution
Forgotten `test.only` merges, global scope pollution from `.d.ts` files — verify in review.
— colinhacks, KATT

### 3-26. Niche use cases don't belong in core
"Interesting but narrow-impact" features should be implemented in userland. Protect core bundle size and maintenance cost.
— colinhacks, mattpocock

### 3-27. Factory functions for module-level tree-shaking
Instead of a monolithic class, independent factory functions allow users who don't use subscriptions to avoid loading that code.
— KATT

### 3-28. Audit consistency across all API surface
When adding route masking, verify `useLocation` and `router.subscribe` both return the same location. API inconsistencies break user assumptions.
— React Router team

---

## 4. Runtime Environment

### 4-1. `new Function()` and environment-dependent code
JIT optimization doesn't work in Cloudflare Workers, CSP-restricted environments, etc. Provide an opt-out mechanism.
— colinhacks

### 4-2. Accurate spec compliance
Understand specs like JSON Schema precisely and prevent non-compliant usage.
— colinhacks

### 4-3. Key recalculation during schema transformation
When a schema has transforms, keys need to be rebuilt from the transformed values.
— colinhacks

### 4-4. ESM/CJS migration requires cross-build-tool manual testing
Manually test across multiple build tools (webpack, Rollup, esbuild, Vite, etc.) × dev/prod modes. Module resolution behavior differs per tool; automation is insufficient.
— markerikson (Redux Toolkit)

### 4-5. package.json fields have cascading effects on tool resolution
A `name` field can interfere with Vitest module resolution. Metadata fields are not cosmetic.
— markerikson (Redux Toolkit)

### 4-6. Type declaration bundling and module augmentation don't mix well
Interface merging / declared module patterns break in bundled .d.ts. Pragmatic retreat is sometimes the right call.
— markerikson (Redux Toolkit)

### 4-7. Vite plugins: watch for Rollup's sanitizeFileName
`:` is replaced with `_`, so virtual module name matching should use `name.endsWith()` defensively.
— pcattori (React Router)

### 4-8. Don't assume `globalThis` exists
In Vue's support range, `globalThis` may not be available. Use `import { getGlobalThis } from '@vue/shared'`.
— yyx990803 (Vue.js)

### 4-9. `__DEV__` branch for dev-only code
HMR code, warning messages, `formatComponentName`, etc. go inside `__DEV__` branches to be tree-shakeable in production.
— yyx990803 (Vue.js)

---

## 5. Test Quality

### 5-1. Test case that fails on main but passes on PR
Even for type improvement PRs, if the test can't demonstrate the diff, it's meaningless.
— TkDodo, KATT

### 5-2. Tests verify behavior, not implementation
Tests depending on internal implementation details are brittle. Verify public API behavior.
— dai-shi

### 5-3. Deleting a test equals deleting a spec
Before removing a test, reproduce the original issue and understand it before deciding on approach.
— dai-shi

### 5-4. Inline snapshots for verifying concrete output
Use `toMatchInlineSnapshot` to actually test custom error messages and other output.
— colinhacks

### 5-5. Related syntax patterns also tested
If the fixed node type is used in other syntax constructs, test those constructs too.
— DanielRosenwasser

### 5-6. Runtime tests needed even for type-only changes
Even changes that appear type-only need a test confirming "does it work at runtime?"
— colinhacks

### 5-7. Reproduction test submitted before the fix
"Demonstrate the reproduction in the issue, then validate the fix." A test that simultaneously confirms reproduction and fix is needed.
— brophdawg11 (React Router)

### 5-8. Type test determinism ensured
TypeScript union types have non-deterministic iteration order. Write test cases that guarantee "always fails" rather than "happens to pass".
— sindresorhus (type-fest)

### 5-9. New methods must have tests
"Add test?" "Needs tests." — untested new methods don't get merged. Even a single test may suffice.
— dsherret (ts-morph)

### 5-10. Assert result counts
Assert how many `edits` are returned, whether `results.length` matches expectations. Strengthens test reliability.
— dsherret (ts-morph)

### 5-12. No `sleep` needed in type tests
Type tests don't execute at runtime. `Promise.resolve(...)` from queryFn is sufficient.
— TkDodo

### 5-13. Fake timers instead of real `sleep`
`await sleep(5000)` in tests is slow. Use `vi.useFakeTimers()` for fast and deterministic execution.
— TkDodo, KATT

### 5-14. Defensive tests: valid for preventing future regressions
Even when no current issue exists, a test proving "this loop won't happen in the future" has value. Also serves as evidence for issue reports.
— timneutkens (Next.js)

### 5-15. Path/filename assertions are precise
Don't confuse pathname with file path. Helper naming should also distinguish: `isMetadataRouteFile` vs `isMetadataFileStaticRoutePage`.
— huozhi (Next.js)

### 5-16. Don't let test source depend on production source
Don't extract hashes or suffixes from source code for use in tests — hardcode them. Tests should automatically fail when implementation changes.
— huozhi (Next.js)

---

## 6. Code Quality

### 6-1. `let` replaceable with `const`
`let` signals mutable state. Consider if closures or factories can enable `const`.
— dai-shi

### 6-2. Readability > DRY
Excessive abstraction hinders understanding. If DRY pursuit makes code unreadable, split it.
— KATT

### 6-3. Deviation from existing patterns needs justification
Changing from `cached()` to IIFE + getter requires explaining why.
— colinhacks

### 6-4. Debug.assert includes an error message
Let API consumers understand the cause when assertions fail.
— DanielRosenwasser

### 6-5. Don't mix logic changes and type changes
Don't change logic in a type improvement PR. Truthy checks and `=== true` checks behave differently.
— dai-shi

### 6-6. Bug fix scope kept narrow
Target only the affected elements (e.g., Vue custom elements only) rather than applying a fix to all elements. Broad fixes have higher side-effect risk.
— yyx990803 (Vue.js)

### 6-8. Early return to reduce nesting
Nested `if` statements are hard to read. Return early to reduce indentation levels.
— KATT, yyx990803

### 6-9. `void promise` is an unhandled rejection breeding ground
`void asyncFn()` doesn't handle Promise rejection. In Node.js, this crashes the server.
— KATT

### 6-10. Avoid single-character variable names
`p`, `m`, `t` — reviewers can't follow context with these names.
— KATT

### 6-11. Don't destructure carelessly
When reference count is low, destructuring reduces readability. "Rule of 3" — destructure if referenced 3+ times.
— KATT

### 6-12. Avoid index.ts
Index files make import paths ambiguous. Use specific file names.
— KATT

### 6-14. Remove unnecessary `await`
`await` on synchronously completing code creates unnecessary microtasks.
— huozhi (Next.js)

### 6-15. Avoid unnecessary object copies
Instead of spreading every time, consider passing references directly.
— timneutkens (Next.js)

### 6-16. Comments explain the reason for changes
When taking a different approach from the original implementation, add a comment explaining why.
— timneutkens (Next.js)

### 6-17. Don't mutate objects directly
`res.props[key] = { ...t.props[key], optional: true }` — clone before modifying. Prevent unintended mutation of user raw objects or shared structures.
— yyx990803 (Vue.js)

### 6-18. Don't assign refs during rendering in Concurrent Mode
`ref.current = value` during rendering is unsafe in Concurrent Mode. Do it inside effects.
— TkDodo, dai-shi

### 6-20. Minimize function parameters, consolidate into option objects
4+ parameters should be consolidated into an option object. "What do you think about making this a single object parameter?"
— dsherret (ts-morph)

### 6-21. Variable names shouldn't imply boolean when they're predicates or functions
`excludeDeclaration` (boolean-sounding) → `declarationFilter` (predicate-sounding). Names should accurately represent type and role.
— RyanCavanaugh

### 6-22. Tuple types less readable than object types
"Can you use a (preferably named) object type instead of this tuple?" — tuples rely on position for meaning; objects with field names are self-documenting.
— DanielRosenwasser

### 6-23. `timer.unref()` to not block process exit
Timers like ping intervals should call `unref()` to not prevent graceful shutdown.
— KATT

### 6-24. Use `EMPTY_OBJ` to avoid unnecessary allocations
`return EMPTY_OBJECT` avoids creating new empty objects. But avoid `for...in` on `EMPTY_OBJ` (see 2-13).
— yyx990803 (Vue.js)

### 6-25. Regex dotAll flag (`s`) and browser compatibility
ES2018 regex features don't work in older browsers. Use compatible alternatives like `/[^]+/`.
— yyx990803 (Vue.js)

---

## 7. PR Discipline

### 7-1. Minimal diff
Format changes and unrelated fixes go in separate PRs. Large diffs reduce review quality.
— colinhacks, dai-shi

### 7-2. PR scope limited to the original issue
Unrelated fixes are out of scope. "While I'm here" fixes go in separate PRs.
— colinhacks

### 7-3. Test proving the change is necessary
If reverting the change still passes all tests, a test proving the change's necessity is missing.
— KATT

### 7-4. Drive-by changes separated
"Is this drive-by, or necessary?" — unrelated changes go in separate PRs. Split PRs by feature.
— RyanCavanaugh, dsherret

### 7-5. Dependency stability verified before adoption
Verify ecosystem adoption (vite/pnpm/storybook, etc.) for packages like tinyglobby before merging.
— dsherret (ts-morph)

### 7-6. PR split when too large
"This PR is too large to merge. Individually, we could discuss these pieces and get them merged one by one." — split multiple changes into individual PRs.
— mattpocock (ts-reset)

### 7-7. Version bumping done carefully
Build configuration changes can affect compatibility. Evaluate whether a minor bump is needed.
— markerikson (Redux Toolkit)

### 7-8. Prevent `.test.only` from being merged
CI runs all tests, so `.only` can go unnoticed. Verify in review.
— colinhacks, dsherret

### 7-9. Lock file changes generally unnecessary
In library repositories, don't include lock file changes in PRs.
— TkDodo

### 7-10. Feature addition after deprecated feature removal
Keep deprecated APIs while adding new ones, with sufficient migration period before removal.
— multiple committers

---

## 8. Framework / Compiler Specific

### 8-1. Compiler code avoids object allocations
Replacing switch with map/object creates allocations on every call. Keep switch in high-frequency compiler paths.
— RyanCavanaugh

### 8-2. Test format prioritizes baseline generation
Generated baseline files with diff verification over hand-written assertions. In the TypeScript repo, compiler/fourslash tests are more appropriate than unit tests.
— RyanCavanaugh, DanielRosenwasser

### 8-3. Impact on custom renderers considered
Adding methods to Vue's nodeOps forces all custom renderers to implement them. Treat as a breaking change.
— yyx990803

### 8-4. `__DEV__` guard to eliminate dev-only code from production
Warnings, formatComponentName, HMR code go inside `__DEV__` branches. Directly impacts user bundle size.
— yyx990803

### 8-5. Type-level complexity may kill practicality
When TypeScript 5.5 inference results become too complex for developers to understand, prioritize usability over correctness. Same for HKT internal plumbing leaking into exports.
— mikearnaldi (Effect-TS)

### 8-6. Adopt interop standards like Standard Schema
Adopt Standard Schema v1 and similar interop standards to avoid ecosystem lock-in.
— gcanti (Effect-TS)

### 8-7. API design follows SQL conventions
`select().from()` order follows SQL's `SELECT...FROM`. Leverage users' existing knowledge — sometimes convention beats theoretical type safety advantages.
— Drizzle ORM team

### 8-8. Practical type safety > theoretical type safety
A fully type-safe API may produce unreadable error messages. After 20 months in production, reverting to a simpler API is a documented case.
— dankochetov, AlexBlokh (Drizzle)

### 8-9. SSR / hydration context isolation
`renderToString` is async. Concurrent calls overwrite ssrContext. Generate context within each call and pass downstream.
— yyx990803 (Vue.js)

### 8-10. `/*#__PURE__*/` annotation declares side-effect-free
Adding `/*#__PURE__*/` to factory function calls lets bundlers eliminate them when unused.
— yyx990803 (Vue.js)

### 8-11. Microtask timing pitfalls
There's a microtask gap between async function return and evaluation. Svelte async components need context wrapping.
— Rich-Harris (Svelte)

### 8-12. `Explicit Resource Management` (`using`) — verify build environment support
`using` / `Symbol.dispose` polyfills add significant bundle code. Share via `tslib` / `@swc/helpers` or wait for target environment support.
— KATT

### 8-13. ESLint rule exceptions need language-specific reasoning in comments
When using `// eslint-disable`, explain with language constraint reasons like "constructors cannot use # prefix".
— pcattori (Remix)

### 8-14. `Date.now()` triggers synchronous I/O tracking in some environments
In Next.js internals, `Date.now()` can fire tracking. Consider alternatives on performance-critical paths.
— huozhi (Next.js)

---

## Data Sources

| Repository | Committers | Comments Collected | Period |
|-----------|-----------|-------------------|--------|
| TanStack/query, router | @TkDodo | 601 | 2023 – 2026-03 |
| colinhacks/zod | @colinhacks | 581 | 2020 – 2026-03 |
| trpc/trpc | @KATT | 173 | 2024-11 – 2026-03 |
| pmndrs/zustand, jotai, valtio | @dai-shi | 1,687 | 2023 – 2026-03 |
| microsoft/TypeScript | @RyanCavanaugh, @DanielRosenwasser | 197 | 2022-08 – 2026-03 |
| sindresorhus/type-fest | @sindresorhus | 253 | 2023 – 2026-03 |
| dsherret/ts-morph | @dsherret | 270 | 2018 – 2026-03 |
| total-typescript/ts-reset | @mattpocock | ~54 | 2023 – 2026-03 |
| reduxjs/redux-toolkit, redux, reselect, react-redux | @markerikson | 645 | 2021 – 2026-03 |
| vuejs/core, vitejs/vite | @yyx990803 | 437 | 2019 – 2026-03 |
| remix-run/react-router, remix | @pcattori, @brophdawg11 | 790 | 2024 – 2026-03 |
| sveltejs/svelte, kit, rollup/rollup | @Rich-Harris | 862 | 2022 – 2026-03 |
| vercel/next.js | @timneutkens, @huozhi, @shuding | 152 | 2025 – 2026-03 |
| Effect-TS/effect | @mikearnaldi, @gcanti | 787 | 2022 – 2026-03 |
| drizzle-team/drizzle-orm, prisma/prisma | @dankochetov, @AndriiSherman, @jacek-prisma, @aqrln | 349 | 2023 – 2026-03 |
| **Total** | **20+ committers** | **7,785** | |
