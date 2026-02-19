# Progress

## 2026-02-19 — /claude-praxis:implement: Final review complete — Node.js hook migration
- Decision: Migrated all 6 Bash hooks to TypeScript with compiled JS in hooks/dist/. Zero `as` type assertions — used runtime type extraction helpers (getString, getBoolean, getRecord) instead. ESM via "type": "module" in package.json (outputs .js not .mjs as originally designed, but functionally equivalent). Shared test helper with proper type guard eliminates `as` in integration tests too
- Rationale: Review initially failed on `as` assertions — the generic `readStdin<T>()` was a disguised `as`, and integration test error handlers used `as` casts. Fixing required architectural change: readStdin returns `unknown`, callers use type-safe extractors. This is more robust than the original generic approach since it validates at runtime
- Domain: hooks, typescript, testing, type-safety, code-review

## 2026-02-19 — /claude-praxis:design: Design Doc written — 01-nodejs-hook-migration
- Decision: Bash→Node.js(.mjs)移行。モジュラー構造（エントリポイント + lib/）で関数単位テスト可能に。vitest（ユニット + 統合）2層テスト。ESM採用（package.json不要で.mjsだけでESM認識）。移行順序: 単純→複雑（mark-skill-invoked → session-start）
- Rationale: TypeScript却下（ビルドステップがプラグイン体験を劣化）。Bash維持+bats-core却下（可読性・クロスプラットフォーム未解決）。デュアルランタイム却下（二言語保守コスト継続）。Node.jsはClaude Code自体のランタイムなので前提として合理的
- Domain: hooks, testing, infrastructure, cross-platform

## 2026-02-19 — /claude-praxis:feature-spec: FeatureSpec complete — ECC-Inspired Session Experience Enhancement
- Decision: 6つのECC概念（Contexts, 信頼度スコア付き学習, スキル自動生成, Node.js移行, Strategic Compact + Proactive Compound, Iterative Retrieval）を統合的なセッション体験向上として定義。個別機能ではなく、セッションライフサイクル全体の体験設計として捉える
- Rationale: ECCの「幅広い道具箱」から、CPの「理解の深化」哲学と整合する概念のみ選択。ドメイン特化スキルやマルチエージェントオーケストレーションは除外。信頼度スコアはinstincts全体ではなく概念のみ採用。/compact前の/compound連動は提案レベルから開始
- Domain: framework-evolution, session-lifecycle, context-management, learning-system

## 2026-02-18 — /claude-praxis:design: FeatureSpec Research complete
- Decision: FeatureSpec = AI-driven interview producing persistent "What/Why" document before Design Doc. 6-section template (Problem, User Stories, Scope, Purpose, Risks, References). Output saved to feature-specs/[name].md. A+C hybrid interview (free talk → gap-fill → draft → iterate)
- Rationale: Embedding in /design rejected (conflates What with How). Freeform rejected (no structure = no quality gate). User-writes-manually rejected (misses AI interview value). Prior art: Peroli mini spec, Shape Up pitch, Amazon PR/FAQ all validate lightweight pre-design spec
- Domain: framework-design, workflow-phases, requirement-elicitation

## 2026-02-18 — /claude-praxis:design: FeatureSpec Design Doc written
- Decision: New orchestrating command /feature-spec with A+C hybrid interview, 6-section template, output to feature-specs/[name].md. Separate command (not embedded in /design) to enable independent use and cross-session persistence
- Rationale: Separate command preserves FeatureSpec independence (can be used alone, reused across multiple Design Docs). Template provides quality gate without sacrificing flexibility (sections can be marked N/A)
- Domain: framework-design, workflow-phases

## 2026-02-18 — /claude-praxis:implement: Planning — FeatureSpec implementation
- Decision: Implementation plan approved (4 tasks). Task 2 includes fix for UserPromptSubmit hook failing on Japanese input (classifier prompt is English-only)
- Rationale: Hook bug discovered during planning session — Japanese messages cause phase detection to fail with "Unable to classify phase." Fix is low-cost (add multilingual instruction to prompt) and belongs in Task 2 where hooks.json is already being edited
- Domain: hooks, phase-detection, i18n

## 2026-02-18 — /claude-praxis:implement: Final review complete — FeatureSpec phase
- Decision: Review found one gap (First Response Gate phase list missing feature-spec) and one improvement (Suggestion Behavior text not mentioning feature-spec). Both fixed. Review confirmed Design Doc compliance, pattern consistency, and all integration points covered
- Rationale: Inline phase lists need to be updated whenever Detection Rules table changes — they serve different audiences (quick checklist vs. detailed rules) but must stay in sync
- Domain: framework-design, code-review, consistency
