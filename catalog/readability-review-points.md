# Readability Review Points

Language-agnostic code readability review checklist. Categories derived from empirical analysis of 2,401 code review comments in OSS projects (Oliveira et al., "Understanding Code Understandability Improvements in Code Reviews", IEEE TSE 2024). 42% of all code review comments target readability improvements, and 83.9% of such suggestions are accepted — readability is a first-class quality attribute.

**Scope**: This catalog covers the **reader's cognitive experience** — whether a developer unfamiliar with the code can understand it without unnecessary effort. It does NOT cover correctness (general-review), type safety (code-quality/ts-patterns), or architectural fitness (simplicity/structural-patterns).

**Reference**: https://arxiv.org/abs/2410.21990

---

## 1. Bad Identifier

Identifiers are the primary channel through which code communicates intent. A bad identifier forces the reader to trace execution to understand what something represents.

### 1-1. Identifier does not reflect purpose or content

The name fails to communicate what the variable, function, or class represents. The reader must read the implementation to understand the name.

```typescript
// ❌ Name does not communicate content
const d = new Date();
const list = fetchUsers();
function process(data: unknown) { /* ... */ }

// ✅ Name communicates purpose
const createdAt = new Date();
const activeUsers = fetchUsers();
function validateAndNormalize(rawInput: unknown) { /* ... */ }
```

### 1-2. Identifier does not match its type or return value

The name implies a different type or shape than what the code actually produces. This is a direct source of misunderstanding.

```typescript
// ❌ Name implies handler (callback), but it's an executor (service)
const requestHandler = new RequestExecutor();

// ❌ Name implies plural collection, but returns a formatted string
function getDates(): string { return `${start} - ${end}`; }

// ✅ Name matches what it is
const requestExecutor = new RequestExecutor();
function getDateRange(): string { return `${start} - ${end}`; }
```

### 1-3. Typo in identifier

Misspelled identifiers create confusion about whether the typo is intentional (a different concept) or accidental.

```typescript
// ❌ Typo creates ambiguity
const seperate = items.join(",");
function calcualteTotal() { /* ... */ }

// ✅ Correct spelling
const separated = items.join(",");
function calculateTotal() { /* ... */ }
```

### 1-4. Identifier style inconsistent with project conventions

Using a different casing or naming pattern from the rest of the codebase forces the reader to pause and wonder if the inconsistency is meaningful.

```typescript
// ❌ Parameter in UPPER_CASE looks like a constant
function createUser(USER_ID: string) { /* ... */ }

// ❌ Boolean without is/has/should prefix in a codebase that uses them
const valid = schema.check(input);

// ✅ Follows project convention
function createUser(userId: string) { /* ... */ }
const isValid = schema.check(input);
```

---

## 2. Incomplete or Inadequate Documentation

Documentation (JSDoc, inline comments, annotations) is a direct aid to understanding. Missing, incorrect, or redundant documentation harms readability.

### 2-1. Missing documentation on non-obvious public API

A public function, class, or module export whose behavior is not self-evident from its signature lacks documentation. The reader must read the implementation.

```typescript
// ❌ Non-obvious behavior undocumented
export function retry<T>(fn: () => Promise<T>, n: number): Promise<T> { /* ... */ }

// ✅ Behavior documented where signature alone is insufficient
/**
 * Retries `fn` up to `n` times with exponential backoff (base 200ms).
 * Throws the last error if all attempts fail.
 */
export function retry<T>(fn: () => Promise<T>, n: number): Promise<T> { /* ... */ }
```

### 2-2. Documentation contradicts implementation

Stale or incorrect documentation is worse than no documentation — the reader trusts the comment and forms a wrong mental model.

```typescript
// ❌ Comment says inclusive, implementation is exclusive
/** Returns items from `start` to `end` (inclusive). */
function slice(items: Item[], start: number, end: number) {
  return items.slice(start, end); // slice is exclusive on end
}
```

### 2-3. Redundant comment restating what code already says

Comments that restate the code add noise without aiding understanding. They also become maintenance liabilities.

```typescript
// ❌ Comment restates the code
// increment counter by 1
counter += 1;

// ❌ Obvious from the code
// check if user is admin
if (user.role === "admin") { /* ... */ }
```

### 2-4. TODO/FIXME comment for already-completed or abandoned work

Stale task comments mislead the reader into thinking work remains. They should be removed when the task is done or the decision is made.

---

## 3. Complex, Long, or Inadequate Logic

Code that requires excessive mental effort to trace — through verbosity, indirection, or non-idiomatic patterns — harms readability even when correct.

### 3-1. Verbose expression replaceable by idiomatic API call

A multi-step expression that reimplements what a standard library or framework method already provides.

```typescript
// ❌ Reimplements what the API already offers
if (Object.keys(map).length > 0) { /* ... */ }
const result = arr.filter(x => x !== null && x !== undefined);

// ✅ Uses idiomatic API
if (map.size > 0) { /* ... */ }  // for Map
const result = arr.filter(Boolean);
```

### 3-2. Anonymous function or verbose construct replaceable by concise alternative

When the language offers a shorter construct with identical semantics, the verbose version adds cognitive load without benefit.

```typescript
// ❌ Verbose anonymous function
items.forEach(function(item) {
  process(item);
});

// ✅ Concise equivalent
items.forEach(item => process(item));
// or even: items.forEach(process);
```

### 3-3. Long method doing multiple things

A function that exceeds reasonable length because it handles multiple responsibilities. The reader cannot hold the entire function in working memory.

**Not warranted when**: The function is a single linear sequence (e.g., configuration setup) where splitting would scatter related steps.

