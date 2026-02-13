---
name: research
description: Start the research phase — investigate best practices and similar implementations
disable-model-invocation: true
---

Invoke the skill `getting-started` and begin the **Research Phase**:

The goal of research is NOT just to find "the answer" — it's to understand the **landscape of options** so that the Design Doc's Alternative Concerns section writes itself.

1. **Understand the problem space**: Search the web for prior art, similar implementations, and established patterns. Cite all sources with URLs.
2. **Identify candidate approaches**: Find at least 2-3 distinct ways to solve the problem. For each approach:
   - How does it work?
   - Who uses it and in what context?
   - What are the known trade-offs (performance, complexity, maintainability)?
3. **Compare approaches**: Present a comparison that highlights where approaches differ:
   > | Approach | Strengths | Weaknesses | Best suited for |
   > |----------|-----------|------------|-----------------|
   > | A | ... | ... | ... |
   > | B | ... | ... | ... |
4. **Surface constraints**: Identify project-specific constraints that narrow the choices (existing tech stack, team familiarity, performance requirements, etc.)
5. **Preliminary recommendation**: Based on the comparison and constraints, suggest which approach fits best — with reasoning. This becomes the starting point for /design.
6. **Identify open questions**: What needs human input or further investigation before committing to a design?
