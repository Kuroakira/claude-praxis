# Security & Performance Review Points

Language-agnostic security and performance review checklist. Extracted from actual PR reviews by top OSS committers and review gap analysis.
For detailed quotes and context, see `claudedocs/research/security-perf-review-insights.md`.

---

## 1. Input Validation

### 1-1. User input not reaching format strings
Verify all paths — direct and indirect — where user input reaches string formatting functions. Watch for indirect arrival through chained calls.
— tniessen (Node.js)

### 1-2. Type constraints maintained across layers
When value ranges differ across layers (e.g., scripting language → native, frontend → backend), verify constraints at each layer independently. A value valid upstream may overflow downstream.
— tniessen (Node.js)

### 1-3. Arithmetic overflow considered
Verify that additions like offset + length, or implicit truncation in bit operations (32-bit, etc.) don't bypass validation.
— tniessen, BridgeAR (Node.js)

### 1-4. Option object properties read only once
Objects with malicious getters/proxies can return different values on each property access. Copy security-critical values to local variables before use.
— tniessen (Node.js)

### 1-5. Validation/limit change scoped to intended code paths only
When a validation rule or size limit is relaxed for a specific use case (e.g., increasing `MAX_DATA_SIZE` for table elements), verify that the change doesn't apply to unrelated code paths sharing the same constraint. A limit raised to support large tables may also allow oversized payloads for sticky notes, comments, or other element types that don't need it.

**Verification steps**:
1. Identify all code paths that pass through the changed validation
2. For each path, ask: "Does this path's use case justify the relaxed constraint?"
3. If not, the validation needs per-type or per-path scoping
— Derived from PR review gap analysis: MAX_DATA_SIZE increase for table support also applied to all other element types

### 1-6. Deserialization validation for persisted structured data
When structured data (JSON arrays, nested objects) is stored in a database and read back, the runtime type may not match the expected type. Jagged arrays, null entries, missing fields, or malformed JSON can bypass compile-time type checks. Validate structure at the deserialization boundary, not just at the type level.

```
// ❌ Trust DB data matches the type
const cells: TableCell[][] = JSON.parse(row.data);
// Jagged array, null row, or extra fields silently accepted

// ✅ Validate structure at deserialization boundary
const parsed: unknown = JSON.parse(row.data);
const cells = tableCellsSchema.parse(parsed);  // zod or similar
```
— Derived from PR review gap analysis: TableCell[][] from DB assumed rectangular but could contain jagged arrays or invalid entries

---

## 2. Object Pollution

### 2-1. User input not used as object keys
Using user input as plain object keys enables prototype pollution. Use `Object.create(null)` or `Map`.
— CVE-2022-21824 (Node.js)

### 2-2. Security-critical options not accepting prototype chain values
Use `hasOwnProperty` checks or destructuring in option processing to prevent unintended values from the prototype chain.
— LiviaMedeiros (Node.js)

---

## 3. Resource Management

### 3-1. Event listener registration and removal paired
Especially for pooled resources, clean up listeners before reuse. maxListeners warnings signal leaks.
— Node.js core team

### 3-2. Resource ownership clear
Manual close/dispose/free is a leak breeding ground. Use RAII, try-with-resources, `using` declarations, or finally blocks for guaranteed cleanup.
— joyeecheung (Node.js)

### 3-3. Short-lived objects not unnecessarily heap-allocated
Short-lived objects or closures created on every loop iteration cause GC pressure. Consider stack variables or pre-allocation as alternatives.
— bnoordhuis (Node.js)

---

## 4. DoS Prevention

### 4-1. Network input has size limits and timeouts
Unlimited input is a DoS vector. Set upper bounds on headers, body, chunk sizes, etc.
— Node.js security team

### 4-2. Parser fields have size limits
Even if specs allow "arbitrary length", implementations need limits. CVE-2024-22019 (unlimited chunked transfer encoding extension size) is a real-world example.
— Node.js security team

### 4-3. Long-idle connections properly drained
Set idle timeouts and max request counts on keep-alive connections to prevent zombie connections from exhausting resources.
— Node.js core team

---

## 5. Performance

### 5-1. Performance improvement backed by benchmarks
"Probably faster" is not evidence. If claiming improvement, benchmarks are mandatory.
— ronag, joyeecheung (Node.js), mcollina (Fastify)

### 5-2. Fast path for frequently called validations
Check the most common case first and early-return to skip unnecessary processing.
— ronag (Node.js)

### 5-3. No indirect property access on hot paths
Getters/setters and Proxies degrade hot path performance. Consider replacing with direct property access.
— ronag (Node.js)

### 5-4. Small I/O operations batchable
Combining multiple small write/send operations reduces system call count.
— ronag (Node.js)

### 5-5. No unnecessary initialization on object creation paths
Eliminate unnecessary property setup, event emission, and default value computation during initialization. Keep creation paths minimal.
— ronag (Node.js)

### 5-6. useLayoutEffect for non-DOM-measurement work
`useLayoutEffect` runs synchronously after DOM mutation and blocks visual update. When the effect only updates a ref, sets state from props, or performs non-DOM work, `useEffect` is sufficient. Unnecessary `useLayoutEffect` delays paint and hurts perceived performance, especially on low-end devices.

```tsx
// ❌ useLayoutEffect updating a ref that doesn't need DOM measurement
useLayoutEffect(() => {
  prevValueRef.current = value;  // no DOM read — useEffect is sufficient
}, [value]);

// ✅ useEffect for non-DOM work
useEffect(() => {
  prevValueRef.current = value;
}, [value]);

// ✅ useLayoutEffect IS correct when measuring DOM before paint
useLayoutEffect(() => {
  const height = elementRef.current.getBoundingClientRect().height;
  setMeasuredHeight(height);  // needs DOM measurement before paint
}, [children]);
```

**Rule of thumb**: `useLayoutEffect` is only justified when the effect reads DOM geometry (`getBoundingClientRect`, `offsetHeight`, `scrollTop`) or mutates DOM to prevent visual flicker. All other effects should use `useEffect`.
— Derived from PR review gap analysis: `useLayoutEffect` used for ref updates without DOM measurement, security-perf reviewer noted "render-phase state update" but did not flag the specific useLayoutEffect overuse

---

## 6. Bundle / Delivery Optimization

### 6-1. Module format not blocking tree-shaking
Prefer ESM exports. CommonJS prevents tree-shaking, inflating bundle size.
— feedthejim (Next.js)

### 6-2. sideEffects declaration matches actual side effects
Declaring `sideEffects: false` while having side-effectful code causes tree-shaking to remove necessary code.
— Next.js team

### 6-3. Request pipeline addition overhead measured
Middleware/hook additions affect all requests. Measure overhead and make opt-in if needed.
— delvedor, mcollina (Fastify)

---

## 7. Sandbox / Permissions

### 7-1. File path validation after symlink resolution
Prevent sandbox bypass via symlinks. Canonicalize with `realpath` before applying access control.
— Deno security team

### 7-2. Pseudo-filesystems considered
`/proc/self/environ` and similar pseudo-filesystems bypass normal file access control. Block explicitly.
— Deno security team

### 7-3. FFI/native code call permission check in place
FFI is the most powerful sandbox bypass mechanism. Check permissions more strictly than for other operations.
— Deno security team
