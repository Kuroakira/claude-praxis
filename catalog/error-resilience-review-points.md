# Error Resilience Review Points

Language-agnostic error handling and fault tolerance review checklist. Extracted from actual PR reviews by top OSS committers.
Focuses on detecting code that works on the happy path but breaks under failure conditions.

---

## 1. Error Capture Scope

### 1-1. try-catch scope too broad
Wrapping both I/O operations and business logic in the same try-catch causes business logic bugs to be handled as I/O errors. Scope try-catch to the error source only; let other errors propagate.
— huozhi, timneutkens (Next.js)

### 1-2. "Not found" vs "access error" distinguished
When file existence checks or data retrieval return null/undefined for both "doesn't exist" (normal absence) and "I/O error" (failure), disk failures and network failures are silently ignored.
— timneutkens (Next.js)

### 1-3. Catch block not swallowing all errors
`catch (e) { return null; }` suppresses all errors. Catch only expected error types and re-throw the rest.
— huozhi (Next.js), mikearnaldi (Effect-TS)

### 1-4. External API error notification method matches caller's handling approach
External libraries and SDKs don't always report errors via exceptions. Redirects (next-auth `signIn` with `redirect: true`), response objects with error properties, callback arguments, event emission — each library has its own error notification method. If the code assumes try/catch will capture errors, verify the callee actually throws in that mode. Pay special attention when default option values determine the error notification method (`redirect: true` as default means errors are reported via redirect, not exceptions).
(See: general-review-points 8-4 detects default behavior mismatches as implicit assumptions.)

**Verification steps**:
1. Identify external API calls wrapped in try/catch or `.catch()`
2. Check the API's documentation for error behavior (throw / return value / redirect / callback)
3. Check whether default options affect the error notification method
4. If the code's handling approach doesn't match the API's notification method, report the mismatch

### 1-5. User-initiated action errors not distinguished from system errors
User actions like closing a popup, cancelling a dialog, navigating away, or aborting an operation produce errors that are semantically different from system failures. When both flow through the same catch block with a generic error message ("Sign-in failed"), the user sees a failure message for something they intentionally did. Distinguish user-initiated errors and suppress or handle them silently.

```
// ❌ Popup close and auth failure both show "Sign-in failed"
try {
  await signInWithPopup(auth, provider);
} catch (e) {
  setError("Sign-in failed. Please try again.");  // shown even when user closed popup
}

// ✅ Distinguish user-initiated cancellation from actual errors
try {
  await signInWithPopup(auth, provider);
} catch (e) {
  if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") {
    return;  // user intentionally cancelled — not an error
  }
  setError("Sign-in failed. Please try again.");
}
```

**Common user-initiated error signals**: `auth/popup-closed-by-user`, `AbortError` (from AbortController), `auth/cancelled-popup-request`, `user_cancelled`, dialog dismiss events. Each external API has its own set — check the API's documentation for cancellation-specific error codes.
— Derived from PR review gap analysis: all 8 reviewers missed popup cancellation UX in a Firebase Auth implementation

---

## 2. Error Propagation and Information Preservation

### 2-1. Original error information not lost during error transformation
When wrapping into a new error, verify `cause` property and original stack trace are preserved. "An unknown error occurred" burying the original error makes debugging difficult.
— mikearnaldi (Effect-TS)

### 2-2. Error type not changing across layers
When error types change while passing through transformation layers, upstream catch/match logic breaks. If type transformation is needed, document it explicitly in types and docs.
— mikearnaldi, gcanti (Effect-TS)

### 2-3. Error message actionable for the user
Messages should communicate "what happened and what to do next", not internal implementation details (stack traces, internal variable names).
— timneutkens (Next.js)

---

## 3. Resource Cleanup

### 3-1. Resources released on error paths
When cleanup only executes on the success path and errors cause early returns, resources (file handles, DB connections, temp files, Map entries) leak. Use `finally` blocks or RAII patterns.
— timneutkens (Next.js), joyeecheung (Node.js)

### 3-3. Resource lifecycle (creation, use, disposal) explicit
Resources where it's ambiguous whether `destroy()` or `onCloseOrError` gets called are breeding grounds for leaks and double-frees. Document disposal conditions for each resource.
— KATT (tRPC)

---

## 4. Partial Defenses

### 4-1. Defensive logic covers all code paths
Null checks or type checks in some branches but not others ("asymmetric defense") crash on the unprotected paths.
— timneutkens (Next.js)

