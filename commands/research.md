---
name: research
description: >-
  Investigate a topic by searching across the current codebase, related
  repositories, and the public web. Returns a structured summary with cited
  sources. Use to broaden context before reading code or making decisions —
  not to commit to a design.
disable-model-invocation: false
---

Begin the **Research Phase**.

The goal is a structured survey of a topic with cited sources, NOT a recommendation. The output is reading material that broadens context.

## Step 1: Clarify scope

Confirm with the user (one quick exchange, not a multi-turn interview):
- What topic to research
- What kind of sources matter most (current codebase / OSS prior art / official docs / blog posts)
- Any explicit "do NOT search" exclusions

If the topic is clear from the invocation, skip to Step 2 with one-line confirmation.

## Step 2: Search across sources

In parallel where possible:
- **Codebase**: grep / read current project for existing patterns matching the topic
- **Public web**: WebSearch + WebFetch for OSS implementations, official docs, established patterns
- **Adjacent repos**: if the user mentioned a related repo (e.g., a sibling project), include its relevant files

Cite every claim. Every finding must include a source — file path with line number for code, URL with title for web sources.

## Step 3: Write structured summary to file

Before writing, read the plugin's quality rules and follow them while composing the summary:

- `${CLAUDE_PLUGIN_ROOT}/rules/document-quality.md` — always applies.
- `${CLAUDE_PLUGIN_ROOT}/rules/japanese-writing.md` — applies **only when the output language is Japanese** (the output matches the language the user wrote the request in). The research summary is Markdown, so all of that file's rules apply, including the formatting rules.

Write the summary to `claudedocs/research/YYYY-MM-DD-[topic-slug].md` (kebab-case slug from the topic, max 60 chars). Also surface a brief inline confirmation to the user (file path + 1-sentence summary of what was found).

File content format:

```
# Research: [topic]

Generated: YYYY-MM-DD

## Codebase findings
- [finding] — `[file:line]`
- ...

## External findings
- [finding] — [Source Title](URL)
- ...

## Patterns observed
[1-2 paragraphs synthesizing what the sources collectively suggest, without recommending one]

## Open questions
- [question that the sources didn't resolve]
- ...
```

Do NOT produce: "preliminary recommendation", "alternatives considered", "ideal vs pragmatic vs incremental" framing. Those belong in a Design Doc downstream (handled by superpowers), not in research output.
