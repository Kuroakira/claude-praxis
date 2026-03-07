# Progress

## 2026-03-07 — /claude-praxis:design: Research complete (Guide HTML Book)
- Decision: Claude writes HTML directly (no two-stage pipeline), multi-page folder structure, CDN for mermaid/highlight.js, CSS described in skill prompt and generated as output artifact
- Rationale: Project is entirely prompt-driven (14/14 skills store only SKILL.md). Adding build tooling would be the first build dependency. Claude follows skill prompt structure reliably (proven by current Markdown generation). CSS as output artifact preserves SKILL.md-only pattern while ensuring per-guide visual consistency
- Rejected: Two-stage pipeline (Markdown→converter→HTML) — adds build dependency to a prompt-driven system, complexity doesn't decrease (just spreads across prompt + script). Stored template files — breaks 14/14 SKILL.md-only precedent without sufficient justification
- Axes evaluated: HTML Generation Strategy (A: direct, HIGH confidence), CSS/Template Assets (B: prompt-described, HIGH confidence). No inter-axis conflicts
- Domain: guide, html-generation, output-format

## 2026-03-07 — /claude-praxis:design: Design Doc written (Guide HTML Book)
- Decision: Direct HTML generation with multi-page folder output, CSS as output artifact
- Rationale: Consistent with prompt-driven architecture (14/14 skills = SKILL.md only, no build tooling). Two-stage pipeline rejected because it introduces first build dependency. Stored template files rejected because it breaks SKILL.md-only pattern. Single HTML rejected because hub-and-spoke is best expressed as page navigation
- Key trade-offs acknowledged: HTML output costs ~1.5-2x tokens vs Markdown (to be validated). HTML review may be noisier than Markdown review. Both have reconsider triggers pointing to Alternative A (two-stage pipeline)
- Domain: guide, html-generation, output-format
