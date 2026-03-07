---
name: guide
description: >-
  Generate a codebase walkthrough guide — produces a durable narrative Markdown document
  for human understanding. Step-by-step walkthrough with zoom-in/zoom-out navigation.
  TRIGGER when: user asks for a guide, walkthrough, or explanation of how code works —
  a module, directory, cross-cutting concern, or the whole project.
disable-model-invocation: false
---

Run the **Guide Generation** workflow.

This command produces a durable walkthrough guide saved to `claudedocs/guides/[scope-name].md`. The guide serves as a human learning companion — read alongside the code to build understanding step by step.

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

The skill executes the multi-pass exploration (overview scan → targeted deep dives → write guide) and produces the complete guide document.

## Step 3: Review

1. Save the guide to `claudedocs/guides/[scope-name].md` (kebab-case derived from scope)
2. If a guide already exists at that path, overwrite it (no versioning — latest guide only)
3. Invoke `dispatch-reviewers` with:

| Parameter | Value |
|-----------|-------|
| `tier` | light |
| `reviewers` | `document-quality`, `architecture` |
| `target` | The saved guide file path |

- `document-quality`: applies `rules/document-quality.md` only (not `rules/design-doc-format.md`, which is Design Doc-specific)
- `architecture`: validates the narrative reflects actual system boundaries

If issues are found, revise the guide, re-save, then present.

## Step 4: Present

Present the guide to the user with a brief summary:
- Scope covered
- Number of focus areas explored
- What was NOT covered (from Coverage Boundary)
- Suggested next guides for areas not covered in depth

The guide is now available for the user to read alongside the code.
