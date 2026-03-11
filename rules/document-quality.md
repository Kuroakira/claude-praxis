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

## Diagram Complexity (Mermaid)

One diagram, one abstraction level. A diagram that exceeds **15 nodes** is a signal that the section is mixing abstraction levels — trying to show both the forest and the trees in one picture.

```
❌ One diagram with 30 nodes covering the entire system at every level of detail
✅ Overview diagram (5-8 nodes: high-level components) → each component has its own section with a focused diagram
```

**Why this matters**: Complex diagrams increase cognitive load more than they aid understanding. A reader cannot hold 20+ relationships in working memory. Splitting by abstraction level also improves document structure — if you need a complex diagram, the section itself is probably trying to cover too much.

**When a diagram exceeds 15 nodes**:

1. **Raise abstraction** — Group related nodes into a single high-level node. The grouped details become a separate diagram in a deeper section
2. **Split into focused diagrams** — Each diagram explains one thing at one level. Connect them through the document's section hierarchy (overview section → detail section)
3. **Mirror document structure** — The diagram hierarchy should match the document's abstract-to-concrete flow. Overview diagram in the overview section, component diagram in the component section

```
❌ Section "System Architecture" with a 40-node mermaid covering everything
✅ Section "System Architecture" with 6-node overview diagram
   → Section "Auth Module" with 8-node diagram of auth internals
   → Section "Data Pipeline" with 7-node diagram of pipeline stages
```

**Subgraph is not a substitute for splitting**: Mermaid's `subgraph` groups nodes visually but does not reduce cognitive load — the reader still sees all nodes at once. Use subgraphs for logical grouping within a manageable diagram (under 15 nodes), not as a way to cram more nodes into one diagram.

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

## Conciseness

One idea per sentence. If removing a word doesn't change the meaning, remove it.

```
❌ "基本的に、このシステムは主にユーザー認証を行うためのものとなっています"
✅ "このシステムはユーザー認証を行う"

❌ "It should be noted that the service is responsible for handling authentication"
✅ "The service handles authentication"
```

Verbosity signals (delete or rewrite on sight):
- Modifiers removable without meaning change ("基本的に", "主に", "～となっています", "it should be noted that", "in order to")
- Paraphrased repetition of the same point
- Unnecessary insertions between subject and verb

## Document Checklist

```
Structure:
- [ ] Abstract to concrete overall and per section
- [ ] Reader stopping at any point has coherent understanding

Terminology:
- [ ] Every term defined at or before first use
- [ ] Same term for same concept (no silent synonyms)
- [ ] Scope changes explicitly bridged

Diagrams:
- [ ] Every mermaid diagram ≤15 nodes
- [ ] One abstraction level per diagram
- [ ] Diagram hierarchy mirrors document structure (overview → detail sections)

Conciseness:
- [ ] No filler words or redundant modifiers
- [ ] One idea per sentence

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
| "It sounds more polished/professional" | Concise is professional. |
| "More words make it clearer" | If removing words keeps meaning, they add noise. |

**Following the letter of the rule IS following the spirit.**

## Project-Specific Rules

<!-- PROJECT_RULES_START -->
<!-- Approved project-specific rules will be added here -->
<!-- PROJECT_RULES_END -->
