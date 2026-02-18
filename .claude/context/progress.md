# Progress

## 2026-02-18 — /claude-praxis:design: FeatureSpec Research complete
- Decision: FeatureSpec = AI-driven interview producing persistent "What/Why" document before Design Doc. 6-section template (Problem, User Stories, Scope, Purpose, Risks, References). Output saved to feature-specs/[name].md. A+C hybrid interview (free talk → gap-fill → draft → iterate)
- Rationale: Embedding in /design rejected (conflates What with How). Freeform rejected (no structure = no quality gate). User-writes-manually rejected (misses AI interview value). Prior art: Peroli mini spec, Shape Up pitch, Amazon PR/FAQ all validate lightweight pre-design spec
- Domain: framework-design, workflow-phases, requirement-elicitation

## 2026-02-18 — /claude-praxis:design: FeatureSpec Design Doc written
- Decision: New orchestrating command /feature-spec with A+C hybrid interview, 6-section template, output to feature-specs/[name].md. Separate command (not embedded in /design) to enable independent use and cross-session persistence
- Rationale: Separate command preserves FeatureSpec independence (can be used alone, reused across multiple Design Docs). Template provides quality gate without sacrificing flexibility (sections can be marked N/A)
- Domain: framework-design, workflow-phases
