# Claude Praxis — Project Overview

@rules/document-quality.md

## What this project is

A two-command Claude Code plugin for understanding source code:

- `/guide [scope] [intent]` → produces a single-file interactive HTML walkthrough at `claudedocs/investigations/YYYY-MM-DD-[topic-slug].html`
- `/research [topic]` → produces a cited survey at `claudedocs/research/YYYY-MM-DD-[topic-slug].md`

## File structure

```
claude-praxis/
├── rules/
│   └── document-quality.md         # Always-on quality rules for HTML/Markdown output
├── agents/
│   ├── scout.md                    # Read-only codebase explorer (used by /guide)
│   └── researcher.md               # Read-only researcher (used by /research)
├── commands/
│   ├── guide.md                    # /guide entry point
│   └── research.md                 # /research entry point
├── skills/
│   └── guide-generation/
│       ├── SKILL.md                # /guide pipeline (4 phases)
│       └── assets/
│           ├── head.html           # Mermaid + highlight.js + lightbox boilerplate
│           └── style.css           # Single-file layout + callouts + player/demo styles
├── claudedocs/                     # Output destination
│   ├── investigations/             # /guide output
│   └── research/                   # /research output
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── README.md
└── CLAUDE.md
```

## Session Cache MCP

Before reading any file, call `check_cache` from the session-cache server with the file path. If the cache returns a hit, use the summary instead of re-reading unless you need details not covered by the summary. After reading, call `record_read` with a 2-4 sentence summary. At the start of a complex task, call `get_session_map` to see what was already read.

## Research policy (applies to /research)

- Cite every claim with a URL or file:line reference
- Prefer primary sources (official docs > GitHub repos > blog posts > Stack Overflow)
- Flag outdated information explicitly
- If a claim cannot be verified, state that — do not fabricate

## Language policy

- Output artifacts (HTML walkthroughs, research summaries): match the language the user wrote the request in
- Internal files (SKILL.md, CLAUDE.md, command files): English

## Relationship to superpowers

Praxis produces understanding artifacts; superpowers handles design and implementation. The handoff is informal: the user reads the `/guide` HTML and `/research` summary, then invokes superpowers with their own framing.
