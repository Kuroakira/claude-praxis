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

## Plain Language

Prefer concrete, direct expressions over abstract jargon. If a reader must decode a term to understand the sentence, rewrite it.

```
❌ "メンバーシップのセマンティクスを検証する"
✅ "どのエレメントがセクションに属するかを検証する"

❌ "The module encapsulates the lifecycle semantics of the entity"
✅ "The module controls when the entity is created, updated, and deleted"
```

When a technical term is unavoidable, define it inline on first use. But if a plain expression conveys the same meaning, use the plain expression.

## Breathing Room

Dense text blocks exhaust the reader. Use whitespace to separate ideas visually.

```
❌ Section heading immediately followed by 10+ lines of unbroken prose
✅ Section heading → 1-2 sentence context → blank line → details
```

- **Between sections**: Always one blank line after a heading before content
- **Between paragraphs**: One blank line between distinct ideas. If two paragraphs discuss the same point, they should be one paragraph
- **After code blocks / diagrams**: One blank line before continuing prose

**Wall-of-text signal**: If a paragraph exceeds 5 lines, check whether it contains multiple ideas. If yes, split at the idea boundary with a blank line.

## Lists Over Prose

When information has parallel structure, use lists. Prose that enumerates is harder to scan.

```
❌ "The system supports JWT, OAuth2, and API keys. JWT is used for session auth,
    OAuth2 for third-party integration, and API keys for service-to-service."

✅ The system supports three auth methods:
   - **JWT** — session authentication
   - **OAuth2** — third-party integration
   - **API keys** — service-to-service communication
```

**When to use bullet lists**: 3+ parallel items, feature lists, pros/cons, requirements.

**When to use numbered lists**: Steps with order dependency, priority-ranked items.

**When NOT to use lists**: Narrative explanation, cause-and-effect reasoning, argument flow. These need prose to connect ideas.

**List hygiene**:
- Each item is one idea (no multi-sentence bullets)
- Consistent grammatical form across items (all nouns, all verbs, all sentences — don't mix)
- No nested lists deeper than 2 levels — if needed, restructure into subsections

## Visual Chunking

Long unbroken content creates cognitive fatigue. Break content into scannable chunks.

```
❌ 15-line paragraph explaining three related but distinct concepts
✅ Three 3-5 line paragraphs, each covering one concept, separated by blank lines
```

**Chunk boundaries**: Place breaks at idea transitions, not arbitrary line counts. A 7-line paragraph about one idea is fine. A 4-line paragraph mixing two ideas should be split.

**Section length**: If a section exceeds ~20 lines of prose (excluding code blocks and lists), consider whether it covers multiple sub-topics that deserve their own subsections.

## Emphasis Discipline

Bold and italic aid scanning when used sparingly. Overuse neutralizes their effect.

```
❌ **The system** uses **JWT tokens** for **authentication** with **15-minute** expiry
✅ The system uses JWT tokens for authentication with **15-minute expiry**
```

- **Bold**: Key terms at definition, critical constraints, warnings. Ask: "Would a scanner miss something important without this?"
- **Italic**: Introducing a term, attributing a phrase, subtle emphasis. Rare
- **Neither**: Default. Most text needs no emphasis

**Overuse signal**: If more than ~20% of a paragraph is bold, nothing stands out — reduce to the one or two most important phrases.

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

Plain Language:
- [ ] No abstract jargon when a concrete expression conveys the same meaning
- [ ] Technical terms defined inline on first use if unavoidable

Visual Readability:
- [ ] No paragraph exceeds 5 lines without an idea-boundary check
- [ ] 3+ parallel items use bullet or numbered lists, not prose
- [ ] List items are single-idea, consistent grammatical form, ≤2 nesting levels
- [ ] Bold used only for key terms / critical constraints (~20% max per paragraph)
- [ ] Blank lines between sections, paragraphs, and after code blocks

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
| "It's the correct technical term" | If a plain expression conveys the same meaning, use it. |

**Following the letter of the rule IS following the spirit.**

## Project-Specific Rules

<!-- PROJECT_RULES_START -->
<!-- Approved project-specific rules will be added here -->
<!-- PROJECT_RULES_END -->