### 4-2. Defense covers all input types
E.g., a visited set handling only object types but not primitives or arrays. Verify the guard covers the full range of types and values it targets.
— colinhacks (Zod), RyanCavanaugh (TypeScript)

### 4-3. Error collection not stopping at the first error
Using `.find()` to return only the first error forces users to fix problems one-by-one and re-run. Collect all errors and report them at once.
— timneutkens (Next.js)

---

## 5. Async Error Handling

### 5-1. Error handler registered on event emitters
Node.js EventEmitter crashes the process if no handler is registered for the error event. Verify error handler registration when creating async resources.
— KATT (tRPC)

### 5-2. Errors not silently lost mid-Promise chain
`.then()` without `.catch()`, or `.catch()` with an empty handler. Trace to the end of the Promise chain and verify errors are handled on all paths.
— KATT (tRPC), mikearnaldi (Effect-TS)

### 5-3. Timeout functioning in both request and response directions
Resetting timeout on the send side only but not the receive side means one-directional failures (no response) go undetected.
— KATT (tRPC)

---

## 6. State Machines and Lifecycle

### 6-1. All state transition patterns handled
In state machines, if non-happy-path transitions like "error during connecting" or "cancel during initializing" aren't defined, the system enters unexpected states.
— KATT (tRPC)

### 6-2. Initialization function retry-safe (idempotent)
When retrying an initialization function after failure, verify no double-registration or double-initialization occurs. Non-idempotent initialization makes retry impossible.
— mikearnaldi (Effect-TS)

### 6-3. Configuration defaults are "safe values"
When required configuration defaults to empty string or zero, missing configuration silently passes through, causing cryptic errors downstream. Required config should have no default and throw on absence.
— dankochetov (Drizzle ORM)

---

## 7. Graceful Degradation

### 7-1. Feature degradation explicitly notified
Silent switching to polyfills or fallback implementations makes root cause identification difficult when dependent features malfunction. Notify via warning logs or fallback markers.
— yyx990803 (Vue.js/Vite)

### 7-2. Operations not repeating without bounds
`Array.from()` on an infinite iterable, unbounded retries, recursion without depth limits, etc. Set guard limits on all repeating operations.
— mikearnaldi (Effect-TS)

### 7-3. Timeout value meaning and retry policy documented
`15000ms` as a magic number alone doesn't indicate whether to retry after timeout or escalate immediately. Comment the timeout's intent and recommended action.
— timneutkens (Next.js)

### 7-4. Retry/wait strategy not accounting for execution context
A retry with exponential backoff (e.g., 3 retries, max 600ms total) is reasonable on the client side where it runs in the background. The same retry on the server side (e.g., in a JWT callback, API route handler, or middleware) blocks the HTTP request — the user's browser hangs for the total retry duration. Evaluate whether the retry strategy is appropriate for where the code actually executes.

```
// ❌ Server-side JWT callback retries 3x with backoff — user waits up to 600ms+ for page load
async jwt({ token }) {
  try {
    return await refreshToken(token);
  } catch {
    return await retryWithBackoff(() => refreshToken(token), { maxRetries: 3 });
    // user's request is blocked for the entire retry duration
  }
}

// ✅ Server-side: fail fast, let client handle retry or show refresh prompt
async jwt({ token }) {
  try {
    return await refreshToken(token);
  } catch {
    return { ...token, error: "RefreshFailed" };  // propagate to client
  }
}
```

**Key question**: "Is this code running within a user's HTTP request lifecycle?" If yes, every millisecond of retry/wait directly increases response time. Prefer fail-fast with error propagation over server-side retry.
— Derived from PR review gap analysis: error-resilience confirmed retry bounds (3x, 600ms) but missed that JWT callback blocks the request

---

## AI-Generated Code Resilience Patterns

| Pattern | Review Point |
|---------|-------------|
| `catch (e) { return null; }` swallowing all errors | 1-3: catch swallowing |
| Cleanup only on success path via finally | 3-1: error path resource release |
| Null check in some branches only | 4-1: asymmetric defense |
| Promise chain without `.catch()` | 5-2: silent error loss |
| Wrapping external API in try/catch but API doesn't throw on error | 1-4: error notification mismatch |
| Magic number timeouts | 7-3: timeout intent |
| `.find()` returning only the first error | 4-3: error collection stopping |
| Generic "failed" message for user-initiated cancellation | 1-5: user action vs system error |
| Server-side retry blocking HTTP request | 7-4: execution context retry |
