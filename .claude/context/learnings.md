# Project Learnings — claude-praxis

Project-specific knowledge accumulated through /praxis:compound.

## PreToolUse hook can enforce skill invocation mechanically

- **Learning**: `PreToolUse` hook matching `Edit|Write` can grep the session transcript (via `transcript_path` in hook input) for evidence of Skill tool invocations. If `code-quality-rules` was not invoked, the hook returns `permissionDecision: "deny"` to block the file edit.
- **Context**: This is the chosen approach for 施策1 in the skill-invocation-reliability design doc. Transcript grep with `grep -m 1` is sufficient for performance. The hook is plugin-scoped (only fires when claude-praxis is enabled).
- **Implication**: This pattern can be extended to other gate skills (e.g., `verification-before-completion` could be checked before Stop events).

## Framework improvements tracked in design doc

- **Learning**: Three structural issues identified — rule duplication dilutes authority (7 locations → consolidate to 1), instruction volume dilutes critical rules (~65KB → target ~45KB), and `disable-model-invocation: true` creates a single point of failure for the skill chain.
- **Context**: Documented in `claudedocs/skill-invocation-reliability.md` as 施策3 (First Response Gate), 施策4 (instruction volume reduction), 施策5 (deduplication), and 施策2 (auto-invocable). Implementation pending approval.
- **Implication**: After implementation, re-evaluate whether the changes actually improve skill invocation rates in real sessions.
