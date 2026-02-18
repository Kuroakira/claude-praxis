---
name: document-quality-rules
description: Use ALWAYS when writing, editing, or creating any document — markdown files, technical writing, reports, proposals, READMEs, or any prose-heavy content. Also use when reviewing documents for quality. Does NOT apply to Design Docs (use design-doc-format instead).
---

# Document Quality Rules

This skill has two roles:
1. **Enforce existing rules** - Always follow rules when writing documents
2. **Self-evolve rules** - Propose additions when new quality issues are discovered

## Absolute Rules (violate = rewrite)

### Abstract-to-Concrete Structure (Document Level)

Every document flows from abstract to concrete. A reader who stops at any point should have a coherent (if incomplete) understanding.

```
❌ Never do this
1. Jump into implementation details
2. List specifics before context
3. Assume the reader already knows the background

✅ Do this
1. Purpose and context (why this document exists)
2. Key concepts at a high level (what the reader needs to know)
3. Specifics and details (how things work concretely)
4. Implications and next steps (what this means going forward)
```

"The details are more important" → **Details without context are noise. Context first, always.**

### Abstract-to-Concrete Structure (Section Level)

Within each section, follow the same pattern. Lead with context, follow with specifics, close with implications.

```
❌ Never do this
## Authentication
We use JWT tokens with RS256 signing. The token expiry is 15 minutes.
Refresh tokens last 7 days. Here's why we chose this approach...

✅ Do this
## Authentication
Users need secure, stateless session management that works across
our distributed services. (context)

We use JWT tokens with RS256 signing — stateless verification without
shared session storage. Tokens expire after 15 minutes to limit the
window of compromise; refresh tokens (7-day lifetime) handle renewal
without re-authentication. (specifics)

This means each service validates tokens independently — no central
session store becomes a single point of failure. (implication)
```

"It's obvious from context" → **If you need to say that, it isn't obvious. State it explicitly.**

### Terminology Consistency

Define terms at first use. Use the same term for the same concept throughout. Never introduce synonyms without explicit bridging.

```
❌ Never do this
The "service" handles requests. ... The "module" processes incoming data.
... The "component" returns the response.
(Are these the same thing? Three different things?)

✅ Do this
The **request handler** (the service that receives and processes HTTP
requests) validates input and returns responses. ... The request handler
also manages rate limiting. ... When the request handler encounters
an error, it delegates to the error middleware.

If you must introduce a new term for an existing concept:
The request handler (also called the "gateway" in our infrastructure
diagrams) sits at the edge of the network.
```

"The reader will figure it out" → **The reader will be confused. Use one term consistently or bridge explicitly.**

### Progressive Detailing with Known Terms

Each explanation builds on concepts the reader has already encountered. Introduce new ideas using previously defined terms as anchors.

```
❌ Never do this
## Rate Limiting
The sliding window algorithm counts requests in a time frame.

## Request Handler  ← defined AFTER it was needed above
The request handler receives HTTP requests.

✅ Do this
## Request Handler
The request handler receives and processes HTTP requests.

## Rate Limiting
The **request handler** enforces rate limiting using a sliding window
algorithm — it counts the number of requests within a rolling time
frame and rejects requests that exceed the threshold.
```

The rule: **never reference a concept before defining it.** If section B depends on a term from section A, section A comes first.

"I'll define it later" → **The reader doesn't know that. Define before use, or restructure.**

### No Terminology Drift

Once a term is established, do not subtly shift its meaning. If a term's scope needs to expand, acknowledge the change explicitly.

```
❌ Never do this
"Authentication" in section 1: user login
"Authentication" in section 4: ...also includes API key validation
and service-to-service tokens (meaning silently expanded)

✅ Do this
"Authentication" in section 1: user login via JWT
"Authentication" in section 4: In addition to user login, this system
also handles API key validation and service-to-service authentication.
These three mechanisms share the same verification pipeline described
above, but differ in token format.
```

"It's a natural extension" → **Natural to you. Confusing to the reader. Bridge the expansion.**

### Self-Contained Sections

Each section should be understandable with minimal backtracking. When referencing another section, provide enough inline context that the reader doesn't need to jump.

```
❌ Never do this
## Error Handling
As described in the Architecture section, errors are handled by
the middleware chain. (forces the reader to go back)

✅ Do this
## Error Handling
Errors propagate through the middleware chain (the layered processing
pipeline described in Architecture). Each middleware layer can catch,
transform, or forward errors to the next layer.
```

"Just read the previous section" → **Restate the essential context inline. Readers skip around.**

## Document Checklist

Review before finalizing any document:

```
Structure:
- [ ] Document flows from abstract to concrete overall
- [ ] Each section follows context → specifics → implications
- [ ] A reader stopping at any point has coherent understanding

Terminology:
- [ ] Every term is defined at or before first meaningful use
- [ ] Same concept uses same term throughout (no silent synonyms)
- [ ] Scope changes in terms are explicitly bridged
- [ ] Sections that depend on earlier concepts come after them

Readability:
- [ ] Sections are self-contained (minimal backtracking needed)
- [ ] Cross-references include inline context
- [ ] No assumption of knowledge not provided in the document
```

---

## Rule Evolution Protocol

### Flow When an Issue Is Discovered

When you notice a document quality problem during writing or review:

1. **Identify the problem**
   - What makes this hard to read or understand
   - Why it confuses the reader
   - How it should be restructured

2. **Propose to the human**
   ```
   ⚠️ Document Quality Rule Addition Proposal

   **Detected issue**: [specific problem]
   **Why it's a problem**: [reader impact]
   **Proposed rule**: [rule to add]

   Add this rule to document-quality-rules? (y/n)
   ```

3. **If approved**
   - Add the new rule to this SKILL.md file
   - Include concrete ❌ and ✅ examples
   - Commit message: `chore: add document quality rule - [rule name]`

4. **If rejected**
   - Record the reason
   - Don't force it

### Rule Addition Format

```markdown
### [Rule Name]

[Why this rule is needed - 1-2 sentences]

```
❌ Never do this
[bad example]

✅ Do this
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

| Excuse | Response |
|--------|----------|
| "The reader should already know this" | Don't assume. Provide context. |
| "It's obvious" | If you have to say it's obvious, it isn't. State it. |
| "I'll clarify later in the doc" | Define before use. Restructure if needed. |
| "Using different words makes it more interesting" | Consistency beats variety. One term, one concept. |
| "This section is too short to structure" | Even two sentences benefit from context-first ordering. |
| "Everyone does it this way" | Convention doesn't excuse confusion. Write for clarity. |

**Following the letter of the rule IS following the spirit.**
"I'm following the spirit" is not an accepted excuse.
