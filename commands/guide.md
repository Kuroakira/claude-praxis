---
name: guide
description: >-
  Generate a single-file interactive HTML walkthrough of a code topic — prose,
  diagrams, sequence player, and (when applicable) a live demo of the actual
  state machine. Use when you want to deeply understand a specific aspect of a
  codebase, not just skim it.
disable-model-invocation: false
---

Run the **Guide Generation** workflow.

This command produces ONE self-contained HTML file at `claudedocs/investigations/YYYY-MM-DD-[topic-slug].html` modeling a specific aspect of the target code. Open it in a browser and read alongside the code.

## Step 1: Collect scope and intent

Both required.

- **scope**: a directory or file path inside the target codebase (e.g., `frontend/src/features/board/`, `src/auth/`).
- **intent**: a one-line statement of what aspect to deep-dive (e.g., "interaction state がどう遷移するか", "how requests flow from controller to repository").

If the user invoked `/guide [scope] [intent]` with both, proceed. If either is missing, ask once for the missing piece — do not infer. The intent shapes the entire investigation; guessing produces an unfocused HTML.

## Step 2: Run the skill

Invoke the `guide-generation` skill with:

| Parameter | Value |
|-----------|-------|
| `scope` | The scope from Step 1 |
| `intent` | The intent from Step 1 |

The skill executes the 4-phase pipeline (structured investigation → demo feasibility → outline → one-shot HTML write).

## Step 3: Surface the output

After the skill returns, report:
- The full file path (so the user can `open` it)
- Approximate line count
- Whether an interactive demo was included (yes/no + brief reason)
- One sentence summary of what the HTML covers

Do NOT auto-iterate. If the user wants refinements, they will say so in a follow-up turn.
