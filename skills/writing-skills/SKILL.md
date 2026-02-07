---
name: writing-skills
description: Use when creating a new skill, improving an existing skill, or adding a rule to code-quality-rules.
---

# Writing Skills

Apply TDD to skill creation. Test how the agent fails first, then write the minimal skill to prevent it.

## The Iron Law

```
NO SKILL WITHOUT A BASELINE FAILURE TEST
```

## TDD for Skills

### RED — Establish the Baseline

1. Run a scenario WITHOUT the skill
2. Document exactly how the agent fails:
   - What did it skip?
   - What rationalizations did it use? (capture verbatim)
   - What shortcuts did it take?
3. These failures become your test cases

### GREEN — Write the Minimal Skill

1. Address each documented failure
2. Include counter-rationalizations for each observed excuse
3. Add concrete examples (what to do / what not to do)
4. Keep it minimal — don't add rules for problems you haven't seen

### REFACTOR — Close Loopholes

1. Run the scenario again WITH the skill
2. Did the agent find new workarounds?
3. If yes, add explicit countermeasures
4. Repeat until the skill is robust

## SKILL.md Structure

### Frontmatter (CSO — Claude Search Optimization)

```yaml
---
name: skill-name-with-hyphens
description: Use when [trigger conditions only]. Never summarize the workflow here.
---
```

**Critical**: The description must contain ONLY trigger conditions.
If you summarize the workflow in the description, Claude will follow the summary
as a shortcut instead of reading the full skill. This is the #1 cause of skill non-compliance.

### Body Structure

1. **Title + One-liner** — What this skill does in one sentence
2. **The Iron Law** — One non-negotiable rule in a code block (for discipline skills)
3. **Process** — Step-by-step instructions
4. **Red Flags** — Self-check list (thoughts that mean "stop and reconsider")
5. **Common Rationalizations** — Table: excuse → rebuttal
6. **Integration** — Cross-references to related skills
7. **Quick Reference** — Condensed version for scanning

### Token Budget

- Bootstrap/frequently-loaded skills: < 200 words
- Standard skills: < 500 words
- Complex skills with templates: < 1000 words

The context window is a shared resource. Every unnecessary word costs attention.

## Persuasion Principles for Skill Design

Based on Cialdini's framework, validated for LLM contexts:

| Principle | Application |
|-----------|-------------|
| **Authority** | Imperative language: "YOU MUST", "No exceptions" |
| **Commitment** | Require announcements: "I'm using [skill]" |
| **Scarcity** | Time-bound: "IMMEDIATELY after", "BEFORE proceeding" |
| **Social Proof** | Universal patterns: "Every time", "Always" |

**Ethics test**: Would this technique serve the user's genuine interests if they fully understood it?

## Common Mistakes in Skill Writing

| Mistake | Fix |
|---------|-----|
| Describing workflow in frontmatter description | Only trigger conditions in description |
| Writing rules for hypothetical problems | Only write rules for observed failures |
| Too verbose (>500 words for simple skill) | Cut ruthlessly. Brevity = compliance |
| No rationalization countermeasures | Add table of excuses → rebuttals |
| No integration section | Declare which skills this works with |

## Integration

- Feeds into `code-quality-rules` — new rules follow this writing process
- The self-evolution protocol in code-quality-rules uses this skill's TDD approach
