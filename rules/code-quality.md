# Code Quality Rules

Always-applied constraints. Violate = delete and redo.

## TDD Required

Wrote production code before tests? → **Delete and redo.** For the detailed RED-GREEN-REFACTOR procedure, see `tdd-cycle` skill.

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

**Following the letter of the rule IS following the spirit.**

## Project-Specific Rules

<!-- PROJECT_RULES_START -->
<!-- Approved project-specific rules will be added here -->
<!-- PROJECT_RULES_END -->
