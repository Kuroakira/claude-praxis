# Document Quality Rules

Always-applied constraints for all documents. Violate = rewrite.

## Abstract-to-Concrete Structure (Document Level)

Every document flows from abstract to concrete. A reader stopping at any point has coherent understanding.

```
❌ Jump into details, list specifics before context
✅ 1. Purpose/context → 2. Key concepts → 3. Specifics → 4. Implications
```

## Abstract-to-Concrete Structure (Section Level)

Within each section: lead with context, follow with specifics, close with implications.

```
❌ "We use JWT with RS256. Expiry is 15 min. Here's why..."
✅ Context (why needed) → Specifics (JWT, RS256, 15min) → Implication (independent verification)
```

## Terminology Consistency

Define terms at first use. One term per concept. Never introduce synonyms without explicit bridging.

```
❌ "The service handles..." then "The module processes..." (same thing? different?)
✅ "The request handler validates..." consistently, or bridge: "also called 'gateway' in infra diagrams"
```

## Progressive Detailing with Known Terms

Never reference a concept before defining it. If section B depends on a term from section A, A comes first.

## No Terminology Drift

Once a term is established, do not silently shift its meaning. Acknowledge scope changes explicitly.

## Self-Contained Sections

Each section understandable with minimal backtracking. Cross-references include enough inline context.

```
❌ "As described in the Architecture section..." (forces reader to go back)
✅ "Errors propagate through the middleware chain (the layered pipeline described in Architecture)."
```

## Document Checklist

```
Structure:
- [ ] Abstract to concrete overall and per section
- [ ] Reader stopping at any point has coherent understanding

Terminology:
- [ ] Every term defined at or before first use
- [ ] Same term for same concept (no silent synonyms)
- [ ] Scope changes explicitly bridged

Readability:
- [ ] Sections self-contained (minimal backtracking)
- [ ] Cross-references include inline context
```

## Anti-Rationalization

| Excuse | Response |
|--------|----------|
| "The reader should already know this" | Provide context. |
| "It's obvious" | State it explicitly. |
| "I'll clarify later in the doc" | Define before use. |
| "Different words make it interesting" | Consistency beats variety. |

**Following the letter of the rule IS following the spirit.**

## Project-Specific Rules

<!-- PROJECT_RULES_START -->
<!-- Approved project-specific rules will be added here -->
<!-- PROJECT_RULES_END -->