### 3-4. Deeply nested conditionals

Nested if/else chains force the reader to track multiple conditions simultaneously. Guard clauses and early returns flatten the logic.

```typescript
// ❌ Deep nesting
function process(user: User) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission("edit")) {
        return doWork(user);
      }
    }
  }
  return null;
}

// ✅ Flattened with guard clauses
function process(user: User) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission("edit")) return null;
  return doWork(user);
}
```

---

## 4. Unnecessary Code

Code elements that can be removed without changing behavior impose cognitive load on the reader, who must determine whether each element matters.

### 4-1. Unused imports, variables, constants, or functions

Dead code that is never referenced. The reader wastes effort determining whether the element is used elsewhere.

### 4-2. Commented-out code

Commented-out code suggests incomplete work or a fallback the reader should understand. Version control serves this purpose — remove it.

### 4-3. Redundant expression or intermediate variable

Code that computes or stores a value only to immediately pass it through without transformation.

```typescript
// ❌ Intermediate variable used once with no clarifying name
const result = client.execute(query);
return result;

// ✅ Direct return (unless the variable name adds clarity)
return client.execute(query);
```

**Not warranted when**: The intermediate variable has a descriptive name that clarifies a complex expression.

### 4-4. Semantically duplicate code

Two functions or expressions that produce identical results through different code paths. The reader cannot tell if the difference is intentional.

---

## 5. Inconsistent or Disrupted Formatting

Formatting inconsistencies break the reader's visual scanning pattern, forcing conscious attention on structure instead of semantics.

### 5-1. Inconsistent spacing or indentation

Horizontal or vertical spacing that deviates from the surrounding code without purpose.

### 5-2. Missing structural characters that clarify scope

Omitted braces or parentheses that would make the code's structure explicit. Operator precedence, in particular, is a common source of misreading.

```typescript
// ❌ Precedence unclear without parentheses
if (a && b || c) { /* ... */ }

// ✅ Parentheses make evaluation order explicit
if ((a && b) || c) { /* ... */ }
```

### 5-3. Code elements not in conventional position

Code elements placed in unexpected positions relative to project conventions — e.g., variable declarations scattered throughout a function body, or methods ordered in a way that breaks reading flow.

---

## 6. Wrong, Missing, or Inadequate String Expression

String literals in error messages, logs, and assertions are natural-language documentation of system behavior. Poor string content undermines the reader's (and operator's) understanding.

### 6-1. Error or exception message missing or uninformative

A thrown error or assertion failure that provides no context about what went wrong or how to fix it.

```typescript
// ❌ Uninformative
throw new Error("Invalid input");

// ✅ Actionable message
throw new Error(
  `Expected positive integer for retryCount, got ${retryCount}`
);
```

### 6-2. Typo or incorrect wording in string literal

Misspelled words or incorrect descriptions in user-facing or developer-facing messages create confusion about whether the message matches the actual behavior.

### 6-3. String literal style inconsistent with project conventions

Inconsistent capitalization, punctuation, or phrasing patterns across similar messages in the same codebase.

---

## 7. Inadequate Logging and Monitoring

Log statements and exception types communicate system behavior to developers during debugging and operations. Inadequate logging obscures what the system is doing.

### 7-1. Missing log at a significant decision point or failure path

A code path where something notable happens (fallback triggered, retry initiated, unexpected state encountered) but no log records it. Debugging requires adding logs and reproducing.

### 7-2. Debug or development log left in production code

Verbose logging (`console.log`, `System.out.println`) that was useful during development but creates noise in production.

### 7-3. Log level inappropriate for the message severity

Using `error` for informational messages or `debug` for critical failures. Incorrect levels make log filtering unreliable.

### 7-4. Generic exception type hiding specific failure

Throwing a base exception class (e.g., `Error`, `RuntimeException`) when a specific exception type would communicate the failure mode.

```typescript
// ❌ Generic type — caller cannot distinguish failure modes
throw new Error("encoding failed");

// ✅ Specific type — caller can handle appropriately
throw new EncodingError(`Failed to encode ${format}: unsupported charset`);
```

---

## 8. Missing Constant Usage

Magic values (literal numbers, strings) scattered in code force the reader to infer their meaning from context. Constants give meaning a name.

### 8-1. Magic value without named constant

A literal value whose meaning is not self-evident from the surrounding code.

```typescript
// ❌ What does 86400000 mean?
setTimeout(cleanup, 86400000);

// ✅ Named constant communicates intent
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
setTimeout(cleanup, ONE_DAY_MS);
```

### 8-2. Existing constant available but not used

The project already defines a constant for this value, but the code uses the raw literal instead. This also creates a DRY violation.

---

## Distinction from Other Catalogs

| This catalog checks | NOT covered here (see instead) |
|---------------------|-------------------------------|
| Identifier communicates intent (1-x) | Naming convention rules (code-quality 8-x) |
| Documentation accuracy and necessity (2-x) | Documentation-code consistency (code-quality 11-x) |
| Logic conciseness for readability (3-x) | Logic correctness (general-review), over-abstraction (simplicity) |
| Dead code as cognitive noise (4-x) | Dead code as tech debt (code-quality 5-x) |
| Formatting for visual parsing (5-x) | Linter-enforced formatting rules (automated) |
| String quality in messages (6-x) | Input validation of strings (security-perf) |
| Logging adequacy (7-x) | Error handling completeness (error-resilience) |
| Magic values (8-x) | Hardcoded secrets (code-quality security rules) |

The key difference: other catalogs ask "is this correct / safe / simple?" This catalog asks **"can a reader unfamiliar with this code understand it without unnecessary effort?"**
