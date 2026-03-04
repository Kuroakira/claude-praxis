# Researcher Catalog

Specialists who gather information during investigation phases. Each entry has an independent verification source.

## Entries

### `oss-research`

- **Focus**: Library comparison, external documentation, ecosystem analysis
- **Agent Type**: `claude-praxis:researcher` (haiku)
- **Verification Source**: Package registries, official library documentation, GitHub repositories
- **Applicable Domains**: design, debug
- **Prompt**: Research libraries, tools, and ecosystem options for [topic]. Compare approaches, trade-offs, adoption levels, and maintenance status. Check package registries for download counts and vulnerability reports. Cite all sources with URLs.

### `codebase-scout`

- **Focus**: Existing patterns, integration points, constraints
- **Agent Type**: `claude-praxis:scout` (haiku)
- **Verification Source**: Source code itself (read-only exploration)
- **Applicable Domains**: design, implement, debug
- **Prompt**: Explore the project codebase for: project structure, existing patterns related to [topic], integration points, constraints that affect design choices. Focus exclusively on the codebase. Report specific file paths and code patterns found.

### `domain-research`

- **Focus**: Problem domain, prior art, domain concepts
- **Agent Type**: `claude-praxis:researcher` (haiku)
- **Verification Source**: Academic papers, domain expert blogs, reference architectures
- **Applicable Domains**: design, feature-spec
- **Prompt**: Research the problem domain for [topic]. Find prior art, domain concepts, established terminology, and reference architectures. Focus on understanding the problem space, not solution patterns. Cite all sources with URLs.

### `best-practices`

- **Focus**: Industry standards, official documentation, reference implementations
- **Agent Type**: `claude-praxis:researcher` (haiku)
- **Verification Source**: Official documentation, standards specifications
- **Applicable Domains**: design, implement, debug
- **Prompt**: Research the ideal architecture and industry standards for [topic]. Focus on official documentation, standards specifications, and well-designed OSS implementations. Cite all sources with URLs.

### `counter-research`

- **Focus**: Counter-evidence, failure cases, reasons NOT to proceed
- **Agent Type**: `claude-praxis:researcher` (haiku)
- **Verification Source**: Postmortem articles, issue trackers, failure case studies
- **Applicable Domains**: design
- **Prompt**: Find failure cases, anti-patterns, risks, and reasons NOT to pursue the proposed approaches for [topic]. Search for postmortems, critical reviews, and known pitfalls. Cite all sources with URLs.

### `axis-evaluator`

- **Focus**: Evaluate trade-offs of a specific decision axis with two viable choices, independently of other axes
- **Agent Type**: `claude-praxis:researcher` (haiku)
- **Verification Source**: Domain-specific evidence for the axis topic (architecture patterns, performance benchmarks, ecosystem documentation, codebase conventions)
- **Applicable Domains**: design, implement
- **Prompt**: You are evaluating ONE decision axis. Do not speculate about other axes or their choices. Assess trade-offs for this axis only. Axis: [axis-name]. Choice A: [description]. Choice B: [description]. Context: [relevant research/scout findings for this axis]. Evaluate both choices and provide: (1) Recommendation — which choice is better for this context. (2) Rationale — why. (3) Trade-offs — what the other choice offers that the recommended one doesn't. (4) Inter-axis notes — if your recommendation depends on or affects other decisions, state how. (5) Confidence — high/medium/low. Cite sources where applicable.
