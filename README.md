# Claude Praxis

**A focused tool for deeply understanding source code.**

Claude Praxis produces two artifacts:

- **`/guide [scope] [intent]`** — a single-file interactive HTML walkthrough of a specific aspect of a codebase. Contains prose, diagrams (Mermaid + custom SVG), a sequence player for stepping through call chains, and (when the target has state) a live demo where you can click to see the state machine update. Read alongside the code.

- **`/research [topic]`** — a structured cited survey of a topic, searching across the current codebase, related repos, and the public web. Returns reading material, not a recommendation. Hand off to superpowers (or your own thinking) for design work downstream.

Both commands are intentionally one-shot: heavy upfront investigation produces a high-quality artifact in a single emission. Iterate manually if needed.

## Installation

```bash
claude plugin marketplace add Kuroakira/claude-praxis
claude plugin install claude-praxis@claude-praxis
```

## When to use

- You opened a directory you don't fully understand and you want a walkthrough that ties prose to the actual files.
- You're about to start a design and you want a survey of how this is done elsewhere (codebase + OSS + docs).
- You want to *understand*, not just to ship. The artifacts are durable — they live in `claudedocs/investigations/` and `claudedocs/research/` and you can re-open them.

## What's NOT in this tool

- No design / planning / implementation workflow. Use [superpowers](https://github.com/obra/superpowers) for that. Praxis feeds context into superpowers.
- No code review, TDD enforcement, or quality gates. Praxis is a reading tool.
- No multi-page guide books or whole-project overviews. Each guide covers one focused topic. Invoke `/guide` multiple times for multiple topics.

## Example output

A single-file HTML walkthrough produced by `/guide frontend/src/features/board/ "interaction state がどう遷移するか"` includes:

- Custom SVG state diagram of the mode transitions
- Sequence player walking through Table cell click → edit mode
- Interactive demo where you click a mock board and watch atoms update in real time
- File references (`atomName.ts:101`) on every claim

See `skills/guide-generation/SKILL.md` Appendix A and B for the target style spec.

## Inspired by

[obra/superpowers](https://github.com/obra/superpowers) — Praxis is the reading-and-understanding companion, not a replacement.

## License

MIT
