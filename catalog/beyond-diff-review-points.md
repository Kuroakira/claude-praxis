# Beyond-Diff Review Points

Review checklist for issues that only surface when looking beyond the immediate diff.
Bot reviewers excel at finding problems within changed code but systematically miss these 3 categories.

---

## 1. Temporal State Tracking

Trace state transitions across multiple operations over time — not just "does this function work once?" but "what happens on the 2nd, 3rd, Nth invocation?"

### 1-1. State not updated after successful operation invalidates subsequent decisions
A value read at startup (token expiry, cache timestamp, config version) is used for conditional logic but never updated after the condition triggers an action. The action executes correctly once, but subsequent checks use stale state and re-trigger unnecessarily.

```
// ❌ tokenExpiryTime checked to decide refresh, but never updated after refresh succeeds.
//    Every subsequent request sees the old expiry and refreshes again.
if (Date.now() > tokenExpiryTime) {
  await refreshToken();  // succeeds, but tokenExpiryTime still holds the old value
}

// ✅ Update the state that drives the decision after the action succeeds
if (Date.now() > tokenExpiryTime) {
  const newToken = await refreshToken();
  tokenExpiryTime = newToken.expiresAt;  // state updated
}
```

### 1-2. Lifecycle event handler racing with in-progress operations
An event listener (auth state change, connection status, visibility change) fires during an ongoing async operation and starts a conflicting action. The first operation completes into an inconsistent state.

```
// ❌ onAuthStateChanged fires signIn while signOut is still in progress
onAuthStateChanged((user) => {
  if (!user) signIn();  // races with ongoing signOut()
});

// ✅ Guard with operation-in-progress flag or queue
onAuthStateChanged((user) => {
  if (isSigningOut) return;  // skip during active signOut
  if (!user) signIn();
});
```

### 1-3. Retry/polling loop not observing updated state
A retry loop captures initial state in a closure and re-uses it across iterations. State changes between retries (new token, updated config, changed connection) are invisible to the loop.

### 1-4. Accumulated side effects across repeated invocations
Event listeners added on each call without cleanup, timers set without clearing previous ones, entries appended to a collection without bounds. The first invocation works; the 100th causes memory leaks, duplicate handlers, or performance degradation.

---

## 2. Cross-Diff Consistency

When a pattern is changed in one location, verify that all other locations using the same pattern are also updated.

### 2-1. Same API call pattern not consistently fixed across callers
A fix applied to one call site (e.g., adding `redirect: false` to `signIn()`) is not applied to other call sites that use the same function with the same problem.

```
// ❌ SignIn.container fixed, but NextAuthProvider.signIn still uses the old pattern
// File A (fixed):
const result = await signIn("credentials", { redirect: false });
// File B (not fixed):
await signIn("credentials", { callbackUrl: "/" });  // still has the original bug
```

**How to check**: For each changed function call, search for all other call sites of the same function. Verify whether the fix applies to them too.

### 2-2. Error handling strategy inconsistent across similar operations
One endpoint validates input and returns structured errors; a sibling endpoint doing similar work skips validation or returns raw errors. The fix improves one path but leaves others vulnerable.

### 2-3. Type/interface change not propagated to all consumers
A field name, type, or shape change in a shared type/interface is reflected in the changed files but not in files outside the diff that depend on the same type.

### 2-4. Configuration or constant change not applied to all environments
A value changed in one config file (dev, staging) but not in others (production, test). Or a constant updated in one module but still referenced by its old value elsewhere.

---

## 3. External Spec Conformance

Verify that code matches what external APIs, protocols, or services actually expect — not just what the code internally assumes.

### 3-1. Request format not matching API specification
Missing required headers (Content-Type, Authorization scheme), wrong HTTP method, incorrect request body structure, or mismatched field names (`refreshToken` vs `refresh_token`).

```
// ❌ API expects snake_case field names per OAuth2 spec
fetch("/token", {
  body: JSON.stringify({ refreshToken: token })  // wrong field name
});

// ✅ Match the API's expected field names
fetch("/token", {
  headers: { "Content-Type": "application/json" },  // required header
  body: JSON.stringify({ refresh_token: token })     // correct field name
});
```

### 3-2. Response shape assumption not matching actual API response
Code destructures or accesses fields that don't exist in the actual response, or assumes a response structure (nested object vs flat, array vs single) that differs from the API contract.

### 3-3. Error response format not matching API's error contract
Code expects errors as thrown exceptions, but the API returns error information in the response body (or vice versa). Or code parses error messages assuming a format the API doesn't guarantee.

### 3-4. Authentication/authorization flow not following protocol spec
OAuth2 flows, JWT validation, CSRF token handling, or session management deviating from the protocol specification. Especially: token refresh flows that skip required parameters or misorder steps.

### 3-5. Rate limiting, pagination, or retry expectations not matching API behavior
Code assumes unlimited requests, single-page responses, or idempotent retries when the API has rate limits, paginated responses, or non-idempotent operations.

---

## AI-Generated Code Patterns

| Pattern | Review Point |
|---------|-------------|
| Token refresh that works once but breaks on repeat | 1-1: state not updated after operation |
| Auth state listener conflicting with ongoing auth flow | 1-2: lifecycle event racing |
| Fix applied to one call site but not siblings | 2-1: inconsistent fix across callers |
| Field name mismatch with external API | 3-1: request format |
| Missing Content-Type or auth headers | 3-1: request format |
| Catching errors from an API that returns them in response body | 3-3: error contract mismatch |
