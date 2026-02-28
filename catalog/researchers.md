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

### `strategy-researcher`

- **Focus**: Evaluate viability, risks, costs, and trade-offs of a proposed strategic direction under a specific constraint set
- **Agent Type**: `claude-praxis:researcher` (haiku)
- **Verification Source**: Problem domain constraints, implementation pattern feasibility, failure case studies
- **Applicable Domains**: design, implement
- **Prompt**: Evaluate the following strategic direction: [direction-brief]. Constraints: [constraint-set]. Assess: (1) technical viability — is this direction feasible? Are there known blockers? (2) major risks — what are the biggest technical, operational, and cost risks? (3) implementation cost — estimated complexity and effort. (4) trade-offs — what does this direction sacrifice? Your output is a "strategy sketch" — a concise viability assessment, not a deep investigation. Cite sources where applicable.
