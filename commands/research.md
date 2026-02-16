---
name: praxis:research
description: Standalone research — investigate problem space without committing to a Design Doc (research is built into /praxis:design)
disable-model-invocation: true
---

Invoke the skill `getting-started` and begin the **Research Phase**:

The goal of research is NOT just to find "the answer" — it's to understand the **landscape of options** so that the Design Doc's Alternatives Considered section writes itself.

1. **Understand the problem space**: Search the web for prior art, similar implementations, and established patterns. Cite all sources with URLs.
2. **Understand "what it should be"**: Research is not just about extending the current code. Investigate what the ideal architecture or approach looks like regardless of the current implementation. Best practices, industry standards, and well-designed OSS projects reveal what "should be" — before cost constraints narrow the choices.
3. **Identify candidate approaches**: Find at least 2-3 distinct ways to solve the problem, including:
   - The ideal approach (what it should look like if built from scratch)
   - A pragmatic middle ground (meaningful improvement within reasonable cost)
   - An incremental approach (extending the current implementation)
   For each approach: How does it work? Who uses it? What are the trade-offs?
4. **Compare approaches**: Present a comparison that highlights where approaches differ:
   > | Approach | Strengths | Weaknesses | Cost | Best suited for |
   > |----------|-----------|------------|------|-----------------|
   > | A (ideal) | ... | ... | ... | ... |
   > | B (pragmatic) | ... | ... | ... | ... |
   > | C (incremental) | ... | ... | ... | ... |
5. **Surface constraints**: Identify project-specific constraints that narrow the choices (existing tech stack, team familiarity, performance requirements, timeline, etc.)
6. **Preliminary recommendation**: Based on the comparison and constraints, suggest which approach fits best — with reasoning. Explicitly address whether the cost of the ideal approach is justified, or if a pragmatic middle ground is more appropriate.
7. **Identify open questions**: What needs human input or further investigation before committing to a design?
