---
name: code-quality-rules
description: Use when writing code, reviewing code, writing tests, or when a potential quality issue is detected.
---

# Code Quality Rules

This skill has two roles:
1. **Enforce existing rules** - Always follow rules during implementation
2. **Self-evolve rules** - Propose additions when new quality issues are discovered

## Absolute Rules (violate = delete and redo)

### TDD Required

Wrote production code before tests? → **Delete and redo.**

```
❌ Never do this
1. Write code first
2. Add tests later
3. "It works, tests can wait"

✅ Do this
1. Write a failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor (REFACTOR)
4. Commit
```

"It works without tests so it's fine" → **This is rationalizing a rule violation. Delete and redo.**

### TypeScript Type Safety

```typescript
// ❌ Strictly forbidden
const data = response as UserData;  // type assertion with `as`
const user = data as any;           // escaping to `any`
// @ts-ignore                       // ignoring TS errors
// @ts-expect-error                 // same

// ✅ Correct approach
// Use type guards
function isUserData(data: unknown): data is UserData {
  return typeof data === 'object' && data !== null && 'id' in data;
}

// Use runtime validation (e.g. zod)
const userData = userSchema.parse(response);
```

"Types don't match but it works, so `as`" → **Delete and redo. Investigate why types don't match.**

### ESLint/Linter Rules

```typescript
// ❌ Never do this
// eslint-disable-next-line  ← silently disable without reason
/* eslint-disable */         ← disable for entire file

// ✅ Correct approach
// 1. Try to fix it in code first
// 2. If not possible, analyze why
// 3. Consult the human and decide together
```

**Flow when a lint error occurs:**

```
Lint error occurs
    ↓
Fixable in code? ─→ Yes → Fix the code
    ↓ No
    ↓
Why can't it be fixed?
    ↓
┌─────────────────────────────────────────────────────┐
│ Pattern 1: Code design is wrong                     │
│   → Propose a design change                         │
│                                                     │
│ Pattern 2: ESLint rule doesn't fit the project      │
│   → Suggest "maybe this rule should be changed"     │
│   → Discuss .eslintrc config changes                │
│                                                     │
│ Pattern 3: Special case needs an exception          │
│   → Explain reasoning, discuss whether to disable   │
│   → If disabling, leave a comment explaining why    │
└─────────────────────────────────────────────────────┘
```

**How to consult:**

```
⚠️ ESLint Rule Consultation

**Error**: [rule name]
**Code**: [code snippet]
**Why it can't be fixed**: [reason]

**Proposals**:
- Option A: [change code this way]
- Option B: [change eslintrc rule this way]
- Option C: [disable for this line only (reason: ...)]

Which do you prefer?
```

"Silently disable" → **Never. Always consult.**
"Maybe the rule itself is wrong" → **Good observation. Let's discuss.**

### Test Quality

```typescript
// ❌ Lazy assertions (strictly forbidden)
expect(result).toBeDefined();
expect(result).toBeTruthy();
expect(result).not.toBeNull();
expect(users.length).toBeGreaterThan(0);

// ✅ Specific assertions
expect(result).toEqual({ id: 1, name: 'Test User' });
expect(result.status).toBe('active');
expect(users).toHaveLength(3);
expect(users[0].email).toBe('test@example.com');
```

"Just make it pass for now" → **Delete and redo. Tests are specifications.**

## Post-Implementation Checklist

Run after every file change:

```bash
# 1. Type check
npm run typecheck  # or tsc --noEmit

# 2. Lint
npm run lint

# 3. Test
npm run test

# 4. Build (if applicable)
npm run build
```

**Do not proceed until everything passes.**

---

## Rule Evolution Protocol

### Flow When an Issue Is Discovered

When you notice "this is a bad pattern" during implementation:

1. **Identify the problem**
   - What is the problem
   - Why is it a problem
   - How should it be fixed

2. **Propose to the human**
   ```
   ⚠️ Quality Rule Addition Proposal

   **Detected issue**: [specific problem]
   **Why it's a problem**: [reason]
   **Proposed rule**: [rule to add]

   Add this rule to code-quality-rules? (y/n)
   ```

3. **If approved**
   - Add the new rule to this SKILL.md file
   - Include concrete ❌ and ✅ examples
   - Commit message: `chore: add quality rule - [rule name]`

4. **If rejected**
   - Record the reason (not needed now, team decided otherwise, etc.)
   - Don't force it

### Rule Addition Format

```markdown
### [Rule Name]

[Why this rule is needed - 1-2 sentences]

```[language]
// ❌ Never do this
[bad example]

// ✅ Correct approach
[good example]
```

"[common excuse]" → **[how to handle]**
```

---

## Project-Specific Rules

Customized per project. New approved rules are added here.

<!-- PROJECT_RULES_START -->
<!-- Approved project-specific rules will be added here -->
<!-- PROJECT_RULES_END -->

---

## Anti-Rationalization

Claude is smart enough to find reasons to bypass rules. The following are not accepted:

| Excuse | Response |
|--------|----------|
| "Just this once" | There's no special reason. Follow the rule. |
| "No time" | Cutting quality costs more time later. |
| "It works so it's fine" | Working and being correct are different things. |
| "I'll fix it later" | Later never comes. Fix it now. |
| "This case is an exception" | Once you start making exceptions, rules become meaningless. Consult the human. |
| "Testing is hard" | If it's hard to test, the code design is bad. Revisit the design. |

**Following the letter of the rule IS following the spirit.**
"I'm following the spirit" is not an accepted excuse.
