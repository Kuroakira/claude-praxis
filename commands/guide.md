---
name: guide
description: >-
  Generate a codebase walkthrough guide — produces a durable HTML book
  (multi-page folder with sidebar navigation, mermaid diagrams, syntax highlighting).
  TRIGGER when: user asks for a guide, walkthrough, or explanation of how code works —
  a module, directory, cross-cutting concern, or the whole project.
disable-model-invocation: false
---

Run the **Guide Generation** workflow.

This command produces a durable walkthrough guide saved to `claudedocs/guides/[scope-name]/` as a multi-page HTML book. The guide serves as a human learning companion — open `index.html` in a browser and read alongside the code to build understanding step by step.

## Step 1: Determine Scope

Ask the user what to guide if not already specified. Scope can be:
- A module or directory (e.g., "the hooks system", "skills/workflow-planner")
- A cross-cutting concern (e.g., "how review dispatch flows across commands")
- The whole project ("project" — produces overview-level guide only; use `/guide [module]` for deep dives)

If the user has already specified the scope (e.g., `/guide hooks`), proceed directly.

## Step 2: Generate Guide

Invoke `guide-generation` skill with:

| Parameter | Value |
|-----------|-------|
| `scope` | The scope from Step 1 |

The skill executes the multi-pass exploration (overview scan → targeted deep dives → write HTML book) and produces the complete guide folder.

## Step 3: Save and Review

1. The guide is saved to `claudedocs/guides/[scope-name]/` (kebab-case derived from scope). The folder contains `index.html`, chapter HTML files, `style.css`, and optionally an `images/` directory
2. If a guide folder already exists at that path, verify the path is within `claudedocs/guides/` then delete it (`rm -rf`) before writing new files (no versioning — latest guide only). Also remove any legacy `.md` file at `claudedocs/guides/[scope-name].md` if it exists
3. Invoke `dispatch-reviewers` with:

| Parameter | Value |
|-----------|-------|
| `tier` | light |
| `reviewers` | `document-quality`, `architecture` |
| `target` | HTML content files only: list all `.html` files in the guide folder (e.g., `[index.html, 01-focus.html, 02-focus.html]`). For short guides (single `index.html` only), pass `[index.html]`. Exclude `style.css` and `images/` — reviewers evaluate content structure, not presentation |

- `document-quality`: applies `rules/document-quality.md` only (not `rules/design-doc-format.md`, which is Design Doc-specific)
- `architecture`: validates the narrative reflects actual system boundaries

If issues are found, revise the guide HTML files, re-save, then present.

## Step 4: Present

Present the guide to the user with a brief summary:
- Scope covered
- Number of focus areas (chapters) explored
- What was NOT covered (from Coverage Boundary)
- Suggested next guides for areas not covered in depth
- Path to open: `claudedocs/guides/[scope-name]/index.html`

The guide is now available for the user to open in a browser and read alongside the code.
