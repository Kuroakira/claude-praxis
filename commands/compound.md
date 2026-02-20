---
name: compound
description: Promote valuable knowledge from Flow to Stock — curate learnings from recent work
disable-model-invocation: false
---

Invoke skill `context-persistence`, then execute both phases sequentially.

## Phase 1: Flow → Stock Promotion

1. Read `.claude/context/progress.md` (recent work log)
2. For each entry, evaluate: does this contain reusable knowledge?
3. **Present a routing proposal to the human** — do NOT write directly:

```
📋 /compound — Knowledge Promotion Proposal

From progress.md, I found the following promotable learnings:

| # | Learning | Context / Rationale | Proposed Destination | Level | Initial Confidence |
|---|----------|--------------------|--------------------|-------|--------------------|
| 1 | "JWT chosen over session-based auth" | "Stateless requirement, multiple API consumers" | project learnings | design | 1回 \| today \| implement |
| 2 | "Scope creep on auth feature" | "Started login, ended up adding 2FA" | project learnings | feature-spec | 1回 \| today \| implement |
| 3 | "deny-by-default for error paths" | "Silent allow on parse failure = gate bypass" | project learnings | coding | 1回 \| today \| implement |
| 4 | "CORS middleware must come before auth" | "Auth middleware rejects preflight requests otherwise" | global learnings | — | — |
| 5 | "Never use eval()" | "Arbitrary code execution risk" | code-quality-rules | — | — |
| 6 | "Design Docs should focus on WHY, not HOW" | "HOW becomes outdated when implementation changes" | framework improvement → design-doc-format | — | — |
| 7 | "Fixed typo in line 42" | — | discard | — | — |

Adjust any routing? (or "OK" to proceed)
```

**Level column**: Only for `project learnings` destination. Determines which file the learning is written to.

**Level判定基準**: この学びが再利用される場面を考える。「要件を決めるとき」に役立つなら feature-spec、「設計を決めるとき」なら design、「コードを書くとき」なら coding。複数に該当する場合は、最も影響の大きいレベルに1箇所だけ配置する。

**Important**: Every learning MUST include its context/rationale — the WHY behind the decision or discovery. This context is what makes the learning reusable: when a similar situation arises later, we can ask "does the same rationale still apply?" instead of blindly repeating the same choice.

**Initial Confidence column**: Only for `project learnings` destination. All new entries start at `1回 | {today's date} | {source phase}`. The promotion itself is the first confirmation. Replace `today` with the actual date (YYYY-MM-DD) and the source phase with the phase where the learning was discovered (e.g., implement, design, debug).

4. Wait for human confirmation or adjustments before writing
5. For quality rule candidates, follow the Rule Evolution Protocol in `code-quality-rules`:
   - Propose the rule to the human
   - If approved, add to SKILL.md with examples
6. After confirmation, write to destinations with the `- **Confirmed**:` field and clean up promoted entries from `progress.md`

**Writing format**: Each promoted entry is written with four fields:
```markdown
## [entry title]
- **Learning**: [what was learned]
- **Context**: [why — rationale and discovery context]
- **Implication**: [when/how to apply]
- **Confirmed**: 1回 | 2026-02-20 | implement
```

7. **Write execution marker**: After writing promoted entries, write `.claude/context/compound-last-run.json`:
   ```json
   { "timestamp": "<current ISO timestamp>", "promotedCount": <number of entries promoted> }
   ```
   This marker is read by PreCompact and Stop hooks to determine if /compound was executed before compact.

8. **Reset context pressure**: If `.claude/context/context-pressure.json` exists, delete it. Knowledge preservation is complete, so the urgency signal is no longer relevant. The next StatusLine update will recreate it if usage is still high.

9. Report final results

| Destination | Level | Target File | Criteria |
|-------------|-------|-------------|----------|
| project learnings | feature-spec | `.claude/context/learnings-feature-spec.md` | Requirements, scope decisions |
| project learnings | design | `.claude/context/learnings-design.md` | Architecture, design patterns |
| project learnings | coding | `.claude/context/learnings-coding.md` | Implementation patterns, quality |
| global learnings | — | `~/.claude/learnings/global-learnings.md` | Cross-project knowledge |
| code-quality-rules | — | self-evolution | Universal quality rule |
| framework improvement | — | `[skill or command]` | Better way to work |
| discard | — | — | Not reusable |

### Framework Improvement Process

When a learning is about **how to work** (not what to build), route it to the relevant skill or command:

1. Identify which skill/command should be updated (e.g., `design-doc-format`, `research.md`, `systematic-debugging`)
2. Propose a specific edit to the human: what to add/change and why
3. If approved, apply the edit directly to the skill or command file
4. This is how the framework evolves from experience — not just code quality rules, but research methods, design practices, implementation workflows, and debugging approaches

## Phase 2: Stock Compression

After promotion is complete, review existing learnings for compression opportunities. This keeps learnings files growing in **density**, not just size.

1. Read all 3 learnings files: `learnings-feature-spec.md`, `learnings-design.md`, `learnings-coding.md`
2. Identify compression candidates in 3 categories:

| Category | What to look for | Example |
|----------|-----------------|---------|
| 重複排除 (Dedup) | Same insight recorded in different contexts | "deny-by-default" + "error paths should exit 2" → merge |
| 陳腐化削除 (Obsolete) | Learning invalidated by project evolution | Bash hook patterns after Node.js migration |
| 類似統合 (Synthesize) | Multiple learnings sharing a common principle | 3 hook patterns → "hooks should be mechanical state checks" |

3. **Present compression proposal to the human** — do NOT execute directly:

```
🗜️ Stock Compression Proposal

| # | Category | Target Entries | Current Confidence | Proposed Action | Rationale |
|---|----------|---------------|-------------------|-----------------|-----------|
| 1 | Dedup | "deny-by-default" + "exit 2 on errors" | 3回 + 2回 | Merge (→ 5回) | Same pattern, different expressions |
| 2 | Obsolete | "Bash heredoc escaping" | 4回 | Delete | Node.js migration complete |
| 3 | Synthesize | 3 hook state patterns | 2回, 3回, 1回 | Unify (→ 1回, new) | Common principle discovered |
| 4 | Confirm | "deny-by-default pattern" | 3回 | Confirm (→ 4回) | Still valid, increment |

Approve compressions? (adjust or "OK" to proceed)
```

**Confidence handling per operation**:
- **Dedup (Merge)**: Sum confirmation counts, union phases, use latest date
- **Obsolete (Delete)**: Entry is removed. High confidence does NOT prevent deletion — if the premise is invalid, delete regardless of count
- **Synthesize (Unify)**: New abstracted entry starts at `1回`. The original entries' counts are NOT inherited — the synthesis is a new insight. Record "Synthesized from N entries" in the Context field
- **Confirm (Increment)**: When an existing entry is reviewed and still valid, increment its count, update date, add current phase

4. Wait for human confirmation
5. Execute approved compressions
6. For entries without a `- **Confirmed**:` field (unverified/migrated entries), add `- **Confirmed**: 1回 | {today} | compound` upon review confirmation
7. Report: entries before → entries after per file, include confidence changes

**Rationale is required** for every compression candidate. Without a clear reason, the proposal is noise.

**No candidates?** Report "No compression candidates found." and finish. Do not force compression.
