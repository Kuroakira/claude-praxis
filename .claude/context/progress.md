# Progress

## 2026-02-25 — /claude-praxis:design: Research complete — Collaborative Multi-Agent Workflows
- Decision: Three approaches identified (Full Team-Based, Selective Delegation, Enhanced SDD). Key finding: specialization helps when agents have independent verification sources but hurts when cognitively coupled (e.g., test designer/writer split not worth it). CodeBuff's "toolless orchestrator" is instructive but not directly portable to Claude Code.
- Rationale: Claude Code's 2-level hierarchy limit (no nested subagent spawning) rules out deep agent trees. Main Claude must remain interactive orchestrator, not truly toolless. The pragmatic middle ground — selective delegation to specialized agents for /design Research and /implement Review — provides the best cost/quality ratio.
- Domain: multi-agent, architecture, workflow-design

## 2026-02-25 — /claude-praxis:design: Design Doc written — Collaborative Multi-Agent Workflows
- Decision: Selective delegation — /design Research を並列Researchチームに、/implement Final Review を並列専門Reviewチームに分割。Scout Agent を新設して両ワークフローで共有。認知的に結合したフェーズ（Outline-Write、TDD RED-GREEN-REFACTOR）は単一エージェント維持。
- Rationale: 「独立した検証ソースを持つフェーズのみ協調型にする」原則。CodeBuff全体の再現は不要、概念のみ採用（過去learningの「外部フレームワーク概念採用」に従う）。
- Domain: multi-agent, architecture, workflow-design
