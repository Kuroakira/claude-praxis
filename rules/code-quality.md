# Code Quality Rules

Always-applied constraints. Violate = delete and redo.

## TDD Required

Wrote production code before tests? → **Delete and redo.** Follow the RED-GREEN-REFACTOR cycle: failing test → minimal code to pass → refactor.

```
❌ Write code first, add tests later
✅ Failing test (RED) → minimal code (GREEN) → refactor (REFACTOR)
```

## TypeScript Type Safety

```typescript
// ❌ Forbidden
const data = response as UserData;  // `as` assertion
const user = data as any;           // escape to `any`
// @ts-ignore                       // ignoring TS errors
// @ts-expect-error

// ✅ Use type guards or runtime validation
function isUserData(data: unknown): data is UserData {
  return typeof data === 'object' && data !== null && 'id' in data;
}
const userData = userSchema.parse(response);  // zod
```

## No Generic Return Types for Untyped Data

Generic return types on JSON.parse wrappers are disguised `as` assertions.

```typescript
// ❌ Disguised assertion — no runtime validation
function readInput<T>(): Promise<T> { return JSON.parse(data); }

// ✅ Return unknown, validate at use-site
function readInput(): Promise<unknown> { return JSON.parse(data); }
```

## ESLint/Linter Rules

Never silently disable. Fix in code first. If unfixable, consult the human:

```
⚠️ ESLint Rule Consultation
**Error**: [rule name]  **Code**: [snippet]  **Why unfixable**: [reason]
Options: A) change code  B) change eslintrc  C) disable with comment
```

## Test Quality

```typescript
// ❌ Lazy assertions (forbidden)
expect(result).toBeDefined();
expect(result).toBeTruthy();
expect(users.length).toBeGreaterThan(0);

// ✅ Specific assertions
expect(result).toEqual({ id: 1, name: 'Test User' });
expect(users).toHaveLength(3);
```

## Simplicity Over Cleverness

AI-generated code systematically tends toward over-engineering. Actively resist this — at **every level**, from planning to code.

### Planning Level

**Always evaluate structural fitness before planning implementation.** Never assume the current structure is the right structure.

```
❌ Plan to add conditionals/branches to accommodate the new feature
❌ Plan to duplicate patterns in a new location because the existing structure doesn't fit
❌ Plan that touches many files for a conceptually simple feature (structural friction signal)
❌ Plan that assumes the current structure is the right structure without evaluating fitness
❌ Plan that follows an existing pattern without evaluating whether that pattern is appropriate

✅ Always evaluate: does the existing structure naturally support this change?
✅ When the feature fights the structure, restructure first, then add — never patch around structural problems
✅ When adding requires spreading logic across many places, consolidate first
✅ Always include refactoring tasks BEFORE feature tasks when structure doesn't fit
✅ Always ask: "What's the simplest structure that supports both existing and new behavior?"
✅ When following an existing pattern, verify the pattern itself is appropriate — consistency with a bad pattern is not a virtue
```

### Code Level

```
❌ Wrapper function with one caller
❌ Generic type parameter used with only one concrete type
❌ Configuration object for values that never change
❌ Abstract class with a single implementation
❌ Strategy/factory pattern for 1-2 variants (use if/switch)
❌ Nested if/else chains (flatten with early returns)
❌ Service → Helper → Util → actual logic (unnecessary indirection)

✅ Inline simple logic — extract only when reused or complex
✅ Concrete types until generalization is proven necessary
✅ Direct values until configuration is proven necessary
✅ Guard clauses and early returns over nested conditionals
✅ Shortest call chain that maintains clarity
```

**Rule of thumb**: If removing a layer, parameter, or abstraction would make the code simpler without losing functionality, remove it. If restructuring existing code would make the new feature simpler to add, restructure first.

## No Obvious Comments

Comments explain WHY, not WHAT. If code already shows what it does, a restating comment is noise.

## Post-Implementation Checklist

Run after every change. Do not proceed until all pass:

```bash
npm run typecheck
npm run lint
npm run test
npm run build       # if applicable
```

## Security Rules

**No Hardcoded Secrets** — Use environment variables. Never commit secrets.

**Input Validation at Boundaries** — Validate all external input (API requests, user input, URL parameters). Parameterize queries.

**No Dynamic Code Execution** — No `eval()`, `Function()`, `exec()`. Use lookup tables or `execFile` with explicit arguments.

**Dependency Awareness** — Check downloads, vulnerabilities, necessity, and license before adding dependencies.

## Anti-Rationalization

| Excuse | Response |
|--------|----------|
| "Just this once" | Follow the rule. |
| "It works so it's fine" | Working and correct are different. |
| "I'll fix it later" | Fix it now. |
| "This case is an exception" | Consult the human. |
| "Testing is hard" | Code design is bad. Revisit. |
| "It might be needed later" | YAGNI. Remove it now. |
| "This abstraction makes it extensible" | Extensible for what? Prove the need. |
| "It's a best practice" | Best practice for this scale? Simplicity is also a best practice. |

**Following the letter of the rule IS following the spirit.**

## Project-Specific Rules

<!-- PROJECT_RULES_START -->
<!-- Approved project-specific rules will be added here -->
<!-- PROJECT_RULES_END -->
