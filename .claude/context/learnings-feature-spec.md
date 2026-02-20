# Learnings — Feature Spec Level

要件定義・スコープ判断に関する学び。feature-specフェーズで参照される。

## 外部フレームワークの概念採用はFeatureSpecのOut of Scopeで範囲を制限する

- **Learning**: 外部プロジェクトから概念を取り入れる際、FeatureSpecのOut of Scopeで「概念だけ取り入れる」と明記することで、設計時の過剰な移植を防止できる
- **Context**: ECCのinstinctシステムは概念として優れるが、全体の再現（import/export/evolve）はclaude-praxisの哲学と規模に合わない。FeatureSpecで「instinctsの完全再現ではなく、信頼度スコアの概念だけを取り入れる」と明記したことで、Design Doc段階での設計判断が明確に制約された
- **Implication**: 外部参照を含むFeatureSpecでは、In Scope（取り入れる概念）とOut of Scope（取り入れない範囲）の境界を明示する。曖昧なままだと設計フェーズで範囲が膨張する
